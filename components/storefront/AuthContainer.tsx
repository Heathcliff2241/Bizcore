interface AuthContainerProps {
	backgroundColor?: string
	borderRadius?: number
	border?: string
	padding?: number
	shadow?: string
}

export function AuthContainer({
	backgroundColor = '#ffffff',
	borderRadius = 16,
	border = '1px solid rgba(226, 232, 240, 1)',
	padding = 36,
	shadow = '0 16px 40px -20px rgba(15, 23, 42, 0.35)'
}: AuthContainerProps) {
	return (
		<div
			className="h-full w-full"
			style={{
				backgroundColor,
				borderRadius,
				border,
				padding,
				boxShadow: shadow
			}}
		/>
	)
}
