/**
 * OTP (One-Time Password) Utility Functions
 */

import crypto from 'crypto'
import { prisma } from './prisma'

/**
 * Generate a random OTP
 * @param length Length of OTP (default: 6)
 * @returns Random numeric OTP string
 */
export function generateOtp(length: number = 6): string {
  const digits = '0123456789'
  let otp = ''

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, digits.length)
    otp += digits[randomIndex]
  }

  return otp
}

/**
 * Verify OTP is numeric and correct length
 */
export function isValidOtpFormat(otp: string, length: number = 6): boolean {
  if (typeof otp !== 'string') {
    return false
  }
  return /^\d+$/.test(otp) && otp.length === length
}

/**
 * Calculate OTP expiry time
 */
export function calculateOtpExpiry(minutes: number = 10): Date {
  const now = new Date()
  return new Date(now.getTime() + minutes * 60 * 1000)
}

/**
 * Check if OTP is expired
 */
export function isOtpExpired(expiryTime: Date | null | undefined): boolean {
  if (!expiryTime) return true
  return new Date() > new Date(expiryTime)
}

/**
 * Generate a unique verification token for one-time use links
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Hash data for secure storage (simple version for non-sensitive data)
 * For passwords, use bcrypt or similar
 */
export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

/**
 * Mask email for display (e.g., "o***r@example.com")
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email

  const maskedLocal = local.charAt(0) + '*'.repeat(Math.max(1, local.length - 2)) + local.charAt(local.length - 1)
  return `${maskedLocal}@${domain}`
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254 // RFC 5321
}

/**
 * Sanitize business name (prevent XSS)
 */
export function sanitizeBusinessName(name: string): string {
  return name
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .substring(0, 100) // Limit length
}

/**
 * Sanitize description (prevent XSS)
 */
export function sanitizeDescription(text: string): string {
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .substring(0, 500) // Limit length
}

/**
 * Validate subdomain format
 * Allowed: alphanumeric and hyphens, 3-30 characters
 */
export function isValidSubdomain(subdomain: string): boolean {
  const subdomainRegex = /^[a-z0-9]([a-z0-9-]{1,28}[a-z0-9])?$/
  return subdomainRegex.test(subdomain)
}

/**
 * List of reserved subdomains
 */
const RESERVED_SUBDOMAINS = [
  'admin',
  'api',
  'www',
  'mail',
  'support',
  'app',
  'dashboard',
  'storefront',
  'pos',
  'test',
  'demo',
  'staging',
  'production',
  'localhost',
  'api-v1',
  'api-v2'
]

/**
 * Check if subdomain is reserved
 */
export function isReservedSubdomain(subdomain: string): boolean {
  return RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())
}

/**
 * Validate subdomain completely
 */
export function validateSubdomain(subdomain: string): { valid: boolean; error?: string } {
  const trimmed = subdomain.toLowerCase().trim()

  if (!trimmed) {
    return { valid: false, error: 'Subdomain is required' }
  }

  if (!isValidSubdomain(trimmed)) {
    return {
      valid: false,
      error: 'Subdomain must be 3-30 characters, start with a letter, and contain only alphanumeric characters and hyphens'
    }
  }

  if (isReservedSubdomain(trimmed)) {
    return { valid: false, error: `"${trimmed}" is a reserved subdomain` }
  }

  return { valid: true }
}

/**
 * Store OTP in database for tenant/customer login
 */
export async function storeOTP(
  email: string,
  otp: string,
  userType: 'tenant' | 'customer' = 'tenant'
) {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Delete any existing OTPs for this email/type
  await prisma.oTP.deleteMany({
    where: {
      email,
      userType,
    },
  });

  // Store new OTP
  return prisma.oTP.create({
    data: {
      email,
      otp,
      userType,
      expiresAt,
      attempts: 0,
    },
  });
}

/**
 * Verify OTP against stored value
 */
export async function verifyStoredOTP(
  email: string,
  otp: string,
  userType: 'tenant' | 'customer' = 'tenant'
): Promise<boolean> {
  const record = await prisma.oTP.findFirst({
    where: {
      email,
      userType,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    return false;
  }

  // Check if OTP has expired
  if (new Date() > record.expiresAt) {
    await prisma.oTP.delete({ where: { id: record.id } });
    return false;
  }

  // Check attempt limit (max 5 attempts)
  if (record.attempts >= 5) {
    await prisma.oTP.delete({ where: { id: record.id } });
    return false;
  }

  // Verify OTP
  const isValid = record.otp === otp;

  if (isValid) {
    // Delete OTP on successful verification
    await prisma.oTP.delete({ where: { id: record.id } });
  } else {
    // Increment attempts
    await prisma.oTP.update({
      where: { id: record.id },
      data: { attempts: record.attempts + 1 },
    });
  }

  return isValid;
}

/**
 * Send OTP via email
 */
export async function sendOTPEmail(
  email: string,
  otp: string,
  userType: 'tenant' | 'customer' = 'tenant'
) {
  try {
    // @ts-expect-error - nodemailer is optional dependency
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodemailer: any = await import('nodemailer');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

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
            .title { font-size: 24px; font-weight: 600; color: #1e40af; margin-bottom: 10px; }
            .subtitle { font-size: 14px; color: #6b7280; margin-bottom: 30px; }
            .otp-container { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 4px solid #1e40af; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center; }
            .otp-code { font-size: 36px; font-weight: 700; color: #1e40af; letter-spacing: 4px; font-family: 'Courier New', monospace; margin: 15px 0; }
            .otp-expiry { font-size: 13px; color: #666; margin-top: 10px; }
            .instructions { font-size: 14px; color: #4b5563; line-height: 1.6; margin: 20px 0; }
            .security { background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; border-radius: 6px; font-size: 13px; color: #166534; margin-top: 20px; }
            .footer { border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; font-size: 12px; color: #9ca3af; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <div class="logo">BizCore</div>
                <div class="title">Your Login Code</div>
                <div class="subtitle">Sign in securely with OTP</div>
              </div>

              <p>We received a login attempt for your BizCore account. Use the code below to continue:</p>

              <div class="otp-container">
                <p style="margin: 0 0 10px 0; color: #4b5563; font-size: 13px;">Your verification code:</p>
                <div class="otp-code">${otp}</div>
                <div class="otp-expiry">Valid for 10 minutes</div>
              </div>

              <div class="instructions">
                <p><strong>How to use:</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Copy the code above</li>
                  <li>Return to the login page</li>
                  <li>Paste the code in the verification field</li>
                  <li>Complete your sign-in</li>
                </ul>
              </div>

              <div class="security">
                <p style="margin: 0;">
                  <strong>Security Tip:</strong> Never share this code with anyone. BizCore staff will never ask you for your OTP.
                </p>
              </div>

              <p style="margin-top: 30px; font-size: 13px; color: #6b7280;">
                If you didn't request this code, you can safely ignore this email. Your account remains secure.
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

    return transporter.sendMail({
      from: process.env.ADMIN_EMAIL || 'noreply@bizcore.ph',
      to: email,
      subject: '[BizCore] Your Login Code - ' + otp,
      html,
    });
  } catch (error) {
    console.error('[OTP] Failed to send OTP email:', error);
    throw error;
  }
}

/**
 * Clean up expired OTPs
 */
export async function cleanupExpiredOTPs() {
  return prisma.oTP.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}
