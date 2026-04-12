import { headers } from 'next/headers'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'your-secret-key')

export interface CustomerSessionPayload {
  customerId: string
  tenantId: string
  email: string
  role: 'customer'
  iat?: number
  exp?: number
}

/**
 * Verify customer JWT token from Authorization header
 * Used in API routes to authenticate customer requests
 */
export async function verifyCustomerToken(
  authHeader: string | undefined
): Promise<CustomerSessionPayload | null> {
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  try {
    const token = authHeader.slice(7)
    const verified = await jwtVerify(token, JWT_SECRET)
    const payload = verified.payload as unknown as CustomerSessionPayload
    return payload
  } catch (err) {
    console.error('[VERIFY_TOKEN] Invalid token:', err)
    return null
  }
}

/**
 * Get customer session from request headers or cookies
 * For server-side use to protect routes
 */
export async function getCustomerSession(): Promise<CustomerSessionPayload | null> {
  const headersList = await headers()
  const authHeader = headersList.get('authorization')
  
  if (!authHeader) {
    return null
  }

  return verifyCustomerToken(authHeader)
}
