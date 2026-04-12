import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { resolveTenant } from '@/lib/tenant';
import { logActivity } from '@/lib/activityLogger';
import { createNewCustomerNotification } from '@/lib/notifications';
import bcrypt from 'bcryptjs';
import { isRateLimited, recordFailedAttempt, clearFailedAttempts } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
  // First try customer auth (for storefront customer data)
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const subdomain = searchParams.get('subdomain');

  // If customer session, return their own data
  if (session.user.role === 'customer') {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(session.user.id) }
    });

    if (!customer) {
      return NextResponse.json({ message: 'Customer not found' }, { status: 404 });
    }

    // If subdomain is specified, verify customer belongs to that tenant
    if (subdomain) {
      const tenant = await prisma.tenant.findUnique({
        where: { subdomain: subdomain.toLowerCase() }
      });
      
      if (!tenant || customer.tenantId !== tenant.id) {
        // Customer doesn't belong to this tenant
        return NextResponse.json({ message: 'Customer not registered on this storefront' }, { status: 404 });
      }
    }

    const address = typeof customer.address === 'string'
      ? JSON.parse(customer.address)
      : customer.address;

    return NextResponse.json({
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      address: address,
      isActive: customer.isActive,
      emailVerified: customer.emailVerified
    });
  }

  // If admin session, fetch customers for a tenant
  const tenant = await resolveTenant(session, subdomain);

  if (!tenant) {
    return NextResponse.json({ message: 'Tenant not found' }, { status: 404 });
  }

  try {
    const customers = await prisma.customer.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: {
        customers: customers.map(customer => ({
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, phone, subdomain, password } = body

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // If subdomain is provided, find the tenant by subdomain
    let tenant = null
    if (subdomain) {
      tenant = await prisma.tenant.findUnique({ where: { subdomain: subdomain.toLowerCase() } })
      if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
      }
    } else {
      // No subdomain - invalid for public customer creation
      return NextResponse.json({ error: 'Subdomain required' }, { status: 400 })
    }

    // Prevent abuse - apply rate limit to signups for this email
    const rateLimitKey = `signup_${email || 'unknown'}`
    if (isRateLimited(rateLimitKey, 10, 900000)) {
      recordFailedAttempt(rateLimitKey)
      return NextResponse.json({ error: 'Too many signup attempts. Please try again later.' }, { status: 429 })
    }

    // Optional reCAPTCHA verification (if configured)
    const recaptchaSecret = process.env.RECAPTCHA_SECRET
    if (recaptchaSecret) {
      const recaptchaToken = body.recaptchaToken
      if (!recaptchaToken) {
        return NextResponse.json({ error: 'reCAPTCHA verification required' }, { status: 400 })
      }
      try {
        const verifyRes = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `secret=${encodeURIComponent(recaptchaSecret)}&response=${encodeURIComponent(recaptchaToken)}`
        })
        const verifyJson = await verifyRes.json()
        if (!verifyJson.success) {
          return NextResponse.json({ error: 'reCAPTCHA verification failed' }, { status: 400 })
        }
      } catch (err) {
        console.error('reCAPTCHA verification error:', err)
        return NextResponse.json({ error: 'reCAPTCHA verification failed' }, { status: 500 })
      }
    }

    // Create customer and optionally a matching User (NextAuth) in a transaction
    const hashedPassword = password ? await bcrypt.hash(String(password), 12) : undefined

    // Check for existing customer with same email for this tenant
    if (email) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          email: {
            equals: email,
            mode: 'insensitive'
          },
          tenantId: tenant.id
        }
      })
      if (existingCustomer) {
        return NextResponse.json({ error: 'A customer with this email already exists for this store' }, { status: 409 })
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          tenantId: tenant.id,
          firstName: String(firstName),
          lastName: String(lastName),
          email: email ? String(email) : undefined,
          phone: phone ? String(phone) : undefined,
          password: hashedPassword || undefined
        }
      })

      return { customer }
    })

    // Log the customer signup
    await logActivity({
      tenantId: tenant.id,
      action: 'CUSTOMER_SIGNUP',
      details: {
        customerId: result.customer.id,
        customerName: `${result.customer.firstName} ${result.customer.lastName}`,
        email: result.customer.email,
        phone: result.customer.phone
      }
    })

    // Send notification to tenant about new customer
    await createNewCustomerNotification(
      tenant.id,
      result.customer.id,
      `${result.customer.firstName} ${result.customer.lastName}`,
      result.customer.email || 'No email',
      tenant.subdomain
    )

    // Clear signup rate-limit on success
    try {
      clearFailedAttempts(`signup_${email}`)
    } catch {}

    return NextResponse.json({ success: true, data: result }, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Try customer auth first (for self-updates)
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, phone, address, email } = body;

    // Customers can only update their own profile
    if (session.user.role === 'customer') {
      const customerId = parseInt(session.user.id);
      
      const updateData: any = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (phone) updateData.phone = phone;
      if (address) updateData.address = address;

      const customer = await prisma.customer.update({
        where: { id: customerId },
        data: updateData,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          address: true
        }
      });

      return NextResponse.json(customer);
    }

    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  } catch (error) {
    console.error('[API] PUT /api/customers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

