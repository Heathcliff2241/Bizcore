'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { StorefrontContext } from './types'
import { ProfileContent } from './account/ProfileContent'
import { OrdersContent } from './account/OrdersContent'
import { SecurityContent } from './account/SecurityContent'
import { motion, AnimatePresence } from 'framer-motion'

interface AccountContentProps {
	backgroundColor?: string
	borderRadius?: number
	border?: string
	padding?: number
	heading?: string
	description?: string
	activeTab?: string
	customer?: any
	storefront?: StorefrontContext
}

const TABS = [
	{ id: 'profile', label: 'Profile' },
	{ id: 'orders', label: 'Orders' },
	{ id: 'security', label: 'Security' }
]

export function AccountContent({
	backgroundColor = '#ffffff',
	borderRadius = 16,
	border = '1px solid rgba(226, 232, 240, 1)',
	padding = 32,
	heading = 'Account Overview',
	description = 'Manage your account details',
	activeTab = 'profile',
	customer,
	storefront
}: AccountContentProps) {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [tab, setTab] = useState(activeTab)

	useEffect(() => {
		const tabParam = searchParams.get('tab')
		if (tabParam) {
			setTab(tabParam)
		}
	}, [searchParams])

	const handleTabChange = (tabId: string) => {
		setTab(tabId)
		router.push(`?tab=${tabId}`, { scroll: false })
	}

	const renderContent = () => {
		switch (tab) {
			case 'profile':
				return <ProfileContent customer={customer} />
			case 'orders':
				return <OrdersContent storefront={storefront} />
			case 'security':
				return <SecurityContent />
			default:
				return <ProfileContent customer={customer} />
		}
	}

	return (
		<div className="space-y-6">
			{/* Mobile Tab Selector - Segmented Control */}
			<div className="lg:hidden">
				<div className="flex gap-2 p-1.5 bg-gray-100 rounded-xl w-full">
					{TABS.map((tabItem) => (
						<button
							key={tabItem.id}
							onClick={() => handleTabChange(tabItem.id)}
							className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
								tab === tabItem.id
									? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
									: 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
							}`}
						>
							{tabItem.label}
						</button>
					))}
				</div>
			</div>

			{/* Desktop Tab Navigation */}
			<div className="hidden lg:flex gap-6">
				{TABS.map((tabItem) => (
					<button
						key={tabItem.id}
						onClick={() => handleTabChange(tabItem.id)}
						className={`relative py-3 px-5 font-semibold text-sm transition-all rounded-xl ${
							tab === tabItem.id
								? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
								: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
						}`}
					>
						{tabItem.label}
					</button>
				))}
			</div>

			{/* Content Area */}
			<section className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm"
			>
				<AnimatePresence mode="wait">
					<motion.div
						key={tab}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						transition={{ duration: 0.2 }}
					>
						{renderContent()}
					</motion.div>
				</AnimatePresence>
			</section>
		</div>
	)
}
