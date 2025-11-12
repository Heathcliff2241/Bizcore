interface SummaryLine {
	label: string
	value: number
}

interface CheckoutSummaryProps {
	subtotal?: number
	tax?: number
	shipping?: number
	discount?: number
	currency?: string
	backgroundColor?: string
	borderRadius?: number
	border?: string
	padding?: number
	buttonLabel?: string
	note?: string
}

export function CheckoutSummary({
	subtotal,
	tax,
	shipping,
	discount,
	currency = '$',
	backgroundColor = '#ffffff',
	borderRadius = 8,
	border = '1px solid #e2e8f0',
	padding = 24,
	buttonLabel = 'Proceed to Checkout',
	note = 'Shipping and taxes calculated at checkout.'
}: CheckoutSummaryProps) {
	const fallbackSubtotal = 24.25
	const finalSubtotal = subtotal ?? fallbackSubtotal
	const finalTax = tax ?? Number((finalSubtotal * 0.08).toFixed(2))
	const finalShipping = shipping ?? 4.5
	const finalDiscount = discount ?? 0
	const total = finalSubtotal + finalTax + finalShipping - finalDiscount

	const breakdown: SummaryLine[] = [
		{ label: 'Subtotal', value: finalSubtotal },
		{ label: 'Tax', value: finalTax },
		{ label: 'Shipping', value: finalShipping }
	]

	if (finalDiscount > 0) {
		breakdown.push({ label: 'Discount', value: -finalDiscount })
	}

	return (
		<aside
			className="w-full h-full flex flex-col gap-4"
			style={{
				backgroundColor,
				borderRadius,
				border,
				padding
			}}
		>
			<div className="space-y-4">
				<h3 className="text-xl font-semibold text-gray-900">Order Summary</h3>

				<div className="space-y-2">
					{breakdown.map((line) => (
						<div key={line.label} className="flex justify-between text-sm text-gray-600">
							<span>{line.label}</span>
							<span>{currency}{line.value.toFixed(2)}</span>
						</div>
					))}
				</div>

				<div className="border-t border-gray-200 pt-4 mt-4 flex justify-between items-center">
					<span className="text-base font-semibold text-gray-900">Total</span>
					<span className="text-2xl font-bold text-gray-900">
						{currency}{total.toFixed(2)}
					</span>
				</div>
			</div>

			<button
				type="button"
				className="w-full bg-gray-900 text-white py-3 rounded-md text-sm font-semibold tracking-wide hover:bg-gray-800 transition-colors"
			>
				{buttonLabel}
			</button>

			{note && <p className="text-xs text-gray-500">{note}</p>}
		</aside>
	)
}
