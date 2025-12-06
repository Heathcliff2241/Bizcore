'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import type { StorefrontContext } from './types'
import { ProfileContent } from './account/ProfileContent'
import { OrdersContent } from './account/OrdersContent'
import { AddressesContent } from './account/AddressesContent'

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

export function AccountContent({
	backgroundColor = '#ffffff',
	borderRadius = 16,
	border = '1px solid rgba(226, 232, 240, 1)',
	padding = 32,
	heading = 'Account Overview',
	description = 'You are signed in as customer@example.com',
	activeTab = 'profile',
	customer,
	storefront
}: AccountContentProps) {
	const searchParams = useSearchParams()
	const [tab, setTab] = useState(activeTab)

	useEffect(() => {
		const tabParam = searchParams.get('tab')
		if (tabParam) {
			setTab(tabParam)
		}
	}, [searchParams])

	const renderContent = () => {
		switch (tab) {
			case 'profile':
				return <ProfileContent customer={customer} />
			case 'orders':
				return <OrdersContent storefront={storefront} />
			case 'addresses':
				return <AddressesContent customer={customer} />
			default:
				return <ProfileContent customer={customer} />
		}
	}

	return (
		<section
			className="flex flex-col gap-6 w-full"
			style={{
				backgroundColor,
				borderRadius,
				border,
				padding
			}}
		>
			<header className="space-y-1 pb-4 border-b border-slate-200">
				<h2 className="text-2xl font-semibold text-slate-900">{heading}</h2>
				<p className="text-sm text-slate-500">{description}</p>
			</header>

			<div>
				{renderContent()}
			</div>
		</section>
	)
}
