import { NextAuthOptions } from 'next-auth'
import { randomUUID } from 'crypto'
import { prisma } from './prisma'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { isRateLimited, recordFailedAttempt, clearFailedAttempts } from './rateLimit'
import { resolveCookieDomain } from './utils'

const customerSessionCookieDomain = resolveCookieDomain()

// Determine whether session cookies should be marked Secure. Allow explicit override
// for local testing using NEXTAUTH_COOKIE_SECURE (true/false). Default to production.
let cookieSecure = typeof process.env.NEXTAUTH_COOKIE_SECURE !== 'undefined'
  ? String(process.env.NEXTAUTH_COOKIE_SECURE).toLowerCase() === 'true'
  : process.env.NODE_ENV === 'production'

// If we're running in production and cookies are set to insecure, require an explicit
// opt-in to avoid accidental misconfiguration. Use ALLOW_INSECURE_PROD=true to override.
if (process.env.NODE_ENV === 'production' && cookieSecure === false && process.env.ALLOW_INSECURE_PROD !== 'true') {
  console.warn('[CUSTOMER AUTH] In production, cookies should be secure. To opt-in to insecure cookies (HTTP) set NEXTAUTH_COOKIE_SECURE=false and ALLOW_INSECURE_PROD=true. Overriding and enabling secure cookies.')
  cookieSecure = true
}

export const customerAuthOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  useSecureCookies: cookieSecure,
  cookies: {
    sessionToken: {
      name: `next-auth.session-token.customer`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: cookieSecure,
        // Allow overriding the domain so sessions work on localhost, bizcore.test, etc.
        domain: customerSessionCookieDomain,
      },
    },
  },
  providers: [
    CredentialsProvider({
      id: 'customer-credentials',
      name: 'customer-credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        subdomain: { label: 'Subdomain', type: 'text' }
      },
      async authorize(credentials) {
        console.log('[CUSTOMER AUTH] authorize() called with email:', credentials?.email, 'subdomain:', credentials?.subdomain)
        
        if (!credentials?.email || !credentials?.password || !credentials?.subdomain) {
          console.log('[CUSTOMER AUTH] Missing credentials - email:', !!credentials?.email, 'password:', !!credentials?.password, 'subdomain:', !!credentials?.subdomain)
          return null
        }

        const email = credentials.email
        const subdomain = credentials.subdomain

        // Find tenant by subdomain
        const tenant = await prisma.tenant.findUnique({
          where: { subdomain: subdomain.toLowerCase() }
        })

        console.log('[CUSTOMER AUTH] Tenant lookup for subdomain:', subdomain, '-> found:', !!tenant)

        if (!tenant) {
          console.log('[CUSTOMER AUTH] Tenant not found:', subdomain)
          return null
        }

        // Find customer by email and tenant
        const customer = await prisma.customer.findFirst({
          where: {
            email: {
              equals: email,
              mode: 'insensitive'
            },
            tenantId: tenant.id,
            isActive: true
          }
        })

        console.log('[CUSTOMER AUTH] Customer lookup for email:', email, 'tenantId:', tenant.id, '-> found:', !!customer, 'has password:', !!customer?.password)

        if (!customer || !customer.password) {
          console.log('[CUSTOMER AUTH] Customer not found or no password')
          recordFailedAttempt(`customer_auth_${email}`)
          return null
        }

        const isValid = await bcrypt.compare(credentials.password, customer.password)
        console.log('[CUSTOMER AUTH] Password comparison result:', isValid)
        if (!isValid) {
          console.log('[CUSTOMER AUTH] Invalid password for:', email)
          recordFailedAttempt(`customer_auth_${email}`)
          return null
        }

        // Password valid - clear failed attempts and update last login
        console.log('[CUSTOMER AUTH] Authentication successful for:', email, 'customerId:', customer.id)
        clearFailedAttempts(`customer_auth_${email}`)
        await prisma.customer.update({
          where: { id: customer.id },
          data: { lastLogin: new Date() }
        })

        return {
          id: customer.id.toString(),
          email: customer.email || '',
          name: `${customer.firstName} ${customer.lastName}`,
          role: 'customer',
          tenantId: tenant.id.toString(),
          subdomain: tenant.subdomain
        }
      }
    })
  ],
  pages: {
    // Customer auth doesn't use a centralized signin page
    // Each storefront handles its own auth flow
  },
  callbacks: {
    async signIn({ account, credentials }) {
      // Handle rate limiting for credentials provider
      if (account?.provider === 'customer-credentials' && credentials?.email) {
        const email = credentials.email as string
        const rateLimitKey = `customer_auth_${email}`

        if (isRateLimited(rateLimitKey, 5, 900000)) {
          console.log('[CUSTOMER AUTH] Rate limited signin attempt for:', email)
          throw new Error('Too many failed attempts. Please try again later.')
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id?.toString()
        token.email = user.email ?? token.email
        token.role = (user as { role?: string }).role || 'customer'
        token.tenantId = (user as { tenantId?: string }).tenantId
        token.subdomain = (user as { subdomain?: string }).subdomain
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          email: (token.email as string | undefined) || session.user?.email || '',
          role: token.role as string,
          tenantId: token.tenantId as string | undefined,
          subdomain: token.subdomain as string | undefined,
        }
      }
      return session
    }
  }
}