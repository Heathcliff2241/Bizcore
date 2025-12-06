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

    // Get subscription
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: tenant.id },
    });

    if (!subscription) {
      return NextResponse.json({ usage: [] });
    }

    // Get usage records
    const usageRecords = await prisma.usageRecord.findMany({
      where: { subscriptionId: subscription.id },
    });

    return NextResponse.json({
      usage: usageRecords.map((record: typeof usageRecords[0]) => ({
        id: record.id,
        metric: record.metric,
        value: record.value,
        limit: record.limit,
        percentage: record.percentage,
        recordedAt: record.recordedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage" },
      { status: 500 }
    );
  }
}
