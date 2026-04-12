import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id as string) },
      include: { tenantUsers: { include: { tenant: true } } },
    });

    if (!user || !user.tenantUsers.length) {
      return NextResponse.json(
        { error: "No tenant found" },
        { status: 404 }
      );
    }

    const tenant = user.tenantUsers[0].tenant;

    // Get subscription data
    let subscription = await prisma.subscription.findUnique({
      where: { tenantId: tenant.id },
      include: {
        invoices: { orderBy: { issuedAt: "desc" }, take: 1 },
        usageRecords: true,
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    // If no subscription exists, create default trial
    if (!subscription) {
      const trialStart = new Date();
      const trialEnd = new Date(trialStart.getTime() + 14 * 24 * 60 * 60 * 1000);

      subscription = await prisma.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: "trial",
          status: "trial",
          billingCycle: "trial",
          currentPeriodStart: trialStart,
          currentPeriodEnd: trialEnd,
          renewalDate: trialEnd,
          nextPaymentAmount: null,
          nextPaymentDate: null,
          autoRenew: true,
        },
        include: {
          invoices: true,
          usageRecords: true,
          payments: true,
        },
      });
    }

    // Calculate days remaining for trial
    const now = new Date();
    const daysRemaining =
      subscription.status === "trial"
        ? Math.ceil(
            (subscription.currentPeriodEnd.getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null;

    // Use pending upgrade plan if it exists, otherwise use current plan
    const planIdToShow = subscription.pendingUpgradePlanId || subscription.planId;
    
    // CRITICAL: Fetch plan data from database instead of hardcoded values
    const planData = await prisma.plan.findUnique({
      where: { id: planIdToShow },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        billingCycle: true,
        features: true,
      },
    });

    if (!planData) {
      return NextResponse.json(
        { error: `Plan not found: ${planIdToShow}` },
        { status: 404 }
      );
    }

    // CRITICAL: Fetch ALL active plans so client can calculate proration
    const allPlans = await prisma.plan.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        billingCycle: true,
        features: true,
        displayOrder: true,
      },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        tenantId: subscription.tenantId,
        planId: subscription.planId,
        pendingUpgradePlanId: subscription.pendingUpgradePlanId,
        status: subscription.status,
        billingCycle: subscription.billingCycle,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        renewalDate: subscription.renewalDate,
        nextPaymentAmount: subscription.nextPaymentAmount,
        nextPaymentDate: subscription.nextPaymentDate,
        autoRenew: subscription.autoRenew,
        daysRemaining,
      },
      plan: {
        id: planData.id,
        name: planData.name,
        description: planData.description,
        price: planData.price,
        cycle: planData.billingCycle,
        features: planData.features,
      },
      allPlans,
      tenant: {
        name: tenant.name,
        email: user.email,
      },
      lastPayment: subscription.payments[0] || null,
      lastInvoice: subscription.invoices[0] || null,
      usageRecords: subscription.usageRecords,
    });
  } catch (error) {
    console.error("Error fetching current subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
