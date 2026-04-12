/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useCallback, useState } from 'react'
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { User, Package, MapPin, Lock } from 'lucide-react'
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
	{ title: 'Addresses', href: 'addresses' },
	{ title: 'Security', href: 'security' }
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
	const router = useRouter()
	const currentSection = searchParams.get('tab') || activeSection
	const [isLoggingOut, setIsLoggingOut] = useState(false)

	const handleLogout = useCallback(async () => {
		setIsLoggingOut(true)
		try {
			await fetch('/api/auth/clear-session', { method: 'POST', credentials: 'include' })
		} catch (err) {
			console.warn('[LOGOUT] clear-session request failed', err)
		}

		if (storefront?.subdomain) {
			await signOut({ redirect: true, callbackUrl: `/storefront/${storefront.subdomain}` })
			return
		}

		await signOut({ redirect: true, callbackUrl: '/' })
	}, [storefront])

	return (
		<div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden sticky top-6">
			{/* Desktop Navigation */}
			<div className="p-4">
				<nav className="space-y-1">
					{sections.map((section) => (
						<Link
							key={section.href}
							href={`?tab=${section.href}`}
							className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
								currentSection === section.href
									? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
									: 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
							}`}
						>
							{section.href === 'profile' && <User className="w-4 h-4" />}
							{section.href === 'orders' && <Package className="w-4 h-4" />}
							{section.href === 'addresses' && <MapPin className="w-4 h-4" />}
							{section.href === 'security' && <Lock className="w-4 h-4" />}
							{section.title}
						</Link>
					))}
				</nav>
			</div>

			{/* Logout Button */}
			<div className="border-t border-gray-100 p-4">
				<button
					onClick={handleLogout}
					disabled={isLoggingOut}
					className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all disabled:opacity-50 active:scale-95"
				>
					<ArrowRightOnRectangleIcon className="w-5 h-5" />
					{isLoggingOut ? 'Signing out...' : 'Sign out'}
				</button>
			</div>
		</div>
	)
}
