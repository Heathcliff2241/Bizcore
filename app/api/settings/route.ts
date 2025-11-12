import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function getTenantId(userId: string): Promise<number | null> {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId, 10) },
    include: { tenantUsers: true },
  });
  return user?.tenantUsers[0]?.tenantId ?? null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = await getTenantId(session.user.id);
  if (!tenantId) {
    return NextResponse.json({ message: 'User is not associated with a tenant' }, { status: 403 });
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        settings: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ message: 'Tenant not found' }, { status: 404 });
    }

    // Default settings if none exist
    const defaultSettings = {
      brandColors: {
        primary: '#059669',
        secondary: '#10b981',
        accent: '#34d399',
        background: '#ffffff',
        surface: '#f9fafb',
        text: '#111827',
      },
      typography: {
        titleFont: 'Inter',
        textFont: 'Inter',
        contentFont: 'Inter',
      },
      layout: {
        headerStyle: 'modern',
        footerStyle: 'minimal',
        sectionSpacing: 'comfortable',
      },
      seo: {
        metaTitle: tenant.name,
        metaDescription: `Welcome to ${tenant.name}`,
        keywords: '',
      },
    };

    const settings = tenant.settings || defaultSettings;

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = await getTenantId(session.user.id);
  if (!tenantId) {
    return NextResponse.json({ message: 'User is not associated with a tenant' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json({ message: 'Settings are required' }, { status: 400 });
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings,
      },
      select: {
        id: true,
        name: true,
        settings: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedTenant.settings,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
