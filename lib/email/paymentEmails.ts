/**
 * Send email using Gmail SMTP via Nodemailer
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  from: string = process.env.ADMIN_EMAIL || 'noreply@bizcore.ph'
) {
  try {
    // @ts-expect-error - nodemailer is optional dependency
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodemailer: any = await import('nodemailer');
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // Gmail App Password
      },
    });

    return transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('[Email] Gmail SMTP error:', error);
    throw new Error('Email service not available');
  }
}
interface PaymentEmailData {
  recipientEmail: string;
  recipientName: string;
  tenantName: string;
  amount: number;
  currency: string;
  gcashTransactionId: string;
  expiresAt: Date;
  paymentLink?: string;
}

interface VerificationEmailData {
  recipientEmail: string;
  recipientName: string;
  tenantName: string;
  planName: string;
  amount: number;
  currency: string;
  paymentDate: Date;
}

interface ExpiryAlertEmailData {
  recipientEmail: string;
  recipientName: string;
  tenantName: string;
  amount: number;
  currency: string;
  expiresAt: Date;
  resubmitLink?: string;
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(data: PaymentEmailData) {
  try {
    const expiresIn = Math.ceil((data.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60));
    
    const emailContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f0f9ff 0%, #f3e8ff 100%); }
            .card { background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .emoji { font-size: 48px; margin-bottom: 15px; }
            .title { font-size: 24px; font-weight: 600; color: #1e40af; }
            .content { font-size: 14px; line-height: 1.6; color: #4b5563; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #4338ca 100%); color: #ffffff !important; text-decoration: none !important; padding: 12px 30px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .details-box { background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .detail-item { margin: 12px 0; font-size: 13px; color: #4b5563; }
            .info-box { background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 20px 0; }
            .footer { border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; font-size: 12px; color: #9ca3af; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <div class="title">Payment Received!</div>
              </div>

              <div class="content">
                <p>Hi ${data.recipientName},</p>
                
                <p>Great! We've received your GCash payment for ${data.tenantName}. We're now verifying it and will activate your upgrade shortly.</p>

                <div class="details-box">
                  <div class="detail-item"><strong>Amount:</strong> ${data.currency === 'PHP' ? '₱' : '$'}${(data.amount / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
                  <div class="detail-item"><strong>Transaction ID:</strong> ${data.gcashTransactionId}</div>
                  <div class="detail-item"><strong>Verification expires in:</strong> ${expiresIn} hours</div>
                </div>

                <div class="info-box">
                  <p style="margin: 0 0 8px 0; font-weight: 600; color: #1e40af;">What's next?</p>
                  <p style="margin: 0; color: #1e40af; font-size: 13px;">Our team will verify your payment within 24 hours. Once confirmed, your upgrade activates automatically and you'll get another email. Sit tight!</p>
                </div>

                <p style="margin-top: 20px; font-size: 13px; color: #6b7280;">
                  Questions? We're here to help at support@bizcore.app
                </p>
              </div>

              <div class="footer">
                <p style="margin: 0;">BizCore - All-in-One Business Management</p>
                <p style="margin: 8px 0 0 0;">© ${new Date().getFullYear()} BizCore. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail(
      data.recipientEmail,
      `Payment received - We're verifying now`,
      emailContent
    );

    console.log(`[Email] Payment confirmation sent to ${data.recipientEmail}`);
  } catch (error) {
    console.error('[Email] Failed to send payment confirmation:', error);
    throw error;
  }
}

/**
 * Send payment verification success email
 */
