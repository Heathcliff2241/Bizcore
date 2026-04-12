/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import EmailVerificationStep from '@/components/onboarding/EmailVerificationStep'
import {
  SparklesIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  CheckCircleIcon,
  TagIcon,
  CogIcon,
  ShoppingCartIcon,
  ArchiveBoxIcon,
  CreditCardIcon,
  // PaintBrushIcon - removed (BrandStudio)
  BarChart3Icon
} from '@heroicons/react/24/outline'

interface OnboardingStep {
  title: string
  description: string
  component: React.ReactNode
}

interface BusinessInfo {
  email: string
  verificationToken: string
  businessName: string
  subdomain: string
  industry: string
  description: string
  services: string[]
  branchName: string
  branchAddress: string
  openingTime: string
  closingTime: string
  taxPercent: number
}

export default function OnboardingWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    email: '',
    verificationToken: '',
    businessName: '',
    subdomain: '',
    industry: '',
    description: '',
    services: [],
    branchName: 'Main Branch',
    branchAddress: '',
    openingTime: '09:00',
    closingTime: '18:00',
    taxPercent: 0
  })

  // Load saved state
  useEffect(() => {
    const savedStep = localStorage.getItem('onboarding_step')
    const savedInfo = localStorage.getItem('onboarding_info')
    if (savedStep) setCurrentStep(parseInt(savedStep, 10))
    if (savedInfo) {
      try { setBusinessInfo(JSON.parse(savedInfo)) } catch {}
    }
    setIsLoading(false)
  }, [])

  // Persist state
  useEffect(() => {
    localStorage.setItem('onboarding_step', currentStep.toString())
    localStorage.setItem('onboarding_info', JSON.stringify(businessInfo))
  }, [currentStep, businessInfo])

  // BizCore onboarding steps
  const steps: OnboardingStep[] = [
    {
      title: 'Verify Email',
      description: 'Verify your email address to get started.',
      component: (
        <EmailVerificationStep
          onSuccess={(email, token, businessName) => {
            setBusinessInfo(prev => ({
              ...prev,
              email,
              verificationToken: token,
              businessName
            }))
            handleNext()
          }}
          onError={(error) => console.error('Verification error:', error)}
        />
      )
    },
    { title: 'Welcome to BizCore', description: 'Manage your business operations efficiently.', component: <WelcomeStep /> },
    { title: "Business Profile", description: 'Enter your business information.', component: <BusinessProfileStep info={businessInfo} onChange={setBusinessInfo} /> },
    { title: 'Branch Setup', description: 'Create your main branch.', component: <BranchSetupStep info={businessInfo} onChange={setBusinessInfo} /> },
    { title: 'Products & Categories', description: 'Add initial products to your POS.', component: <ProductsStep info={businessInfo} onChange={setBusinessInfo} /> },
    { title: 'Optional: Inventory & Staff', description: 'Add stock or staff if available.', component: <InventoryStaffStep /> },
    { title: 'System Preferences', description: 'Set tax and operational defaults.', component: <PreferencesStep info={businessInfo} onChange={setBusinessInfo} /> },
    { title: 'All Set!', description: 'Your BizCore system is ready.', component: <CompletionStep info={businessInfo} /> }
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1)
    else applyOnboarding()
  }
  const handleBack = () => currentStep > 0 && setCurrentStep(currentStep - 1)

  // Finalize onboarding
  const applyOnboarding = async () => {
    setIsLoading(true)
    try {
      // Validate required fields
      if (!businessInfo.email || !businessInfo.verificationToken) {
        alert('Email verification required. Please go back to Step 1.')
        setIsLoading(false)
        setCurrentStep(0)
        return
      }

      if (!businessInfo.businessName.trim() || !businessInfo.subdomain.trim()) {
        alert('Business name and subdomain are required.')
        setIsLoading(false)
        return
      }

      // Transform services array into products array for API
      const products = businessInfo.services
        .filter(service => service.trim().length > 0)
        .map(service => ({
          name: service,
          price: 0,
          cost: 0,
          description: ''
        }))

      // Prepare submission data
      const submissionData = {
        ...businessInfo,
        products // Replace services with products
      }
      
      delete (submissionData as any).services // Remove services field

      // Submit to API
      const response = await fetch('/api/onboarding/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Onboarding failed. Please try again.')
        setIsLoading(false)
        return
      }

      const data = await response.json()

      // Store session token and redirect
      if (data.sessionToken) {
        localStorage.setItem('auth_token', data.sessionToken)
        localStorage.setItem('tenant', JSON.stringify(data.tenant))
      }

      localStorage.removeItem('onboarding_step')
      localStorage.removeItem('onboarding_info')

      // Redirect to dashboard
      router.push(data.redirectUrl || `/dashboard/${businessInfo.subdomain}`)
    } catch (err) {
      console.error('Onboarding failed:', err)
      alert('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  if (isLoading) return <LoadingSpinner />

  const isStepValid =
    (currentStep === 0 && businessInfo.email && businessInfo.verificationToken) ||
    (currentStep === 1) ||
    (currentStep === 2 && businessInfo.businessName.trim() !== '' && businessInfo.subdomain.trim() !== '') ||
    (currentStep === 3 && businessInfo.branchName.trim() !== '') ||
    currentStep >= 4

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/40 to-white overflow-x-hidden relative">
      {/* Dark blue gradient accent overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-5 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-transparent to-indigo-900" />
      </div>

      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <motion.div
          animate={{ x: [-60, 60, -60], y: [0, 30, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute rounded-full opacity-10 left-0 top-0 w-96 h-96 blur-3xl bg-gradient-to-br from-blue-600 to-blue-400"
        />
        <motion.div
          animate={{ x: [60, -60, 60], y: [0, -30, 0] }}
          transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-80 h-80 rounded-full opacity-8 right-0 top-1/3 blur-3xl bg-gradient-to-br from-blue-700 to-indigo-600"
        />
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-3xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-12 text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900">BizCore</h1>
            </div>
            <p className="text-blue-700 text-lg">Let&apos;s set up your business</p>
          </motion.div>

          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-10"
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-semibold text-blue-700">Step {currentStep + 1} of {steps.length}</span>
              <span className="text-sm text-blue-600">{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-700"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </motion.div>

          {/* Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-3xl shadow-xl border border-blue-100/50 overflow-hidden p-8 md:p-12"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="mb-10">
                  <motion.h2
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="text-3xl md:text-4xl font-bold text-blue-900 mb-3"
                  >
                    {steps[currentStep].title}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                    className="text-lg text-blue-700"
                  >
                    {steps[currentStep].description}
                  </motion.p>
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="mb-12"
                >
                  {steps[currentStep].component}
                </motion.div>
              </motion.div>

              {/* Navigation */}
              <div className="flex items-center justify-between border-t border-blue-100/50 pt-8">
                <motion.button
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  whileHover={{ x: -4 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed hover:text-blue-700 transition"
                >
                  <ChevronLeftIcon className="w-5 h-5" /> Back
                </motion.button>
                <motion.button
                  onClick={handleNext}
                  disabled={!isStepValid}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:from-blue-500 hover:to-indigo-600 transition shadow-lg hover:shadow-blue-500/40"
                >
                  {currentStep === steps.length - 1 ? 'Go to Dashboard' : 'Continue'}
                  {currentStep < steps.length - 1 && <ChevronRightIcon className="w-5 h-5" />}
                </motion.button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// Loading Spinner
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50/40 to-white">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"
        />
        <p className="text-blue-700">Setting up your BizCore...</p>
      </div>
    </div>
  )
}

// Steps components

function WelcomeStep() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="text-center space-y-8 py-6"
    >
      {/* Trial Activated Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl"
      >
        <p className="text-green-700 font-bold text-lg mb-1">✓ Free Trial Activated!</p>
        <p className="text-green-600">You now have 14 days to explore all features at no cost</p>
      </motion.div>

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center"
      >
        <SparklesIcon className="w-10 h-10 text-white" />
      </motion.div>
      <div>
        <h3 className="text-2xl font-bold text-blue-900 mb-3">Welcome to BizCore</h3>
        <p className="text-blue-700 text-lg leading-relaxed">
          An all-in-one platform to manage POS, inventory, and online ordering. Let&apos;s get your system ready in just a few minutes.
        </p>
      </div>
      <div className="pt-6 grid grid-cols-2 gap-4">
        {[
          { Icon: CreditCardIcon, label: 'POS System' },
          { Icon: ShoppingCartIcon, label: 'Online Ordering' },
          { Icon: ArchiveBoxIcon, label: 'Inventory' },
          { Icon: BarChart3Icon, label: 'Analytics' }
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="p-4 rounded-xl bg-blue-50 border border-blue-200"
          >
            <item.Icon className="w-8 h-8 mb-2 text-blue-600" />
            <p className="text-base font-medium text-blue-700">{item.label}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function BusinessProfileStep({ info, onChange }: { info: BusinessInfo; onChange: (info: BusinessInfo) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-semibold text-blue-900 mb-2">Business Name *</label>
        <motion.input
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          type="text"
          value={info.businessName}
          onChange={(e) => onChange({ ...info, businessName: e.target.value })}
          placeholder="e.g., The Coffee House"
          className="w-full px-4 py-3 bg-white border border-blue-200 rounded-lg text-blue-900 placeholder:text-blue-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500/30"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-blue-900 mb-2">Subdomain *</label>
        <motion.input
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          type="text"
          value={info.subdomain}
          onChange={(e) => onChange({ ...info, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
          placeholder="e.g., coffeehouse"
          className="w-full px-4 py-3 bg-white border border-blue-200 rounded-lg text-blue-900 placeholder:text-blue-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500/30"
        />
        <p className="text-blue-600 text-xs mt-1">3-30 characters, alphanumeric and hyphens only. This will be your store&apos;s URL.</p>
      </div>
      <div>
        <label className="block text-sm font-semibold text-blue-900 mb-2">Industry</label>
        <motion.input
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          type="text"
          value={info.industry}
          onChange={(e) => onChange({ ...info, industry: e.target.value })}
          placeholder="e.g., Food & Beverage"
          className="w-full px-4 py-3 bg-white border border-blue-200 rounded-lg text-blue-900 placeholder:text-blue-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500/30"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-blue-900 mb-2">Description</label>
        <motion.textarea
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          value={info.description}
          onChange={(e) => onChange({ ...info, description: e.target.value })}
          placeholder="Tell us about your business..."
          rows={3}
          className="w-full px-4 py-3 bg-white border border-blue-200 rounded-lg text-blue-900 placeholder:text-blue-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500/30"
        />
      </div>
    </motion.div>
  )
}

function BranchSetupStep({ info, onChange }: { info: BusinessInfo; onChange: (info: BusinessInfo) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-semibold text-blue-900 mb-2">Branch Name *</label>
        <motion.input
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          type="text"
          value={info.branchName}
          onChange={(e) => onChange({ ...info, branchName: e.target.value })}
          placeholder="e.g., Main Branch"
          className="w-full px-4 py-3 bg-white border border-blue-200 rounded-lg text-blue-900 placeholder:text-blue-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500/30"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-blue-900 mb-2">Address</label>
        <motion.input
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          type="text"
          value={info.branchAddress}
          onChange={(e) => onChange({ ...info, branchAddress: e.target.value })}
          placeholder="Enter branch address"
          className="w-full px-4 py-3 bg-white border border-blue-200 rounded-lg text-blue-900 placeholder:text-blue-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500/30"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-blue-900 mb-2">Opening Time</label>
          <motion.input
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            type="time"
            value={info.openingTime}
            onChange={(e) => onChange({ ...info, openingTime: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-blue-200 rounded-lg text-blue-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500/30"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-blue-900 mb-2">Closing Time</label>
          <motion.input
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            type="time"
            value={info.closingTime}
            onChange={(e) => onChange({ ...info, closingTime: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-blue-200 rounded-lg text-blue-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500/30"
          />
        </div>
      </div>
    </motion.div>
  )
}

function ProductsStep({ info, onChange }: { info: BusinessInfo; onChange: (info: BusinessInfo) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <p className="text-blue-700 mb-4">Add up to 5 products or services</p>
      <div className="space-y-3">
        {info.services.map((service, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.06 }}
            className="flex gap-2 items-center"
          >
            <TagIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <input
              type="text"
              value={service}
              onChange={(e) => {
                const newServices = [...info.services]
                newServices[idx] = e.target.value
                onChange({ ...info, services: newServices })
              }}
              placeholder={`Product/Service ${idx + 1}`}
              className="flex-1 px-4 py-3 bg-white border border-blue-200 rounded-lg text-blue-900 placeholder:text-blue-400 focus:outline-none focus:border-blue-600"
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange({ ...info, services: info.services.filter((_, i) => i !== idx) })}
              className="px-3 py-2 text-red-600 hover:text-red-700 transition font-semibold"
            >
              ×
            </motion.button>
          </motion.div>
        ))}
      </div>
      {info.services.length < 5 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ x: 4 }}
          onClick={() => onChange({ ...info, services: [...info.services, ''] })}
          className="text-blue-600 hover:text-blue-700 font-semibold mt-4 transition"
        >
          + Add Product
        </motion.button>
      )}
    </motion.div>
  )
}

function InventoryStaffStep() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="text-center py-8"
    >
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
        <CogIcon className="w-8 h-8 text-blue-600" />
      </div>
      <p className="text-blue-900 text-lg">
        Optional inventory & staff setup can be done later in the dashboard.
      </p>
      <p className="text-blue-600 text-sm mt-3">You can add staff accounts and manage inventory anytime.</p>
    </motion.div>
  )
}

function PreferencesStep({ info, onChange }: { info: BusinessInfo; onChange: (info: BusinessInfo) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-semibold text-blue-900 mb-3">Default Tax Rate (%)</label>
        <motion.input
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={info.taxPercent}
          onChange={(e) => onChange({ ...info, taxPercent: parseFloat(e.target.value) || 0 })}
          placeholder="12"
          className="w-full max-w-xs px-4 py-3 bg-white border border-blue-200 rounded-lg text-blue-900 placeholder:text-blue-400 focus:outline-none focus:border-blue-600"
        />
        <p className="text-blue-600 text-sm mt-2">This can be changed later for individual items.</p>
      </div>
    </motion.div>
  )
}

function CompletionStep({ info }: { info: BusinessInfo }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="text-center space-y-8 py-6"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.2, repeat: Infinity }}
        className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center"
      >
        <CheckCircleIcon className="w-10 h-10 text-white" />
      </motion.div>
      <div>
        <h3 className="text-3xl font-bold text-blue-900 mb-2">
          Welcome, {info.businessName || 'BizCore'}!
        </h3>
        <p className="text-blue-700 text-lg">Your system is all set up and ready to go.</p>
      </div>

      {/* Trial Countdown Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl"
      >
        <p className="text-green-700 font-bold text-lg mb-1">14-Day Free Trial</p>
        <p className="text-green-600 text-sm">Explore all premium features at no cost. No credit card required.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="pt-6 space-y-2 text-blue-700"
      >
        <p className="text-sm flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-600" /> Business profile created</p>
        <p className="text-sm flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-600" /> Branch setup complete</p>
        <p className="text-sm flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-600" /> Products configured</p>
        <p className="text-sm flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-600" /> System ready to use</p>
        <p className="text-sm flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-600" /> 14-day trial activated</p>
      </motion.div>
    </motion.div>
  )
}