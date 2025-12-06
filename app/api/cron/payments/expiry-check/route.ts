import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPaymentExpiryAlertEmail } from '@/lib/email/paymentEmails';

/**
 * GET /api/cron/payments/expiry-check
 * Scheduled job to check for payments expiring soon and send alert emails
 * Should be called via Vercel Cron or similar service
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const cronSecret = request.headers.get('authorization');
    if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find payments that expire within 24 hours and haven't been alerted yet
    const paymentsToAlert = await prisma.payment.findMany({
      where: {
        status: 'unpaid',
      },
      include: {
        subscription: {
          include: {
            tenant: true,
          },
        },
      },
    });

    let alertCount = 0;

    for (const payment of paymentsToAlert) {
      const metadata = typeof payment.metadata === 'object' && payment.metadata !== null ? (payment.metadata as Record<string, unknown>) : {};
      const expiresAt = metadata.expiresAt
        ? new Date(metadata.expiresAt as string)
        : null;

      if (!expiresAt) continue;

      const now = new Date();
      const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Send alert if expiring within 24 hours and not already alerted
      if (hoursUntilExpiry <= 24 && hoursUntilExpiry > 0) {
        const hasBeenAlerted = metadata.expiryAlertSent === true;

        if (!hasBeenAlerted) {
          try {
            const subscriber = await prisma.user.findFirst({
              where: { tenantUsers: { some: { tenantId: payment.subscription.tenantId } } },
              select: { email: true, firstName: true, lastName: true },
            });

            if (subscriber) {
              const recipientName = `${subscriber.firstName} ${subscriber.lastName}`.trim() || 'Customer';
              await sendPaymentExpiryAlertEmail({
                recipientEmail: subscriber.email || '',
                recipientName,
                tenantName: payment.subscription.tenant.name,
                amount: payment.amount,
                currency: payment.currency || 'PHP',
                expiresAt,
              });

              // Mark alert as sent
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (prisma.payment.update as any)({
                where: { id: payment.id },
                data: {
                  metadata: {
                    ...metadata,
                    expiryAlertSent: true,
                    expiryAlertSentAt: new Date().toISOString(),
                  },
                },
              });

              alertCount++;
            }
          } catch (error) {
            console.error(`[Cron] Failed to send expiry alert for payment ${payment.id}:`, error);
          }
        }
      }

      // Auto-expire payments past their expiry time
      if (hoursUntilExpiry <= 0) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (prisma.payment.update as any)({
            where: { id: payment.id },
            data: {
              status: 'unpaid', // Mark as unpaid since verification window expired
              failureReason: 'Payment verification window expired',
              metadata: {
                ...metadata,
                verificationStatus: 'expired',
                expiredAt: new Date().toISOString(),
              },
            },
          });

          console.log(`[Cron] Payment ${payment.id} marked as expired`);
        } catch (error) {
          console.error(`[Cron] Failed to expire payment ${payment.id}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Checked ${paymentsToAlert.length} payments, sent ${alertCount} expiry alerts`,
      alertsSent: alertCount,
    });
  } catch (error) {
    console.error('[GET /api/cron/payments/expiry-check] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
