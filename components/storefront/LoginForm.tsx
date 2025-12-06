"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import type { StorefrontContext } from "./types"
import { resolveStorefrontHref } from "./utils/links"

interface LoginFormProps {
  fields?: string[]
  submitText?: string
  showForgotPassword?: boolean
  showSignUpLink?: boolean
  note?: string
  storefront?: StorefrontContext
  fullWidth?: boolean
  backgroundColor?: string
  textColor?: string
}

const DEFAULT_FIELDS = ["email", "password"] as const

const LABELS: Record<string, string> = {
  email: "Email address",
  password: "Password",
}

const TYPES: Record<string, string> = {
  email: "email",
  password: "password",
}

export function LoginForm({
  fields = Array.from(DEFAULT_FIELDS),
  submitText = "Sign In",
  showForgotPassword = true,
  showSignUpLink = true,
  note,
  storefront,
  fullWidth = true,
  backgroundColor = '#ffffff',
  textColor = '#000000'
}: LoginFormProps) {
  const router = useRouter()
  const [values, setValues] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (field: string, value: string) =>
    setValues((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // CUSTOMER LOGIN
      if (storefront?.subdomain) {
        const res = await signIn("customer-credentials", {
          email: values.email || "",
          password: values.password || "",
          subdomain: storefront.subdomain,
          redirect: false,
          callbackUrl: `/storefront/${storefront.subdomain}/account`,
        })

        if (res?.error) {
          setError(res.error || "Login failed")
          setLoading(false)
          return
        }

        router.push(`/storefront/${storefront.subdomain}/account`)
        return
      }

      // ADMIN LOGIN
      const res = await signIn("credentials", {
        email: values.email || "",
        password: values.password || "",
        redirect: false,
      })

      if (res?.error) {
        setError(res.error || "Login failed")
        setLoading(false)
        return
      }

      router.push("/dashboard")
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className={`w-full ${fullWidth ? '' : 'px-8 md:px-16 lg:px-24'}`} style={{ backgroundColor }}>
      <div className={`w-full ${!fullWidth ? 'max-w-7xl mx-auto' : ''} flex justify-center items-center py-16 px-4`}>
      {/* Apple-style floating card */}
      <div
        className="
          w-full max-w-lg
          bg-white backdrop-blur-xl
          border border-gray-200/70
          shadow-[0_8px_32px_rgba(0,0,0,0.08)]
          rounded-[32px]
          p-10
          transition-all duration-300
        "
      >
        {/* Title */}
        <div className="mb-8 text-center">
          <h1 className="text-[32px] font-semibold tracking-tight" style={{ color: textColor }}>
            Welcome back
          </h1>
          <p className="text-sm mt-2" style={{ color: textColor, opacity: 0.6 }}>
            Sign in to continue
          </p>
        </div>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          {/* Input grid */}
          <div className={`grid gap-6 ${fields.length > 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            {fields.map(field => (
              <div key={field} className="flex flex-col gap-2">

                <label
                  htmlFor={field}
                  className="text-sm font-medium"
                  style={{ color: textColor }}
                >
                  {LABELS[field] ?? field}
                </label>

                <input
                  id={field}
                  type={TYPES[field] ?? 'text'}
                  placeholder={`Enter your ${LABELS[field] ?? field}`}
                  value={values[field] ?? ''}
                  onChange={(e) => handleChange(field, e.target.value)}
                  className="
                    rounded-2xl px-4 py-[14px]
                    bg-gray-50
                    border border-gray-300
                    text-[15px]
                    placeholder:text-gray-400
                    focus:bg-white focus:border-blue-500
                    focus:ring-4 focus:ring-blue-100
                    transition-all duration-150
                  "
                  style={{ color: textColor }}
                />
              </div>
            ))}
          </div>

            {/* Forgot password */}
            {showForgotPassword && (
              <div className="text-right">
                {(() => {
                  const resolved = resolveStorefrontHref(
                    "/forgot",
                    storefront,
                    { label: "Forgot" }
                  )

                  if (resolved.isExternal)
                    return (
                      <a
                        href={resolved.href}
                        className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Forgot your password?
                      </a>
                    )

                  return (
                    <Link
                      href={resolved.href}
                      className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Forgot your password?
                    </Link>
                  )
                })()}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full rounded-2xl py-3
                bg-gray-900 text-white font-medium
                shadow-[0_2px_8px_rgba(0,0,0,0.15)]
                hover:bg-black
                active:scale-[0.98]
                transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {loading ? 'Signing in…' : submitText}
            </button>

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-red-50 text-red-700 border border-red-200 p-3 text-sm text-center">
                {error}
              </div>
            )}

          {/* Error message */}
          {error && (
            <p
              className="rounded-lg px-4 py-3 text-sm mt-3"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,60,60,0.07), rgba(255,60,60,0.04))",
                border: "1px solid rgba(255,60,60,0.12)",
                color: "#ffd4d4",
              }}
            >
              {error}
            </p>
          )}

            {/* Signup link */}
            {showSignUpLink && (
              <p className="text-center text-sm" style={{ color: textColor, opacity: 0.6 }}>
                Don&apos;t have an account?{' '}
                {(() => {
                  const resolved = resolveStorefrontHref(
                    "/signup",
                    storefront,
                    { label: "Sign Up" }
                  )

                  if (resolved.isExternal)
                    return (
                      <a href={resolved.href} className="text-blue-600 font-medium hover:underline" target="_blank" rel="noopener noreferrer">
                        Sign up
                      </a>
                    )

                  return (
                    <Link href={resolved.href} className="text-blue-600 font-medium hover:underline">
                      Sign up
                    </Link>
                  )
                })()}
              </p>
            )}

            {note && (
              <p className="text-center text-xs" style={{ color: textColor, opacity: 0.5 }}>
                {note}
              </p>
            )}

          </form>
        </div>
      </div>
    </section>
  )
}
