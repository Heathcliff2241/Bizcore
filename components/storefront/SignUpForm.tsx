interface SignUpFormProps {
	fields?: string[]
	submitText?: string
	showLoginLink?: boolean
	requireTerms?: boolean
}

const DEFAULT_FIELDS = ['firstName', 'lastName', 'email', 'password', 'confirmPassword'] as const

const LABELS: Record<string, string> = {
	firstName: 'First name',
	lastName: 'Last name',
	email: 'Email address',
	password: 'Password',
	confirmPassword: 'Confirm password'
}

const TYPES: Record<string, string> = {
	email: 'email',
	password: 'password',
	confirmPassword: 'password'
}

export function SignUpForm({
	fields = Array.from(DEFAULT_FIELDS),
	submitText = 'Create Account',
	showLoginLink = true,
	requireTerms = true
}: SignUpFormProps) {
	const twoColumn = fields.length > 3

	return (
		<form className="flex flex-col gap-4">
			<div className={`grid gap-4 ${twoColumn ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
				{fields.map(field => (
					<div key={field} className="flex flex-col gap-1">
						<label className="text-sm font-medium text-slate-700" htmlFor={field}>
							{LABELS[field] ?? field}
						</label>
						<input
							id={field}
							type={TYPES[field] ?? 'text'}
							placeholder={`Enter your ${field}`}
							className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
						/>
					</div>
				))}
			</div>

			{requireTerms && (
				<label className="flex items-center gap-2 text-xs text-slate-500">
					<input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
					<span>I agree to the Terms of Service and Privacy Policy.</span>
				</label>
			)}

			<button
				type="submit"
				className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
			>
				{submitText}
			</button>

			{showLoginLink && (
				<p className="text-center text-xs text-slate-500">
					Already have an account?{' '}
					<a className="font-medium text-slate-900" href="#">
						Sign in
					</a>
				</p>
			)}
		</form>
	)
}
