import { getServerSession } from "next-auth";
import { NextResponse, NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
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
      return NextResponse.json({ invoices: [], total: 0 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = { subscriptionId: subscription.id };
    if (status && status !== "all") {
      where.status = status;
    }

    // Fetch invoices
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { issuedAt: "desc" },
        skip,
        take: limit,
        include: { payment: true },
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({
      invoices: invoices.map((inv: typeof invoices[0]) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        status: inv.status,
        subtotal: inv.subtotal,
        tax: inv.tax,
        discount: inv.discount,
        total: inv.total,
        issuedAt: inv.issuedAt,
        dueDate: inv.dueDate,
        paidAt: inv.paidAt,
        lineItems: inv.lineItems,
        payment: inv.payment,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}
