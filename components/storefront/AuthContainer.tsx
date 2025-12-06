import React from 'react'

interface AuthContainerProps {
	backgroundColor?: string
	borderRadius?: number
	border?: string
	padding?: number
	shadow?: string
	className?: string
	children?: React.ReactNode
}

export function AuthContainer({
	backgroundColor = '#ffffff',
	borderRadius = 16,
	border = '1px solid rgba(226, 232, 240, 1)',
	padding = 36,
	shadow = '0 16px 40px -20px rgba(15, 23, 42, 0.35)',
	className = '',
	children
}: AuthContainerProps) {
	return (
		<div className={`w-full flex items-center justify-center ${className}`}>
			<div
				className="w-full max-w-md"
				style={{
					backgroundColor,
					borderRadius,
					border,
					padding,
					boxShadow: shadow
				}}
			>
				{children}
			</div>
		</div>
	)
}
