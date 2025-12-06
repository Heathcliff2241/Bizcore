/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect } from 'react';
import SubscriptionHero from '@/components/billing/SubscriptionHero';
import FeatureUsageCard from '@/components/billing/FeatureUsageCard';
import { UpgradeFlowModal } from '@/components/billing/UpgradeFlowModal';
import { DowngradeWarningModal } from '@/components/billing/DowngradeWarningModal';
import { CancellationFlowModal } from '@/components/billing/CancellationFlowModal';
import { PauseFlowModal } from '@/components/billing/PauseFlowModal';
import { InvoiceModal } from '@/components/billing/InvoiceModal';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useSettings } from '@/lib/settings-context';
import { calculateProration, calculateCancellationRefund, ProratedPrice } from '@/lib/proration';
import { EyeIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

interface CurrentSubscription {
  subscription: Record<string, unknown>;
  plan: Record<string, unknown>;
  tenant: Record<string, unknown>;
  lastPayment: Record<string, unknown> | null;
  lastInvoice: Record<string, unknown> | null;
  usageRecords: Record<string, unknown>[];
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  status: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  issuedAt: string;
  dueDate: string;
  paidAt: string | null;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

interface Plan {
  id: string;
  name: string;
  price: number | null;
  billingCycle: string;
  duration: string;
  description: string;
  features: Record<string, unknown>;
  isRecommended?: boolean;
  monthlyEquivalent?: number;
  savings?: number;
}

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const { settings } = useSettings();
  const [currentSub, setCurrentSub] = useState<CurrentSubscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'manage'>('overview');
  const [loading, setLoading] = useState(true);
  const [autoRenewEnabled, setAutoRenewEnabled] = useState(true);
  const [autoRenewLoading, setAutoRenewLoading] = useState(false);

  // Modal states
  const [upgradeModal, setUpgradeModal] = useState<{ isOpen: boolean; planId?: string }>({
    isOpen: false
  });
  const [downgradeModal, setDowngradeModal] = useState<{ isOpen: boolean; planId?: string }>({
    isOpen: false
  });
  const [cancellationModal, setCancellationModal] = useState(false);
  const [pauseModal, setPauseModal] = useState(false);
  const [invoiceModal, setInvoiceModal] = useState<{ isOpen: boolean; invoice?: Invoice }>({
    isOpen: false
  });

  // Theme styling
  const theme = {
    primary: settings.brandColors.primary,
    secondary: settings.brandColors.secondary,
    accent: settings.brandColors.accent,
    background: settings.brandColors.background,
    surface: settings.brandColors.surface,
    text: settings.brandColors.text,
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [currentRes, invoicesRes, plansRes] = await Promise.all([
          fetch('/api/tenant/subscriptions/current', {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          }),
          fetch('/api/tenant/subscriptions/invoices?page=1&limit=10', {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          }),
          fetch('/api/tenant/subscriptions/plans-available', {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          }),
        ]);

        if (currentRes.ok) {
          const data = await currentRes.json();
          setCurrentSub(data);
          setAutoRenewEnabled((data.subscription as Record<string, unknown>).autoRenew as boolean);
        } else if (!currentRes.ok) {
          console.error('Failed to fetch current subscription:', currentRes.status);
        }

        if (invoicesRes.ok) {
          const data = await invoicesRes.json();
          setInvoices(data.invoices);
        } else if (!invoicesRes.ok) {
          console.error('Failed to fetch invoices:', invoicesRes.status);
        }

        if (plansRes.ok) {
          const data = await plansRes.json();
          setPlans(data.plans);
        } else if (!plansRes.ok) {
          console.error('Failed to fetch plans:', plansRes.status);
        }
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchData();
    }
  }, [session]);

  if (loading || !currentSub) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const formatPrice = (pesos: number) => {
    if (!pesos) return '₱0';
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(pesos / 100);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleAutoRenewToggle = async () => {
    if (!currentSub) return;
    try {
      setAutoRenewLoading(true);
      const res = await fetch('/api/tenant/subscriptions/auto-renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subscriptionId: (currentSub.subscription as Record<string, unknown>).id,
          autoRenew: !autoRenewEnabled 
        })
      });

      if (res.ok) {
        setAutoRenewEnabled(!autoRenewEnabled);
        // Refresh subscription data
        const currentRes = await fetch('/api/tenant/subscriptions/current', {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (currentRes.ok) {
          const data = await currentRes.json();
          setCurrentSub(data);
        }
      } else {
        console.error('Failed to update auto-renewal:', res.status);
      }
    } catch (error) {
      console.error('Error updating auto-renewal:', error);
    } finally {
      setAutoRenewLoading(false);
    }
  };

  const currentPlan = plans.find((p) => p.id === currentSub.subscription.planId) || plans[0];

  const handleUpgradeClick = (planId: string) => {
    setUpgradeModal({ isOpen: true, planId });
  };

  const handleDowngradeClick = (planId: string) => {
    setDowngradeModal({ isOpen: true, planId });
  };

  const handleUpgradeConfirm = async () => {
    if (!upgradeModal.planId) return;

    try {
      const res = await fetch('/api/tenant/subscriptions/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPlanId: upgradeModal.planId })
      });

      if (res.ok) {
        const data = await res.json();
        
        // If payment was needed, the modal will handle polling for verification
        // If no payment needed, the upgrade is already applied
        // In both cases, close modal and let polling or immediate success refresh the data
        setUpgradeModal({ isOpen: false });
        
        // Refresh subscription data after a short delay to ensure latest data
        setTimeout(async () => {
          const currentRes = await fetch('/api/tenant/subscriptions/current', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          });
          if (currentRes.ok) {
            const subData = await currentRes.json();
            setCurrentSub(subData);
          }
        }, 500);
      } else {
        throw new Error('Upgrade failed');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      throw error;
    }
  };

  const handleDowngradeConfirm = async (effectiveDate: Date) => {
    if (!downgradeModal.planId) return;

    try {
      const res = await fetch('/api/tenant/subscriptions/downgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPlanId: downgradeModal.planId, effectiveDate })
      });

      if (res.ok) {
        const currentRes = await fetch('/api/tenant/subscriptions/current');
        if (currentRes.ok) {
          const data = await currentRes.json();
          setCurrentSub(data);
        }
        setDowngradeModal({ isOpen: false });
      } else {
        throw new Error('Downgrade failed');
      }
    } catch (error) {
      console.error('Downgrade error:', error);
      throw error;
    }
  };

  const handleCancellationConfirm = async (reason: string, feedback: string) => {
    try {
      const res = await fetch('/api/tenant/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, feedback, cancelImmediately: true })
      });

      if (res.ok) {
        const currentRes = await fetch('/api/tenant/subscriptions/current');
        if (currentRes.ok) {
          const data = await currentRes.json();
          setCurrentSub(data);
        }
        setCancellationModal(false);
      } else {
        throw new Error('Cancellation failed');
      }
    } catch (error) {
      console.error('Cancellation error:', error);
      throw error;
    }
  };

  const handlePauseConfirm = async (months: number) => {
    try {
      const res = await fetch('/api/tenant/subscriptions/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pauseMonths: months })
      });

      if (res.ok) {
        const currentRes = await fetch('/api/tenant/subscriptions/current');
        if (currentRes.ok) {
          const data = await currentRes.json();
          setCurrentSub(data);
        }
        setPauseModal(false);
      } else {
        throw new Error('Pause failed');
      }
    } catch (error) {
      console.error('Pause error:', error);
      throw error;
    }
  };

  // Calculate proration for upgrade modal
  const getUpgradeProration = (): ProratedPrice | null => {
    if (!upgradeModal.planId || !currentSub) return null;

    const planPrices: Record<string, number> = {
      trial: 0,
      basic: 1999,
      premium: 19999,
      enterprise: 0
    };

    const currentPrice = planPrices[currentSub.subscription.planId as string] || 0;
    const newPrice = planPrices[upgradeModal.planId] || 0;

    return calculateProration(
      currentPrice,
      newPrice,
      new Date(currentSub.subscription.currentPeriodStart as string),
      new Date(currentSub.subscription.currentPeriodEnd as string)
    );
  };

  // Calculate proration for downgrade modal
  const getDowngradeProration = (): ProratedPrice | null => {
    if (!downgradeModal.planId || !currentSub) return null;

    const planPrices: Record<string, number> = {
      trial: 0,
      basic: 1999,
      premium: 19999,
      enterprise: 0
    };

    const currentPrice = planPrices[currentSub.subscription.planId as string] || 0;
    const newPrice = planPrices[downgradeModal.planId] || 0;

    return calculateProration(
      currentPrice,
      newPrice,
      new Date(currentSub.subscription.currentPeriodStart as string),
      new Date(currentSub.subscription.currentPeriodEnd as string)
    );
  };

  // Calculate refund for cancellation modal
  const getCancellationRefund = (): { refundAmount: number; explanation: string } | null => {
    if (!currentSub) return null;

    const planPrices: Record<string, number> = {
      trial: 0,
      basic: 1999,
      premium: 19999,
      enterprise: 0
    };

    const currentPrice = planPrices[currentSub.subscription.planId as string] || 0;

    return calculateCancellationRefund(
      currentPrice,
      new Date(currentSub.subscription.currentPeriodStart as string),
      new Date(currentSub.subscription.currentPeriodEnd as string)
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.surface }}>
      <div className="max-w-6xl mx-auto space-y-8 py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: theme.text }}>Subscriptions</h1>
          <p className="mt-2" style={{ color: `${theme.text}99` }}>Manage your subscription and billing</p>
        </div>
        {/* Hero Card */}
        <SubscriptionHero
          plan={{
            name: (currentSub.plan as Record<string, unknown>).name as string || "Plan",
            price: (currentSub.plan as Record<string, unknown>).price as number || 0,
            cycle: (currentSub.plan as Record<string, unknown>).cycle as string || "monthly",
            features: (currentSub.plan as Record<string, unknown>).features as Record<string, unknown>,
          }}
          subscription={{
            status: (currentSub.subscription as Record<string, unknown>).status as string || "active",
            renewalDate: (currentSub.subscription as Record<string, unknown>).renewalDate as string || null,
            daysRemaining: (currentSub.subscription as Record<string, unknown>).daysRemaining as number || null,
            autoRenew: autoRenewEnabled,
          }}
          onUpgrade={() => setActiveTab('manage')}
          onManage={() => setActiveTab('manage')}
          onCancel={() => setCancellationModal(true)}
          theme={theme}
        />

        {/* Tabs */}
        <div style={{ borderBottom: `1px solid ${theme.primary}20` }}>
          <div className="flex gap-8">
            {['overview', 'history', 'manage'].map((tab) => {
              type TabType = 'overview' | 'history' | 'manage';
              return (
                <motion.button
                  key={tab}
                  onClick={() => setActiveTab(tab as TabType)}
                  className="py-4 px-2 font-medium transition-colors border-b-2"
                  style={{
                    borderColor: activeTab === tab ? theme.primary : 'transparent',
                    color: activeTab === tab ? theme.primary : `${theme.text}99`,
                  }}
                >
                  {tab === 'overview' && 'Overview'}
                  {tab === 'history' && 'Billing History'}
                  {tab === 'manage' && 'Manage Plan'}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Usage Metrics */}
              {currentSub.usageRecords.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-4" style={{ color: theme.text }}>Feature Usage</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {currentSub.usageRecords.map((record: Record<string, unknown>) => (
                      <FeatureUsageCard
                        key={record.id as string | number}
                        metric={record.metric as string}
                        value={record.value as number}
                        limit={record.limit as number | null}
                        percentage={record.percentage as number}
                        onUpgrade={() => setActiveTab('manage')}
                        theme={theme}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Billing Summary */}
              <div className="rounded-xl border p-6" style={{ backgroundColor: theme.background, borderColor: `${theme.primary}20` }}>
                <h3 className="text-xl font-bold mb-6" style={{ color: theme.text }}>Billing Summary</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Next Charge */}
                  <div className="rounded-lg p-4" style={{ backgroundColor: theme.surface }}>
                    <p className="text-sm font-medium" style={{ color: `${theme.text}99` }}>Next Charge</p>
                    <p className="text-3xl font-bold mt-2" style={{ color: theme.text }}>
                      {formatPrice((currentSub.subscription as Record<string, unknown>).nextPaymentAmount as number || currentSub.plan.price as number)}
                    </p>
                    <p className="text-sm mt-2" style={{ color: `${theme.text}99` }}>
                      {(currentSub.subscription as Record<string, unknown>).nextPaymentDate
                        ? `On ${formatDate((currentSub.subscription as Record<string, unknown>).nextPaymentDate as string)}`
                        : (currentSub.subscription as Record<string, unknown>).renewalDate
                        ? `On ${formatDate((currentSub.subscription as Record<string, unknown>).renewalDate as string)}`
                        : 'No upcoming charges'}
                    </p>
                  </div>

                  {/* Payment Method */}
                  <div className="rounded-lg p-4" style={{ backgroundColor: theme.surface }}>
                    <p className="text-sm font-medium" style={{ color: `${theme.text}99` }}>Payment Method</p>
                    <p className="text-lg font-semibold mt-2" style={{ color: theme.text }}>
                      {currentSub.lastPayment && (currentSub.lastPayment as Record<string, unknown>).cardBrand
                        ? `${((currentSub.lastPayment as Record<string, unknown>).cardBrand as string).charAt(0).toUpperCase() +
                            ((currentSub.lastPayment as Record<string, unknown>).cardBrand as string).slice(1)} •••• ${
                            (currentSub.lastPayment as Record<string, unknown>).cardLastFour
                          }`
                        : 'No payment method'}
                    </p>
                    <button style={{ color: theme.primary }} className="text-sm font-semibold mt-3 hover:underline">
                      Update Payment Method
                    </button>
                  </div>
                </div>

                {/* Auto-renew toggle */}
                <div className="mt-6 border-t pt-6" style={{ borderColor: `${theme.primary}20` }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium" style={{ color: theme.text }}>Auto-renewal</p>
                      <p className="text-sm mt-1" style={{ color: `${theme.text}99` }}>
                        Your subscription will automatically renew on the renewal date
                      </p>
                    </div>
                    <div className="flex items-center">
                      <button
                        onClick={handleAutoRenewToggle}
                        disabled={autoRenewLoading}
                        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50"
                        style={{ backgroundColor: autoRenewEnabled ? theme.primary : `${theme.text}30` }}
                      >
                        <span 
                          className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                          style={{ transform: autoRenewEnabled ? 'translateX(1.25rem)' : 'translateX(0.25rem)' }}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h3 className="text-xl font-bold mb-4" style={{ color: theme.text }}>Invoice History</h3>

              {invoices.length === 0 ? (
                <div className="rounded-lg p-8 text-center" style={{ backgroundColor: theme.surface }}>
                  <p style={{ color: `${theme.text}99` }}>No invoices yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="border rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                      style={{ backgroundColor: theme.background, borderColor: `${theme.primary}20` }}
                    >
                      <div className="flex-1">
                        <p className="font-semibold" style={{ color: theme.text }}>{invoice.invoiceNumber}</p>
                        <p className="text-sm mt-1" style={{ color: `${theme.text}99` }}>
                          {formatDate(invoice.issuedAt)}
                        </p>
                      </div>

                      <div className="text-right mr-4">
                        <p className="font-semibold" style={{ color: theme.text }}>{formatPrice(invoice.total)}</p>
                        <p
                          className="text-sm mt-1 font-medium"
                          style={{
                            color: invoice.status === 'paid' ? '#16a34a' : '#ca8a04'
                          }}
                        >
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setInvoiceModal({ isOpen: true, invoice })}
                          className="p-2 hover:bg-gray-100 rounded-lg transition flex items-center gap-1"
                          style={{ color: theme.primary }}
                          title="View Invoice"
                        >
                          <EyeIcon className="w-4 h-4" />
                          <span className="text-sm font-semibold">View</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold" style={{ color: theme.text }}>Plan Comparison</h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {plans.map((plan) => {
                  const isCurrent = plan.id === currentSub.subscription.planId;
                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg border-2 p-6 transition-all"
                      style={{
                        borderColor: isCurrent ? theme.primary : `${theme.primary}20`,
                        backgroundColor: isCurrent ? `${theme.primary}10` : theme.background,
                      }}
                    >
                      {plan.isRecommended && (
                        <div className="text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4" style={{ backgroundColor: theme.primary }}>
                          ⭐ Best Value
                        </div>
                      )}

                      <h4 className="text-lg font-bold" style={{ color: theme.text }}>{plan.name}</h4>

                      <p className="text-3xl font-bold mt-2" style={{ color: theme.text }}>
                        {plan.price ? formatPrice(plan.price) : 'Free'}
                      </p>

                      {plan.monthlyEquivalent && (
                        <p className="text-sm mt-1" style={{ color: `${theme.text}99` }}>
                          {formatPrice(plan.monthlyEquivalent)}/month
                        </p>
                      )}

                      {plan.savings && (
                        <p className="text-sm font-semibold mt-2" style={{ color: '#16a34a' }}>
                          Save {formatPrice(plan.savings)}/year
                        </p>
                      )}

                      <p className="text-sm mt-4" style={{ color: `${theme.text}99` }}>{plan.description}</p>

                      <div className="space-y-2 mt-6 mb-6">
                        {Object.entries(plan.features).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2 text-sm">
                            <span style={{ color: theme.primary }}>✓</span>
                            <span style={{ color: `${theme.text}99` }}>
                              {value === null
                                ? `Unlimited ${key.replace(/_/g, ' ')}`
                                : `${value} ${key.replace(/_/g, ' ')}`}
                            </span>
                          </div>
                        ))}
                      </div>

                      <button
                        disabled={isCurrent}
                        onClick={() => {
                          if (isCurrent) return;
                          const planTiers = { trial: 0, basic: 1, premium: 2, enterprise: 3 };
                          const currentTier =
                            planTiers[
                              (currentSub.subscription.planId as keyof typeof planTiers) || 'trial'
                            ] || 0;
                          const newTier =
                            planTiers[(plan.id as keyof typeof planTiers) || 'trial'] || 0;

                          if (newTier > currentTier) {
                            handleUpgradeClick(plan.id);
                          } else if (newTier < currentTier) {
                            handleDowngradeClick(plan.id);
                          }
                        }}
                        className="w-full py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-default"
                        style={{
                          backgroundColor: isCurrent ? `${theme.text}20` : theme.primary,
                          color: isCurrent ? theme.text : 'white',
                        }}
                      >
                        {isCurrent ? 'Current Plan' : 'Upgrade'}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      {currentSub && upgradeModal.planId && getUpgradeProration() && (
        <UpgradeFlowModal
          isOpen={upgradeModal.isOpen}
          subscriptionId={(currentSub.subscription as Record<string, unknown>).id as number}
          currentPlan={{
            name: currentPlan.name,
            price: currentPlan.price ?? 0
          }}
          newPlan={{
            name: (plans.find((p) => p.id === upgradeModal.planId)?.name) || plans[0].name,
            price: (plans.find((p) => p.id === upgradeModal.planId)?.price) ?? plans[0].price ?? 0,
            features: (plans.find((p) => p.id === upgradeModal.planId)?.features) || plans[0].features
          }}
          proration={getUpgradeProration()!}
          onConfirm={handleUpgradeConfirm}
          onCancel={() => setUpgradeModal({ isOpen: false })}
          theme={theme}
        />
      )}

      {currentSub && downgradeModal.planId && getDowngradeProration() && (
        <DowngradeWarningModal
          isOpen={downgradeModal.isOpen}
          currentPlan={{
            name: currentPlan.name,
            features: currentPlan.features
          }}
          newPlan={plans.find((p) => p.id === downgradeModal.planId) || plans[0]}
          proration={getDowngradeProration()!}
          onConfirm={handleDowngradeConfirm}
          onCancel={() => setDowngradeModal({ isOpen: false })}
          theme={theme}
        />
      )}

      {currentSub && getCancellationRefund() && (
        <CancellationFlowModal
          isOpen={cancellationModal}
          refundAmount={getCancellationRefund()!.refundAmount}
          planName={currentPlan.name}
          onConfirm={handleCancellationConfirm}
          onCancel={() => setCancellationModal(false)}
          theme={theme}
        />
      )}

      <PauseFlowModal
        isOpen={pauseModal}
        onConfirm={handlePauseConfirm}
        onCancel={() => setPauseModal(false)}
        theme={theme}
      />

      {invoiceModal.invoice && (
        <InvoiceModal
          isOpen={invoiceModal.isOpen}
          invoice={invoiceModal.invoice}
          tenantName={(currentSub?.tenant as Record<string, unknown>)?.name as string || 'Customer'}
          onClose={() => setInvoiceModal({ isOpen: false })}
          theme={theme}
        />
      )}
    </div>
  );
}
