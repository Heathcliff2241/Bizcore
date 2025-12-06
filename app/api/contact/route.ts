import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subdomain, name, email, message } = body

    if (!subdomain || !name || !message || !email) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const tenant = await prisma.tenant.findUnique({ where: { subdomain } })
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const to = (tenant.settings as any)?.contactEmail || process.env.EMAIL_FROM || process.env.SMTP_USER
    if (!to) {
      // Not configured – still return success but log
      console.warn('Contact: no recipient configured for tenant', subdomain)
      return NextResponse.json({ success: true })
    }

    await sendEmail({
      to,
      subject: `Storefront Contact: ${tenant.name} (${subdomain})`,
      text: `Message from ${name} <${email}>:\n\n${message}`,
      html: `<p><strong>From:</strong> ${name} &lt;${email}&gt;</p><p>${message}</p>`
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Contact API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
