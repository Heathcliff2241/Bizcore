'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface OnboardingStep {
  title: string
  description: string
  component: React.ReactNode
}

interface BusinessInfo {
  industry: string
  primaryColor: string
  secondaryColor: string
  logo: string
  description: string
  services: string[]
}

export default function OnboardingWizard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    industry: '',
    primaryColor: '#1e40af',
    secondaryColor: '#059669',
    logo: '',
    description: '',
    services: []
  })

  // Industry options with Apple-style design
  const industries = [
    { id: 'technology', name: 'Technology', icon: '💻', colors: { primary: '#007AFF', secondary: '#34C759' } },
    { id: 'healthcare', name: 'Healthcare', icon: '🏥', colors: { primary: '#FF3B30', secondary: '#007AFF' } },
    { id: 'finance', name: 'Finance', icon: '💰', colors: { primary: '#1D1D1F', secondary: '#FF9500' } },
    { id: 'retail', name: 'Retail', icon: '🛍️', colors: { primary: '#FF2D92', secondary: '#5856D6' } },
    { id: 'food', name: 'Food & Beverage', icon: '🍽️', colors: { primary: '#FF9500', secondary: '#FF3B30' } },
    { id: 'education', name: 'Education', icon: '🎓', colors: { primary: '#5856D6', secondary: '#007AFF' } },
    { id: 'consulting', name: 'Consulting', icon: '📊', colors: { primary: '#1D1D1F', secondary: '#34C759' } },
    { id: 'creative', name: 'Creative Services', icon: '🎨', colors: { primary: '#FF2D92', secondary: '#FF9500' } }
  ]

  const steps: OnboardingStep[] = [
    {
      title: 'Welcome to BrandStudio!',
      description: 'Let\'s customize your website to match your business perfectly.',
      component: <WelcomeStep />
    },
    {
      title: 'What industry are you in?',
      description: 'We\'ll customize your design based on your industry.',
      component: <IndustryStep 
        industries={industries}
        selected={businessInfo.industry}
        onSelect={(industry) => {
          const industryData = industries.find(i => i.id === industry)
          setBusinessInfo(prev => ({
            ...prev,
            industry,
            primaryColor: industryData?.colors.primary || prev.primaryColor,
            secondaryColor: industryData?.colors.secondary || prev.secondaryColor
          }))
        }}
      />
    },
    {
      title: 'Tell us about your business',
      description: 'Help us personalize your content.',
      component: <BusinessDetailsStep 
        info={businessInfo}
        onChange={setBusinessInfo}
      />
    },
    {
      title: 'Choose your colors',
      description: 'Pick colors that represent your brand.',
      component: <ColorStep 
        primaryColor={businessInfo.primaryColor}
        secondaryColor={businessInfo.secondaryColor}
        onChange={(primary, secondary) => 
          setBusinessInfo(prev => ({ ...prev, primaryColor: primary, secondaryColor: secondary }))
        }
      />
    },
    {
      title: 'You\'re all set!',
      description: 'Your website is ready. You can customize it anytime in BrandStudio.',
      component: <CompletionStep />
    }
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Apply customizations and redirect to BrandStudio
      applyCustomizations()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const applyCustomizations = async () => {
    try {
      await fetch('/api/tenant/customize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessInfo)
      })
      router.push('/brandstudio')
    } catch (error) {
      console.error('Failed to apply customizations:', error)
    }
  }

  if (!session) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden">
        {/* Progress Bar */}
        <div className="bg-gray-50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Setup Your Website</h1>
            <span className="text-sm text-gray-500">
              {currentStep + 1} of {steps.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {steps[currentStep].title}
            </h2>
            <p className="text-gray-600 text-lg">
              {steps[currentStep].description}
            </p>
          </div>

          <div className="mb-8">
            {steps[currentStep].component}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="px-6 py-3 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {currentStep === steps.length - 1 ? 'Launch My Website' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Step Components
function WelcomeStep() {
  return (
    <div className="text-center">
      <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl">🎉</span>
      </div>
      <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
        Congratulations! Your account is ready. We&apos;ve created a beautiful starter website for you. 
        Let&apos;s customize it to match your brand in just a few simple steps.
      </p>
    </div>
  )
}

interface Industry {
  id: string
  name: string
  icon: string
  colors: { primary: string; secondary: string }
}

function IndustryStep({ industries, selected, onSelect }: {
  industries: Industry[]
  selected: string
  onSelect: (industry: string) => void
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {industries.map((industry) => (
        <button
          key={industry.id}
          onClick={() => onSelect(industry.id)}
          className={`p-6 rounded-2xl border-2 transition-all hover:scale-105 ${
            selected === industry.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-4xl mb-3">{industry.icon}</div>
          <div className="text-sm font-medium text-gray-900">{industry.name}</div>
        </button>
      ))}
    </div>
  )
}

function BusinessDetailsStep({ info, onChange }: {
  info: BusinessInfo
  onChange: (info: BusinessInfo) => void
}) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Business Description
        </label>
        <textarea
          value={info.description}
          onChange={(e) => onChange({ ...info, description: e.target.value })}
          placeholder="Tell people what your business does..."
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Main Services (separate with commas)
        </label>
        <input
          type="text"
          value={info.services.join(', ')}
          onChange={(e) => onChange({ 
            ...info, 
            services: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
          })}
          placeholder="Web Design, Marketing, Consulting..."
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  )
}

function ColorStep({ primaryColor, secondaryColor, onChange }: {
  primaryColor: string
  secondaryColor: string
  onChange: (primary: string, secondary: string) => void
}) {
  const colorPresets = [
    { name: 'Ocean Blue', primary: '#007AFF', secondary: '#34C759' },
    { name: 'Sunset Orange', primary: '#FF9500', secondary: '#FF3B30' },
    { name: 'Royal Purple', primary: '#5856D6', secondary: '#FF2D92' },
    { name: 'Forest Green', primary: '#34C759', secondary: '#007AFF' },
    { name: 'Midnight Black', primary: '#1D1D1F', secondary: '#FF9500' },
    { name: 'Cherry Red', primary: '#FF3B30', secondary: '#5856D6' }
  ]

  return (
    <div className="space-y-8">
      {/* Color Presets */}
      <div>
        <h3 className="text-lg font-medium mb-4">Choose a color scheme</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {colorPresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onChange(preset.primary, preset.secondary)}
              className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                primaryColor === preset.primary 
                  ? 'border-gray-900 shadow-lg' 
                  : 'border-gray-200'
              }`}
            >
              <div className="flex space-x-2 mb-2">
                <div 
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: preset.primary }}
                />
                <div 
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: preset.secondary }}
                />
              </div>
              <div className="text-sm font-medium">{preset.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Colors */}
      <div>
        <h3 className="text-lg font-medium mb-4">Or pick custom colors</h3>
        <div className="flex space-x-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Color
            </label>
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => onChange(e.target.value, secondaryColor)}
              className="w-20 h-12 border border-gray-300 rounded-lg cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secondary Color
            </label>
            <input
              type="color"
              value={secondaryColor}
              onChange={(e) => onChange(primaryColor, e.target.value)}
              className="w-20 h-12 border border-gray-300 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function CompletionStep() {
  return (
    <div className="text-center">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl">✨</span>
      </div>
      <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto mb-6">
        Perfect! We&apos;ve customized your website with your brand colors and content. 
        Your professional website is now live and ready for visitors.
      </p>
      <div className="bg-gray-50 rounded-xl p-6 max-w-md mx-auto">
        <h4 className="font-medium mb-2">What&apos;s next?</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Edit any page in BrandStudio</li>
          <li>• Add your products or services</li>
          <li>• Customize colors and fonts</li>
          <li>• Set up your custom domain</li>
        </ul>
      </div>
    </div>
  )
}