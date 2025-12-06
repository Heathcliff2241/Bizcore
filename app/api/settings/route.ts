import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resolveTenant } from '@/lib/tenant'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const subdomain = searchParams.get('subdomain')

  const tenant = await resolveTenant(session, subdomain)
  if (!tenant) {
    return NextResponse.json({ message: 'Tenant not found' }, { status: 404 })
  }

  try {
    // Fetch tenant with owner to get owner's email
    const tenantWithOwner = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      include: {
        owner: true
      }
    })

    // Build settings from tenant data
    const businessInfo = {
      businessName: tenant.name || '',
      email: tenantWithOwner?.owner?.email || '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }

    // If there are saved settings, merge them
    if (tenant.settings && typeof tenant.settings === 'object' && 'businessInfo' in tenant.settings) {
      const savedBusinessInfo = (tenant.settings as Record<string, unknown>).businessInfo
      if (savedBusinessInfo && typeof savedBusinessInfo === 'object') {
        Object.assign(businessInfo, savedBusinessInfo)
      }
    }

    // Default brand colors
    const brandColors = {
      primary: tenant.primaryColor || '#10B981',
      secondary: tenant.secondaryColor || '#34D399',
      accent: '#6EE7B7',
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#111827'
    }

    // If there are saved brand colors, use them
    if (tenant.settings && typeof tenant.settings === 'object' && 'brandColors' in tenant.settings) {
      const savedBrandColors = (tenant.settings as Record<string, unknown>).brandColors
      if (savedBrandColors && typeof savedBrandColors === 'object') {
        Object.assign(brandColors, savedBrandColors)
      }
    }

    const paymentSettings = tenant.settings && typeof tenant.settings === 'object' && 'paymentSettings' in tenant.settings
      ? (tenant.settings as Record<string, unknown>).paymentSettings
      : { gcashNumber: '', gcashQrCode: '' }

    const tax = tenant.settings && typeof tenant.settings === 'object' && 'tax' in tenant.settings
      ? (tenant.settings as Record<string, unknown>).tax
      : { defaultTaxPercent: 0 }

    const settings = {
      brandColors,
      businessInfo,
      paymentSettings,
      tax
    }

    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const subdomain = searchParams.get('subdomain')

  const tenant = await resolveTenant(session, subdomain)
  if (!tenant) {
    return NextResponse.json({ message: 'Tenant not found' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const { settings } = body as { settings?: unknown }

    if (!settings) {
      return NextResponse.json({ message: 'Settings are required' }, { status: 400 })
    }

    console.log('[SETTINGS API] Received settings:', JSON.stringify(settings, null, 2))

    // Prepare update data
    const updateData: Prisma.TenantUpdateInput = {
      settings: settings as Prisma.InputJsonValue
    }

    // Update primaryColor and secondaryColor if brand colors changed
    if (
      typeof settings === 'object' &&
      settings !== null &&
      'brandColors' in settings &&
      typeof (settings as Record<string, unknown>).brandColors === 'object'
    ) {
      const brandColors = (settings as { brandColors?: Record<string, unknown> }).brandColors
      const primary = typeof brandColors?.primary === 'string' ? brandColors.primary : undefined
      const secondary = typeof brandColors?.secondary === 'string' ? brandColors.secondary : undefined

      if (primary) {
        updateData.primaryColor = primary
      }
      if (secondary) {
        updateData.secondaryColor = secondary
      }
    }

    // Update tenant name if businessName changed
    if (
      typeof settings === 'object' &&
      settings !== null &&
      'businessInfo' in settings &&
      typeof (settings as Record<string, unknown>).businessInfo === 'object'
    ) {
      const businessInfo = (settings as { businessInfo?: Record<string, unknown> }).businessInfo
      const businessName = typeof businessInfo?.businessName === 'string' ? businessInfo.businessName : undefined

      if (businessName) {
        updateData.name = businessName
      }
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        settings: true,
        primaryColor: true,
        secondaryColor: true
      }
    })

    console.log('[SETTINGS API] Updated tenant settings:', JSON.stringify(updatedTenant.settings, null, 2))

    // Return merged settings
    const businessInfo = {
      businessName: updatedTenant.name || '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }

    // Fetch owner email if needed
    if (!businessInfo.email) {
      const tenantWithOwner = await prisma.tenant.findUnique({
        where: { id: updatedTenant.id },
        include: {
          owner: true
        }
      })
      if (tenantWithOwner?.owner?.email) {
        businessInfo.email = tenantWithOwner.owner.email
      }
    }

    if (updatedTenant.settings && typeof updatedTenant.settings === 'object' && 'businessInfo' in updatedTenant.settings) {
      const savedBusinessInfo = (updatedTenant.settings as Record<string, unknown>).businessInfo
      if (savedBusinessInfo && typeof savedBusinessInfo === 'object') {
        Object.assign(businessInfo, savedBusinessInfo)
      }
    }

    const brandColors = {
      primary: updatedTenant.primaryColor || '#10B981',
      secondary: updatedTenant.secondaryColor || '#34D399',
      accent: '#6EE7B7',
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#111827'
    }

    if (updatedTenant.settings && typeof updatedTenant.settings === 'object' && 'brandColors' in updatedTenant.settings) {
      const savedBrandColors = (updatedTenant.settings as Record<string, unknown>).brandColors
      if (savedBrandColors && typeof savedBrandColors === 'object') {
        Object.assign(brandColors, savedBrandColors)
      }
    }

    const responsePaymentSettings = updatedTenant.settings && typeof updatedTenant.settings === 'object' && 'paymentSettings' in updatedTenant.settings
      ? (updatedTenant.settings as Record<string, unknown>).paymentSettings
      : { gcashNumber: '', gcashQrCode: '' }

    const responseTax = updatedTenant.settings && typeof updatedTenant.settings === 'object' && 'tax' in updatedTenant.settings
      ? (updatedTenant.settings as Record<string, unknown>).tax
      : { defaultTaxPercent: 0 }

    const responseSettings = {
      brandColors,
      businessInfo,
      paymentSettings: responsePaymentSettings,
      tax: responseTax
    }

    return NextResponse.json({
      success: true,
      data: responseSettings,
      message: 'Settings updated successfully'
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
