import type { StorefrontContext } from './types'
import { resolveStorefrontHref } from './utils/links'

interface ButtonBlockProps {
  text?: string
  url?: string
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'small' | 'medium' | 'large'
  fullWidth?: boolean
  backgroundColor?: string
  textColor?: string
  borderColor?: string
  storefront?: StorefrontContext
}

export function ButtonBlock({
  text = 'Click Here',
  url = '#',
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  backgroundColor = '#3b82f6',
  textColor = '#ffffff',
  borderColor = '#3b82f6',
  storefront
}: ButtonBlockProps) {
  const resolvedLink = resolveStorefrontHref(url, storefront, { allowEmpty: true, label: text })
  const sizeClasses = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg'
  }

  const getButtonStyle = () => {
    if (variant === 'outline') {
      return {
        backgroundColor: 'transparent',
        color: backgroundColor,
        border: `2px solid ${borderColor}`
      }
    }
    if (variant === 'secondary') {
      return {
        backgroundColor: '#6b7280',
        color: textColor,
        border: 'none'
      }
    }
    return {
      backgroundColor,
      color: textColor,
      border: 'none'
    }
  }

  return (
    <section className="py-8 px-8 md:px-16 lg:px-24 w-full">
      <div className="w-full max-w-7xl mx-auto text-center">
        <a
          href={resolvedLink.href}
          target={resolvedLink.isExternal ? '_blank' : undefined}
          rel={resolvedLink.isExternal ? 'noopener noreferrer' : undefined}
          className={`inline-block font-semibold rounded-lg hover:opacity-90 transition-opacity ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''}`}
          style={getButtonStyle()}
        >
          {text}
        </a>
      </div>
    </section>
  )
}
