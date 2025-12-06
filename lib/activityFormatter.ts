/**
 * Activity Log Formatter
 * Converts activity log details into human-readable descriptions
 */

export function formatActivityDetails(
  action: string,
  details: Record<string, unknown> | null
): string {
  if (!details) return '';

  switch (action) {
    // Authentication operations
    case 'TENANT_SIGNUP':
      return formatTenantSignup(details);
    case 'USER_SIGNIN':
      return formatUserSignin(details);
    case 'USER_SIGNIN_FAILED':
      return formatUserSigninFailed(details);
    case 'CUSTOMER_SIGNIN':
      return formatCustomerSignin(details);
    case 'CUSTOMER_SIGNIN_FAILED':
      return formatCustomerSigninFailed(details);
    case 'EMPLOYEE_CREATED':
      return formatEmployeeCreated(details);
    case 'EMPLOYEE_UPDATED':
      return formatEmployeeUpdated(details);
    case 'EMPLOYEE_DELETED':
      return formatEmployeeDeleted(details);

    // Tenant operations
    case 'TENANT_CREATED':
      return formatTenantCreated(details);
    case 'TENANT_UPDATED':
      return formatTenantUpdated(details);
    case 'TENANT_DEACTIVATED':
      return formatTenantDeactivated(details);

    // User operations
    case 'USER_CREATED':
      return formatUserCreated(details);
    case 'USER_UPDATED':
      return formatUserUpdated(details);

    // Order operations
    case 'ORDER_CREATED':
      return formatOrderCreated(details);
    case 'ORDER_UPDATED':
      return formatOrderUpdated(details);

    // Product operations
    case 'PRODUCT_CREATED':
      return formatProductCreated(details);
    case 'PRODUCT_UPDATED':
      return formatProductUpdated(details);
    case 'PRODUCT_DELETED':
      return formatProductDeleted(details);

    default:
      return '';
  }
}

// Tenant Formatters
function formatTenantCreated(details: Record<string, unknown>): string {
  const tenantName = details.tenantName || 'Unnamed tenant';
  const subdomain = details.subdomain || 'N/A';
  const plan = details.plan || 'N/A';
  const ownerEmail = details.ownerEmail || 'N/A';

  return `Created tenant "${tenantName}" (${subdomain}) - Plan: ${plan}, Owner: ${ownerEmail}`;
}

function formatTenantUpdated(details: Record<string, unknown>): string {
  const changes = (details.changes as string[]) || [];
  const changesList = changes.length > 0 ? changes.join(', ') : 'multiple fields';

  return `Updated tenant: ${changesList}`;
}

function formatTenantDeactivated(details: Record<string, unknown>): string {
  const tenantName = details.tenantName || 'Unnamed tenant';
  return `Deactivated tenant "${tenantName}"`;
}

// User Formatters
function formatUserCreated(details: Record<string, unknown>): string {
  const email = details.email || 'N/A';
  const firstName = details.firstName || '';
  const lastName = details.lastName || '';
  const role = details.role || 'N/A';
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || email;

  return `Created user "${fullName}" (${email}) - Role: ${role}`;
}

function formatUserUpdated(details: Record<string, unknown>): string {
  const changes = (details.changes as string[]) || [];
  const newRole = details.newRole ? ` to ${details.newRole}` : '';
  const changesList = changes.length > 0 ? changes.join(', ') : 'multiple fields';

  return `Updated user: ${changesList}${newRole}`;
}

// Order Formatters
function formatOrderCreated(details: Record<string, unknown>): string {
  const orderNumber = details.orderNumber || 'N/A';
  const total = formatPrice(details.total as number | undefined);
  const itemCount = details.itemCount || 0;
  const customerEmail = details.customerEmail || 'N/A';
  const paymentMethod = details.paymentMethod || 'N/A';
  const orderType = details.orderType || 'N/A';

  return `Created order #${orderNumber} - ${total} (${itemCount} item${itemCount !== 1 ? 's' : ''}) - Customer: ${customerEmail}, Payment: ${paymentMethod}, Type: ${orderType}`;
}

