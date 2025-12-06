import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface User {
    id: string
    email: string
    role?: string
    name?: string
    tenantId?: string
    subdomain?: string
  }

  interface Session {
    user: {
      id: string
      email: string
      token?: string
      role?: string
      tenantId?: string
      subdomain?: string
      name?: string | null
      image?: string | null
      tenantUsers?: Array<{
        tenantId: number
        role: string
      }>
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    token?: string
    role?: string
    tenantId?: string
    subdomain?: string
    tenantUsers?: Array<{
      tenantId: number
      role: string
    }>
  }
}