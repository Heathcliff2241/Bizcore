'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CurrencyDollarIcon, Squares2X2Icon, ArrowPathIcon, ChatBubbleLeftIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface Theme {
  primary: string;
  secondary: string;
  accent?: string;
  background?: string;
  surface?: string;
  text?: string;
}

interface CancellationFlowModalProps {
  isOpen: boolean;
  refundAmount: number;
  planName: string;
  onConfirm: (reason: string, feedback: string) => Promise<void>;
  onCancel: () => void;
  theme?: Theme;
}

export function CancellationFlowModal({
  isOpen,
  refundAmount,
  planName,
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
}: CancellationFlowModalProps) {
  const [step, setStep] = useState<'reason' | 'feedback' | 'confirm'>('reason');
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reasons = [
    { id: 'too-expensive', label: 'Too expensive' },
    { id: 'not-using', label: 'Not using enough features' },
    { id: 'switching', label: 'Switching to another service' },
    { id: 'poor-support', label: 'Poor customer support' },
    { id: 'other', label: 'Other reason' }
  ];

  const getReasonIcon = (reasonId: string) => {
    const iconProps = { className: 'w-5 h-5', style: { color: theme.primary } };
    switch (reasonId) {
      case 'too-expensive':
        return <CurrencyDollarIcon {...iconProps} />;
      case 'not-using':
        return <Squares2X2Icon {...iconProps} />;
      case 'switching':
        return <ArrowPathIcon {...iconProps} />;
      case 'poor-support':
        return <ChatBubbleLeftIcon {...iconProps} />;
      case 'other':
        return <QuestionMarkCircleIcon {...iconProps} />;
      default:
        return null;
    }
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onConfirm(selectedReason, feedback);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancellation failed');
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
            className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 sticky top-0" style={{ borderBottom: `1px solid ${theme.primary}20`, backgroundColor: theme.background }}>
              <h2 className="text-xl font-semibold" style={{ color: theme.text }}>
                {step === 'reason' && "We're sorry to see you go"}
                {step === 'feedback' && 'Help us improve'}
                {step === 'confirm' && 'Cancel subscription?'}
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
              {step === 'reason' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <p className="text-sm mb-4" style={{ color: `${theme.text}88` }}>
                    Please let us know why you&rsquo;re cancelling. Your feedback helps us serve you better.
                  </p>
                  {reasons.map((reason) => (
                    <button
                      key={reason.id}
                      onClick={() => {
                        setSelectedReason(reason.id);
                        setStep('feedback');
                      }}
                      className="w-full text-left p-4 rounded-lg transition-colors flex items-center gap-3"
                      style={{ border: `1px solid ${theme.primary}40`, backgroundColor: reason.id === selectedReason ? `${theme.primary}10` : 'transparent' }}
                    >
                      {getReasonIcon(reason.id)}
                      <span className="font-medium" style={{ color: theme.text }}>{reason.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}

              {step === 'feedback' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <p className="text-sm" style={{ color: `${theme.text}88` }}>
                    Is there anything we can do to improve your experience?
                  </p>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Your feedback (optional)..."
                    disabled={isLoading}
                    className="w-full h-24 px-3 py-2 rounded-lg resize-none"
                    style={{ border: `1px solid ${theme.primary}40`, color: theme.text }}
                  />
                  <p className="text-xs" style={{ color: `${theme.text}66` }}>Your feedback helps us make BizCore better</p>
                </motion.div>
              )}

              {step === 'confirm' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="rounded-lg p-4" style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca' }}>
                    <p className="font-medium mb-2" style={{ color: '#b91c1c' }}>What happens next:</p>
                    <ul className="space-y-2 text-sm" style={{ color: '#991b1b' }}>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Immediate access loss to {planName} features</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>All your data will be preserved for 30 days</span>
                      </li>
                      {refundAmount > 0 && (
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>Refund of ₱{refundAmount.toFixed(2)} will be processed within 5-7 days</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  {refundAmount > 0 && (
                    <div className="rounded-lg p-4" style={{ backgroundColor: `${theme.secondary}15`, border: `1px solid ${theme.secondary}40` }}>
                      <p className="text-sm font-medium mb-1" style={{ color: theme.text }}>Refund amount</p>
                      <p className="text-2xl font-bold" style={{ color: theme.secondary }}>₱{refundAmount.toFixed(2)}</p>
                    </div>
                  )}

                  <div className="rounded-lg p-4" style={{ backgroundColor: `${theme.primary}15`, border: `1px solid ${theme.primary}40` }}>
                    <p className="text-sm font-medium mb-2" style={{ color: theme.text }}>Want to pause instead?</p>
                    <p className="text-sm" style={{ color: `${theme.text}88` }}>
                      You can pause for 1-3 months and resume later. All data stays safe.
                    </p>
                  </div>

                  {error && (
                    <div className="rounded-lg p-3" style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca' }}>
                      <p className="text-sm" style={{ color: '#b91c1c' }}>{error}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 sticky bottom-0" style={{ borderTop: `1px solid ${theme.primary}20`, backgroundColor: theme.background }}>
              <button
                onClick={() => {
                  if (step === 'reason') {
                    onCancel();
                  } else {
                    setStep(step === 'confirm' ? 'feedback' : 'reason');
                  }
                }}
                disabled={isLoading}
                className="flex-1 px-4 py-2 rounded-lg disabled:opacity-50 font-medium"
                style={{ backgroundColor: `${theme.text}15`, color: theme.text }}
              >
                {step === 'reason' ? 'Keep Plan' : 'Back'}
              </button>
              <button
                onClick={() => {
                  if (step === 'feedback') {
                    setStep('confirm');
                  } else if (step === 'confirm') {
                    handleConfirm();
                  }
                }}
                disabled={isLoading || (step === 'reason' && !selectedReason)}
                className="flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 font-medium"
                style={{ backgroundColor: '#dc2626' }}
              >
                {isLoading ? 'Cancelling...' : step === 'confirm' ? 'Cancel Subscription' : 'Next'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
