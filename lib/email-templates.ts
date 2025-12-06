/**
 * Email Templates for BizCore
 * All templates use inline CSS for email client compatibility
 */

export const emailTemplates = {
  /**
   * OTP Email Template
   */
  sendOtp: (email: string, otp: string, expiryMinutes: number = 10) => ({
    subject: 'Your magic code is here - Verify your BizCore account',
    html: `
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
            .title { font-size: 24px; font-weight: 600; color: #1e40af; margin-bottom: 10px; }
            .subtitle { font-size: 14px; color: #6b7280; margin-bottom: 30px; }
            .otp-container { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 4px solid #1e40af; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center; }
            .otp-code { font-size: 36px; font-weight: 700; color: #1e40af; letter-spacing: 4px; font-family: 'Courier New', monospace; margin: 15px 0; }
            .otp-expiry { font-size: 13px; color: #666; margin-top: 10px; }
            .instructions { font-size: 14px; color: #4b5563; line-height: 1.6; margin: 20px 0; }
            .footer { border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; font-size: 12px; color: #9ca3af; text-align: center; }
            .security { background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; border-radius: 6px; font-size: 13px; color: #166534; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <div class="logo">BizCore</div>
                <div class="title">Ready to build something great?</div>
                <div class="subtitle">Verify your email to get started</div>
              </div>

              <p>Welcome aboard! We're excited to help you grow your business.</p>
              <p>Here's your verification code. It's valid for ${expiryMinutes} minutes, so act quick!</p>

              <div class="otp-container">
                <p style="margin: 0 0 10px 0; color: #4b5563; font-size: 13px;">Your verification code:</p>
                <div class="otp-code">${otp}</div>
                <div class="otp-expiry">Valid for ${expiryMinutes} minutes</div>
              </div>

              <div class="instructions">
                <strong>Quick setup:</strong>
                <ol style="margin: 10px 0; padding-left: 20px;">
                  <li>Copy the code above (or just note it down)</li>
                  <li>Pop it into the field we sent you to</li>
                  <li>Click verify and let's get rolling!</li>
                </ol>
              </div>

              <div class="security">
                <strong>Heads up:</strong> Keep this code to yourself. We'll never ask for it anywhere else.
              </div>

              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                Didn't sign up? No worries, just ignore this email and nothing will change.
              </p>

              <div class="footer">
                <p style="margin: 0;">BizCore - All-in-One Business Management</p>
                <p style="margin: 8px 0 0 0;">© ${new Date().getFullYear()} BizCore. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Ready to build something great?

Your verification code: ${otp}
Valid for: ${expiryMinutes} minutes

Quick setup:
1. Copy the code above
2. Paste it into the field
3. Click verify and let's go!

Keep this code to yourself - we'll never ask for it anywhere else.

Didn't sign up? Just ignore this email.

---
BizCore - All-in-One Business Management
© ${new Date().getFullYear()} BizCore
    `.trim()
  }),

  /**
   * Email Verification Success
   */
  verificationSuccess: () => ({
    subject: 'Email verified - Welcome to BizCore!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; }
            .card { background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .checkmark { font-size: 48px; margin-bottom: 15px; }
            .title { font-size: 24px; font-weight: 600; color: #1e40af; }
            .subtitle { font-size: 14px; color: #6b7280; margin-top: 10px; }
            .content { font-size: 14px; line-height: 1.6; color: #4b5563; }
            .footer { border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; font-size: 12px; color: #9ca3af; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <div class="checkmark">Done!</div>
                <div class="title">Your email is verified</div>
                <div class="subtitle">Let's set up your business</div>
              </div>

              <div class="content">
                <p>Nice work! Your email is all confirmed. Now for the fun part - getting your business ready to go.</p>
                
                <p style="margin-top: 20px;"><strong>What's next:</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Tell us about your business</li>
                  <li>Set up your branch info</li>
                  <li>Add your products</li>
                  <li>Create your online store</li>
                  <li>Turn on your POS system</li>
                </ul>

                <p style="margin-top: 20px;">You're just a few steps away from having your business online. Let's go!</p>
              </div>

              <div class="footer">
                <p style="margin: 0;">BizCore - All-in-One Business Management</p>
                <p style="margin: 8px 0 0 0;">© ${new Date().getFullYear()} BizCore. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Email verified - Welcome!

Your email is confirmed. Now let's get your business set up.

What's next:
- Tell us about your business
- Set up your branch info
- Add your products
- Create your online store
- Turn on your POS system

You're just a few steps away!

---
BizCore - All-in-One Business Management
© ${new Date().getFullYear()} BizCore
    `.trim()
  }),

  /**
   * Onboarding Complete - Welcome Email
   */
  onboardingComplete: (businessName: string, email: string, dashboardUrl: string) => ({
    subject: `Your BizCore setup is complete, ${businessName}! Plus 14 days free.`,
    html: `
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
            .features { background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .feature-item { margin: 12px 0; font-size: 13px; color: #4b5563; }
            .trial-banner { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-left: 4px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .trial-title { font-size: 16px; font-weight: 600; color: #065f46; margin-bottom: 8px; }
            .trial-text { color: #047857; font-size: 13px; line-height: 1.5; }
            .footer { border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; font-size: 12px; color: #9ca3af; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <div class="emoji">Congrats!</div>
                <div class="title">You're all set, ${businessName}!</div>
              </div>

              <div class="content">
                <p>Your BizCore account is ready to roll. Everything you've set up is now live and ready for action.</p>
                
                <p style="margin-top: 20px;">Here's what you've got configured:</p>
                <div class="features">
                  <div class="feature-item">Business profile created</div>
                  <div class="feature-item">Branch details all set</div>
                  <div class="feature-item">Products and categories added</div>
                  <div class="feature-item">POS system activated</div>
                  <div class="feature-item">Online storefront design tools ready (BrandStudio)</div>
                </div>

                <div class="trial-banner">
                  <div class="trial-title">Free 14-Day Trial Activated!</div>
                  <div class="trial-text">
                    <p style="margin: 8px 0 0 0;">You now have 14 days to explore all premium features at no cost. No credit card required, and you can upgrade or cancel anytime. Make the most of your trial and get your business up and running!</p>
                  </div>
                </div>

                <p>Now you can:</p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Log into your dashboard</li>
                  <li>Manage your products and inventory</li>
                  <li>Customize and launch your storefront with BrandStudio</li>
                  <li>Accept orders online from customers</li>
                  <li>Process transactions with your POS system</li>
                  <li>Track orders and payments in real-time</li>
                </ul>

                <center>
                  <a href="${dashboardUrl}" class="cta-button">Get Started</a>
                </center>

                <p style="margin-top: 20px; font-size: 13px; color: #6b7280;">
                  Questions? Our team is here to help at support@bizcore.app
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
    `,
    text: `
You're all set, ${businessName}!

Your BizCore account is ready. Everything is configured and live.

You've got:
- Business profile created
- Branch details set up
- Products and categories added
- POS system activated
- Online storefront design tools ready (BrandStudio)

FREE 14-DAY TRIAL ACTIVATED!
You now have 14 days to explore all premium features at no cost. No credit card required, and you can upgrade or cancel anytime. Make the most of your trial and get your business up and running!

Now you can:
- Log into your dashboard
- Manage your products
- Design your online storefront
- Accept customer orders
- Process transactions
- Track everything in real-time

Get Started: ${dashboardUrl}

Questions? Email support@bizcore.app

---
BizCore - All-in-One Business Management
© ${new Date().getFullYear()} BizCore
    `.trim()
  }),

  /**
   * Admin Notification - New Tenant Registration
   */
  adminNewTenantNotification: (
    businessName: string,
    industry: string,
    subdomain: string,
    ownerEmail: string,
    registrationTime: string,
    dashboardLink: string
  ) => ({
    subject: `New business on board: ${businessName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; }
            .card { background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #1e40af 0%, #4338ca 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px; }
            .title { font-size: 22px; font-weight: 600; }
            .info-grid { display: table; width: 100%; margin: 20px 0; }
            .info-row { display: table-row; }
            .info-label { display: table-cell; background-color: #f3f4f6; padding: 12px; font-weight: 600; color: #374151; width: 30%; border: 1px solid #e5e7eb; }
            .info-value { display: table-cell; padding: 12px; color: #4b5563; border: 1px solid #e5e7eb; }
            .cta-link { display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #4338ca 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
            .footer { border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; font-size: 12px; color: #9ca3af; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <div class="title">New registration alert</div>
              </div>

              <p>A fresh business just signed up for BizCore. Here's the lowdown:</p>

              <table class="info-grid">
                <tr class="info-row">
                  <td class="info-label">Business Name</td>
                  <td class="info-value">${businessName}</td>
                </tr>
                <tr class="info-row">
                  <td class="info-label">Industry</td>
                  <td class="info-value">${industry || 'Not specified'}</td>
                </tr>
                <tr class="info-row">
                  <td class="info-label">Subdomain</td>
                  <td class="info-value"><code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 3px;">${subdomain}</code></td>
                </tr>
                <tr class="info-row">
                  <td class="info-label">Owner Email</td>
                  <td class="info-value"><a href="mailto:${ownerEmail}" style="color: #1e40af; text-decoration: none;">${ownerEmail}</a></td>
                </tr>
                <tr class="info-row">
                  <td class="info-label">Joined</td>
                  <td class="info-value">${registrationTime}</td>
                </tr>
              </table>

              <div style="text-align: center;">
                <a href="${dashboardLink}" class="cta-link">View on Dashboard</a>
              </div>

              <p style="margin-top: 20px; font-size: 13px; color: #6b7280; text-align: center;">
                You can manage this business from your admin dashboard or reach out to them directly.
              </p>

              <div class="footer">
                <p style="margin: 0;">BizCore Admin</p>
                <p style="margin: 8px 0 0 0;">© ${new Date().getFullYear()} BizCore. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
New business on board: ${businessName}

Business Name: ${businessName}
Industry: ${industry || 'Not specified'}
Subdomain: ${subdomain}
Owner Email: ${ownerEmail}
Joined: ${registrationTime}

View on Dashboard: ${dashboardLink}

---
BizCore Admin
© ${new Date().getFullYear()} BizCore
    `.trim()
  })
}

