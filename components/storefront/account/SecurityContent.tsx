/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, AlertTriangle, CheckCircle, XCircle, Circle, Loader2, ShieldCheck } from 'lucide-react'

interface SecurityError {
	field?: string
	message: string
}

export function SecurityContent() {
	const [formData, setFormData] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: ''
	})
	const [errors, setErrors] = useState<SecurityError[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [successMessage, setSuccessMessage] = useState('')

	const validateForm = () => {
		const newErrors: SecurityError[] = []

		if (!formData.currentPassword) {
			newErrors.push({ field: 'currentPassword', message: 'Current password is required' })
		}

		if (!formData.newPassword) {
			newErrors.push({ field: 'newPassword', message: 'New password is required' })
		}

		if (formData.newPassword.length < 8) {
			newErrors.push({ field: 'newPassword', message: 'Password must be at least 8 characters' })
		}

		if (formData.newPassword !== formData.confirmPassword) {
			newErrors.push({ field: 'confirmPassword', message: 'Passwords do not match' })
		}

		if (formData.currentPassword === formData.newPassword) {
			newErrors.push({ message: 'New password must be different from current password' })
		}

		setErrors(newErrors)
		return newErrors.length === 0
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!validateForm()) return

		setIsLoading(true)
		setSuccessMessage('')

		try {
			// TODO: Wire up to /api/customer/change-password endpoint
			const response = await fetch('/api/customer/change-password', {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					currentPassword: formData.currentPassword,
					newPassword: formData.newPassword
				})
			})

			if (!response.ok) {
				const data = await response.json()
				setErrors([{ message: data.error || 'Failed to change password' }])
				return
			}

			setSuccessMessage('Password changed successfully!')
			setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
		} catch (error) {
			setErrors([{ message: 'An error occurred. Please try again.' }])
		} finally {
			setIsLoading(false)
		}
	}

	const getFieldError = (fieldName: string) => {
		return errors.find((e) => e.field === fieldName)?.message
	}

	return (
		<div className="max-w-2xl">
			<div className="mb-8">
				<h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
					<Lock className="w-6 h-6 text-gray-900" />
					Security Settings
				</h3>
				<p className="text-sm text-gray-600">
					Keep your account secure by using a strong, unique password
				</p>
			</div>

			{/* Error Messages */}
			{errors.length > 0 && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg"
				>
					<div className="flex items-start gap-3">
						<AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
						<div className="flex-1">
							{errors.map((error, idx) => (
								<p key={idx} className="text-sm text-red-700 font-medium">
									{error.message}
								</p>
							))}
						</div>
					</div>
				</motion.div>
			)}

			{/* Success Message */}
			{successMessage && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-lg"
				>
					<div className="flex items-start gap-3">
						<CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
						<p className="text-sm text-emerald-700 font-medium">{successMessage}</p>
					</div>
				</motion.div>
			)}

			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
					{/* Current Password */}
					<div>
						<label className="block text-sm font-semibold text-gray-900 mb-2">
							Current Password
						</label>
						<input
							type="password"
							value={formData.currentPassword}
							onChange={(e) =>
								setFormData({ ...formData, currentPassword: e.target.value })
							}
							className={`w-full px-4 py-3 border rounded-xl bg-white text-gray-900 placeholder-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 shadow-sm ${
								getFieldError('currentPassword')
									? 'border-red-300 focus:ring-red-500'
									: 'border-gray-300 focus:ring-blue-500'
							}`}
							placeholder="Enter your current password"
						/>
						{getFieldError('currentPassword') && (
							<p className="mt-2 text-xs text-red-600 flex items-center gap-1">
								<XCircle className="w-3 h-3" />
								{getFieldError('currentPassword')}
							</p>
						)}
					</div>

					{/* New Password */}
					<div className="mt-6">
						<label className="block text-sm font-semibold text-gray-900 mb-2">
							New Password
						</label>
						<input
							type="password"
							value={formData.newPassword}
							onChange={(e) =>
								setFormData({ ...formData, newPassword: e.target.value })
							}
							className={`w-full px-4 py-3 border rounded-xl bg-white text-gray-900 placeholder-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 shadow-sm ${
								getFieldError('newPassword')
									? 'border-red-300 focus:ring-red-500'
									: 'border-gray-300 focus:ring-blue-500'
							}`}
							placeholder="Enter a strong password"
						/>
						{getFieldError('newPassword') && (
							<p className="mt-2 text-xs text-red-600 flex items-center gap-1">
								<XCircle className="w-3 h-3" />
								{getFieldError('newPassword')}
							</p>
						)}
						<div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
							<p className="text-xs text-blue-800 font-medium mb-2">Password must include:</p>
							<ul className="text-xs text-blue-700 space-y-1">
								<li className="flex items-center gap-2">
									{formData.newPassword.length >= 8 ? (
										<CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
									) : (
										<Circle className="w-3.5 h-3.5 text-gray-400" />
									)}
									At least 8 characters
								</li>
								<li className="flex items-center gap-2">
									{/[A-Z]/.test(formData.newPassword) ? (
										<CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
									) : (
										<Circle className="w-3.5 h-3.5 text-gray-400" />
									)}
									One uppercase letter
								</li>
								<li className="flex items-center gap-2">
									{/[a-z]/.test(formData.newPassword) ? (
										<CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
									) : (
										<Circle className="w-3.5 h-3.5 text-gray-400" />
									)}
									One lowercase letter
								</li>
								<li className="flex items-center gap-2">
									{/[0-9]/.test(formData.newPassword) ? (
										<CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
									) : (
										<Circle className="w-3.5 h-3.5 text-gray-400" />
									)}
									One number
								</li>
							</ul>
						</div>
					</div>

					{/* Confirm Password */}
					<div className="mt-6">
						<label className="block text-sm font-semibold text-gray-900 mb-2">
							Confirm New Password
						</label>
						<input
							type="password"
							value={formData.confirmPassword}
							onChange={(e) =>
								setFormData({ ...formData, confirmPassword: e.target.value })
							}
							className={`w-full px-4 py-3 border rounded-xl bg-white text-gray-900 placeholder-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 shadow-sm ${
								getFieldError('confirmPassword')
									? 'border-red-300 focus:ring-red-500'
									: 'border-gray-300 focus:ring-blue-500'
							}`}
							placeholder="Re-enter your new password"
						/>
						{getFieldError('confirmPassword') && (
							<p className="mt-2 text-xs text-red-600 flex items-center gap-1">
								<XCircle className="w-3 h-3" />
								{getFieldError('confirmPassword')}
							</p>
						)}
						{formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
							<p className="mt-2 text-xs text-emerald-600 flex items-center gap-1 font-medium">
								<CheckCircle className="w-3 h-3" />
								Passwords match
							</p>
						)}
					</div>
				</div>

				{/* Submit Button */}
				<button
					type="submit"
					disabled={isLoading}
					className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
				>
					{isLoading ? (
						<><Loader2 className="w-5 h-5 animate-spin" /> Updating Password...</>
					) : (
						<><ShieldCheck className="w-5 h-5" /> Update Password</>
					)}
				</button>
			</form>

			<div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
				<p className="text-xs text-gray-600 text-center flex items-center justify-center gap-2">
					<Lock className="w-3.5 h-3.5" />
					Your password is encrypted and never stored in plain text
				</p>
			</div>
		</div>
	)
}
