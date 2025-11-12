import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      tenantUsers: Array<{
        tenantId: number
        role: string
      }>
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    tenantUsers: Array<{
      tenantId: number
      role: string
    }>
  }
}