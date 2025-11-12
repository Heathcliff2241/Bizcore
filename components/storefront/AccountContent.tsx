import Link from 'next/link'
import type { StorefrontContext } from './types'
import { resolveStorefrontHref } from './utils/links'

interface AccountSection {
	title: string
	description?: string
	href?: string
}

interface AccountContentProps {
	backgroundColor?: string
	borderRadius?: number
	border?: string
	padding?: number
	heading?: string
	description?: string
	sections?: AccountSection[]
	emptyState?: string
	storefront?: StorefrontContext
}

const DEFAULT_SECTIONS: AccountSection[] = [
	{
		title: 'Profile Details',
		description: 'Update your personal information and contact details.'
	},
	{
		title: 'Order History',
		description: 'Track past orders and download receipts.'
	},
	{
		title: 'Saved Addresses',
		description: 'Manage delivery locations for faster checkout.'
	}
]

export function AccountContent({
	backgroundColor = '#ffffff',
	borderRadius = 16,
	border = '1px solid rgba(226, 232, 240, 1)',
	padding = 32,
	heading = 'Account Overview',
	description = 'You are signed in as customer@example.com',
	sections = DEFAULT_SECTIONS,
	emptyState = 'Nothing to show here yet.',
	storefront
}: AccountContentProps) {
	const hasSections = sections.length > 0

	return (
		<section
			className="flex h-full w-full flex-col gap-6"
			style={{
				backgroundColor,
				borderRadius,
				border,
				padding
			}}
		>
			<header className="space-y-1">
				<h2 className="text-2xl font-semibold text-slate-900">{heading}</h2>
				<p className="text-sm text-slate-500">{description}</p>
			</header>

			{hasSections ? (
				<div className="grid gap-4 sm:grid-cols-2">
					{sections.map(section => {
						const resolved = section.href
							? resolveStorefrontHref(section.href, storefront)
							: null

						return (
							<article
								key={section.title}
								className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:shadow-sm"
							>
								<h3 className="text-base font-semibold text-slate-900">{section.title}</h3>
								{section.description && (
									<p className="mt-2 text-sm text-slate-500">{section.description}</p>
								)}
								{resolved && (
									resolved.isExternal ? (
										<a
											className="mt-4 inline-flex items-center text-sm font-medium text-slate-900 underline"
											href={resolved.href}
											target="_blank"
											rel="noopener noreferrer"
										>
											Manage
										</a>
									) : (
										<Link
											className="mt-4 inline-flex items-center text-sm font-medium text-slate-900 underline"
											href={resolved.href}
										>
											Manage
										</Link>
									)
								)}
							</article>
						)
					})}
				</div>
			) : (
				<div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-400">
					{emptyState}
				</div>
			)}
		</section>
	)
}
