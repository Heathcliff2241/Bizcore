/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * POST /api/onboarding/apply
 * Complete onboarding: Create user, tenant, products, categories, branch in transaction
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOnboardingCompleteEmail, sendAdminNotificationEmail } from '@/lib/email'
import { validateSubdomain, isValidEmail, sanitizeBusinessName, sanitizeDescription } from '@/lib/otp'
import { generateDefaultPages, templateToPageData } from '@/lib/defaultPages'
import { rateLimits } from '@/lib/rate-limit'
import jwt from 'jsonwebtoken'

interface OnboardingRequest {
  email: string
  verificationToken: string
  businessName: string
  industry: string
  description: string
  subdomain: string
  branchName: string
  branchAddress: string
  openingTime: string
  closingTime: string
  taxPercent: number
  products?: Array<{
    name: string
    price: number
    cost?: number
    description?: string
  }>
}

export async function POST(req: NextRequest) {
  try {
    const body: OnboardingRequest = await req.json()
    const {
      email,
      verificationToken,
      businessName,
      industry,
      description,
      subdomain,
      branchName,
      branchAddress,
      openingTime,
      closingTime,
      taxPercent,
      products = []
    } = body

    // Validate input
    if (!email || !verificationToken || !businessName || !subdomain) {
      return NextResponse.json(
        { error: 'Missing required fields: email, verificationToken, businessName, subdomain' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    const sanitizedBusinessName = sanitizeBusinessName(businessName)
    const sanitizedDescription = sanitizeDescription(description || '')
    const normalizedSubdomain = subdomain.toLowerCase().trim()

    // Validate subdomain
    if (!validateSubdomain(normalizedSubdomain)) {
      return NextResponse.json(
        { error: 'Invalid or reserved subdomain. Use 3-30 alphanumeric characters and hyphens.' },
        { status: 400 }
      )
    }

    // Rate limit: 1 submission per IP per 5 minutes
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
    const rateLimitResult = rateLimits.onboardingSubmit(clientIp)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too many onboarding submissions',
          retryAfter: rateLimitResult.retryAfter
        },
        { status: 429, headers: { 'Retry-After': `${rateLimitResult.retryAfter}` } }
      )
    }

    // Find user by email and verify token
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please complete email verification first.' },
        { status: 404 }
      )
    }

    // Verify verification token and it hasn't been used
    if (!user.emailVerificationToken || user.emailVerificationToken !== verificationToken) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token. Please verify email again.' },
        { status: 400 }
      )
    }

    // Check if email already verified (prevent reuse)
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email already verified. Please sign in instead.' },
        { status: 400 }
      )
    }

    // Check subdomain not already taken
    const existingSubdomain = await prisma.tenant.findUnique({
      where: { subdomain: normalizedSubdomain }
    })

    if (existingSubdomain) {
      return NextResponse.json(
        { error: 'Subdomain already taken. Please choose another.' },
        { status: 400 }
      )
    }

    // TRANSACTION: Create user, tenant, categories, products, branch
    const tenant = await prisma.$transaction(async (tx) => {
      // Update user with verified status and clear verification token
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationOtp: null,
          emailVerificationOtpExpires: null,
          emailVerificationAttempts: 0,
          firstName: sanitizedBusinessName.split(' ')[0] || 'Owner',
          lastName: sanitizedBusinessName.split(' ').slice(1).join(' ') || 'Account',
          role: 'tenant_owner'
        } as any
      })

      // Create tenant
      const newTenant = await tx.tenant.create({
        data: {
          name: sanitizedBusinessName,
          subdomain: normalizedSubdomain,
          description: sanitizedDescription,
          industry: industry || 'General',
          ownerId: updatedUser.id,
          primaryColor: '#1e40af', // Blue theme
          secondaryColor: '#059669', // Green accent
          isActive: true,
          isPremium: false,
          subscriptionPlan: 'free'
        }
      })

      // Create default category
      const defaultCategory = await tx.category.create({
        data: {
          tenantId: newTenant.id,
          name: 'General',
          description: 'Default product category',
          isActive: true
        }
      })

      // Create products if provided
      const createdProducts = []
      if (products && products.length > 0) {
        for (const product of products) {
          const createdProduct = await tx.product.create({
            data: {
              tenantId: newTenant.id,
              categoryId: defaultCategory.id,
              name: product.name,
              description: product.description || '',
              price: product.price,
              cost: product.cost || 0,
              isActive: true
            }
          })
          createdProducts.push(createdProduct)
        }
      }

      // Create tenant user relationship (owner)
      await tx.tenantUser.create({
        data: {
          tenantId: newTenant.id,
          userId: updatedUser.id,
          role: 'owner'
        }
      })

      // Store branch info in tenant settings (or create Branch model later)
      await tx.tenant.update({
        where: { id: newTenant.id },
        data: {
          settings: {
            branches: [
              {
                name: branchName || 'Main Branch',
                address: branchAddress,
                openingTime,
                closingTime,
                isDefault: true
              }
            ],
            tax: {
              defaultTaxPercent: taxPercent || 0
            }
          }
        }
      })

      // Create default pages for the new tenant
      const defaultPages = generateDefaultPages(sanitizedBusinessName)
      const pageCreationPromises = defaultPages.map(template => 
        tx.pageDesign.create({
          data: templateToPageData(template, newTenant.id)
        })
      )
      
      await Promise.all(pageCreationPromises)

      // Create trial subscription starting from now (email verification time)
      const trialStart = new Date();
      const trialEnd = new Date(trialStart.getTime() + 14 * 24 * 60 * 60 * 1000);
      
      await tx.subscription.create({
        data: {
          tenantId: newTenant.id,
          planId: "trial",
          status: "trial",
          billingCycle: "trial",
          currentPeriodStart: trialStart,
          currentPeriodEnd: trialEnd,
          renewalDate: trialEnd,
          nextPaymentAmount: null,
          nextPaymentDate: null,
          autoRenew: true,
        }
      })

      return newTenant
    })

    // Send onboarding complete email
    try {
      await sendOnboardingCompleteEmail(
        normalizedEmail,
        sanitizedBusinessName,
        normalizedSubdomain
      )
    } catch (emailError) {
      console.error('Failed to send onboarding complete email:', emailError)
      // Don't fail the request if email fails
    }

    // Create admin notification
    try {
      await (prisma as any).adminNotification.create({
        data: {
          type: 'new_registration',
          tenantId: tenant.id,
          title: `New Registration: ${sanitizedBusinessName}`,
          message: `A new tenant "${sanitizedBusinessName}" (${industry || 'General'}) has completed onboarding.\n\nSubdomain: ${normalizedSubdomain}\nOwner: ${normalizedEmail}`,
          actionUrl: `/admin/tenants/${tenant.id}`
        }
      })

      // Send admin notification email
      await sendAdminNotificationEmail(
        sanitizedBusinessName,
        industry || 'General',
        normalizedSubdomain,
        normalizedEmail,
        new Date().toLocaleString()
      )
    } catch (notifError: unknown) {
      console.error('Failed to create admin notification:', notifError)
      // Don't fail the request if notification fails
    }

    // Generate JWT session token
    const sessionToken = jwt.sign(
      {
        userId: user.id,
        email: normalizedEmail,
        role: 'tenant_owner',
        tenantId: tenant.id,
        subdomain: normalizedSubdomain
      },
      process.env.NEXTAUTH_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    // Return success with auth data
    return NextResponse.json(
      {
        success: true,
        message: 'Onboarding completed successfully',
        user: {
          id: user.id,
          email: normalizedEmail,
          firstName: user.firstName,
          lastName: user.lastName
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain
        },
        sessionToken,
        redirectUrl: `/dashboard/${normalizedSubdomain}`
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ Onboarding apply error:', error)

    // Handle Prisma unique constraint errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint failed')) {
        return NextResponse.json(
          { error: 'Subdomain or email already in use' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}

// Configure timeout for serverless
export const maxDuration = 60 // 60 seconds
