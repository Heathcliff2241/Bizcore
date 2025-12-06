import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/payment-settings
 * Public endpoint to fetch admin payment settings
 * (No authentication required - customers need to see payment details)
 */
export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let settings = await (prisma as any).adminSettings.findFirst();
    
    // Create default settings if none exist
    if (!settings) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      settings = await (prisma as any).adminSettings.create({
        data: {
          adminGcashPhoneNumber: null,
          adminGcashAccountName: null,
          adminGcashQrCodeUrl: null,
        },
      });
    }

    return NextResponse.json({
      adminGcashPhoneNumber: settings.adminGcashPhoneNumber,
      adminGcashAccountName: settings.adminGcashAccountName,
      adminGcashQrCodeUrl: settings.adminGcashQrCodeUrl,
    });
  } catch (error) {
    console.error('[GET /api/admin/payment-settings] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
