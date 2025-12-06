import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const DEFAULT_SETTINGS = {
  appName: 'BizCore',
  appLogo: 'https://via.placeholder.com/200',
  appEmail: 'noreply@bizcore.io',
  supportEmail: 'support@bizcore.io',
  primaryColor: '#10b981',
  secondaryColor: '#3b82f6',
  emailNotifications: true,
  smsNotifications: false,
  maintenanceMode: false,
  apiRateLimit: 1000,
  adminGcashPhoneNumber: null,
  adminGcashAccountName: null,
  adminGcashQrCodeUrl: null,
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get admin settings from database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let adminSettings = await (prisma as any).adminSettings.findFirst()
    
    if (!adminSettings) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      adminSettings = await (prisma as any).adminSettings.create({
        data: {
          adminGcashPhoneNumber: null,
          adminGcashAccountName: null,
          adminGcashQrCodeUrl: null,
        },
      })
    }

    const settings = {
      ...DEFAULT_SETTINGS,
      adminGcashPhoneNumber: adminSettings.adminGcashPhoneNumber,
      adminGcashAccountName: adminSettings.adminGcashAccountName,
      adminGcashQrCodeUrl: adminSettings.adminGcashQrCodeUrl,
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      adminGcashPhoneNumber,
      adminGcashAccountName,
      adminGcashQrCodeUrl,
    } = body

    // Update admin settings in database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let adminSettings = await (prisma as any).adminSettings.findFirst()
    
    if (!adminSettings) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      adminSettings = await (prisma as any).adminSettings.create({
        data: {
          adminGcashPhoneNumber,
          adminGcashAccountName,
          adminGcashQrCodeUrl,
        },
      })
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      adminSettings = await (prisma as any).adminSettings.update({
        where: { id: adminSettings.id },
        data: {
          adminGcashPhoneNumber: adminGcashPhoneNumber || null,
          adminGcashAccountName: adminGcashAccountName || null,
          adminGcashQrCodeUrl: adminGcashQrCodeUrl || null,
        },
      })
    }

    const settings = {
      ...DEFAULT_SETTINGS,
      adminGcashPhoneNumber: adminSettings.adminGcashPhoneNumber,
      adminGcashAccountName: adminSettings.adminGcashAccountName,
      adminGcashQrCodeUrl: adminSettings.adminGcashQrCodeUrl,
    }

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
