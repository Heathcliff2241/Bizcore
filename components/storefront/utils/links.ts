import type { StorefrontContext } from '../types'

const EXTERNAL_PROTOCOL_REGEX = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i

interface ResolveOptions {
  allowEmpty?: boolean
  label?: string
}

const LABEL_ROUTE_ALIASES: Record<string, string> = {
  home: '/',
  homepage: '/',
  menu: '/home',
  shop: '/home',
  shops: '/home',
  product: '/home',
  products: '/home',
  catalogue: '/home',
  catalog: '/home',
  discover: '/home',
  cart: '/cart',
  basket: '/cart',
  checkout: '/checkout',
  account: '/account',
  profile: '/account',
  orders: '/account',
  login: '/auth/signin',
  signin: '/auth/signin',
  forgot: '/auth/forgot',
  reset: '/auth/reset',
  signup: '/auth/signup',
  register: '/auth/signup'
}

function derivePathFromLabel(label?: string): string | undefined {
  if (!label) {
    return undefined
  }

  const normalized = label.trim().toLowerCase()
  if (!normalized) {
    return undefined
  }

  if (normalized in LABEL_ROUTE_ALIASES) {
    return LABEL_ROUTE_ALIASES[normalized]
  }

  const slug = normalized
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s/-]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/g, '')
    .replace(/-+$/g, '')

  if (!slug) {
    return undefined
  }

  return `/${slug}`
}

export interface ResolvedHref {
  href: string
  isExternal: boolean
}

export function resolveStorefrontHref(
  url: string | undefined,
  storefront?: StorefrontContext,
  options: ResolveOptions = {}
): ResolvedHref {
  const fallbackFromLabel = derivePathFromLabel(options.label)

  let candidate = (url ?? '').trim()

  if ((candidate.length === 0 || candidate === '#') && fallbackFromLabel) {
    candidate = fallbackFromLabel
  }

  if (candidate.length === 0) {
    return {
      href: options.allowEmpty ? '' : '#',
      isExternal: false
    }
  }

  let trimmed = candidate.trim()

  // Handle anchor links (e.g., #products, #about, #contact) - pass through unchanged
  if (trimmed.startsWith('#') && trimmed.length > 1) {
    return {
      href: trimmed,
      isExternal: false
    }
  }

  // Compute the storefront base path for tenant-aware routing early so it can
  // be used by alias mapping logic below; this avoids using `base` before
  // initialization and keeps all path calculations consistent.
  const base = storefront ? `/storefront/${storefront.subdomain}` : ''

  if (trimmed === '#') {
    return {
      href: '#',
      isExternal: false
    }
  }

  if (EXTERNAL_PROTOCOL_REGEX.test(trimmed)) {
    return {
      href: trimmed,
      isExternal: true
    }
  }

  const aliasLookupKey = trimmed
    .replace(/^\/+/, '')
    .replace(/\/+$/g, '')
    .split(/[?#]/)[0]
    .toLowerCase()

  const aliasPath = aliasLookupKey ? LABEL_ROUTE_ALIASES[aliasLookupKey] : undefined
  if (aliasPath) {
    // If we're rendering inside a storefront and the alias maps to an auth route,
    // prefer the storefront's own route (e.g. /storefront/{subdomain}/signup) so
    // site authors can create tenant-local signup/sign-in pages that shadow global auth routes.
    if (storefront && aliasPath.startsWith('/auth/')) {
      // convert '/auth/signup' -> '/storefront/{subdomain}/signup'
      const storefrontPath = `${base}${aliasPath.replace(/^\/auth/, '')}`
      trimmed = storefrontPath
    } else {
      trimmed = aliasPath
    }
  }

  if (trimmed.startsWith('/storefront/') || trimmed.startsWith('/api/') || trimmed.startsWith('/auth/')) {
    return {
      href: trimmed,
      isExternal: false
    }
  }

  // `base` is already defined above.

  if (!base) {
    if (trimmed.startsWith('/')) {
      return {
        href: trimmed,
        isExternal: false
      }
    }

    return {
      href: `/${trimmed}`,
      isExternal: false
    }
  }

  if (trimmed === '/' || trimmed === '') {
    return {
      href: base,
      isExternal: false
    }
  }

  if (trimmed.startsWith('/')) {
    return {
      href: `${base}${trimmed}`,
      isExternal: false
    }
  }

  return {
    href: `${base}/${trimmed}`,
    isExternal: false
  }
}
