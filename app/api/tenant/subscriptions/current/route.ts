import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PLAN_PRICING = {
  trial: { amount: 0, cycle: "trial", name: "Trial" },
  basic: { amount: 199900, cycle: "monthly", name: "BizCore Starter" },
  premium: { amount: 1999900, cycle: "annual", name: "BizCore Premium" },
  enterprise: { amount: 0, cycle: "custom", name: "Enterprise" },
};

const PLAN_FEATURES = {
  trial: {
    orders: 10,
    employees: 1,
    storage: 1,
    apiCalls: 100,
  },
  basic: {
    orders: null, // unlimited
    employees: 3,
    storage: 10,
    apiCalls: 1000,
  },
  premium: {
    orders: null, // unlimited
    employees: null, // unlimited
    storage: 100,
    apiCalls: 100000,
  },
  enterprise: {
    orders: null,
    employees: null,
    storage: null,
    apiCalls: null,
  },
};

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
    const pricing = PLAN_PRICING[planIdToShow as keyof typeof PLAN_PRICING] || PLAN_PRICING.trial;
    const features = PLAN_FEATURES[planIdToShow as keyof typeof PLAN_FEATURES] || PLAN_FEATURES.trial;

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        tenantId: subscription.tenantId,
        planId: subscription.planId,
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
        name: pricing.name,
        price: pricing.amount,
        cycle: pricing.cycle,
        features,
      },
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
