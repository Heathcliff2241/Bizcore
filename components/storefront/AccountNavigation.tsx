interface AccountNavigationProps {
	sections?: string[]
	activeSection?: string
	backgroundColor?: string
	borderRadius?: number
	padding?: number
	heading?: string
}

const DEFAULT_SECTIONS = ['Profile', 'Orders', 'Addresses', 'Preferences']

export function AccountNavigation({
	sections = DEFAULT_SECTIONS,
	activeSection,
	backgroundColor = '#f8fafc',
	borderRadius = 12,
	padding = 24,
	heading = 'Account'
}: AccountNavigationProps) {
	const resolvedSections = sections.length > 0 ? sections : DEFAULT_SECTIONS
	const currentActive = activeSection ?? resolvedSections[0]

	return (
		<aside
			className="flex h-full w-full flex-col gap-4 border border-slate-200"
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

			<nav className="flex flex-col gap-2">
						{resolvedSections.map(section => {
							const isActive = section === currentActive
					return (
						<button
							key={section}
							type="button"
							className="rounded-lg px-3 py-2 text-left text-sm font-medium transition"
							style={{
								backgroundColor: isActive ? '#0f172a' : 'transparent',
								color: isActive ? '#ffffff' : '#1f2937'
							}}
						>
							{section}
						</button>
					)
				})}
			</nav>
		</aside>
	)
}
