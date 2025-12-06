/**
 * Tenant warning and notification emails
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
    throw error;
  }
}

/**
 * Send warning email to tenant
 */
export async function sendTenantWarningEmail(
  tenantEmail: string,
  tenantName: string,
  reason: string,
  adminMessage: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; }
          .card { background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #1e40af; margin-bottom: 10px; }
          .alert-banner { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #d97706; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .alert-icon { font-size: 32px; margin-bottom: 10px; }
          .alert-title { font-size: 18px; font-weight: 600; color: #92400e; margin-bottom: 10px; }
          .alert-message { font-size: 14px; color: #78350f; line-height: 1.6; margin-bottom: 15px; }
          .admin-message { background-color: #f3f4f6; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 14px; color: #374151; line-height: 1.6; }
          .admin-label { font-weight: 600; color: #1f2937; margin-bottom: 8px; }
          .action-section { background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .action-title { font-weight: 600; color: #0369a1; margin-bottom: 8px; }
          .action-text { font-size: 14px; color: #164e63; line-height: 1.6; }
          .footer { border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; font-size: 12px; color: #9ca3af; text-align: center; }
          .cta-button { display: inline-block; background-color: #0284c7; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <div class="logo">BizCore</div>
            </div>

            <p>Hi ${tenantName},</p>

            <div class="alert-banner">
              <div class="alert-icon" style="font-size: 28px;">⚠</div>
              <div class="alert-title">Account Notice Required</div>
              <div class="alert-message">
                We're reaching out regarding your BizCore account. Please review the message below.
              </div>
            </div>

            <div class="admin-message">
              <div class="admin-label">Issue: ${reason}</div>
              <p style="margin: 10px 0;">${adminMessage}</p>
            </div>

            <div class="action-section">
              <div class="action-title">What You Can Do</div>
              <div class="action-text">
                <p>Please take prompt action to address this matter. If you have any questions or need assistance, our support team is here to help.</p>
                <a href="https://bizcore.test/dashboard" class="cta-button">Go to Your Dashboard</a>
              </div>
            </div>

            <p style="margin-top: 30px; font-size: 14px; color: #4b5563;">
              Thank you for using BizCore. We're committed to your success.
            </p>

            <div class="footer">
              <p>© 2025 BizCore. All rights reserved.</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const subject = `[BizCore Alert] ${reason}`;

  return sendEmail(tenantEmail, subject, html);
}

/**
 * Send account deactivation email to tenant
 */
export async function sendTenantDeactivationEmail(
  tenantEmail: string,
  tenantName: string,
  businessName: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; }
          .card { background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #1e40af; margin-bottom: 10px; }
          .alert-banner { background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border-left: 4px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .alert-icon { font-size: 32px; margin-bottom: 10px; }
          .alert-title { font-size: 18px; font-weight: 600; color: #991b1b; margin-bottom: 10px; }
          .alert-message { font-size: 14px; color: #7f1d1d; line-height: 1.6; margin-bottom: 15px; }
          .info-box { background-color: #f3f4f6; border-left: 4px solid #6b7280; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 14px; color: #374151; line-height: 1.6; }
          .info-title { font-weight: 600; color: #1f2937; margin-bottom: 8px; }
          .info-list { margin: 10px 0; }
          .info-list li { margin: 8px 0; }
          .action-section { background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .action-title { font-weight: 600; color: #15803d; margin-bottom: 8px; }
          .action-text { font-size: 14px; color: #166534; line-height: 1.6; }
          .footer { border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; font-size: 12px; color: #9ca3af; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <div class="logo">BizCore</div>
            </div>

            <p>Hi ${tenantName},</p>

            <div class="alert-banner">
              <div class="alert-icon" style="color: #dc2626; font-size: 24px; line-height: 1;">●</div>
              <div class="alert-title">Account Deactivated</div>
              <div class="alert-message">
                Your BizCore account for "${businessName}" has been deactivated by our admin team.
              </div>
            </div>

            <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
              This action means that your account and all associated data are no longer active on our platform. You will not be able to access your dashboard, manage products, or process orders.
            </p>

            <div class="info-box">
              <div class="info-title">What This Means:</div>
              <ul class="info-list">
                <li>Your account is no longer accessible</li>
                <li>Your subscription has been terminated</li>
                <li>Your data is preserved for historical records</li>
                <li>No further charges will be applied</li>
              </ul>
            </div>

            <div class="action-section">
              <div class="action-title">Next Steps</div>
              <div class="action-text">
                <p>If you believe this is an error or would like to appeal this decision, please contact our support team immediately. We're here to help.</p>
                <p><strong>Support Email:</strong> support@bizcore.ph</p>
                <p><strong>Support Hours:</strong> Monday - Friday, 9am - 6pm PST</p>
              </div>
            </div>

            <p style="margin-top: 30px; font-size: 13px; color: #6b7280; line-height: 1.6;">
              We appreciate the time you spent with BizCore. If you have any questions or concerns, please don't hesitate to reach out to our support team.
            </p>

            <div class="footer">
              <p>© 2025 BizCore. All rights reserved.</p>
              <p>This is an automated message from our admin system. Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const subject = `[BizCore] Your Account Has Been Deactivated`;

  return sendEmail(tenantEmail, subject, html);
}
