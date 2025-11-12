export interface StorefrontContext {
  id: number
  subdomain: string
  name: string
  settings?: Record<string, unknown>
}
