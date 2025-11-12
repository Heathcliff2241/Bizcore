"use client"

import Link from 'next/link'
import type { StorefrontContext } from './types'
import { resolveStorefrontHref } from './utils/links'

interface FooterLink {
  label: string
  url: string
}

interface FooterColumn {
  title: string
  links: FooterLink[]
}

interface FooterSectionProps {
  companyName?: string
  tagline?: string
  storefront?: StorefrontContext
  columns?: FooterColumn[]
  socialLinks?: {
    facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
  }
  backgroundColor?: string
  textColor?: string
  copyright?: string
  height?: number
  size?: {
    width?: number
    height?: number
  }
}

type SocialKey = keyof NonNullable<FooterSectionProps['socialLinks']>

export function FooterSection({
  companyName = 'Your Store',
  tagline = 'Quality products for everyone',
  columns = [
    {
      title: 'Shop',
      links: [
        { label: 'All Products', url: '/products' },
        { label: 'Categories', url: '/categories' },
        { label: 'New Arrivals', url: '/new' },
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', url: '/about' },
        { label: 'Contact', url: '/contact' },
        { label: 'Careers', url: '/careers' },
      ]
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', url: '/help' },
        { label: 'Shipping', url: '/shipping' },
        { label: 'Returns', url: '/returns' },
      ]
    }
  ],
  socialLinks = {},
  backgroundColor = '#1f2937',
  textColor = '#ffffff',
  copyright,
  storefront,
  height,
  size
}: FooterSectionProps) {
  const currentYear = new Date().getFullYear()
  const copyrightText = copyright || `© ${currentYear} ${companyName}. All rights reserved.`

  const resolvedHeight = height ?? size?.height
  const basePadding = resolvedHeight ? Math.max(24, Math.min(resolvedHeight / 6, 72)) : 48

  const socialLinkEntries = Object.entries(socialLinks).filter(([, url]) => Boolean(url)) as Array<[
    SocialKey,
    string
  ]>

  const socialLabels: Record<SocialKey, string> = {
    facebook: 'Visit our Facebook page',
    twitter: 'Visit our Twitter page',
    instagram: 'Visit our Instagram page',
    linkedin: 'Visit our LinkedIn page'
  }

  return (
    <footer 
      className="px-8 md:px-16 lg:px-24 w-full"
      style={{
        backgroundColor,
        color: textColor,
        minHeight: resolvedHeight ? `${resolvedHeight}px` : undefined,
        paddingBlock: `${basePadding}px`,
        display: resolvedHeight ? 'flex' : undefined,
        alignItems: resolvedHeight ? 'center' : undefined
      }}
    >
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl font-bold mb-2">{companyName}</h3>
            <p className="opacity-80">{tagline}</p>
            
            {/* Social Links */}
            {socialLinkEntries.length > 0 && (
              <div className="flex gap-4 mt-4">
                {socialLinkEntries.map(([network, url]) => {
                  const resolved = resolveStorefrontHref(url, storefront)
                  const label = socialLabels[network] ?? 'Visit our social page'
                  const initials = network.substring(0, 2).toUpperCase()

                  return (
                    <a
                      key={network}
                      href={resolved.href}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-semibold tracking-wide transition-opacity hover:opacity-80"
                      aria-label={label}
                      title={label}
                      target={resolved.isExternal ? '_blank' : undefined}
                      rel={resolved.isExternal ? 'noopener noreferrer' : undefined}
                    >
                      <span>{initials}</span>
                    </a>
                  )
                })}
              </div>
            )}
          </div>
          
          {/* Footer Columns */}
          {columns.map((column, index) => (
            <div key={index}>
              <h4 className="font-semibold text-lg mb-4">{column.title}</h4>
              <ul className="space-y-2">
                {column.links.map((link, linkIndex) => {
                  const resolved = resolveStorefrontHref(link.url, storefront, { label: link.label })
                  return (
                    <li key={linkIndex}>
                      {resolved.isExternal ? (
                        <a
                          href={resolved.href}
                          className="opacity-80 hover:opacity-100 transition-opacity"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link 
                          href={resolved.href}
                          className="opacity-80 hover:opacity-100 transition-opacity"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
        
        {/* Copyright */}
        <div className="border-t pt-8 text-center opacity-80" style={{ borderColor: textColor + '33' }}>
          <p>{copyrightText}</p>
        </div>
      </div>
    </footer>
  )
}
