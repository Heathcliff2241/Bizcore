'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ProratedPrice } from '@/lib/proration';

interface Theme {
  primary: string;
  secondary: string;
  accent?: string;
  background?: string;
  surface?: string;
  text?: string;
}

interface DowngradeWarningModalProps {
  isOpen: boolean;
  currentPlan: { name: string; features?: Record<string, unknown> };
  newPlan: { name: string; features?: Record<string, unknown> };
  proration: ProratedPrice;
  onConfirm: (effectiveDate: Date) => Promise<void>;
  onCancel: () => void;
  theme?: Theme;
}

export function DowngradeWarningModal({
  isOpen,
  currentPlan,
  newPlan,
  proration,
  onConfirm,
  onCancel,
  theme = {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#6366F1',
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#111827',
  },
}: DowngradeWarningModalProps) {
  const [step, setStep] = useState<'warning' | 'schedule'>('warning');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [effectiveDate, setEffectiveDate] = useState<'immediate' | 'endOfCycle'>('endOfCycle');

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const date =
        effectiveDate === 'immediate'
          ? new Date()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await onConfirm(date);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Downgrade failed');
      setIsLoading(false);
    }
  };

  // Identify features that will be lost
  const currentFeatures = (currentPlan.features as Record<string, unknown>) || {};
  const newFeatures = (newPlan.features as Record<string, unknown>) || {};
  const lostFeatures = Object.entries(currentFeatures).filter(
    ([key, value]) =>
      !newFeatures[key] ||
      (typeof value === 'string' && value === 'Unlimited' && newFeatures[key] !== 'Unlimited')
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6" style={{ borderBottom: `1px solid ${theme.primary}20`, backgroundColor: `${theme.accent}15` }}>
              <h2 className="text-xl font-semibold" style={{ color: theme.text }}>
                {step === 'warning' ? 'Downgrade Notice' : 'Schedule Downgrade'}
              </h2>
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="disabled:opacity-50"
                style={{ color: `${theme.text}66` }}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {step === 'warning' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  {/* Warning message */}
                  <div className="flex gap-3 rounded-lg p-4" style={{ backgroundColor: `${theme.accent}15`, border: `1px solid ${theme.accent}40` }}>
                    <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme.accent }} />
                    <div>
                      <p className="font-medium" style={{ color: theme.text }}>You&rsquo;re about to downgrade</p>
                      <p className="text-sm mt-1" style={{ color: `${theme.text}88` }}>
                        Some features will no longer be available on the {newPlan.name} plan.
                      </p>
                    </div>
                  </div>

                  {/* Features being lost */}
                  {lostFeatures.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-3" style={{ color: theme.text }}>You&rsquo;ll lose access to:</p>
                      <ul className="space-y-2">
                        {lostFeatures.map(([key]) => (
                          <li key={key} className="flex items-center text-sm" style={{ color: `${theme.text}88` }}>
                            <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: theme.accent }} />
                            {key.replace(/_/g, ' ').charAt(0).toUpperCase() +
                              key.replace(/_/g, ' ').slice(1)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Credit info */}
                  {proration.creditApplied > 0 && (
                    <div className="rounded-lg p-4" style={{ backgroundColor: `${theme.secondary}15`, border: `1px solid ${theme.secondary}40` }}>
                      <p className="text-sm font-medium mb-1" style={{ color: theme.text }}>You&rsquo;ll receive a credit</p>
                      <p className="text-lg font-semibold" style={{ color: theme.secondary }}>
                        ₱{proration.creditApplied.toFixed(2)}
                      </p>
                      <p className="text-sm mt-2" style={{ color: `${theme.text}77` }}>{proration.description}</p>
                    </div>
                  )}

                  {/* Error message */}
                  {error && (
                    <div className="rounded-lg p-3" style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca' }}>
                      <p className="text-sm" style={{ color: '#b91c1c' }}>{error}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {step === 'schedule' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <p className="text-sm text-slate-600">When should this downgrade take effect?</p>

                  <div className="space-y-3">
                    <label className="flex items-center p-3 rounded-lg cursor-pointer" style={{ border: `1px solid ${theme.primary}40`, backgroundColor: effectiveDate === 'immediate' ? `${theme.primary}10` : 'transparent' }}>
                      <input
                        type="radio"
                        name="effectiveDate"
                        value="immediate"
                        checked={effectiveDate === 'immediate'}
                        onChange={(e) => setEffectiveDate(e.target.value as 'immediate' | 'endOfCycle')}
                        disabled={isLoading}
                        className="w-4 h-4"
                      />
                      <span className="ml-3">
                        <p className="font-medium" style={{ color: theme.text }}>Immediately</p>
                        <p className="text-sm" style={{ color: `${theme.text}77` }}>Downgrade now and lose access immediately</p>
                      </span>
                    </label>

                    <label className="flex items-center p-3 rounded-lg cursor-pointer" style={{ border: `1px solid ${theme.primary}40`, backgroundColor: effectiveDate === 'endOfCycle' ? `${theme.primary}10` : 'transparent' }}>
                      <input
                        type="radio"
                        name="effectiveDate"
                        value="endOfCycle"
                        checked={effectiveDate === 'endOfCycle'}
                        onChange={(e) => setEffectiveDate(e.target.value as 'immediate' | 'endOfCycle')}
                        disabled={isLoading}
                        className="w-4 h-4"
                      />
                      <span className="ml-3">
                        <p className="font-medium" style={{ color: theme.text }}>At end of billing cycle</p>
                        <p className="text-sm" style={{ color: `${theme.text}77` }}>Keep full access until your renewal date</p>
                      </span>
                    </label>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6" style={{ borderTop: `1px solid ${theme.primary}20` }}>
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 px-4 py-2 rounded-lg disabled:opacity-50 font-medium"
                style={{ backgroundColor: `${theme.text}15`, color: theme.text }}
              >
                Keep Plan
              </button>
              <button
                onClick={() => {
                  if (step === 'warning') {
                    setStep('schedule');
                  } else {
                    handleConfirm();
                  }
                }}
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 font-medium"
                style={{ backgroundColor: theme.accent }}
              >
                {isLoading ? 'Processing...' : step === 'warning' ? 'Continue' : 'Downgrade'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
