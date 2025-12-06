'use client'

import type { CSSProperties } from 'react'
import type { StorefrontContext } from './types'
import { resolveStorefrontHref } from './utils/links'

interface CTASectionProps {
  heading?: string
  subheading?: string
  buttonText?: string
  buttonUrl?: string
  backgroundColor?: string
  textColor?: string
  buttonColor?: string
  height?: number
  size?: {
    width?: number
    height?: number
  }
  storefront?: StorefrontContext
  fullWidth?: boolean
}

export function CTASection({
  heading = 'Ready to Get Started?',
  subheading = 'Join thousands of satisfied customers',
  buttonText = 'Get Started',
  buttonUrl = '#',
  backgroundColor = '#10b981',
  textColor = '#ffffff',
  buttonColor = '#ffffff',
  height,
  size,
  storefront
  , fullWidth = true
}: CTASectionProps) {
  const resolvedHeight = height ?? size?.height
  const basePadding = resolvedHeight ? Math.max(24, Math.min(resolvedHeight / 4, 96)) : 80

  const sectionStyle: CSSProperties = {
    backgroundColor,
    minHeight: resolvedHeight ? `${resolvedHeight}px` : undefined,
    paddingBlock: `${basePadding}px`
  }

  if (resolvedHeight) {
    sectionStyle.display = 'flex'
    sectionStyle.alignItems = 'center'
  }

  const buttonLink = resolveStorefrontHref(buttonUrl, storefront, { allowEmpty: true, label: buttonText })

  return (
    <section 
      className={`w-full ${fullWidth ? '' : 'px-8 md:px-16 lg:px-24'}`}
      style={sectionStyle}
    >
      <div className={`w-full ${!fullWidth ? 'max-w-7xl mx-auto' : ''} text-center`}>
        <h2 
          className="text-4xl md:text-5xl font-bold mb-6"
          style={{ color: textColor }}
        >
          {heading}
        </h2>
        
        {subheading && (
          <p 
            className="text-xl md:text-2xl mb-8 opacity-90"
            style={{ color: textColor }}
          >
            {subheading}
          </p>
        )}
        
        {buttonText && (
          <a
            href={buttonLink.href}
            target={buttonLink.isExternal ? '_blank' : undefined}
            rel={buttonLink.isExternal ? 'noopener noreferrer' : undefined}
            className="inline-block px-8 py-4 font-semibold rounded-lg hover:opacity-90 transition-opacity text-lg shadow-lg"
            style={{ 
              backgroundColor: buttonColor,
              color: backgroundColor 
            }}
          >
            {buttonText}
          </a>
        )}
      </div>
    </section>
  )
}
