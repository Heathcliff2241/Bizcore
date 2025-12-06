import { getServerSession } from "next-auth";
import { NextResponse, NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/tenant/subscriptions/invoices/[id]/pdf
 * Generate and download invoice as PDF
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      return NextResponse.json({ error: "No tenant found" }, { status: 404 });
    }

    const tenant = user.tenantUsers[0].tenant;
    const { id } = await params;

    // Get invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id) },
      include: { subscription: { include: { tenant: true } } },
    });

    if (!invoice || invoice.subscription.tenantId !== tenant.id) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Generate HTML content for PDF
    const htmlContent = generateInvoiceHTML(invoice, tenant, user);

    // Return HTML as response - client will use library to convert to PDF
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.html"`,
      },
    });
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    );
  }
}

function generateInvoiceHTML(
  invoice: any,
  tenant: any,
  user: any
): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(amount / 100);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; }
          .container { max-width: 900px; margin: 0 auto; padding: 40px; background: white; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #1e40af; padding-bottom: 20px; }
          .logo-section h1 { color: #1e40af; font-size: 28px; margin-bottom: 5px; }
          .logo-section p { color: #666; font-size: 14px; }
          .invoice-title { text-align: right; }
          .invoice-title h2 { color: #1e40af; font-size: 24px; margin-bottom: 10px; }
          .invoice-details { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
          .details-section h3 { color: #1e40af; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.5px; }
          .details-section p { font-size: 14px; line-height: 1.6; color: #666; }
          .details-section strong { color: #333; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background-color: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; color: #333; font-size: 14px; border-bottom: 2px solid #1e40af; }
          td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
          tr:last-child td { border-bottom: none; }
          .text-right { text-align: right; }
          .subtotal-section { display: flex; justify-content: flex-end; margin-bottom: 20px; }
          .subtotal-box { width: 300px; }
          .subtotal-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
          .subtotal-row.total { font-weight: 700; border-bottom: 2px solid #1e40af; padding: 12px 0; font-size: 16px; color: #1e40af; }
          .footer { border-top: 2px solid #1e40af; padding-top: 20px; text-align: center; color: #666; font-size: 12px; }
          .status-badge { display: inline-block; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
          .status-paid { background-color: #d1fae5; color: #065f46; }
          .status-draft { background-color: #fef3c7; color: #92400e; }
          .status-overdue { background-color: #fee2e2; color: #991b1b; }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <div class="logo-section">
              <h1>BizCore</h1>
              <p>Business Management Platform</p>
            </div>
            <div class="invoice-title">
              <h2>INVOICE</h2>
              <p style="color: #1e40af; font-weight: 600;">${invoice.invoiceNumber}</p>
            </div>
          </div>

          <!-- Invoice Details -->
          <div class="invoice-details">
            <div>
              <div class="details-section">
                <h3>Bill To</h3>
                <p><strong>${tenant.name}</strong></p>
                <p>${user.email}</p>
              </div>
            </div>
            <div>
              <div class="details-section">
                <h3>Invoice Details</h3>
                <p><strong>Invoice Date:</strong> ${formatDate(invoice.issuedAt)}</p>
                <p><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${invoice.status}">${invoice.status.toUpperCase()}</span></p>
              </div>
            </div>
          </div>

          <!-- Line Items -->
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th class="text-right">Quantity</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${(invoice.lineItems as any[])
                .map(
                  (item: any) => `
                <tr>
                  <td>${item.description}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                  <td class="text-right">${formatCurrency(item.total)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <!-- Totals -->
          <div class="subtotal-section">
            <div class="subtotal-box">
              <div class="subtotal-row">
                <span>Subtotal</span>
                <span>${formatCurrency(invoice.subtotal)}</span>
              </div>
              ${invoice.discount > 0 ? `
              <div class="subtotal-row">
                <span>Discount</span>
                <span>-${formatCurrency(invoice.discount)}</span>
              </div>
              ` : ""}
              ${invoice.tax > 0 ? `
              <div class="subtotal-row">
                <span>Tax</span>
                <span>${formatCurrency(invoice.tax)}</span>
              </div>
              ` : ""}
              <div class="subtotal-row total">
                <span>Total</span>
                <span>${formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>Thank you for your business!</p>
            <p style="margin-top: 10px;">BizCore • All-in-One Business Management Platform</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
