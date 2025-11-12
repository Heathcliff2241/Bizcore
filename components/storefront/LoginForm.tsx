interface LoginFormProps {
	fields?: string[]
	submitText?: string
	showForgotPassword?: boolean
	showSignUpLink?: boolean
	note?: string
}

const DEFAULT_FIELDS = ['email', 'password'] as const

const LABELS: Record<string, string> = {
	email: 'Email address',
	password: 'Password'
}

const TYPES: Record<string, string> = {
	email: 'email',
	password: 'password'
}

export function LoginForm({
	fields = Array.from(DEFAULT_FIELDS),
	submitText = 'Sign In',
	showForgotPassword = true,
	showSignUpLink = true,
	note
}: LoginFormProps) {
	return (
		<form className="flex flex-col gap-4">
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

			{showForgotPassword && (
				<div className="text-right text-xs">
					<a className="font-medium text-slate-500 hover:text-slate-700" href="#">
						Forgot your password?
					</a>
				</div>
			)}

			<button
				type="submit"
				className="mt-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
			>
				{submitText}
			</button>

			{showSignUpLink && (
				<p className="text-center text-xs text-slate-500">
					Don&apos;t have an account?{' '}
					<a className="font-medium text-slate-900" href="#">
						Sign up
					</a>
				</p>
			)}

			{note && <p className="text-center text-xs text-slate-400">{note}</p>}
		</form>
	)
}
