/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/billing/config
 * Retrieve GCash billing configuration for admin
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { error: 'No tenant associated with admin account' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const billingPreference = await prisma.billingPreference.findUnique({
      where: { tenantId: parseInt(tenantId, 10) },
    }) as any;

    if (!billingPreference) {
      return NextResponse.json(
        { error: 'Billing preference not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gcashEnabled: (billingPreference as any).gcashEnabled,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gcashPhoneNumber: (billingPreference as any).gcashPhoneNumber,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gcashAccountName: (billingPreference as any).gcashAccountName,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gcashQrCodeUrl: (billingPreference as any).gcashQrCodeUrl,
    });
  } catch (error) {
    console.error('[GET /api/admin/billing/config] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/billing/config
 * Update GCash billing configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { error: 'No tenant associated with admin account' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      gcashEnabled,
      gcashPhoneNumber,
      gcashAccountName,
      gcashQrCodeUrl,
    } = body;

    // Validate inputs
    if (gcashEnabled && !gcashPhoneNumber) {
      return NextResponse.json(
        { error: 'GCash phone number is required when GCash is enabled' },
        { status: 400 }
      );
    }

    if (gcashEnabled && !gcashAccountName) {
      return NextResponse.json(
        { error: 'GCash account name is required when GCash is enabled' },
        { status: 400 }
      );
    }

    // Validate phone number format (11 digits for Philippines)
    if (gcashPhoneNumber && !/^\d{11}$/.test(gcashPhoneNumber)) {
      return NextResponse.json(
        { error: 'GCash phone number must be 11 digits (Philippine format)' },
        { status: 400 }
      );
    }

    const updatedConfig = await prisma.billingPreference.update({
      where: { tenantId: parseInt(tenantId, 10) },
      data: {
        gcashEnabled: gcashEnabled ?? false,
        gcashPhoneNumber: gcashPhoneNumber || null,
        gcashAccountName: gcashAccountName || null,
        gcashQrCodeUrl: gcashQrCodeUrl || null,
      } as any,
    }) as any;

    return NextResponse.json({
      gcashEnabled: (updatedConfig as any).gcashEnabled,
      gcashPhoneNumber: (updatedConfig as any).gcashPhoneNumber,
      gcashAccountName: (updatedConfig as any).gcashAccountName,
      gcashQrCodeUrl: (updatedConfig as any).gcashQrCodeUrl,
    });
  } catch (error) {
    console.error('[PUT /api/admin/billing/config] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
