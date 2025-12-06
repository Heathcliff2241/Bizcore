// Helper to build complete storefront settings with defaults
export function buildStorefrontSettings(tenant: any) {
  const paymentSettings = tenant.settings && typeof tenant.settings === 'object' && 'paymentSettings' in tenant.settings
    ? (tenant.settings as Record<string, unknown>).paymentSettings
    : { gcashNumber: '', gcashQrCode: '' }

  const tax = tenant.settings && typeof tenant.settings === 'object' && 'tax' in tenant.settings
    ? (tenant.settings as Record<string, unknown>).tax
    : { defaultTaxPercent: 0 }

  return tenant.settings ? {
    ...tenant.settings as Record<string, unknown>,
    paymentSettings,
    tax
  } : {
    paymentSettings,
    tax
  }
}

export function buildStorefrontObject(tenant: any) {
  return {
    id: tenant.id,
    subdomain: tenant.subdomain,
    name: tenant.name,
    settings: buildStorefrontSettings(tenant),
    primaryColor: tenant.primaryColor ?? undefined,
    secondaryColor: tenant.secondaryColor ?? undefined
  }
}
