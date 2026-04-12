/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect } from 'react';
import SubscriptionHero from '@/components/billing/SubscriptionHero';
import FeatureUsageCard from '@/components/billing/FeatureUsageCard';
import { UpgradeFlowModal } from '@/components/billing/UpgradeFlowModal';
import { DowngradeWarningModal } from '@/components/billing/DowngradeWarningModal';
import { CancellationFlowModal } from '@/components/billing/CancellationFlowModal';
import { PauseFlowModal } from '@/components/billing/PauseFlowModal';
import { ReactivationFlowModal } from '@/components/billing/ReactivationFlowModal';
import { InvoiceModal } from '@/components/billing/InvoiceModal';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useSettings } from '@/lib/settings-context';
import { calculateProration, calculateCancellationRefund, ProratedPrice } from '@/lib/proration';
import { EyeIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface CurrentSubscription {
  subscription: Record<string, unknown>;
  plan: Record<string, unknown>;
  tenant: Record<string, unknown>;
  lastPayment: Record<string, unknown> | null;
  lastInvoice: Record<string, unknown> | null;
  usageRecords: Record<string, unknown>[];
}

interface UpgradeRequest {
  id: number;
  tenantId: string;
  currentPlan: string;
  newPlan: string;
  amountDue: number;
  status: 'pending' | 'payment_submitted' | 'approved' | 'applied' | 'cancelled' | 'expired';
  requestedAt: string;
  paymentSubmittedAt?: string;
  approvedAt?: string;
  appliedAt?: string;
  cancelledAt?: string;
  expiresAt?: string;
  gcashTransactionId?: string;
  paymentProof?: string;
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
  const [upgradeRequest, setUpgradeRequest] = useState<UpgradeRequest | null>(null);
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
  const [reactivationModal, setReactivationModal] = useState<{ isOpen: boolean; planId?: string }>({
    isOpen: false,
  });
  const [invoiceModal, setInvoiceModal] = useState<{ isOpen: boolean; invoice?: Invoice }>({
    isOpen: false
  });
  const [paymentProofModal, setPaymentProofModal] = useState(false);
  const [cancelUpgradeModal, setCancelUpgradeModal] = useState(false);

  // Theme styling
  const theme = {
    primary: settings.brandColors.primary,
    secondary: settings.brandColors.secondary,
    accent: settings.brandColors.accent,
    background: settings.brandColors.background,
    surface: settings.brandColors.surface,
    text: settings.brandColors.text,
  };

  const loadSubscriptionData = async () => {
    try {
      const [currentRes, upgradeRes, invoicesRes, plansRes] = await Promise.all([
        fetch('/api/tenant/subscriptions/current', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }),
        fetch('/api/tenant/subscriptions/upgrade-request', {
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

      if (upgradeRes.ok) {
        const data = await upgradeRes.json();
        setUpgradeRequest(data.upgradeRequest);
      } else if (upgradeRes.status !== 404) {
        console.error('Failed to fetch upgrade request:', upgradeRes.status);
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
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await loadSubscriptionData();
      setLoading(false);
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(pesos);
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

  const handleReactivationClick = (planId: string) => {
    setReactivationModal({ isOpen: true, planId });
  };

  const handleDowngradeClick = (planId: string) => {
    setDowngradeModal({ isOpen: true, planId });
  };

  const handleReactivationConfirm = async () => {
    // This is now handled by the ReactivationFlowModal when payment details are provided
    // If no payment details, this would submit a reactivation request without payment
    if (!reactivationModal.planId) return;

    try {
      const res = await fetch('/api/tenant/subscriptions/reactivation-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: reactivationModal.planId })
      });

      if (res.ok) {
        const data = await res.json();

        // Refresh data
        await loadSubscriptionData();

        setReactivationModal({ isOpen: false });
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Reactivation request failed');
      }
    } catch (error) {
      console.error('Reactivation request error:', error);
      throw error;
    }
  };

  const handleUpgradeConfirm = async () => {
    if (!upgradeModal.planId) return;

    try {
      const res = await fetch('/api/tenant/subscriptions/upgrade-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPlanId: upgradeModal.planId })
      });

      if (res.ok) {
        const data = await res.json();

        // Refresh upgrade request data
        const upgradeRes = await fetch('/api/tenant/subscriptions/upgrade-request', {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (upgradeRes.ok) {
          const upgradeData = await upgradeRes.json();
          setUpgradeRequest(upgradeData.upgradeRequest);
        }

        setUpgradeModal({ isOpen: false });
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Upgrade request failed');
      }
    } catch (error) {
      console.error('Upgrade request error:', error);
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

  const handleCancelUpgrade = async () => {
    if (!upgradeRequest) return;

    try {
      const res = await fetch(`/api/tenant/subscriptions/upgrade-request/${upgradeRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' })
      });

      if (res.ok) {
        setUpgradeRequest(null);
        setCancelUpgradeModal(false);
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Failed to cancel upgrade request');
      }
    } catch (error) {
      console.error('Cancel upgrade error:', error);
      alert(error instanceof Error ? error.message : 'Failed to cancel upgrade request');
    }
  };

  const handleSubmitPaymentProof = async (gcashTransactionId: string, paymentProof: File) => {
    if (!upgradeRequest) return;

    try {
      const formData = new FormData();
      formData.append('gcashTransactionId', gcashTransactionId);
      formData.append('paymentProof', paymentProof);

      const res = await fetch(`/api/tenant/subscriptions/upgrade-request/${upgradeRequest.id}/submit`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        // Refresh upgrade request data
        const upgradeRes = await fetch('/api/tenant/subscriptions/upgrade-request', {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (upgradeRes.ok) {
          const upgradeData = await upgradeRes.json();
          setUpgradeRequest(upgradeData.upgradeRequest);
        }

        setPaymentProofModal(false);
      } else {
        let errorMessage = 'Failed to submit payment proof';
        try {
          const error = await res.json();
          errorMessage = error.error || errorMessage;
        } catch (parseError) {
          errorMessage = `Server error: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Submit payment proof error:', error);
      throw error;
    }
  };

  // Calculate proration for upgrade modal
  const getUpgradeProration = (): ProratedPrice | null => {
    if (!upgradeModal.planId || !currentSub) return null;

    // CRITICAL: Use plan prices from API response instead of hardcoded values
    const allPlanPrices = (currentSub as any).allPlans?.reduce((acc: Record<string, number>, plan: any) => {
      acc[plan.id] = plan.price || 0;
      return acc;
    }, {}) || {};

    const currentPrice = allPlanPrices[(currentSub as any).subscription.planId as string] || 0;
    const newPrice = allPlanPrices[upgradeModal.planId] || 0;

    console.log('[Billing Page] Upgrade proration:', { currentPrice, newPrice, allPlanPrices });

    return calculateProration(
      currentPrice,
      newPrice,
      new Date((currentSub as any).subscription.currentPeriodStart as string),
      new Date((currentSub as any).subscription.currentPeriodEnd as string)
    );
  };

  // Calculate proration for downgrade modal
  const getDowngradeProration = (): ProratedPrice | null => {
    if (!downgradeModal.planId || !currentSub) return null;

    // CRITICAL: Use plan prices from API response instead of hardcoded values
    const allPlanPrices = (currentSub as any).allPlans?.reduce((acc: Record<string, number>, plan: any) => {
      acc[plan.id] = plan.price || 0;
      return acc;
    }, {}) || {};

    const currentPrice = allPlanPrices[(currentSub as any).subscription.planId as string] || 0;
    const newPrice = allPlanPrices[downgradeModal.planId] || 0;

    console.log('[Billing Page] Downgrade proration:', { currentPrice, newPrice, allPlanPrices });

    return calculateProration(
      currentPrice,
      newPrice,
      new Date((currentSub as any).subscription.currentPeriodStart as string),
      new Date((currentSub as any).subscription.currentPeriodEnd as string)
    );
  };

  // Calculate proration for reactivation modal
  const getReactivationProration = (): ProratedPrice | null => {
    if (!reactivationModal.planId || !currentSub) return null;

    // For reactivation, calculate full price of the reactivation plan
    // Since the subscription is cancelled, there's no proration - full amount due
    const allPlanPrices = (currentSub as any).allPlans?.reduce((acc: Record<string, number>, plan: any) => {
      acc[plan.id] = plan.price || 0;
      return acc;
    }, {}) || {};

    const reactivationPrice = allPlanPrices[reactivationModal.planId] || 0;

    console.log('[Billing Page] Reactivation proration:', { reactivationPrice, allPlanPrices });

    // For reactivation, return full price with no proration
    return {
      currentCycleDays: 0,
      totalCycleDays: 0,
      dailyRate: 0,
      remainingBalance: 0,
      newPlanDailyRate: reactivationPrice,
      creditApplied: 0,
      amountDue: reactivationPrice,
      description: 'Full price for subscription reactivation'
    };
  };

  // Calculate refund for cancellation modal
  const getCancellationRefund = (): { refundAmount: number; explanation: string } | null => {
    if (!currentSub) return null;

    // CRITICAL: Use plan prices from API response instead of hardcoded values
    const allPlanPrices = (currentSub as any).allPlans?.reduce((acc: Record<string, number>, plan: any) => {
      acc[plan.id] = plan.price || 0;
      return acc;
    }, {}) || {};

    const currentPrice = allPlanPrices[(currentSub as any).subscription.planId as string] || 0;

    console.log('[Billing Page] Cancellation refund:', { currentPrice, allPlanPrices });

    return calculateCancellationRefund(
      currentPrice,
      new Date((currentSub as any).subscription.currentPeriodStart as string),
      new Date((currentSub as any).subscription.currentPeriodEnd as string)
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
          onReactivate={() => handleReactivationClick((currentSub.subscription as Record<string, unknown>).planId as string)}
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
                      {(currentSub.subscription as Record<string, unknown>).status === 'cancelled'
                        ? 'No upcoming charges'
                        : formatPrice((currentSub.subscription as Record<string, unknown>).nextPaymentAmount as number || currentSub.plan.price as number)}
                    </p>
                    <p className="text-sm mt-2" style={{ color: `${theme.text}99` }}>
                      {(currentSub.subscription as Record<string, unknown>).status === 'cancelled'
                        ? 'Subscription cancelled'
                        : (currentSub.subscription as Record<string, unknown>).nextPaymentDate
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

                {/* Auto-renew toggle or cancellation status */}
                <div className="mt-6 border-t pt-6" style={{ borderColor: `${theme.primary}20` }}>
                  {(currentSub.subscription as Record<string, unknown>).status === 'cancelled' ? (
                    <div>
                      <p className="font-medium" style={{ color: theme.text }}>Subscription Status</p>
                      <p className="text-sm mt-1" style={{ color: '#ef4444' }}>
                        Your subscription has been cancelled
                      </p>
                      <p className="text-sm mt-2" style={{ color: `${theme.text}99` }}>
                        You can reactivate your subscription at any time using the button above
                      </p>
                    </div>
                  ) : (
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
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
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
              <div>
                <h3 className="text-xl font-bold" style={{ color: theme.text }}>Plan Comparison</h3>
                {(currentSub.subscription as Record<string, unknown>).status === 'cancelled' && (
                  <div className="mt-4 p-4 rounded-lg border" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
                    <p className="text-sm" style={{ color: '#dc2626' }}>
                      <strong>Your subscription has been cancelled.</strong> Choose a plan below to reactivate your subscription. 
                      You&apos;ll be charged the full amount for the selected plan.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {plans.map((plan) => {
                  const isCurrent = plan.id === currentSub.subscription.planId;
                  const isCancelled = (currentSub.subscription as Record<string, unknown>).status === 'cancelled';
                  const wasCurrentPlan = isCurrent && isCancelled;
                  
                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg border-2 p-6 transition-all"
                      style={{
                        borderColor: isCurrent && !isCancelled ? theme.primary : `${theme.primary}20`,
                        backgroundColor: isCurrent && !isCancelled ? `${theme.primary}10` : theme.background,
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
                        disabled={isCurrent && !isCancelled}
                        onClick={() => {
                          if (isCurrent && !isCancelled) return;
                          
                          // For cancelled subscriptions, any plan change is effectively reactivation
                          if (isCancelled) {
                            if (plan.id === currentSub.subscription.planId) {
                              // Same plan reactivation
                              handleReactivationClick(plan.id);
                            } else {
                              // Different plan - treat as upgrade for reactivation
                              handleUpgradeClick(plan.id);
                            }
                            return;
                          }

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
                          backgroundColor: (isCurrent && !isCancelled) ? `${theme.text}20` : theme.primary,
                          color: (isCurrent && !isCancelled) ? theme.text : 'white',
                        }}
                      >
                        {isCurrent && !isCancelled ? 'Current Plan' : 
                         isCancelled ? (plan.id === currentSub.subscription.planId ? 'Reactivate' : 'Upgrade to Reactivate') : 
                         'Upgrade'}
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

      {currentSub && reactivationModal.planId && getReactivationProration() && (
        <ReactivationFlowModal
          isOpen={reactivationModal.isOpen}
          subscriptionId={(currentSub.subscription as Record<string, unknown>).id as number}
          currentPlan={{
            name: currentPlan.name,
            price: currentPlan.price ?? 0
          }}
          reactivationPlan={{
            name: (plans.find((p) => p.id === reactivationModal.planId)?.name) || currentPlan.name,
            price: (plans.find((p) => p.id === reactivationModal.planId)?.price) ?? currentPlan.price ?? 0,
            features: (plans.find((p) => p.id === reactivationModal.planId)?.features) || currentPlan.features
          }}
          proration={getReactivationProration()!}
          onConfirm={handleReactivationConfirm}
          onCancel={() => setReactivationModal({ isOpen: false })}
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

      {/* Payment Proof Modal */}
      {paymentProofModal && upgradeRequest && (
        <PaymentProofModal
          isOpen={paymentProofModal}
          upgradeRequest={upgradeRequest}
          onSubmit={handleSubmitPaymentProof}
          onCancel={() => setPaymentProofModal(false)}
          theme={theme}
        />
      )}

      {/* Cancel Upgrade Modal */}
      {cancelUpgradeModal && upgradeRequest && (
        <CancelUpgradeModal
          isOpen={cancelUpgradeModal}
          upgradeRequest={upgradeRequest}
          onConfirm={handleCancelUpgrade}
          onCancel={() => setCancelUpgradeModal(false)}
          theme={theme}
        />
      )}
    </div>
  );
}

// Payment Proof Modal Component
function PaymentProofModal({
  isOpen,
  upgradeRequest,
  onSubmit,
  onCancel,
  theme
}: {
  isOpen: boolean;
  upgradeRequest: UpgradeRequest;
  onSubmit: (gcashTransactionId: string, paymentProof: File) => Promise<void>;
  onCancel: () => void;
  theme: any;
}) {
  const [gcashTransactionId, setGcashTransactionId] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gcashTransactionId.trim() || !paymentProof) {
      setError('Please provide both GCash transaction ID and payment proof image.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await onSubmit(gcashTransactionId.trim(), paymentProof);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit payment proof');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      setPaymentProof(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
        style={{ backgroundColor: theme.background }}
      >
        {/* Header with gradient background */}
        <div 
          className="px-6 py-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
              💳
            </div>
            <h3 className="text-2xl font-bold">Payment Proof Submission</h3>
          </div>
          <p className="text-blue-100 text-sm mt-3">
            Amount due: <span className="text-white font-bold text-lg">₱{(upgradeRequest.amountDue / 100).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
          </p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-6 py-8 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Amount Summary Card */}
          <div className="rounded-xl p-4 border-2" style={{ borderColor: `${theme.primary}20`, backgroundColor: `${theme.primary}08` }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: `${theme.text}99` }}>Payment for:</p>
                <p className="text-lg font-bold mt-1" style={{ color: theme.text }}>
                  {upgradeRequest.currentPlan} → {upgradeRequest.newPlan}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold" style={{ color: `${theme.text}99` }}>Total Amount</p>
                <p className="text-2xl font-bold mt-1" style={{ color: theme.primary }}>
                  ₱{(upgradeRequest.amountDue / 100).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>

          {/* GCash Transaction ID */}
          <div>
            <label className="block text-sm font-bold mb-3" style={{ color: theme.text }}>
              GCash Transaction ID / Reference Number *
            </label>
            <input
              type="text"
              value={gcashTransactionId}
              onChange={(e) => setGcashTransactionId(e.target.value)}
              className="w-full px-4 py-3 border-2 rounded-lg transition-all focus:ring-2 focus:ring-offset-0 focus:border-transparent font-mono"
              style={{
                borderColor: gcashTransactionId ? theme.primary : '#e5e7eb',
                backgroundColor: `${theme.primary}05`,
                outlineColor: theme.primary
              }}
              placeholder="e.g., 123456789012345"
              required
            />
            <p className="text-xs mt-2" style={{ color: `${theme.text}99` }}>
              You can find this in your GCash app under transaction history or receipt
            </p>
          </div>

          {/* Payment Proof Upload */}
          <div>
            <label className="block text-sm font-bold mb-3" style={{ color: theme.text }}>
              Payment Proof Screenshot *
            </label>
            
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="sr-only"
                id="proof-upload"
                required
              />
              <label
                htmlFor="proof-upload"
                className={`block p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all text-center ${
                  paymentProof
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
                style={{
                  borderColor: paymentProof ? '#10b981' : `${theme.primary}40`,
                  backgroundColor: paymentProof ? '#f0fdf4' : `${theme.primary}08`
                }}
              >
                {preview ? (
                  <div className="space-y-3">
                    <div className="h-32 relative rounded-lg overflow-hidden bg-gray-100">
                      <Image 
                        src={preview} 
                        alt="Payment proof preview" 
                        width={200}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent flex items-center justify-center">
                        <span className="text-white font-semibold">✓ Image selected</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium" style={{ color: '#10b981' }}>
                      {paymentProof?.name || 'Image selected'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-semibold" style={{ color: theme.text }}>
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs" style={{ color: `${theme.text}99` }}>
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg p-4 bg-red-50 border border-red-200"
            >
              <p className="text-sm font-semibold text-red-600">{error}</p>
            </motion.div>
          )}

          {/* Info Box */}
          <div className="rounded-lg p-4" style={{ backgroundColor: `${theme.primary}08` }}>
            <div>
              <p className="text-sm font-semibold mb-2" style={{ color: theme.text }}>Please ensure your proof includes:</p>
              <ul className="text-xs space-y-1" style={{ color: `${theme.text}99` }}>
                <li>• GCash transaction reference number</li>
                <li>• Amount sent</li>
                <li>• Recipient details</li>
                <li>• Timestamp of the transaction</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t" style={{ borderColor: `${theme.primary}20` }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 rounded-lg font-semibold transition-all border-2"
              style={{
                borderColor: `${theme.text}20`,
                color: theme.text,
                backgroundColor: 'transparent'
              }}
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={submitting || !gcashTransactionId.trim() || !paymentProof}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {submitting ? (
                <span>Submitting...</span>
              ) : (
                <span>Submit Payment</span>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Cancel Upgrade Modal Component
function CancelUpgradeModal({
  isOpen,
  upgradeRequest,
  onConfirm,
  onCancel,
  theme
}: {
  isOpen: boolean;
  upgradeRequest: UpgradeRequest;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  theme: any;
}) {
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    try {
      setConfirming(true);
      await onConfirm();
    } catch (err) {
      // Error is handled in the parent component
    } finally {
      setConfirming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" style={{ backgroundColor: theme.background }}>
        <h3 className="text-xl font-bold mb-4" style={{ color: theme.text }}>Cancel Upgrade Request</h3>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Are you sure you want to cancel your upgrade request from <strong>{upgradeRequest.currentPlan}</strong> to <strong>{upgradeRequest.newPlan}</strong>?
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  This action cannot be undone. Your upgrade request will be permanently cancelled.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Keep Request
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-700 hover:to-rose-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {confirming ? 'Cancelling...' : 'Cancel Upgrade'}
          </button>
        </div>
      </div>
    </div>
  );
}
