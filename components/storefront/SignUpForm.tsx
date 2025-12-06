/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import type { StorefrontContext } from './types'
import { resolveStorefrontHref } from './utils/links'

interface SignUpFormProps {
  fields?: string[]
  submitText?: string
  showLoginLink?: boolean
  requireTerms?: boolean
  storefront?: StorefrontContext
  fullWidth?: boolean
  backgroundColor?: string
  textColor?: string
}

const DEFAULT_FIELDS = ['firstName', 'lastName', 'email', 'password', 'confirmPassword'] as const

const LABELS: Record<string, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email address',
  password: 'Password',
  confirmPassword: 'Confirm password'
}

const TYPES: Record<string, string> = {
  email: 'email',
  password: 'password',
  confirmPassword: 'password'
}

export function SignUpForm({
  fields = Array.from(DEFAULT_FIELDS),
  submitText = 'Create Account',
  showLoginLink = true,
  requireTerms = true,
  storefront,
  fullWidth = true,
  backgroundColor = '#1f2937',
  textColor = '#ffffff'
}: SignUpFormProps) {
  const router = useRouter()
  const [formState, setFormState] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const twoColumn = fields.length > 3

  const handleChange = (field: string, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (formState.password && formState.confirmPassword && formState.password !== formState.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      let recaptchaToken: string | undefined
      try {
        if (typeof window !== 'undefined' && (window as any).grecaptcha && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
          recaptchaToken = await (window as any).grecaptcha.execute(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY, { action: 'signup' })
        }
      } catch {}

      const payload = {
        firstName: formState.firstName || '',
        lastName: formState.lastName || '',
        email: formState.email || '',
        phone: formState.phone || '',
        subdomain: storefront?.subdomain,
        password: formState.password || ''
      }

      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...payload, recaptchaToken })
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create account')
        setLoading(false)
        return
      }

      if (formState.email && formState.password) {
        if (storefront?.subdomain) {
          const signInResult = await signIn('customer-credentials', {
            email: formState.email,
            password: formState.password,
            subdomain: storefront.subdomain,
            redirect: false
          })
          if (signInResult?.ok) {
            router.push(`/storefront/${storefront.subdomain}/account`)
            return
          } else {
            const loginHref = resolveStorefrontHref('/signin', storefront, { label: 'Sign In' })
            if (loginHref.isExternal) {
              window.location.href = loginHref.href
            } else {
              router.push(loginHref.href)
            }
            return
          }
        }

        const signInResult = await signIn('credentials', {
          email: formState.email,
          password: formState.password,
          redirect: false
        })
        if (signInResult?.ok) {
          router.push('/dashboard')
          return
        } else {
          router.push('/auth/signin')
          return
        }
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section 
      className={`w-full ${fullWidth ? '' : 'px-8 md:px-16 lg:px-24'}`}
      style={{ backgroundColor }}
    >
      <div className={`w-full ${!fullWidth ? 'max-w-7xl mx-auto px-4' : ''} flex justify-center items-center py-8`}>
      {/* Floating container */}
      <div
        className="
          relative w-full max-w-2xl
          rounded-[40px]
          bg-white/8 backdrop-blur-[28px] bg-clip-padding
          border border-white/10
          shadow-[0_30px_80px_rgba(7,12,20,0.45)]
          overflow-visible
          p-8 md:p-10
        "
        style={{
          // subtle chrome rim + double-glow
          boxShadow: '0 30px 80px rgba(7,12,20,0.45), inset 0 1px 0 rgba(255,255,255,0.03)',
          WebkitBackdropFilter: 'blur(28px)',
          backdropFilter: 'blur(28px)',
          borderImageSlice: 1
        }}
      >
        {/* top glow accent */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-[85%] h-6 rounded-full blur-3xl opacity-30"
          style={{ background: 'linear-gradient(90deg, rgba(94,199,255,0.18), rgba(150,103,255,0.12))' }}
        />

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Heading group */}
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.35)]" style={{ color: textColor }}>
              Create your account
            </h1>
            <p className="text-sm max-w-[56ch] text-center" style={{ color: textColor, opacity: 0.7 }}>
              Secure access to orders and tracking — built for modern shops. Set up takes less than a minute.
            </p>
          </div>

          {/* inner floating panel */}
          <div
            className="w-full rounded-[28px] p-6 md:p-8"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 8px 40px rgba(12,20,40,0.35), inset 0 1px 0 rgba(255,255,255,0.02)'
            }}
          >
            <div className={`grid gap-5 ${twoColumn ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
              {fields.map(field => (
                <div key={field} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label htmlFor={field} className="text-sm font-semibold" style={{ color: textColor, opacity: 0.9 }}>
                      {LABELS[field] ?? field}
                    </label>
                    {/* optional inline hint */}
                    {field === 'password' && (
                      <span className="text-xs" style={{ color: textColor, opacity: 0.5 }}>Strong password recommended</span>
                    )}
                  </div>

                  <div
                    className="relative rounded-xl"
                    style={{
                      // thick chrome edge:
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
                      border: '1px solid rgba(255,255,255,0.06)',
                      padding: 2
                    }}
                  >
                    <input
                      id={field}
                      type={TYPES[field] ?? 'text'}
                      placeholder={`Enter your ${LABELS[field] ?? field}`}
                      value={formState[field] || ''}
                      onChange={(e) => handleChange(field, e.target.value)}
                      className="
                        w-full rounded-lg
                        bg-transparent px-5 py-4 text-base
                        outline-none
                        transition-all duration-200
                      "
                      style={{
                        // inner soft glass
                        backdropFilter: 'blur(6px)',
                        WebkitBackdropFilter: 'blur(6px)',
                        color: textColor
                      }}
                    />
                    {/* focus halo using a pseudo element pattern (JS-free) */}
                    <div className="pointer-events-none absolute inset-0 rounded-lg opacity-0 focus-within:opacity-100 transition-opacity duration-200" />
                  </div>
                </div>
              ))}
            </div>

            {/* Terms checkbox and helper */}
            {requireTerms && (
              <label className="flex items-start gap-3 mt-4 text-sm" style={{ color: textColor, opacity: 0.8 }}>
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 rounded-md accent-[#7dd3fc] bg-white/6 border-white/12"
                />
                <span>
                  I agree to the <a className="underline" style={{ color: textColor, opacity: 0.9 }} href="/terms">Terms of Service</a> and <a className="underline" style={{ color: textColor, opacity: 0.9 }} href="/privacy">Privacy Policy</a>.
                </span>
              </label>
            )}

            {/* action row */}
            <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <button
                type="submit"
                disabled={loading}
                className={`flex items-center justify-center gap-3 w-full md:w-auto rounded-[18px] px-7 py-3 text-base font-semibold
                  transition-transform duration-180
                  ${loading ? 'opacity-60 cursor-wait' : 'hover:scale-[1.02] active:scale-[0.98]'}
                `}
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: textColor,
                  boxShadow: '0 8px 30px rgba(100,120,255,0.12), inset 0 -1px 0 rgba(255,255,255,0.02)'
                }}
              >
                <span className="whitespace-nowrap">
                  {loading ? 'Creating account…' : submitText}
                </span>
              </button>

              <div className="text-sm text-center md:text-left" style={{ color: textColor, opacity: 0.7 }}>
                {showLoginLink && (
                  <>
                    <div>Already have an account?</div>
                    <div className="mt-1">
                      {(() => {
                        const resolved = resolveStorefrontHref('/signin', storefront, { label: 'Sign In' })
                        if (resolved.isExternal) {
                          return (
                            <a href={resolved.href} className="font-semibold underline-offset-2" style={{ color: textColor, opacity: 0.95 }} target="_blank" rel="noopener noreferrer">
                              Sign in
                            </a>
                          )
                        }
                        return (
                          <Link href={resolved.href} className="font-semibold underline-offset-2" style={{ color: textColor, opacity: 0.95 }}>
                            Sign in
                          </Link>
                        )
                      })()}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* error / success area */}
            {error && (
              <div
                className="mt-5 rounded-lg px-4 py-3 text-sm"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,60,60,0.06), rgba(255,60,60,0.03))',
                  border: '1px solid rgba(255,60,60,0.12)',
                  color: '#ffd4d4'
                }}
              >
                {error}
              </div>
            )}
          </div>

          {/* subtle footer / microcopy */}
          <div className="text-center text-xs" style={{ color: textColor, opacity: 0.6 }}>
            By creating an account you agree to receive transactional emails. You can unsubscribe anytime.
          </div>
        </form>
      </div>
    </div>
    </section>
  )
}
