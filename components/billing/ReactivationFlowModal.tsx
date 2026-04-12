'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, XMarkIcon, ClockIcon, ArrowUpTrayIcon, DevicePhoneMobileIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { formatProratedPrice, ProratedPrice } from '@/lib/proration';

interface Theme {
  primary: string;
  secondary: string;
  accent?: string;
  background?: string;
  surface?: string;
  text?: string;
}

interface GCashConfig {
  gcashEnabled: boolean;
  gcashPhoneNumber: string | null;
  gcashAccountName: string | null;
  gcashQrCodeUrl: string | null;
}

interface ReactivationFlowModalProps {
  isOpen: boolean;
  currentPlan: { name: string; price: number };
  reactivationPlan: { name: string; price: number; features?: Record<string, unknown> };
  proration: ProratedPrice;
  subscriptionId: number;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  theme?: Theme;
}

export function ReactivationFlowModal({
  isOpen,
  currentPlan,
  reactivationPlan,
  proration,
  subscriptionId,
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
}: ReactivationFlowModalProps) {
  const [step, setStep] = useState<'confirm' | 'payment' | 'gcash' | 'verifying'>('confirm');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gcashConfig, setGcashConfig] = useState<GCashConfig | null>(null);
  const [adminPaymentConfig, setAdminPaymentConfig] = useState<{ phoneNumber?: string; accountName?: string; qrCodeUrl?: string } | null>(null);
  const [gcashReference, setGcashReference] = useState('');
  const [gcashProof, setGcashProof] = useState<File | null>(null);
  const [gcashPreview, setGcashPreview] = useState<string | null>(null);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [paymentExpiresAt, setPaymentExpiresAt] = useState<Date | null>(null);
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'expired'>('pending');
  const [pollingActive, setPollingActive] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchGcashConfig();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!pollingActive || !paymentId) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/tenant/subscriptions/payment/status?paymentId=${paymentId}&subscriptionId=${subscriptionId}`,
          {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (res.ok) {
          const data = await res.json();

          if (data.isVerified) {
            setVerificationStatus('verified');
            setPollingActive(false);
            setStep('verifying');

            setTimeout(async () => {
              try {
                await onConfirm();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Reactivation failed after payment verification');
                setStep('gcash');
                setPollingActive(true);
              }
            }, 1500);
          } else if (data.isExpired) {
            setVerificationStatus('expired');
            setPollingActive(false);
            setError('Payment link expired. Please submit payment again.');
            setStep('gcash');
            setPaymentSubmitted(false);
          }
        }
      } catch (err) {
        console.error('Payment status polling error:', err);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [pollingActive, paymentId, subscriptionId, onConfirm]);

  const fetchGcashConfig = async () => {
    try {
      const res = await fetch('/api/settings', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data?.paymentSettings) {
          setGcashConfig({
            gcashEnabled: true,
            gcashPhoneNumber: data.data.paymentSettings.gcashNumber || null,
            gcashAccountName: data.data.paymentSettings.accountName || 'Business Account',
            gcashQrCodeUrl: data.data.paymentSettings.gcashQrCode || null,
          });
        }
      }

      const adminRes = await fetch('/api/admin/payment-settings', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (adminRes.ok) {
        const adminData = await adminRes.json();
        setAdminPaymentConfig({
          phoneNumber: adminData.adminGcashPhoneNumber,
          accountName: adminData.adminGcashAccountName,
          qrCodeUrl: adminData.adminGcashQrCodeUrl,
        });
      }
    } catch (err) {
      console.error('Failed to load payment config:', err);
    }
  };

  const handleConfirm = async () => {
    setStep('payment');
  };

  const handleSubmitGcashPayment = async () => {
    if (!gcashReference.trim()) {
      setError('Please enter your GCash transaction reference');
      return;
    }

    if (!gcashProof) {
      setError('Please upload your payment proof screenshot');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Convert proof to base64
      let gcashProofData = null
      if (gcashProof) {
        gcashProofData = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(gcashProof)
        })
      }

      const res = await fetch('/api/tenant/subscriptions/payment/submit', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId,
          amount: Math.round(proration.amountDue * 100), // Convert PHP to centavos for storage
          gcashTransactionId: gcashReference,
          gcashProof: gcashProofData,
          planName: reactivationPlan.name,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Payment submission failed');
      }

      const data = await res.json();
      setPaymentId(data.paymentId);
      setPaymentExpiresAt(new Date(data.expiresAt));
      setPaymentSubmitted(true);
      setGcashReference('');
      setGcashProof(null);
      setGcashPreview(null);
      setVerificationStatus('pending');
      setPollingActive(true);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit payment');
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-lg shadow-2xl max-w-md w-full flex flex-col max-h-[90vh]"
            style={{ backgroundColor: theme.background }}
          >
            <div className="flex items-center justify-between p-6 border-b flex-shrink-0" style={{ borderColor: `${theme.primary}20` }}>
              <h2 className="text-xl font-semibold" style={{ color: theme.text }}>
                {step === 'confirm' && 'Confirm Reactivation'}
                {step === 'payment' && 'Choose Payment Method'}
                {step === 'gcash' && (paymentSubmitted ? 'Payment Submitted' : 'GCash Payment')}
                {step === 'verifying' && 'Verifying Payment'}
              </h2>
              <button
                onClick={onCancel}
                disabled={isLoading || paymentSubmitted || step === 'verifying'}
                className="disabled:opacity-50"
                style={{ color: `${theme.text}66` }}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {step === 'confirm' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg p-4" style={{ backgroundColor: theme.surface }}>
                      <p className="text-sm mb-1" style={{ color: `${theme.text}99` }}>Current Plan</p>
                      <p className="text-lg font-semibold" style={{ color: theme.text }}>{currentPlan.name}</p>
                      <p className="text-sm" style={{ color: `${theme.text}99` }}>₱{currentPlan.price.toLocaleString('en-PH')}/mo</p>
                    </div>
                    <div className="rounded-lg p-4 border" style={{ backgroundColor: `${theme.primary}10`, borderColor: `${theme.primary}30` }}>
                      <p className="text-sm mb-1 font-medium" style={{ color: theme.primary }}>Reactivating To</p>
                      <p className="text-lg font-semibold" style={{ color: theme.text }}>{reactivationPlan.name}</p>
                      <p className="text-sm" style={{ color: theme.primary }}>
                        ₱{((reactivationPlan.price as unknown as number)).toLocaleString('en-PH')}/mo
                      </p>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4" style={{ backgroundColor: `${theme.primary}10`, borderColor: `${theme.primary}30` }}>
                    <p className="text-sm font-medium mb-2" style={{ color: theme.text }}>Pro-rated Adjustment</p>
                    <p className="text-2xl font-bold" style={{ color: theme.primary }}>
                      {formatProratedPrice(proration)}
                    </p>
                    <p className="text-sm mt-2" style={{ color: `${theme.text}99` }}>{proration.description}</p>
                  </div>

                  {error && (
                    <div className="border rounded-lg p-3" style={{ backgroundColor: '#fee2e2', borderColor: '#fecaca' }}>
                      <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {step === 'payment' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <p className="text-sm font-medium" style={{ color: theme.text }}>Select a payment method:</p>

                  {gcashConfig?.gcashEnabled && (
                    <button
                      onClick={() => {
                        setStep('gcash');
                      }}
                      className="w-full border-2 rounded-lg p-4 text-left transition-all hover:shadow-md"
                      style={{
                        borderColor: theme.primary,
                        backgroundColor: `${theme.primary}10`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <DevicePhoneMobileIcon className="w-6 h-6" style={{ color: theme.primary }} />
                        <div>
                          <p className="font-medium text-lg" style={{ color: theme.text }}>GCash</p>
                          <p className="text-sm" style={{ color: `${theme.text}99` }}>Pay using GCash mobile wallet</p>
                          <p className="text-xs mt-2" style={{ color: theme.primary }}>Recommended</p>
                        </div>
                      </div>
                    </button>
                  )}

                  <button
                    onClick={async () => {
                      setIsLoading(true);
                      setError(null);
                      try {
                        await onConfirm();
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Reactivation failed');
                        setIsLoading(false);
                      }
                    }}
                    className="w-full border-2 rounded-lg p-4 text-left transition-all hover:shadow-md"
                    style={{
                      borderColor: `${theme.text}20`,
                      backgroundColor: theme.surface,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCardIcon className="w-6 h-6" style={{ color: `${theme.text}77` }} />
                      <div>
                        <p className="font-medium text-lg" style={{ color: theme.text }}>Credit/Debit Card</p>
                        <p className="text-sm" style={{ color: `${theme.text}99` }}>Visa, Mastercard, etc.</p>
                      </div>
                    </div>
                  </button>
                </motion.div>
              )}

              {step === 'gcash' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  {!paymentSubmitted ? (
                    <>
                      <div className="border rounded-lg p-4" style={{ backgroundColor: theme.surface, borderColor: `${theme.primary}20` }}>
                        <div className="flex items-center gap-2 mb-4">
                          <ArrowUpTrayIcon className="w-5 h-5" style={{ color: theme.primary }} />
                          <p className="text-sm font-medium" style={{ color: theme.text }}>Send payment to:</p>
                        </div>
                        
                        <div className="space-y-3">
                          {gcashConfig?.gcashAccountName && (
                            <div>
                              <p className="text-xs font-medium mb-1" style={{ color: `${theme.text}99` }}>Account Name</p>
                              <p className="font-semibold text-base" style={{ color: theme.text }}>{gcashConfig.gcashAccountName}</p>
                            </div>
                          )}

                          {gcashConfig?.gcashPhoneNumber && (
                            <div>
                              <p className="text-xs font-medium mb-1" style={{ color: `${theme.text}99` }}>GCash Number</p>
                              <p className="font-mono text-base" style={{ color: theme.primary }}>{gcashConfig.gcashPhoneNumber}</p>
                            </div>
                          )}

                          <div className="border-t pt-3" style={{ borderColor: `${theme.primary}20` }}>
                            <p className="text-xs font-medium mb-1" style={{ color: `${theme.text}99` }}>Amount to Send</p>
                            <p className="text-2xl font-bold" style={{ color: theme.primary }}>
                              ₱{proration.amountDue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {adminPaymentConfig?.phoneNumber && (
                        <div className="border rounded-lg p-4" style={{ backgroundColor: `${theme.primary}05`, borderColor: `${theme.primary}30` }}>
                          <div className="flex items-center gap-2 mb-4">
                            <DevicePhoneMobileIcon className="w-5 h-5" style={{ color: theme.primary }} />
                            <p className="text-sm font-medium" style={{ color: theme.text }}>Or send to BizCore admin:</p>
                          </div>
                          
                          <div className="space-y-3">
                            {adminPaymentConfig?.accountName && (
                              <div>
                                <p className="text-xs font-medium mb-1" style={{ color: `${theme.text}99` }}>Account Name</p>
                                <p className="font-semibold text-base" style={{ color: theme.text }}>{adminPaymentConfig.accountName}</p>
                              </div>
                            )}

                            <div>
                              <p className="text-xs font-medium mb-1" style={{ color: `${theme.text}99` }}>GCash Number</p>
                              <p className="font-mono text-base" style={{ color: theme.primary }}>{adminPaymentConfig.phoneNumber}</p>
                            </div>

                            <div className="border-t pt-3" style={{ borderColor: `${theme.primary}20` }}>
                              <p className="text-xs font-medium mb-1" style={{ color: `${theme.text}99` }}>Amount to Send</p>
                              <p className="text-2xl font-bold" style={{ color: theme.primary }}>
                                ₱{proration.amountDue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {adminPaymentConfig?.qrCodeUrl && (
                        <div className="flex flex-col items-center">
                          <p className="text-sm font-medium mb-3" style={{ color: theme.text }}>Scan the BizCore admin QR code:</p>
                          <div className="border-4 rounded-lg p-2" style={{ borderColor: theme.primary }}>
                            <Image
                              src={adminPaymentConfig.qrCodeUrl}
                              alt="BizCore Admin GCash QR Code"
                              width={160}
                              height={160}
                              className="rounded"
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
                          GCash Transaction Reference
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., TXN1234567890"
                          value={gcashReference}
                          onChange={(e) => setGcashReference(e.target.value)}
                          disabled={isLoading}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50"
                          style={{
                            borderColor: `${theme.primary}30`,
                          }}
                        />
                        <p className="text-xs mt-2" style={{ color: `${theme.text}99` }}>
                          Look for this number in your GCash transaction receipt
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
                          Payment Proof Screenshot
                        </label>
                        <p className="text-xs mb-3" style={{ color: `${theme.text}99` }}>
                          Upload a screenshot of your GCash payment confirmation as proof
                        </p>
                        <div className="border-2 border-dashed rounded-lg p-4" style={{ borderColor: `${theme.primary}40`, backgroundColor: `${theme.primary}05` }}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                setGcashProof(file)
                                const reader = new FileReader()
                                reader.onloadend = () => {
                                  setGcashPreview(reader.result as string)
                                }
                                reader.readAsDataURL(file)
                              }
                            }}
                            disabled={isLoading}
                            className="hidden"
                            id="gcash-proof-reactivation"
                          />
                          <label htmlFor="gcash-proof-reactivation" className="cursor-pointer block">
                            {gcashPreview ? (
                              <div className="space-y-2">
                                <div className="relative w-full h-32 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                                  <Image
                                    src={gcashPreview}
                                    alt="GCash payment proof"
                                    width={300}
                                    height={400}
                                    className="object-contain max-h-full"
                                  />
                                </div>
                                <p className="text-xs text-center truncate" style={{ color: `${theme.text}99` }}>
                                  {gcashProof?.name}
                                </p>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    setGcashProof(null)
                                    setGcashPreview(null)
                                  }}
                                  disabled={isLoading}
                                  className="w-full py-1 text-xs rounded transition-colors disabled:opacity-50"
                                  style={{ color: '#dc2626', backgroundColor: '#fee2e2' }}
                                >
                                  Remove Image
                                </button>
                              </div>
                            ) : (
                              <div className="text-center">
                                <p className="text-sm" style={{ color: theme.primary }}>
                                  Click to upload payment proof image
                                </p>
                                <p className="text-xs mt-1" style={{ color: `${theme.text}99` }}>
                                  PNG, JPG up to 5MB
                                </p>
                              </div>
                            )}
                          </label>
                        </div>
                      </div>

                      {error && (
                        <div className="border rounded-lg p-3" style={{ backgroundColor: '#fee2e2', borderColor: '#fecaca' }}>
                          <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center space-y-4">
                      <CheckCircleIcon className="w-16 h-16 mx-auto" style={{ color: theme.secondary }} />
                      <div>
                        <h3 className="text-lg font-semibold" style={{ color: theme.text }}>Payment Submitted!</h3>
                        <p className="text-sm mt-1" style={{ color: `${theme.text}99` }}>
                          We&apos;re verifying your payment
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {step === 'verifying' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    {verificationStatus === 'verified' ? (
                      <>
                        <CheckCircleIcon className="w-16 h-16 mx-auto mb-4" style={{ color: theme.secondary }} />
                        <h3 className="text-lg font-semibold" style={{ color: theme.text }}>Payment Verified!</h3>
                        <p className="text-sm mt-2" style={{ color: `${theme.text}99` }}>
                          Your subscription has been successfully reactivated. Welcome back!
                        </p>
                      </>
                    ) : verificationStatus === 'expired' ? (
                      <>
                        <XMarkIcon className="w-16 h-16 mx-auto mb-4 text-red-500" />
                        <h3 className="text-lg font-semibold" style={{ color: theme.text }}>Payment Expired</h3>
                        <p className="text-sm mt-2" style={{ color: `${theme.text}99` }}>
                          Your payment verification link has expired. Please submit payment again.
                        </p>
                      </>
                    ) : (
                      <>
                        <ClockIcon className="w-16 h-16 mx-auto mb-4" style={{ color: theme.primary }} />
                        <h3 className="text-lg font-semibold" style={{ color: theme.text }}>Verifying Payment</h3>
                        <p className="text-sm mt-2" style={{ color: `${theme.text}99` }}>
                          We&apos;re checking your payment. This usually takes 1-2 minutes.
                        </p>
                        {paymentExpiresAt && (
                          <p className="text-xs mt-3" style={{ color: `${theme.text}66` }}>
                            Expires at: {paymentExpiresAt.toLocaleTimeString()}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            <div className="flex gap-3 p-6 sticky bottom-0 flex-shrink-0" style={{ borderTop: `1px solid ${theme.primary}20`, backgroundColor: theme.background }}>
              {step === 'confirm' && (
                <>
                  <button
                    onClick={onCancel}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 rounded-lg disabled:opacity-50 font-medium transition-colors"
                    style={{ backgroundColor: `${theme.text}15`, color: theme.text }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 font-medium transition-colors"
                    style={{ backgroundColor: theme.primary }}
                  >
                    {isLoading ? 'Processing...' : 'Proceed to Payment'}
                  </button>
                </>
              )}

              {step === 'payment' && (
                <>
                  <button
                    onClick={onCancel}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 rounded-lg disabled:opacity-50 font-medium transition-colors"
                    style={{ backgroundColor: `${theme.text}15`, color: theme.text }}
                  >
                    Cancel
                  </button>
                </>
              )}

              {step === 'gcash' && !paymentSubmitted && (
                <>
                  <button
                    onClick={() => setStep('payment')}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 rounded-lg disabled:opacity-50 font-medium transition-colors"
                    style={{ backgroundColor: `${theme.text}15`, color: theme.text }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmitGcashPayment}
                    disabled={isLoading || !gcashReference.trim() || !gcashProof}
                    className="flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 font-medium transition-colors"
                    style={{ backgroundColor: theme.primary }}
                  >
                    {isLoading ? 'Submitting...' : 'Submit Payment'}
                  </button>
                </>
              )}

              {step === 'verifying' && (
                <>
                  {verificationStatus === 'verified' && (
                    <button
                      onClick={onCancel}
                      className="w-full px-4 py-2 text-white rounded-lg font-medium"
                      style={{ backgroundColor: theme.primary }}
                    >
                      Continue to Dashboard
                    </button>
                  )}

                  {verificationStatus === 'expired' && (
                    <>
                      <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
                        style={{ backgroundColor: `${theme.text}15`, color: theme.text }}
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          setStep('gcash');
                          setPaymentSubmitted(false);
                          setGcashReference('');
                          setGcashProof(null);
                          setGcashPreview(null);
                        }}
                        className="flex-1 px-4 py-2 text-white rounded-lg font-medium"
                        style={{ backgroundColor: theme.primary }}
                      >
                        Try Again
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