function formatOrderUpdated(details: Record<string, unknown>): string {
  const orderNumber = details.orderNumber || 'N/A';
  const newStatus = details.newStatus ? `Status: ${details.newStatus}` : '';
  const newPaymentStatus = details.newPaymentStatus
    ? `Payment: ${details.newPaymentStatus}`
    : '';
  const amountPaid = details.amountPaid
    ? `Amount: ${formatPrice(details.amountPaid as number)}`
    : '';

  const parts = [newStatus, newPaymentStatus, amountPaid].filter(Boolean);
  const summary = parts.length > 0 ? parts.join(', ') : 'multiple fields';

  return `Updated order #${orderNumber} - ${summary}`;
}

// Product Formatters
function formatProductCreated(details: Record<string, unknown>): string {
  const productName = details.productName || 'Unnamed product';
  const price = formatPrice(details.price as number | undefined);
  const cost = formatPrice(details.cost as number | undefined);
  const ingredientCount = details.ingredientCount || 0;

  return `Created product "${productName}" - Price: ${price}, Cost: ${cost}, Ingredients: ${ingredientCount}`;
}

function formatProductUpdated(details: Record<string, unknown>): string {
  const productName = details.productName || 'Unnamed product';
  const changes: string[] = [];

  // Check which fields were changed
  if (details.priceChanged) changes.push(`Price: ${formatPrice(details.newPrice as number | undefined)}`);
  if (details.costChanged) changes.push(`Cost: ${formatPrice(details.newCost as number | undefined)}`);
  if (details.nameChanged) changes.push('Name');
  if (details.descriptionChanged) changes.push('Description');
  if (details.categoryChanged) changes.push('Category');
  if (details.imageChanged) changes.push('Image');
  if (details.ingredientsChanged) changes.push('Ingredients');
  if (details.variantsChanged) changes.push('Variants');
  if (details.statusChanged) changes.push('Status');

  const changesList = changes.length > 0 ? changes.join(', ') : 'multiple fields';

  return `Updated product "${productName}" - ${changesList}`;
}

function formatProductDeleted(details: Record<string, unknown>): string {
  const productName = details.productName || 'Unnamed product';
  const price = formatPrice(details.price as number | undefined);
  const cost = formatPrice(details.cost as number | undefined);

  return `Deleted product "${productName}" - Price: ${price}, Cost: ${cost}`;
}

// Helper function to format currency
function formatPrice(amount: number | undefined): string {
  if (amount === undefined || amount === null) return '₱0.00';
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
}

// Authentication Formatters
function formatTenantSignup(details: Record<string, unknown>): string {
  const email = details.email || 'N/A';
  const name = details.name || 'Unknown user';
  const role = details.role || 'tenant';

  return `Tenant signup - "${name}" (${email}) - Role: ${role}`;
}

function formatUserSignin(details: Record<string, unknown>): string {
  const email = details.email || 'N/A';
  const role = details.role || 'unknown';

  return `Signed in - ${email} (Role: ${role})`;
}

function formatUserSigninFailed(details: Record<string, unknown>): string {
  const email = details.email || 'N/A';
  const reason = details.reason || 'unknown reason';

  return `Sign-in failed - ${email} (Reason: ${reason})`;
}

function formatCustomerSignin(details: Record<string, unknown>): string {
  const email = details.email || 'N/A';

  return `Customer signed in - ${email}`;
}

function formatCustomerSigninFailed(details: Record<string, unknown>): string {
  const email = details.email || 'N/A';
  const reason = details.reason || 'unknown reason';

  return `Customer sign-in failed - ${email} (Reason: ${reason})`;
}

function formatEmployeeCreated(details: Record<string, unknown>): string {
  const name = details.employeeName || 'Unknown employee';
  const email = details.email || 'N/A';
  const role = details.role || 'cashier';

  return `Created employee "${name}" (${email}) - Role: ${role}`;
}

function formatEmployeeUpdated(details: Record<string, unknown>): string {
  const name = details.employeeName || 'Unknown employee';
  const changedFields = (details.changedFields as string[]) || [];
  const fieldsList = changedFields.length > 0 ? changedFields.join(', ') : 'multiple fields';

  return `Updated employee "${name}" - ${fieldsList}`;
}

function formatEmployeeDeleted(details: Record<string, unknown>): string {
  const name = details.employeeName || 'Unknown employee';
  const email = details.email || 'N/A';

  return `Deleted employee "${name}" (${email})`;
}
