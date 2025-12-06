declare module 'set-cookie-parser' {
  interface Cookie {
    name: string
    value?: string
    path?: string
    domain?: string
    expires?: string
    httpOnly?: boolean
    secure?: boolean
    sameSite?: 'strict' | 'lax' | 'none' | string
  }
  function parse(header: string | string[], options?: any): Cookie[]
  const setCookie: { parse: typeof parse }
  export = setCookie
}
