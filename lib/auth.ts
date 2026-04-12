import { NextAuthOptions } from 'next-auth'
import { randomUUID } from 'crypto'
// import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { isRateLimited, recordFailedAttempt, clearFailedAttempts } from './rateLimit'
import { resolveCookieDomain } from './utils'
import { logActivity, getClientIp, getUserAgent, normalizeUserRole } from './activityLogger'
import { verifyStoredOTP } from './otp'

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
  // Custom JWT config with error-resilient decode
  jwt: {
    // Custom decode that returns null instead of throwing on corrupted tokens
    // This prevents the "Invalid Compact JWE" error loop
    async decode({ token, secret }) {
      if (!token) return null
      
      try {
        // Use the default NextAuth JWT decode
        const { decode } = await import('next-auth/jwt')
        const decoded = await decode({ token, secret })
        return decoded
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error('[JWT DECODE ERROR] Full error:', error)
        console.error('[JWT DECODE ERROR] Token preview:', token.substring(0, 100) + '...')
        console.error('[JWT DECODE ERROR] Secret is set:', !!secret)
        // If token is corrupted (Invalid Compact JWE), return null to trigger re-auth
        if (errorMessage.includes('Invalid Compact JWE') || errorMessage.includes('JWE')) {
          console.warn('[AUTH] Corrupted JWT token detected - returning null to trigger re-auth')
          return null
        }
        // Re-throw other errors
        throw error
      }
    },
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
    // OTP provider for employee, tenant, and admin sign-in
    CredentialsProvider({
      id: 'otp',
      name: 'OTP',
      credentials: {
        email: { label: 'Email', type: 'email' },
        otp: { label: 'OTP', type: 'text' },
        userType: { label: 'User Type', type: 'text' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.otp) {
            console.error('❌ OTP Provider: Missing email or OTP in credentials')
            return null
          }

          const email = credentials.email.toLowerCase()
          const otp = credentials.otp
          const userType = credentials.userType || 'employee'

          console.log(`📝 OTP Provider: Attempting OTP verification for ${email}, userType: ${userType}`)

          // Verify OTP
          const isValid = await verifyStoredOTP(email, otp, 'tenant')
          if (!isValid) {
            console.error(`❌ OTP Provider: OTP verification failed for ${email}`)
            recordFailedAttempt(`otp_${email}`)
            return null
          }

          console.log(`✅ OTP Provider: OTP verified for ${email}`)

          // Build where clause based on user type
          // If userType is 'employee', first try admin, then employee
          let whereClause: any = {
            email: {
              equals: email,
              mode: 'insensitive'
            }
          }

          if (userType === 'admin') {
            whereClause.role = 'admin'
          } else if (userType === 'employee') {
            // Will try to find user and auto-detect if admin
            whereClause.role = { in: ['admin', 'user', 'tenant_owner'] }
          }

          // Find user
          const user = await prisma.user.findFirst({
            where: whereClause,
            include: {
              ownedTenants: {
                where: { isActive: true },
                select: { id: true, subdomain: true }
              },
              tenantUsers: {
                where: { tenant: { isActive: true } },
                include: { tenant: { select: { id: true, subdomain: true } } }
              }
            }
          })

          if (!user) {
            console.error(`❌ OTP Provider: User not found for ${email} with whereClause:`, whereClause)
            return null
          }

          console.log(`✅ OTP Provider: User found: ${user.email}, role: ${user.role}`)

          // Determine tenant
          let tenantId = null
          let tenantSubdomain = null

          if (user.ownedTenants && user.ownedTenants.length > 0) {
            tenantId = user.ownedTenants[0].id
            tenantSubdomain = user.ownedTenants[0].subdomain
          } else if (user.tenantUsers.length > 0) {
            tenantId = user.tenantUsers[0].tenant.id
            tenantSubdomain = user.tenantUsers[0].tenant.subdomain
          }

          clearFailedAttempts(`otp_${email}`)

          const returnUser = {
            id: user.id.toString(),
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            tenantId: tenantId?.toString(),
            subdomain: tenantSubdomain,
          }

          console.log(`✅ OTP Provider: Returning user object:`, returnUser)
          return returnUser
        } catch (error) {
          console.error('❌ OTP Provider: Unexpected error in authorize:', error)
          return null
        }
      }
    }),
    // POS Employee OTP provider for POS terminal login
    CredentialsProvider({
      id: 'pos-employee-otp',
      name: 'pos-employee-otp',
      credentials: {
        email: { label: 'Email', type: 'email' },
        otp: { label: 'OTP', type: 'text' },
        subdomain: { label: 'Subdomain', type: 'text' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.otp || !credentials?.subdomain) {
            console.error('❌ POS Employee OTP Provider: Missing email, OTP, or subdomain')
            return null
          }

          const email = credentials.email.toLowerCase()
          const otp = credentials.otp
          const subdomain = credentials.subdomain.toLowerCase()

          console.log(`📝 POS Employee OTP Provider: Attempting OTP verification for ${email}`)

          // Verify OTP
          const isValid = await verifyStoredOTP(email, otp, 'tenant')
          if (!isValid) {
            console.error(`❌ POS Employee OTP Provider: OTP verification failed for ${email}`)
            recordFailedAttempt(`pos_employee_otp_${email}`)
            return null
          }

          console.log(`✅ POS Employee OTP Provider: OTP verified for ${email}`)

          // Find tenant by subdomain
          const tenant = await prisma.tenant.findUnique({
            where: { subdomain }
          })

          if (!tenant || !tenant.isActive) {
            console.error(`❌ POS Employee OTP Provider: Tenant not found or inactive for subdomain: ${subdomain}`)
            return null
          }

          // Find employee by email and tenant
          const employee = await prisma.employee.findUnique({
            where: {
              tenantId_email: {
                tenantId: tenant.id,
                email
              }
            }
          })

          if (!employee || !employee.isActive) {
            console.error(`❌ POS Employee OTP Provider: Employee not found or inactive for ${email}`)
            recordFailedAttempt(`pos_employee_otp_${email}`)
            return null
          }

          // Update last login
          await prisma.employee.update({
            where: { id: employee.id },
            data: { lastLogin: new Date() }
          })

          clearFailedAttempts(`pos_employee_otp_${email}`)

          const returnUser = {
            id: employee.id.toString(),
            email: employee.email,
            name: `${employee.firstName} ${employee.lastName}`,
            role: employee.role,
            tenantId: tenant.id.toString(),
            subdomain: tenant.subdomain,
            userType: 'pos_employee'
          }

          console.log(`✅ POS Employee OTP Provider: Returning employee object:`, returnUser)
          return returnUser
        } catch (error) {
          console.error('❌ POS Employee OTP Provider: Unexpected error in authorize:', error)
          return null
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
      // Handle rate limiting for credentials, otp, pos-employee-otp, and customer-credentials providers
      if ((account?.provider === 'credentials' || account?.provider === 'otp' || account?.provider === 'pos-employee-otp' || account?.provider === 'customer-credentials') && credentials?.email) {
        const email = credentials.email as string
        let rateLimitKey = `auth_${email}`
        
        if (account?.provider === 'customer-credentials') {
          rateLimitKey = `customer_auth_${email}`
        } else if (account?.provider === 'pos-employee-otp') {
          rateLimitKey = `pos_employee_otp_${email}`
        } else if (account?.provider === 'otp') {
          rateLimitKey = `otp_${email}`
        }

        if (isRateLimited(rateLimitKey, 5, 900000)) {
          console.error(`❌ SignIn Callback: Rate limited for ${email}`)
          // Log failed login attempt
          const actionMap: { [key: string]: string } = {
            'customer-credentials': 'CUSTOMER_SIGNIN_FAILED',
            'pos-employee-otp': 'EMPLOYEE_SIGNIN_FAILED',
            'otp': 'USER_SIGNIN_FAILED',
            'credentials': 'USER_SIGNIN_FAILED'
          }
          
          await logActivity({
            userId: user?.id ? (typeof user.id === 'string' ? parseInt(user.id) : user.id) : undefined,
            action: actionMap[account?.provider || 'credentials'] || 'USER_SIGNIN_FAILED',
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
          const isPosEmployee = account?.provider === 'pos-employee-otp'
          const isOtp = account?.provider === 'otp'
          const rawRole = (user as { role?: string }).role || 'user'
          const normalizedRole = normalizeUserRole(rawRole)
          
          console.log(`✅ SignIn Callback: Successful for ${email}, role: ${normalizedRole}, provider: ${account?.provider}`)
          
          // Update lastLogin for system users and POS employees (not customers, they update in OTP provider)
          if (!isCustomer && Number.isFinite(userId)) {
            try {
              if (isPosEmployee) {
                // Update employee last login
                await prisma.employee.update({
                  where: { id: userId },
                  data: { lastLogin: new Date() }
                })
              } else {
                // Update user last login
                await prisma.user.update({
                  where: { id: userId },
                  data: { lastLogin: new Date() }
                })
              }
            } catch (updateError) {
              console.error(`⚠️ Failed to update lastLogin for user ${userId}:`, updateError)
            }
          }
          
          const actionMap: { [key: string]: string } = {
            'customer-credentials': 'CUSTOMER_SIGNIN',
            'pos-employee-otp': 'EMPLOYEE_SIGNIN',
            'otp': 'USER_SIGNIN',
            'credentials': 'USER_SIGNIN'
          }

          const tenantId = isPosEmployee || isCustomer ? parseInt((user as { tenantId?: string }).tenantId || '0') : undefined
          
          await logActivity({
            userId: userId,
            tenantId: tenantId,
            action: actionMap[account?.provider || 'credentials'] || 'USER_SIGNIN',
            details: {
              email: email,
              role: normalizedRole,
              userType: isPosEmployee ? 'pos_employee' : (isOtp ? 'otp' : (isCustomer ? 'customer' : 'employee/admin')),
              method: isOtp ? 'OTP' : 'password'
            },
          })
        }
      }
      return true
    },
    async redirect({ url, baseUrl, user }) {
      console.log('[AUTH REDIRECT] redirect callback triggered')
      console.log('[AUTH REDIRECT] url:', url)
      console.log('[AUTH REDIRECT] baseUrl:', baseUrl) 
      console.log('[AUTH REDIRECT] user:', JSON.stringify(user, null, 2))
      
      // If user is a POS employee, ensure they go to the POS page
      if (user) {
        const userType = (user as any)?.userType
        const subdomain = (user as any)?.subdomain
        console.log('[AUTH REDIRECT] Extracted userType:', userType, 'subdomain:', subdomain)
        
        if (userType === 'pos_employee' && subdomain) {
          const posUrl = `${baseUrl}/pos/${subdomain}`
          console.log('[AUTH REDIRECT] POS employee detected, redirecting to:', posUrl)
          return posUrl
        }
      }
      
      // Extract subdomain from URL if present (e.g., /pos/store1/... → store1)
      // This handles cases where subdomain might not be in user object
      if (url && url.includes('/pos/')) {
        const posMatch = url.match(/\/pos\/([^\/]+)/)
        if (posMatch && posMatch[1]) {
          console.log('[AUTH REDIRECT] POS path detected in URL, extracting subdomain:', posMatch[1])
          // Return the POS URL with extracted subdomain
          return `${baseUrl}/pos/${posMatch[1]}`
        }
      }
      
      // Check if url is already pointing to a valid path
      if (url && url.startsWith(baseUrl)) {
        console.log('[AUTH REDIRECT] URL is valid, returning:', url)
        return url
      }
      
      // Default fallback to baseUrl
      console.log('[AUTH REDIRECT] Falling back to baseUrl:', baseUrl)
      return baseUrl
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id?.toString()
        token.email = user.email ?? token.email
        token.role = (user as { role?: string }).role || 'user'
        token.userType = (user as { userType?: string }).userType // Store userType for POS employees
        token.token = randomUUID()
        token.tenantId = (user as { tenantId?: string }).tenantId
        token.subdomain = (user as { subdomain?: string }).subdomain

        const userIdNumber = typeof user.id === 'string' ? Number(user.id) : user.id
        const computedName = typeof user.name === 'string' && user.name.trim()
          ? user.name.trim()
          : typeof user === 'object' && user !== null && 'firstName' in user
            ? `${(user as { firstName?: string }).firstName ?? ''} ${(user as { lastName?: string }).lastName ?? ''}`.trim()
            : undefined
        token.name = computedName || token.name

        if (Number.isFinite(userIdNumber) && !token.tenantId) {
          const ownedTenant = await prisma.tenant.findFirst({
            where: { ownerId: userIdNumber, isActive: true },
            select: { id: true, subdomain: true }
          })

          if (ownedTenant) {
            token.tenantId = ownedTenant.id.toString()
            token.subdomain = ownedTenant.subdomain
          } else {
            const membership = await prisma.tenantUser.findFirst({
              where: { userId: userIdNumber },
              include: { tenant: { select: { id: true, subdomain: true } } }
            })
            if (membership?.tenant) {
              token.tenantId = membership.tenant.id.toString()
              token.subdomain = membership.tenant.subdomain
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
          userType: token.userType as string | undefined,
          tenantId: token.tenantId as string | undefined,
          subdomain: token.subdomain as string | undefined,
          name: token.name as string | undefined,
          image: session.user?.image || null,
        }
      }
      return session
    }
  },
  events: {
    async signIn() {
      // Clear any old JWT session cookie errors by logging successful signin
      // This ensures next session request will work properly
    }
  }
}

// Diagnostic: show registered providers at startup
try {
  const providerDetails = authOptions.providers?.map((p: any) => ({ id: p.id, name: p.name }))
} catch (err) {
  // Silently fail if provider details unavailable
}