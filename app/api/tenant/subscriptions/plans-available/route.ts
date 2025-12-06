/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Fetch plans from the same database as admin
    const plans = await prisma.plan.findMany({
      orderBy: { displayOrder: 'asc' },
    })

    return NextResponse.json({
      plans: plans.map((plan: any) => {
        // Convert String[] features array to object for modal compatibility
        // Features array like ["Unlimited orders", "Advanced analytics"] becomes
        // { "orders": "Unlimited", "analytics": "Advanced" } etc.
        let featuresObj: Record<string, string> = {}
        
        if (Array.isArray(plan.features) && plan.features.length > 0) {
          // For each feature string, try to extract the value and key
          plan.features.forEach((feature: string) => {
            // Examples: "Unlimited orders" -> { orders: "Unlimited" }
            // "100 API calls" -> { api_calls: "100" }
            const parts = feature.split(' ')
            if (parts.length >= 2) {
              const value = parts[0] // "Unlimited", "100", etc.
              const keyParts = parts.slice(1).join(' ').toLowerCase().replace(/\s+/g, '_')
              featuresObj[keyParts] = value
            } else if (parts.length === 1) {
              // Single word like "Premium" or "Basic"
              featuresObj['tier'] = feature
            }
          })
        } else {
          // Fallback if no features defined
          featuresObj = {
            orders: 'Unlimited',
            employees: 'Unlimited',
            storage: 'Unlimited',
            api_calls: 'Unlimited',
            support: "Priority Support",
          }
        }

        return {
          id: plan.id,
          name: plan.name,
          price: plan.price,
          billingCycle: plan.billingCycle,
          duration: plan.billingCycle === 'monthly' ? 'per month' : plan.billingCycle === 'annual' ? 'per year' : plan.billingCycle === 'trial' ? '14 days' : 'custom',
          description: plan.description,
          features: featuresObj,
          isRecommended: plan.id === 'premium',
        }
      }),
    })
  } catch (error) {
    console.error("Error fetching plans:", error)
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 500 }
    )
  }
}
