'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CheckCircleIcon, CalendarIcon, ChartBarIcon, CogIcon } from '@heroicons/react/24/outline';

interface Theme {
  primary: string;
  secondary: string;
  accent?: string;
  background?: string;
  surface?: string;
  text?: string;
}

interface PauseFlowModalProps {
  isOpen: boolean;
  onConfirm: (months: number) => Promise<void>;
  onCancel: () => void;
  theme?: Theme;
}

export function PauseFlowModal({ isOpen, onConfirm, onCancel, theme = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#6366F1',
  background: '#ffffff',
  surface: '#f9fafb',
  text: '#111827',
} }: PauseFlowModalProps) {
  const [selectedDuration, setSelectedDuration] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const durations = [
    {
      months: 1,
      label: '1 Month',
      description: 'Perfect for a quick break'
    },
    {
      months: 2,
      label: '2 Months',
      description: 'Most popular option'
    },
    {
      months: 3,
      label: '3 Months',
      description: 'Extended time away'
    }
  ];

  const getDurationIcon = (months: number) => {
    const iconProps = { className: 'w-5 h-5', style: { color: theme.primary } };
    switch (months) {
      case 1:
        return <CalendarIcon {...iconProps} />;
      case 2:
        return <ChartBarIcon {...iconProps} />;
      case 3:
        return <CogIcon {...iconProps} />;
      default:
        return null;
    }
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onConfirm(selectedDuration);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pause failed');
      setIsLoading(false);
    }
  };

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
            <div className="flex items-center justify-between p-6" style={{ borderBottom: `1px solid ${theme.primary}20`, backgroundColor: `${theme.primary}15` }}>
              <h2 className="text-xl font-semibold" style={{ color: theme.text }}>Pause Subscription</h2>
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
            <div className="p-6 space-y-6">
              {/* Info box */}
              <div className="flex gap-3 rounded-lg p-4" style={{ backgroundColor: `${theme.primary}15`, border: `1px solid ${theme.primary}40` }}>
                <CheckCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme.primary }} />
                <div>
                  <p className="font-medium" style={{ color: theme.text }}>Your data stays safe</p>
                  <p className="text-sm mt-1" style={{ color: `${theme.text}88` }}>
                    When you resume, everything will be exactly as you left it.
                  </p>
                </div>
              </div>

              {/* Duration selection */}
              <div>
                <p className="text-sm font-medium mb-3" style={{ color: theme.text }}>How long would you like to pause?</p>
                <div className="space-y-3">
                  {durations.map((duration) => (
                    <button
                      key={duration.months}
                      onClick={() => setSelectedDuration(duration.months as 1 | 2 | 3)}
                      className="w-full text-left p-4 border-2 rounded-lg transition-all"
                      style={{
                        borderColor: selectedDuration === duration.months ? theme.primary : `${theme.primary}20`,
                        backgroundColor: selectedDuration === duration.months ? `${theme.primary}10` : 'transparent'
                      }}
                      disabled={isLoading}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getDurationIcon(duration.months)}
                          <div>
                            <p className="font-semibold" style={{ color: theme.text }}>
                              {duration.label}
                            </p>
                            <p className="text-sm mt-1" style={{ color: `${theme.text}88` }}>{duration.description}</p>
                          </div>
                        </div>
                        {selectedDuration === duration.months && (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-2" style={{ backgroundColor: theme.primary }}>
                            <CheckCircleIcon className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* What happens */}
              <div>
                <p className="text-sm font-medium mb-3" style={{ color: theme.text }}>What happens during pause:</p>
                <ul className="space-y-2">
                  {[
                    'No charges will be made',
                    'You lose access to paid features',
                    'All your data is preserved',
                    'Automatic resume reminder email'
                  ].map((item) => (
                    <li key={item} className="flex items-center text-sm" style={{ color: `${theme.text}88` }}>
                      <CheckCircleIcon className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: theme.secondary }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Error message */}
              {error && (
                <div className="rounded-lg p-3" style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca' }}>
                  <p className="text-sm" style={{ color: '#b91c1c' }}>{error}</p>
                </div>
              )}

              {/* Resume date */}
              <div className="rounded-lg p-4" style={{ backgroundColor: `${theme.text}10` }}>
                <p className="text-xs mb-1" style={{ color: `${theme.text}77` }}>Subscription resumes on</p>
                <p className="text-sm font-semibold" style={{ color: theme.text }}>
                  {new Date(Date.now() + selectedDuration * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(
                    'en-US',
                    { month: 'long', day: 'numeric', year: 'numeric' }
                  )}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6" style={{ borderTop: `1px solid ${theme.primary}20` }}>
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 px-4 py-2 rounded-lg disabled:opacity-50 font-medium"
                style={{ backgroundColor: `${theme.text}15`, color: theme.text }}
              >
                Keep Subscription
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 font-medium"
                style={{ backgroundColor: theme.primary }}
              >
                {isLoading ? 'Pausing...' : 'Pause Now'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
