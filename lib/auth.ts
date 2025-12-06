import { NextAuthOptions } from 'next-auth'
import { randomUUID } from 'crypto'
// import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { isRateLimited, recordFailedAttempt, clearFailedAttempts } from './rateLimit'
import { resolveCookieDomain } from './utils'
import { logActivity, getClientIp, getUserAgent, normalizeUserRole } from './activityLogger'

const sessionCookieDomain = resolveCookieDomain()

// Determine whether session cookies should be marked Secure. Allow explicit override
// for local testing using NEXTAUTH_COOKIE_SECURE (true/false). Default to production.
let cookieSecure = typeof process.env.NEXTAUTH_COOKIE_SECURE !== 'undefined'
  ? String(process.env.NEXTAUTH_COOKIE_SECURE).toLowerCase() === 'true'
  : process.env.NODE_ENV === 'production'
// Production env validation - be explicit about security expectations
if (process.env.NODE_ENV === 'production' && process.env.ALLOW_INSECURE_PROD !== 'true') {
  const missingProd = []
  if (!process.env.NEXTAUTH_URL) missingProd.push('NEXTAUTH_URL')
  if (!process.env.NEXT_PUBLIC_APP_URL) missingProd.push('NEXT_PUBLIC_APP_URL')
  if (missingProd.length > 0) {
    console.error(`[AUTH] Missing production environment variables: ${missingProd.join(', ')}. Please set these to your public HTTPS origin (e.g. https://bizcore.test or https://yourdomain.com).`)
    process.exit(1)
  }

  try {
    const nextAuthHost = new URL(process.env.NEXTAUTH_URL as string)
    const pubHost = new URL(process.env.NEXT_PUBLIC_APP_URL as string)
    if (nextAuthHost.protocol !== 'https:' || pubHost.protocol !== 'https:') {
      console.error('[AUTH] NEXTAUTH_URL and NEXT_PUBLIC_APP_URL must use https:// in production.')
      process.exit(1)
    }
    if (nextAuthHost.origin !== pubHost.origin) {
      console.warn('[AUTH] NEXTAUTH_URL and NEXT_PUBLIC_APP_URL origins do not match. This may cause CORS and cookie issues. Consider aligning them to the same origin in production.')
    }
    if (process.env.NEXTAUTH_COOKIE_DOMAIN) {
      const cookieDomainNormalized = process.env.NEXTAUTH_COOKIE_DOMAIN.replace(/^\./, '')
      if (cookieDomainNormalized !== nextAuthHost.hostname.replace(/^\./, '')) {
        console.warn('[AUTH] NEXTAUTH_COOKIE_DOMAIN does not match NEXTAUTH_URL hostname. This may lead to cookie domain mismatch: ', process.env.NEXTAUTH_COOKIE_DOMAIN, 'vs', nextAuthHost.hostname)
      }
    }
  } catch (err) {
    console.error('[AUTH] Failed to parse NEXTAUTH_URL / NEXT_PUBLIC_APP_URL. Please ensure they are valid URLs.', (err as Error).message)
    process.exit(1)
  }
}

