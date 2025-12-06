'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useCallback } from 'react'
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { signOut } from 'next-auth/react'

interface AccountNavigationProps {
	sections?: Array<{ title: string; href?: string }>
	activeSection?: string
	backgroundColor?: string
	borderRadius?: number
	padding?: number
	heading?: string
	storefront?: { subdomain?: string }
}

const DEFAULT_SECTIONS = [
	{ title: 'Profile', href: 'profile' },
	{ title: 'Orders', href: 'orders' },
	{ title: 'Addresses', href: 'addresses' }
]

export function AccountNavigation({
	sections = DEFAULT_SECTIONS,
	activeSection = 'profile',
	backgroundColor = '#f8fafc',
	borderRadius = 12,
	padding = 24,
	heading = 'Account',
	storefront
}: AccountNavigationProps) {
	const searchParams = useSearchParams()
	const currentSection = searchParams.get('tab') || activeSection

	const handleLogout = useCallback(async () => {
		// Call server-side cleanup to ensure cookies are cleared for both admin & customer sessions
		try {
			await fetch('/api/auth/clear-session', { method: 'POST', credentials: 'include' })
		} catch (err) {
			console.warn('[LOGOUT] clear-session request failed', err)
		}

		// For storefront customers, use customer authentication signout
		if (storefront?.subdomain) {
			await signOut({ redirect: true, callbackUrl: `/storefront/${storefront.subdomain}/signin` })
			return
		}

		// For admin users, use regular NextAuth signout
		await signOut({ redirect: true, callbackUrl: '/auth/signin' })
	}, [storefront?.subdomain])

	const resolvedSections = sections.length > 0 ? sections : DEFAULT_SECTIONS

	return (
		<aside
			className="flex h-full w-full flex-col gap-4 border border-slate-200 sticky top-4"
			style={{
				backgroundColor,
				borderRadius,
				padding
			}}
		>
			<div>
				<h2 className="text-lg font-semibold text-slate-900">{heading}</h2>
				<p className="text-sm text-slate-500">Manage every aspect of your account.</p>
			</div>

			<nav className="flex flex-col gap-2 flex-1">
				{resolvedSections.map(section => {
					const isActive = section.href === currentSection
					const href = section.href ? `?tab=${section.href}` : '#'
					
					return (
						<Link
							key={section.title}
							href={href}
							className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition-all duration-200 ${
								isActive
									? 'bg-slate-900 text-white shadow-md'
									: 'text-slate-700 hover:bg-slate-100'
							}`}
						>
							{section.title}
						</Link>
					)
				})}
			</nav>

			<button
				onClick={handleLogout}
				className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
			>
				<ArrowRightOnRectangleIcon className="w-4 h-4" />
				Logout
			</button>
		</aside>
	)
}
