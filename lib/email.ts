import nodemailer from 'nodemailer'
import { emailTemplates } from './email-templates'

interface EmailOptions {
  to: string
  subject: string
  text?: string
  html?: string
}

// Initialize transporter (will use environment variables)
let transporter: nodemailer.Transporter | null = null

const getTransporter = () => {
  if (transporter) {
    return transporter
  }

  // Configure based on environment
  if (process.env.NODE_ENV === 'development' && process.env.SMTP_PROVIDER === 'ethereal') {
    // Try to use Ethereal Email for testing in development
    const etherealUser = process.env.ETHEREAL_USER
    const etherealPass = process.env.ETHEREAL_PASS

    if (etherealUser && etherealPass) {
      console.log('📧 Using Ethereal Email for development')
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: etherealUser,
          pass: etherealPass
        }
      })
      return transporter
    } else {
      console.log('⚠️ Ethereal credentials not configured. Using console logging instead.')
      console.log('💡 To use Ethereal in development:')
      console.log('   1. Visit https://ethereal.email/')
      console.log('   2. Sign up for a free account')
      console.log('   3. Add these to .env.local:')
      console.log('      ETHEREAL_USER=your-email@ethereal.email')
      console.log('      ETHEREAL_PASS=your-password')
      return null
    }
  }

  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ Email service not configured. Using console logging for development.')
    }
    return null
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  })

  return transporter
}

/**
 * Generic email sending function
 */
export async function sendEmail({ to, subject, text, html }: EmailOptions) {
  try {
    const transport = getTransporter()

    if (!transport) {
      // Not configured - log to console
      console.log('[Email] To:', to)
      console.log('[Email] Subject:', subject)
      if (text) console.log('[Email] Text:', text)
      if (html) console.log('[Email] HTML:', html.substring(0, 100) + '...')
      return
    }

    const info = await transport.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html
    })

    console.log('✅ Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Failed to send email:', error)
    throw error
  }
}

/**
 * Send OTP Email
 */
export const sendOtpEmail = async (email: string, otp: string, expiryMinutes: number = 10) => {
  try {
    const template = emailTemplates.sendOtp(email, otp, expiryMinutes)
    return await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error)
    throw error
  }
}

/**
 * Send Email Verification Success
 */
export const sendVerificationSuccessEmail = async (email: string, businessName: string) => {
  try {
    const template = emailTemplates.verificationSuccess(businessName)
    return await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  } catch (error) {
    console.error('❌ Failed to send verification success email:', error)
    throw error
  }
}

/**
 * Send Onboarding Complete Email
 */
export const sendOnboardingCompleteEmail = async (
  email: string,
  businessName: string,
  subdomain: string
) => {
  try {
    const dashboardUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/${subdomain}`
    const template = emailTemplates.onboardingComplete(businessName, email, dashboardUrl)
    return await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  } catch (error) {
    console.error('❌ Failed to send onboarding complete email:', error)
    throw error
  }
}

/**
 * Send Admin Notification - New Tenant Registration
 */
export const sendAdminNotificationEmail = async (
  businessName: string,
  industry: string,
  subdomain: string,
  ownerEmail: string,
  registrationTime: string
) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail) {
      console.warn('⚠️ ADMIN_EMAIL not configured. Skipping admin notification.')
      return { success: false, reason: 'ADMIN_EMAIL not configured' }
    }

    const dashboardLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/tenants/${subdomain}`
    const template = emailTemplates.adminNewTenantNotification(
      businessName,
      industry,
      subdomain,
      ownerEmail,
      registrationTime,
      dashboardLink
    )

    return await sendEmail({
      to: adminEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  } catch (error) {
    console.error('❌ Failed to send admin notification email:', error)
    throw error
  }
}

/**
 * Verify transporter connection (for testing)
 */
export const verifyEmailConnection = async () => {
  try {
    const transport = getTransporter()
    if (!transport) {
      return { success: false, message: 'Email service not configured' }
    }
    await transport.verify()
    console.log('✅ Email service is configured correctly')
    return { success: true }
  } catch (error) {
    console.error('❌ Email service configuration error:', error)
    throw error
  }
}

export default sendEmail