// If we're running in production and cookies are set to insecure, require an explicit
// opt-in to avoid accidental misconfiguration. Use ALLOW_INSECURE_PROD=true to override.
if (process.env.NODE_ENV === 'production' && cookieSecure === false && process.env.ALLOW_INSECURE_PROD !== 'true') {
  console.warn('[AUTH] In production, cookies should be secure. To opt-in to insecure cookies (HTTP) set NEXTAUTH_COOKIE_SECURE=false and ALLOW_INSECURE_PROD=true. Overriding and enabling secure cookies.')
  cookieSecure = true
}

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  useSecureCookies: cookieSecure,
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: cookieSecure,
        // Allow overriding the domain so sessions work on localhost, bizcore.test, etc.
        domain: sessionCookieDomain,
      },
    },
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email || ''

        // Try database lookup (case-insensitive)
        const user = await prisma.user.findFirst({
          where: {
            email: {
              equals: credentials.email,
              mode: 'insensitive'
            }
          }
        })

        if (!user || !user.password) {
          recordFailedAttempt(`auth_${email}`) // Record failed attempt
          return null
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) {
          recordFailedAttempt(`auth_${email}`) // Record failed attempt
          return null
        }

        // Password valid - clear failed attempts
        clearFailedAttempts(`auth_${email}`)

        return {
          id: user.id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
        }
      }
    }),
    // Customer credentials provider for storefront logins
    CredentialsProvider({
      id: 'customer-credentials',
      name: 'customer-credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        subdomain: { label: 'Subdomain', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.subdomain) {
          return null
        }

        const email = credentials.email
        const subdomain = credentials.subdomain

        // Find tenant by subdomain
        const tenant = await prisma.tenant.findUnique({ where: { subdomain: subdomain.toLowerCase() } })
        if (!tenant) {
          return null
        }

        // Find customer by email and tenant
        const customer = await prisma.customer.findFirst({
          where: {
            email: { equals: email, mode: 'insensitive' },
            tenantId: tenant.id,
            isActive: true
          }
        })

        if (!customer || !customer.password) {
          recordFailedAttempt(`customer_auth_${email}`)
          return null
        }

        const isValid = await bcrypt.compare(credentials.password, customer.password)
        if (!isValid) {
          recordFailedAttempt(`customer_auth_${email}`)
          return null
        }

        // Password valid - clear failed attempts and update last login
        clearFailedAttempts(`customer_auth_${email}`)
        await prisma.customer.update({ where: { id: customer.id }, data: { lastLogin: new Date() } })

        return {
          id: customer.id.toString(),
          email: customer.email || '',
          name: `${customer.firstName} ${customer.lastName}`,
          role: 'customer',
          tenantId: tenant.id.toString(),
          subdomain: tenant.subdomain,
        }
      }
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  // Explicitly disable OAuth providers to avoid openid-client loading
  callbacks: {
    async signIn({ account, credentials, user }) {
      // Handle rate limiting for credentials provider, including customer logins
      if ((account?.provider === 'credentials' || account?.provider === 'customer-credentials') && credentials?.email) {
        const email = credentials.email as string
        const rateLimitKey = account?.provider === 'customer-credentials' ? `customer_auth_${email}` : `auth_${email}`

        if (isRateLimited(rateLimitKey, 5, 900000)) {
          // Log failed login attempt
          await logActivity({
            userId: user?.id ? (typeof user.id === 'string' ? parseInt(user.id) : user.id) : undefined,
            action: account?.provider === 'customer-credentials' ? 'CUSTOMER_SIGNIN_FAILED' : 'USER_SIGNIN_FAILED',
            details: {
              email: email,
              reason: 'Rate limit exceeded',
            },
          })
          throw new Error('Too many failed attempts. Please try again later.')
        }

        // Log successful signin
        if (user) {
          const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id
          const isCustomer = account?.provider === 'customer-credentials'
          const rawRole = (user as { role?: string }).role || 'user'
          const normalizedRole = normalizeUserRole(rawRole)
          
          await logActivity({
            userId: userId,
            tenantId: isCustomer ? parseInt((user as { tenantId?: string }).tenantId || '0') : undefined,
            action: isCustomer ? 'CUSTOMER_SIGNIN' : 'USER_SIGNIN',
            details: {
              email: email,
              role: normalizedRole,
              userType: isCustomer ? 'customer' : 'employee/admin',
            },
          })
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id?.toString()
        token.email = user.email ?? token.email
        token.role = (user as { role?: string }).role || 'user'
        token.token = randomUUID()

        const userIdNumber = typeof user.id === 'string' ? Number(user.id) : user.id
        const computedName = typeof user.name === 'string' && user.name.trim()
          ? user.name.trim()
          : typeof user === 'object' && user !== null && 'firstName' in user
            ? `${(user as { firstName?: string }).firstName ?? ''} ${(user as { lastName?: string }).lastName ?? ''}`.trim()
            : undefined
        token.name = computedName || token.name

        if (Number.isFinite(userIdNumber)) {
          const ownedTenant = await prisma.tenant.findFirst({
            where: { ownerId: userIdNumber, isActive: true },
            select: { id: true }
          })

          if (ownedTenant) {
            token.tenantId = ownedTenant.id.toString()
          } else {
            const membership = await prisma.tenantUser.findFirst({
              where: { userId: userIdNumber },
              select: { tenantId: true }
            })
            if (membership?.tenantId) {
              token.tenantId = membership.tenantId.toString()
            }
          }
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id as string,
          email: (token.email as string | undefined) || session.user?.email || '',
          token: token.token as string,
          role: token.role as string,
          tenantId: token.tenantId as string | undefined,
          subdomain: token.subdomain as string | undefined,
          name: token.name as string | undefined,
          image: session.user?.image || null,
        }
      }
      return session
    }
  }
}

// Diagnostic: show registered providers at startup
try {
  const providerDetails = authOptions.providers?.map((p: any) => ({ id: p.id, name: p.name }))
} catch (err) {
  // Silently fail if provider details unavailable
}