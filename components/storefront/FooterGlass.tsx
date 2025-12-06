'use client'

import Link from 'next/link'
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react'

interface FooterGlassProps {
  companyName?: string
  copyright?: string
  footerLinks?: Array<{ label: string; url: string }>
  socialLinks?: Array<{ label: string; url: string }>
  textColor?: string
  glassOpacity?: number
  glassBlurAmount?: number
  backgroundColor?: string
  fullWidth?: boolean
}

export function FooterGlass({
  companyName = 'Your Brand',
  copyright = '© 2025 Your Brand. All rights reserved.',
  footerLinks = [
    { label: 'About', url: '/about' },
    { label: 'Contact', url: '/contact' },
    { label: 'Privacy', url: '/privacy' },
    { label: 'Terms', url: '/terms' }
  ],
  socialLinks = [],
  textColor = '#ffffff',
  glassOpacity = 0.1,
  glassBlurAmount = 10,
  backgroundColor = 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  fullWidth = true
}: FooterGlassProps) {
  const containerClass = fullWidth ? 'w-full' : 'max-w-7xl mx-auto'

  const getSocialIcon = (label: string) => {
    const iconProps = { size: 20, className: 'transition-opacity hover:opacity-80' }
    switch (label.toLowerCase()) {
      case 'facebook':
        return <Facebook {...iconProps} />
      case 'twitter':
        return <Twitter {...iconProps} />
      case 'instagram':
        return <Instagram {...iconProps} />
      case 'linkedin':
        return <Linkedin {...iconProps} />
      default:
        return null
    }
  }

  return (
    <footer
      style={{
        background: backgroundColor,
        position: 'relative',
        overflow: 'hidden'
      }}
      className="w-full"
    >
      {/* Glass morphism overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `rgba(255, 255, 255, ${glassOpacity})`,
          backdropFilter: `blur(${glassBlurAmount}px)`,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />

      {/* Content wrapper */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          color: textColor,
          padding: 'clamp(2rem, 5%, 4rem)',
          boxSizing: 'border-box'
        }}
      >
        <div className={containerClass}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand section */}
            <div>
              <h3
                style={{ color: textColor }}
                className="text-lg font-bold mb-4"
              >
                {companyName}
              </h3>
              <p style={{ color: textColor, opacity: 0.8 }} className="text-sm">
                Creating exceptional digital experiences for modern commerce.
              </p>
            </div>

            {/* Links columns */}
            {footerLinks && footerLinks.length > 0 && (
              <div>
                <h4 style={{ color: textColor }} className="text-sm font-semibold mb-4">
                  Quick Links
                </h4>
                <ul className="space-y-2">
                  {footerLinks.map((link, idx) => (
                    <li key={idx}>
                      <Link
                        href={link.url}
                        style={{
                          color: textColor,
                          opacity: 0.7,
                          textDecoration: 'none',
                          transition: 'opacity 0.2s'
                        }}
                        className="text-sm hover:opacity-100"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Contact info */}
            <div>
              <h4 style={{ color: textColor }} className="text-sm font-semibold mb-4">
                Contact
              </h4>
              <div className="space-y-2 text-sm" style={{ color: textColor, opacity: 0.7 }}>
                <div className="flex items-center gap-2">
                  <Mail size={16} />
                  <span>support@brand.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} />
                  <span>+1 (555) 000-0000</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  <span>City, Country</span>
                </div>
              </div>
            </div>

            {/* Social links */}
            {socialLinks && socialLinks.length > 0 && (
              <div>
                <h4 style={{ color: textColor }} className="text-sm font-semibold mb-4">
                  Follow Us
                </h4>
                <div className="flex gap-4">
                  {socialLinks.map((social, idx) => (
                    <a
                      key={idx}
                      href={social.url}
                      style={{ color: textColor }}
                      className="transition-opacity hover:opacity-80"
                    >
                      {getSocialIcon(social.label)}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom section */}
          <div
            style={{
              borderTop: `1px solid rgba(255, 255, 255, 0.1)`,
              paddingTop: '2rem',
              marginTop: '2rem'
            }}
            className="flex flex-col md:flex-row justify-between items-center"
          >
            <p style={{ color: textColor, opacity: 0.6 }} className="text-xs text-center md:text-left">
              {copyright}
            </p>
            <div className="flex gap-6 mt-4 md:mt-0 text-xs" style={{ color: textColor, opacity: 0.6 }}>
              <Link href="/privacy" style={{ color: 'inherit' }} className="hover:opacity-100">
                Privacy Policy
              </Link>
              <Link href="/terms" style={{ color: 'inherit' }} className="hover:opacity-100">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
