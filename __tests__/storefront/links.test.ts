import { resolveStorefrontHref } from '../../components/storefront/utils/links'

describe('resolveStorefrontHref', () => {
  test('maps /signup to tenant-local signup when storefront provided', () => {
    const storefront = { subdomain: 'nuvem' } as any
    const resolved = resolveStorefrontHref('/signup', storefront)
    expect(resolved).toEqual({ href: '/storefront/nuvem/signup', isExternal: false })
  })

  test('maps label signup to tenant-local signup when storefront provided', () => {
    const storefront = { subdomain: 'nuvem' } as any
    const resolved = resolveStorefrontHref(undefined, storefront, { label: 'SignUp' })
    expect(resolved).toEqual({ href: '/storefront/nuvem/signup', isExternal: false })
  })

  test('returns external urls unchanged', () => {
    const resolved = resolveStorefrontHref('https://example.com')
    expect(resolved).toEqual({ href: 'https://example.com', isExternal: true })
  })
})
