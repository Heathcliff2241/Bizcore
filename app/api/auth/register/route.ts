import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { generateDefaultPages, templateToPageData } from '@/lib/defaultPages'

// Helper to generate a unique subdomain
const generateUniqueSubdomain = async (name: string): Promise<string> => {
  const baseSubdomain = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  let subdomain = baseSubdomain;
  let counter = 1;
  while (await prisma.tenant.findUnique({ where: { subdomain } })) {
    subdomain = `${baseSubdomain}-${counter}`;
    counter++;
  }
  return subdomain;
};

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, businessName } = await request.json()

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 } // Use 409 for conflict
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Split name into first and last
    const [firstName, ...lastNameParts] = name.split(' ')
    const lastName = lastNameParts.join(' ') || ''

    // Create user and tenant in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          role: 'tenant_owner', // Assign tenant owner role
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true,
        },
      });

      // Create tenant
      const tenantName = businessName?.trim() || `${firstName}'s Business`;
      const subdomain = await generateUniqueSubdomain(tenantName);

      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          subdomain,
          ownerId: user.id,
        },
        select: {
          id: true,
          name: true,
          subdomain: true,
          createdAt: true,
        }
      });

      // Create default pages for the new tenant
      const defaultPages = generateDefaultPages(tenantName);
      const pageCreationPromises = defaultPages.map(template => 
        tx.pageDesign.create({
          data: templateToPageData(template, tenant.id)
        })
      );
      
      await Promise.all(pageCreationPromises);

      return { user, tenant };
    });


    return NextResponse.json(
      {
        message: 'User and tenant created successfully',
        user: result.user,
        tenant: result.tenant,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}