export async function sendPaymentVerifiedEmail(data: VerificationEmailData) {
  try {
    const emailContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f0f9ff 0%, #f3e8ff 100%); }
            .card { background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .emoji { font-size: 48px; margin-bottom: 15px; }
            .title { font-size: 24px; font-weight: 600; color: #1e40af; }
            .content { font-size: 14px; line-height: 1.6; color: #4b5563; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #4338ca 100%); color: #ffffff; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
            .details-box { background-color: #f9fafb; border-left: 4px solid #22c55e; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .detail-item { margin: 12px 0; font-size: 13px; color: #4b5563; }
            .footer { border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; font-size: 12px; color: #9ca3af; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <div class="title">Payment Verified!</div>
              </div>

              <div class="content">
                <p>Hi ${data.recipientName},</p>
                
                <p>Your payment has been verified and your upgrade to <strong>${data.planName}</strong> is now live!</p>

                <div class="details-box">
                  <div class="detail-item"><strong>Plan:</strong> ${data.planName}</div>
                  <div class="detail-item"><strong>Amount:</strong> ${data.currency === 'PHP' ? '₱' : '$'}${(data.amount / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
                  <div class="detail-item"><strong>Status:</strong> Active & Ready</div>
                </div>

                <p>You can now:</p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Access all ${data.planName} features</li>
                  <li>Manage unlimited products and inventory</li>
                  <li>Accept more orders from your customers</li>
                  <li>Use advanced POS features</li>
                  <li>Customize your storefront with BrandStudio</li>
                </ul>

                <center>
                  <a href="https://bizcore.app/dashboard" class="cta-button">Go to Dashboard</a>
                </center>

                <p style="margin-top: 20px; font-size: 13px; color: #6b7280;">
                  Thanks for choosing BizCore! We're excited to help your business grow.
                </p>
              </div>

              <div class="footer">
                <p style="margin: 0;">BizCore - All-in-One Business Management</p>
                <p style="margin: 8px 0 0 0;">© ${new Date().getFullYear()} BizCore. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail(
      data.recipientEmail,
      `Your ${data.planName} upgrade is live!`,
      emailContent
    );

    console.log(`[Email] Payment verified email sent to ${data.recipientEmail}`);
  } catch (error) {
    console.error('[Email] Failed to send payment verified email:', error);
    throw error;
  }
}

/**
 * Send payment expiry alert email
 */
export async function sendPaymentExpiryAlertEmail(data: ExpiryAlertEmailData) {
  try {
    const hoursRemaining = Math.ceil((data.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60));
    
    const emailContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #dc2626; margin-bottom: 24px;">⚠ Payment Expiring Soon</h1>
        
        <p style="color: #4b5563; margin-bottom: 16px;">Hi ${data.recipientName},</p>
        
        <p style="color: #4b5563; margin-bottom: 24px;">Your payment for ${data.tenantName} is about to expire. Please resubmit if your transfer hasn't been verified yet.</p>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0 0 12px 0; color: #7f1d1d;">
            <strong style="font-size: 16px;">⚠ Action Required</strong>
          </p>
          <p style="margin: 0; color: #7f1d1d; font-size: 14px;">Your payment verification link will expire in ${hoursRemaining} hours. If you haven't submitted your payment yet, please do so before the deadline.</p>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <p style="margin: 0 0 12px 0; color: #6b7280;">
            <strong style="color: #1f2937;">Amount Due:</strong><br/>
            ${data.currency === 'PHP' ? '₱' : '$'}${(data.amount / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </p>
          <p style="margin: 0; color: #6b7280;">
            <strong style="color: #1f2937;">Expires At:</strong><br/>
            ${data.expiresAt.toLocaleString('en-PH')}
          </p>
        </div>
        
        ${data.resubmitLink ? `
          <a href="${data.resubmitLink}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-bottom: 24px;">
            Resubmit Payment
          </a>
        ` : ''}
        
        <p style="color: #6b7280; margin-bottom: 16px; font-size: 14px;">If you have already submitted your payment, please ignore this message. Our team is verifying it.</p>
        
        <p style="color: #9ca3af; margin-bottom: 0; font-size: 12px;">
          This is an automated message from ${data.tenantName}. Please do not reply with sensitive information.
        </p>
      </div>
    `;

    await sendEmail(
      data.recipientEmail,
      `⚠ Payment Expiring Soon - ${data.tenantName}`,
      emailContent
    );

    console.log(`[Email] Payment expiry alert sent to ${data.recipientEmail}`);
  } catch (error) {
    console.error('[Email] Failed to send payment expiry alert:', error);
    throw error;
  }
}

/**
 * Send payment rejection email
 */
export async function sendPaymentRejectedEmail(
  recipientEmail: string,
  recipientName: string,
  tenantName: string,
  reason: string,
  amount: number,
  currency: string
) {
  try {
    const emailContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f0f9ff 0%, #f3e8ff 100%); }
            .card { background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .emoji { font-size: 48px; margin-bottom: 15px; }
            .title { font-size: 24px; font-weight: 600; color: #dc2626; }
            .content { font-size: 14px; line-height: 1.6; color: #4b5563; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #4338ca 100%); color: #ffffff; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
            .details-box { background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .detail-item { margin: 12px 0; font-size: 13px; color: #4b5563; }
            .footer { border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; font-size: 12px; color: #9ca3af; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <div class="title">Payment Couldn't Be Verified</div>
              </div>

              <div class="content">
                <p>Hi ${recipientName},</p>
                
                <p>We weren't able to verify your payment for the ${tenantName} upgrade. Here's what happened:</p>

                <div class="details-box">
                  <div class="detail-item"><strong>Amount:</strong> ${currency === 'PHP' ? '₱' : '$'}${(amount / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
                  <div class="detail-item"><strong>Reason:</strong> ${reason}</div>
                </div>

                <p><strong>What can you do?</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Check that your GCash details match exactly</li>
                  <li>Verify the transaction ID is correct</li>
                  <li>Try submitting again with a clearer payment proof screenshot</li>
                  <li>Reach out to support@bizcore.app if you need help</li>
                </ul>

                <center>
                  <a href="https://bizcore.app/dashboard/billing" class="cta-button">Try Again</a>
                </center>

                <p style="margin-top: 20px; font-size: 13px; color: #6b7280;">
                  Need help? Our support team is ready to assist you at support@bizcore.app
                </p>
              </div>

              <div class="footer">
                <p style="margin: 0;">BizCore - All-in-One Business Management</p>
                <p style="margin: 8px 0 0 0;">© ${new Date().getFullYear()} BizCore. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail(
      recipientEmail,
      `We need to verify your payment - Let's get this sorted`,
      emailContent
    );

    console.log(`[Email] Payment rejection email sent to ${recipientEmail}`);
  } catch (error) {
    console.error('[Email] Failed to send payment rejection email:', error);
    throw error;
  }
}

/**
 * Send admin notification email when payment is submitted
 */
export async function sendAdminPaymentSubmittedEmail(
  tenantName: string,
  planName: string,
  amount: number,
  currency: string,
  gcashTransactionId: string
) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn('[Email] ADMIN_EMAIL not configured. Skipping admin notification.');
      return;
    }

    const emailContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #f59e0b; margin-bottom: 24px;">Payment Pending Verification</h1>
        
        <p style="color: #4b5563; margin-bottom: 16px;">Hi Admin,</p>
        
        <p style="color: #4b5563; margin-bottom: 24px;">A new payment has been submitted and is awaiting your verification.</p>
        
        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0 0 16px 0; color: #92400e;"><strong style="font-size: 16px;">Verification Required</strong></p>
          <div style="background-color: #fef3c7; padding: 12px; border-radius: 4px;">
            <p style="margin: 0 0 8px 0; color: #92400e; font-size: 14px;">
              <strong>Tenant:</strong> ${tenantName}<br/>
              <strong>Plan:</strong> ${planName}<br/>
              <strong>Amount:</strong> ${currency === 'PHP' ? '₱' : '$'}${(amount / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}<br/>
              <strong>GCash Reference:</strong> ${gcashTransactionId}<br/>
              <strong>Submitted At:</strong> ${new Date().toLocaleString('en-PH')}
            </p>
          </div>
        </div>
        
        <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>Action Required:</strong> Please review the payment details and verify or reject it in the admin panel.</p>
        </div>
        
        <p style="color: #6b7280; margin-bottom: 0; font-size: 12px;">
          This is an automated notification from BizCore.
        </p>
      </div>
    `;

    await sendEmail(
      adminEmail,
      `Payment Pending Verification - ${tenantName}`,
      emailContent,
      process.env.ADMIN_EMAIL
    );

    console.log(`[Email] Admin payment submitted notification sent to ${adminEmail}`);
  } catch (error) {
    console.error('[Email] Failed to send admin payment submitted email:', error);
    // Don't throw - this is a notification, not critical
  }
}

/**
 * Send admin notification email when payment is verified
 */
export async function sendAdminPaymentVerifiedEmail(
  tenantName: string,
  planName: string,
  amount: number,
  currency: string,
  adminNotes?: string
) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn('[Email] ADMIN_EMAIL not configured. Skipping admin notification.');
      return;
    }

    const emailContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #059669; margin-bottom: 24px;">Payment Verified</h1>
        
        <p style="color: #4b5563; margin-bottom: 16px;">Hi Admin,</p>
        
        <p style="color: #4b5563; margin-bottom: 24px;">A pending payment has been verified and the tenant's subscription has been activated.</p>
        
        <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0 0 16px 0; color: #065f46;"><strong style="font-size: 16px;">Payment Approved</strong></p>
          <div style="background-color: #f0fdf4; padding: 12px; border-radius: 4px;">
            <p style="margin: 0 0 8px 0; color: #065f46;">
              <strong>Tenant:</strong> ${tenantName}<br/>
              <strong>Plan:</strong> ${planName}<br/>
              <strong>Amount:</strong> ${currency === 'PHP' ? '₱' : '$'}${(amount / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}<br/>
              <strong>Verified At:</strong> ${new Date().toLocaleString('en-PH')}
            </p>
          </div>
        </div>
        
        ${adminNotes ? `
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px 0; color: #1f2937;"><strong>Admin Notes</strong></p>
          <p style="margin: 0; color: #6b7280;">${adminNotes}</p>
        </div>
        ` : ''}
        
        <p style="color: #6b7280; margin-bottom: 0; font-size: 12px;">
          This is an automated notification from BizCore.
        </p>
      </div>
    `;

    await sendEmail(
      adminEmail,
      `Payment Verified - ${tenantName}`,
      emailContent,
      process.env.ADMIN_EMAIL
    );

    console.log(`[Email] Admin payment verification notification sent to ${adminEmail}`);
  } catch (error) {
    console.error('[Email] Failed to send admin payment verification email:', error);
    // Don't throw - this is a notification, not critical
  }
}

/**
 * Send admin notification email when payment is rejected
 */
export async function sendAdminPaymentRejectedEmail(
  tenantName: string,
  planName: string,
  amount: number,
  currency: string,
  rejectionReason: string
) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn('[Email] ADMIN_EMAIL not configured. Skipping admin notification.');
      return;
    }

    const emailContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #dc2626; margin-bottom: 24px;">Payment Rejected</h1>
        
        <p style="color: #4b5563; margin-bottom: 16px;">Hi Admin,</p>
        
        <p style="color: #4b5563; margin-bottom: 24px;">A payment has been rejected by the admin team.</p>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0 0 16px 0; color: #7f1d1d;"><strong style="font-size: 16px;">Payment Rejected</strong></p>
          <div style="background-color: #fee2e2; padding: 12px; border-radius: 4px;">
            <p style="margin: 0 0 8px 0; color: #7f1d1d;">
              <strong>Tenant:</strong> ${tenantName}<br/>
              <strong>Plan:</strong> ${planName}<br/>
              <strong>Amount:</strong> ${currency === 'PHP' ? '₱' : '$'}${(amount / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}<br/>
              <strong>Rejected At:</strong> ${new Date().toLocaleString('en-PH')}
            </p>
          </div>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px 0; color: #1f2937;"><strong>Rejection Reason</strong></p>
          <p style="margin: 0; color: #6b7280;">${rejectionReason}</p>
        </div>
        
        <p style="color: #6b7280; margin-bottom: 0; font-size: 12px;">
          This is an automated notification from BizCore.
        </p>
      </div>
    `;

    await sendEmail(
      adminEmail,
      `Payment Rejected - ${tenantName}`,
      emailContent,
      process.env.ADMIN_EMAIL
    );

    console.log(`[Email] Admin payment rejection notification sent to ${adminEmail}`);
  } catch (error) {
    console.error('[Email] Failed to send admin payment rejection email:', error);
    // Don't throw - this is a notification, not critical
  }
}

/**
 * Send approval notification to tenant when admin verifies payment
 */
export async function sendTenantPaymentApprovedEmail(
  recipientEmail: string,
  recipientName: string,
  tenantName: string,
  planName: string,
  amount: number,
  currency: string
) {
  try {
    const emailContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f0f9ff 0%, #f3e8ff 100%); }
            .card { background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: 600; color: #1e40af; }
            .content { font-size: 14px; line-height: 1.6; color: #4b5563; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #4338ca 100%); color: #ffffff; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
            .success-box { background-color: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .detail-item { margin: 12px 0; font-size: 13px; color: #4b5563; }
            .footer { border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; font-size: 12px; color: #9ca3af; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <div class="title">Your Payment Has Been Approved!</div>
              </div>

              <div class="content">
                <p>Hi ${recipientName},</p>
                
                <p>Great news! We've approved your payment and your ${planName} plan upgrade is now active. You're all set to enjoy all the premium features!</p>

                <div class="success-box">
                  <div class="detail-item"><strong>Plan:</strong> ${planName}</div>
                  <div class="detail-item"><strong>Amount Paid:</strong> ${currency === 'PHP' ? '₱' : '$'}${(amount / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
                  <div class="detail-item"><strong>Status:</strong> Active Now</div>
                </div>

                <p>Your ${tenantName} account now has access to:</p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>All ${planName} features and tools</li>
                  <li>Priority customer support</li>
                  <li>Advanced analytics and reporting</li>
                  <li>Custom storefront design with BrandStudio</li>
                  <li>Unlimited products and inventory management</li>
                </ul>

                <center>
                  <a href="https://bizcore.app/dashboard" class="cta-button">Start Using Your New Features</a>
                </center>

                <p style="margin-top: 20px; font-size: 13px; color: #6b7280;">
                  If you have any questions or need help, our support team is always available at support@bizcore.app
                </p>
              </div>

              <div class="footer">
                <p style="margin: 0;">BizCore - All-in-One Business Management</p>
                <p style="margin: 8px 0 0 0;">© ${new Date().getFullYear()} BizCore. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail(
      recipientEmail,
      `Payment Approved - Your ${planName} upgrade is active!`,
      emailContent
    );

    console.log(`[Email] Tenant payment approved email sent to ${recipientEmail}`);
  } catch (error) {
    console.error('[Email] Failed to send tenant payment approved email:', error);
    // Don't throw - this is a notification, not critical
  }
}
