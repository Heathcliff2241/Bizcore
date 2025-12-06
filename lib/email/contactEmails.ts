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
    console.error('[Email] Contact form error:', error);
    throw new Error('Email service not available');
  }
}

interface ContactFormData {
  visitorName: string;
  visitorEmail: string;
  subject: string;
  message: string;
}

/**
 * Send contact form message to admin
 */
export async function sendContactFormEmail(data: ContactFormData) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'cesaresmero2@gmail.com';
    
    const emailContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e40af 0%, #0ea5e9 100%); padding: 30px; border-radius: 12px; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">New Contact Form Submission</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">From BizCore Landing Page</p>
        </div>

        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <p style="color: #374151; margin: 0 0 16px 0;"><strong>Visitor Information:</strong></p>
          
          <div style="margin-bottom: 12px;">
            <label style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Name</label>
            <p style="color: #1f2937; margin: 4px 0 0 0; font-weight: 500;">${data.visitorName}</p>
          </div>

          <div style="margin-bottom: 12px;">
            <label style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Email</label>
            <p style="color: #1f2937; margin: 4px 0 0 0; font-weight: 500;">
              <a href="mailto:${data.visitorEmail}" style="color: #1e40af; text-decoration: none;">${data.visitorEmail}</a>
            </p>
          </div>

          <div style="margin-bottom: 0;">
            <label style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Subject</label>
            <p style="color: #1f2937; margin: 4px 0 0 0; font-weight: 500;">${data.subject}</p>
          </div>
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; border-left: 4px solid #1e40af; border-radius: 8px; margin-bottom: 24px;">
          <p style="color: #6b7280; margin: 0 0 12px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Message</p>
          <p style="color: #374151; margin: 0; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            This message was submitted from the BizCore landing page contact form.
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0 0;">
            Reply to ${data.visitorEmail} to respond to the inquiry.
          </p>
        </div>
      </div>
    `;

    await sendEmail(
      adminEmail,
      `[BizCore Contact] ${data.subject}`,
      emailContent
    );

    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('[Contact Email] Failed to send:', error);
    throw error;
  }
}

/**
 * Send confirmation email to visitor
 */
export async function sendContactConfirmationEmail(data: ContactFormData) {
  try {
    const emailContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e40af 0%, #0ea5e9 100%); padding: 30px; border-radius: 12px; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Thank You for Reaching Out!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">We've received your message</p>
        </div>

        <p style="color: #374151; margin-bottom: 16px;">Hi ${data.visitorName},</p>

        <p style="color: #4b5563; margin-bottom: 16px;">Thank you for contacting BizCore. We've received your message and will get back to you as soon as possible.</p>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <p style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">Your Message Summary</p>
          <p style="color: #1f2937; margin: 0 0 12px 0;"><strong>Subject:</strong> ${data.subject}</p>
          <p style="color: #1f2937; margin: 0; white-space: pre-wrap; line-height: 1.6;">${data.message.substring(0, 200)}${data.message.length > 200 ? '...' : ''}</p>
        </div>

        <p style="color: #4b5563; margin-bottom: 16px;">We typically respond within 24 business hours. If your inquiry is urgent, please feel free to call us or check our support documentation.</p>

        <p style="color: #4b5563; margin-bottom: 24px;">Best regards,<br><strong>The BizCore Team</strong></p>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} BizCore. All rights reserved.
          </p>
        </div>
      </div>
    `;

    await sendEmail(
      data.visitorEmail,
      'BizCore - Message Confirmation',
      emailContent,
      'BizCore Support <support@bizcore.com>'
    );

    return { success: true };
  } catch (error) {
    console.error('[Confirmation Email] Failed to send:', error);
    // Don't throw - confirmation emails are non-critical
    return { success: false };
  }
}
