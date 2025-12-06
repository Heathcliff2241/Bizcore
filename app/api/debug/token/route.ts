import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') || ''
  const cookies = cookieHeader.split(';').map(c => c.trim()).filter(Boolean)
  const debugCookies = cookies
    .filter(c => c.startsWith('next-auth'))
    .map(c => {
      const [name, value] = c.split('=')
      const token = value || ''
      const dotCount = (token.match(/\./g) || []).length
      return {
        name,
        length: token.length,
        dotCount,
        typeGuess: dotCount === 4 ? 'jwe' : dotCount === 2 ? 'jws' : 'unknown'
      }
    })

  const response: any = { foundCookies: debugCookies.length > 0, cookies: debugCookies }
  return NextResponse.json(response)
}
