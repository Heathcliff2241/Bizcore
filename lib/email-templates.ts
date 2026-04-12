/**
 * Email Templates for BizCore
 * All templates use inline CSS for email client compatibility
 */

export const emailTemplates = {
  /**
   * Sign-In OTP Email Template
   * Purpose: User authentication during sign-in
   * Context: Urgent, action-focused, short expiry
   */
  signInOtp: (email: string, otp: string, expiryMinutes: number = 10) => ({
    subject: 'Your BizCore Sign-In Code',
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
            .title { font-size: 24px; font-weight: 600; color: #7e22ce; margin-bottom: 10px; }
            .subtitle { font-size: 14px; color: #6b7280; margin-bottom: 30px; }
            .otp-container { background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); border-left: 4px solid #7e22ce; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center; }
            .otp-code { font-size: 48px; font-weight: 700; color: #6b21a8; letter-spacing: 6px; font-family: 'Courier New', monospace; margin: 15px 0; }
            .otp-expiry { font-size: 13px; color: #581c87; margin-top: 10px; font-weight: 600; }
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
                <div class="title">Sign-In Verification</div>
                <div class="subtitle">Enter this code to access your account</div>
              </div>

              <p>Someone is trying to sign in to your BizCore account. If this was you, use the code below to complete your sign-in.</p>

              <div class="otp-container">
                <p style="margin: 0 0 10px 0; color: #7e22ce; font-size: 13px;">Your sign-in code:</p>
                <div class="otp-code">${otp}</div>
                <div class="otp-expiry">Expires in ${expiryMinutes} minutes</div>
              </div>

              <div class="instructions">
                <p><strong>How to use:</strong></p>
                <ol style="margin: 10px 0; padding-left: 20px;">
                  <li>Copy the code above</li>
                  <li>Return to your sign-in page</li>
                  <li>Paste the code and click verify</li>
                </ol>
              </div>

              <div class="security">
                <strong>Security:</strong> Never share this code with anyone. BizCore staff will never ask for your sign-in code.
              </div>

              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                If you didn't request this code, please ignore this email. Your account is secure.
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
Sign-In Verification

Someone is trying to sign in to your BizCore account.

Your sign-in code: ${otp}
Expires in: ${expiryMinutes} minutes

How to use:
1. Copy the code above
2. Return to your sign-in page
3. Paste the code and click verify

Security: Never share this code with anyone. BizCore will never ask for it.

If you didn't request this, please ignore this email.

---
BizCore - All-in-One Business Management
© ${new Date().getFullYear()} BizCore
    `.trim()
  }),

  /**
   * Email Verification OTP Template
   * Purpose: Email verification during onboarding/account setup
   * Context: Welcoming, instructional, longer expiry
   */
  verifyEmailOtp: (email: string, otp: string, expiryMinutes: number = 30) => ({
    subject: 'Verify Your Email - Complete Your BizCore Setup',
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
            .otp-expiry { font-size: 13px; color: #0c4a6e; margin-top: 10px; }
            .instructions { font-size: 14px; color: #4b5563; line-height: 1.6; margin: 20px 0; }
            .welcome-box { background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%); border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .welcome-title { font-weight: 600; color: #065f46; margin-bottom: 8px; }
            .welcome-text { color: #047857; font-size: 13px; line-height: 1.5; }
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

              <div class="welcome-box">
                <div class="welcome-title">Welcome to BizCore!</div>
                <div class="welcome-text">We're excited to help you grow your business with our all-in-one platform. Let's get you set up in just a few steps.</div>
              </div>

              <p>To complete your account setup and unlock all the features of BizCore, we need to verify your email address.</p>

              <div class="otp-container">
                <p style="margin: 0 0 10px 0; color: #4b5563; font-size: 13px;">Your verification code:</p>
                <div class="otp-code">${otp}</div>
                <div class="otp-expiry">Valid for ${expiryMinutes} minutes</div>
              </div>

              <div class="instructions">
                <strong>Quick setup steps:</strong>
                <ol style="margin: 10px 0; padding-left: 20px;">
                  <li>Copy the code above</li>
                  <li>Paste it into the verification field</li>
                  <li>Click verify and complete your profile</li>
                </ol>
              </div>

              <div class="security">
                <strong>Keep it private:</strong> We'll never ask for this code anywhere else. Don't share it with anyone.
              </div>

              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                <strong>What happens next?</strong> After verification, you can add your products, manage inventory, activate your POS system, and launch your online storefront.
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
Welcome to BizCore!

We're excited to help you grow your business. Let's verify your email to get started.

Your verification code: ${otp}
Valid for: ${expiryMinutes} minutes

Quick setup steps:
1. Copy the code above
2. Paste it into the verification field
3. Click verify and complete your profile

What happens next?
After verification, you can add your products, manage inventory, activate your POS system, and launch your online storefront.

Keep it private: We'll never ask for this code anywhere else.

---
BizCore - All-in-One Business Management
© ${new Date().getFullYear()} BizCore
    `.trim()
  }),

  /**
   * Password Reset OTP Template
   * Purpose: Password reset verification
   * Context: Security-focused, straightforward
   */
  resetPasswordOtp: (email: string, otp: string, expiryMinutes: number = 15) => ({
    subject: 'Reset Your BizCore Password',
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
            .otp-container { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center; }
            .otp-code { font-size: 36px; font-weight: 700; color: #92400e; letter-spacing: 4px; font-family: 'Courier New', monospace; margin: 15px 0; }
            .otp-expiry { font-size: 13px; color: #78350f; margin-top: 10px; font-weight: 600; }
            .instructions { font-size: 14px; color: #4b5563; line-height: 1.6; margin: 20px 0; }
            .footer { border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; font-size: 12px; color: #9ca3af; text-align: center; }
            .security { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px; font-size: 13px; color: #78350f; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <div class="logo">BizCore</div>
                <div class="title">Reset Your Password</div>
                <div class="subtitle">Use this code to create a new password</div>
              </div>

              <p>You requested to reset your BizCore password. Use the verification code below to proceed.</p>

              <div class="otp-container">
                <p style="margin: 0 0 10px 0; color: #78350f; font-size: 13px;">Your reset code:</p>
                <div class="otp-code">${otp}</div>
                <div class="otp-expiry">Valid for ${expiryMinutes} minutes</div>
              </div>

              <div class="instructions">
                <ol style="margin: 10px 0; padding-left: 20px;">
                  <li>Copy the code above</li>
                  <li>Return to the password reset page</li>
                  <li>Enter the code and your new password</li>
                </ol>
              </div>

              <div class="security">
                <strong>Important:</strong> If you didn't request this, please ignore this email. Your password remains unchanged and your account is secure.
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
Reset Your Password

You requested to reset your BizCore password.

Your reset code: ${otp}
Valid for: ${expiryMinutes} minutes

How to reset your password:
1. Copy the code above
2. Return to the password reset page
3. Enter the code and your new password

Important: If you didn't request this, please ignore this email.

---
BizCore - All-in-One Business Management
© ${new Date().getFullYear()} BizCore
    `.trim()
  }),

  /**
   * Generic OTP Template (Backwards Compatibility)
   * Defaults to sign-in context
   */
  sendOtp: (email: string, otp: string, expiryMinutes: number = 10) => 
    emailTemplates.signInOtp(email, otp, expiryMinutes),

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

