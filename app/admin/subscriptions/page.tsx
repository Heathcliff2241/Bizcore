/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  } from '@heroicons/react/24/outline'

interface SubscriptionPlan {
  id: string
  name: string
  price: number
  billingCycle: 'monthly' | 'annual'
  description: string
  features: string[]
  tenantCount: number
  isActive: boolean
}

interface Subscription {
  id: string
  tenantId: string
  tenantName: string
  plan: string
  price: number
  billingCycle: 'monthly' | 'annual'
  status: 'active' | 'cancelled' | 'expired'
  startDate: string
  renewalDate: string
  createdAt: string
}

interface PendingPayment {
  id: string
  subscriptionId: string
  planName: string
  amount: number
  currency: string
  gcashTransactionId: string
  submittedAt: string
  expiresAt: string
  status: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    billingCycle: 'monthly',
    description: 'Perfect for getting started',
    features: ['Up to 1 tenant', '5 team members', 'Basic analytics', 'Community support'],
    tenantCount: 0,
    isActive: true,
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 99,
    billingCycle: 'monthly',
    description: 'For small businesses',
    features: ['Up to 5 tenants', '20 team members', 'Advanced analytics', 'Email support'],
    tenantCount: 0,
    isActive: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 299,
    billingCycle: 'monthly',
    description: 'For growing businesses',
    features: ['Up to 20 tenants', '100 team members', 'Real-time analytics', 'Priority support'],
    tenantCount: 0,
    isActive: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 999,
    billingCycle: 'monthly',
    description: 'For large enterprises',
    features: ['Unlimited tenants',       'Unlimited team members',       'Custom analytics',       '24/7 dedicated support'    ],
    tenantCount: 0,
    isActive: true,
  },
]

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(DEFAULT_PLANS)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [payments, setPayments] = useState<PendingPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'plans' | 'subscriptions' | 'payments'>('plans')
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const [editForm, setEditForm] = useState<Partial<SubscriptionPlan>>({})
  const [verifying, setVerifying] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalData, setModalData] = useState<PendingPayment | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [action, setAction] = useState<'verify' | 'reject'>('verify')
  const [showPaymentDetails, setShowPaymentDetails] = useState(false)
  const [selectedPaymentDetails, setSelectedPaymentDetails] = useState<PendingPayment | null>(null)
  const [paymentMetadata, setPaymentMetadata] = useState<any>(null)
  
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      // Fetch subscription plans
      const plansResponse = await fetch('/api/admin/subscriptions/plans')
      if (plansResponse.ok) {
        const plansData = await plansResponse.json()
        setPlans(plansData.plans || DEFAULT_PLANS)
      }

      // Fetch active subscriptions
      const subsResponse = await fetch('/api/admin/subscriptions')
      if (subsResponse.ok) {
        const subsData = await subsResponse.json()
        setSubscriptions(subsData.subscriptions || [])
      }

      // Fetch pending payments
      const paymentsResponse = await fetch('/api/admin/payments')
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json()
        setPayments(paymentsData || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      // Use defaults on error
      setPlans(DEFAULT_PLANS)
    } finally {
      setLoading(false)
    }
  }

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan)
    setEditForm({
      name: plan.name,
      price: plan.price,
      description: plan.description,
    })
  }

  const handleSavePlan = async () => {
    if (!editingPlan) return

    try {
      const response = await fetch(`/api/admin/subscriptions/plans/${editingPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) throw new Error('Failed to update plan')

      setPlans(
        plans.map((p) =>
          p.id === editingPlan.id ? { ...p, ...editForm } : p
        )
      )
      setEditingPlan(null)
    } catch (error) {
      console.error('Error updating plan:', error)
    }
  }

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return

    try {
      const response = await fetch(`/api/admin/subscriptions/plans/${planId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete plan')

      setPlans(plans.filter((p) => p.id !== planId))
    } catch (error) {
      console.error('Error deleting plan:', error)
    }
  }

  const openPaymentModal = (payment: PendingPayment, paymentAction: 'verify' | 'reject') => {
    setModalData(payment)
    setAction(paymentAction)
    setAdminNotes('')
    setShowModal(true)
  }

  const openPaymentDetailsView = async (payment: PendingPayment) => {
    try {
      setSelectedPaymentDetails(payment)
      // Fetch payment with metadata
      const res = await fetch(`/api/admin/payments/${payment.id}`)
      if (res.ok) {
        const data = await res.json()
        setPaymentMetadata(data.metadata || {})
      }
      setShowPaymentDetails(true)
    } catch (error) {
      console.error('Error fetching payment details:', error)
    }
  }

  const handlePaymentSubmit = async () => {
    if (!modalData) return

    try {
      setVerifying(modalData.id)
      const res = await fetch('/api/admin/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: modalData.id,
          action,
          adminNotes,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }

      setShowModal(false)
      fetchData()
    } catch (error) {
      console.error('Error processing payment:', error)
      alert(error instanceof Error ? error.message : 'Failed to process payment')
    } finally {
      setVerifying(null)
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gradient-to-br from-white via-blue-50/40 to-white p-8 relative"
    >
      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <motion.div
          animate={{ x: [-60, 60, -60], y: [0, 30, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute rounded-full opacity-10 left-0 top-0 w-96 h-96 blur-3xl bg-gradient-to-br from-blue-600 to-blue-400"
        />
        <motion.div
          animate={{ x: [60, -60, 60], y: [0, -30, 0] }}
          transition={{ duration: 35, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-80 h-80 rounded-full opacity-8 right-0 top-1/3 blur-3xl bg-gradient-to-br from-blue-700 to-indigo-600"
        />
      </div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-4xl font-bold text-blue-900">Subscriptions</h1>
          <p className="text-blue-700 mt-2">Manage subscription plans and active subscriptions</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100/50">
            <p className="text-sm text-blue-600">Active Plans</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">{plans.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100/50">
            <p className="text-sm text-blue-600">Active Subscriptions</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {subscriptions.filter((s) => s.status === 'active').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100/50">
            <p className="text-sm text-blue-600">Monthly Revenue</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">
              ₱{subscriptions
                .filter((s) => s.status === 'active' && s.billingCycle === 'monthly')
                .reduce((sum, s) => sum + s.price, 0)
                .toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100/50">
            <p className="text-sm text-blue-600">Annual Revenue</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">
              ₱{(
                subscriptions
                  .filter((s) => s.status === 'active' && s.billingCycle === 'annual')
                  .reduce((sum, s) => sum + s.price, 0)
              ).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          variants={itemVariants}
          className="flex gap-2 mb-6 border-b border-blue-100/50"
        >
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'plans'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-blue-600 hover:text-blue-900'
            }`}
          >
            Plans
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'subscriptions'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-blue-600 hover:text-blue-900'
            }`}
          >
            Subscriptions
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'payments'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-blue-600 hover:text-blue-900'
            }`}
          >
            Payments ({payments.length})
          </button>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Plans Tab */}
            {activeTab === 'plans' && (
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {plans.map((plan) => (
                  <motion.div
                    key={plan.id}
                    whileHover={{ translateY: -5 }}
                    className="bg-white rounded-xl shadow-sm border border-blue-100/50 overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                          <p className="text-sm text-slate-600 mt-1">{plan.description}</p>
                        </div>
                        <div className="flex gap-1">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            onClick={() => handleEditPlan(plan)}
                            className="p-2 rounded-lg hover:bg-blue-100 text-blue-600"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            onClick={() => handleDeletePlan(plan.id)}
                            className="p-2 rounded-lg hover:bg-red-100 text-red-600"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>

                      <div className="mb-6">
                        <div className="flex items-baseline">
                          <span className="text-3xl font-bold text-slate-900">
                            ₱{plan.price.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </span>
                          <span className="text-slate-600 ml-2">
                            /{plan.billingCycle === 'monthly' ? 'month' : 'year'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {plan.tenantCount} tenant{plan.tenantCount !== 1 ? 's' : ''}
                        </p>
                      </div>

                      <div className="space-y-3 mb-6">
                        {plan.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckIcon className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-slate-700">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            plan.isActive
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Subscriptions Tab */}
            {activeTab === 'subscriptions' && (
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-xl shadow-sm border border-blue-100/50 overflow-hidden"
              >
                {subscriptions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500">No active subscriptions</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-blue-50 border-b border-blue-100/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-medium text-blue-900">
                            Tenant
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-slate-700">
                            Plan
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-slate-700">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-slate-700">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-slate-700">
                            Started
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-slate-700">
                            Renewal
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {subscriptions.map((sub, idx) => (
                          <motion.tr
                            key={sub.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="border-b border-blue-100/50 hover:bg-blue-50 transition-colors"
                          >
                            <td className="px-6 py-4 font-medium text-blue-900">
                              {sub.tenantName}
                            </td>
                            <td className="px-6 py-4 text-blue-700">{sub.plan}</td>
                            <td className="px-6 py-4 font-medium text-blue-900">
                              ₱{sub.price.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/{sub.billingCycle === 'monthly' ? 'mo' : 'yr'}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                  sub.status === 'active'
                                    ? 'bg-blue-100 text-blue-800'
                                    : sub.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-slate-100 text-slate-800'
                                }`}
                              >
                                {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {new Date(sub.startDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {new Date(sub.renewalDate).toLocaleDateString()}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <motion.div
                variants={itemVariants}
              >
                {payments.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm border border-blue-100/50 p-12 text-center">
                    <ClockIcon className="w-12 h-12 text-blue-300 mx-auto mb-4" />
                    <p className="text-slate-600 text-lg">No pending payments at the moment</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payments.map((payment) => {
                      const isExpired = new Date(payment.expiresAt) < new Date()
                      return (
                        <motion.div
                          key={payment.id}
                          variants={itemVariants}
                          className={`bg-white rounded-lg shadow-sm border-2 transition-all hover:shadow-md p-6 ${
                            isExpired ? 'border-red-200 bg-red-50/30' : 'border-amber-200'
                          }`}
                        >
                          {/* Header with Plan and Status */}
                          <div className="flex items-start justify-between mb-5">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-slate-900">
                                  {payment.planName}
                                </h3>
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                  isExpired 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {isExpired ? 'EXPIRED' : 'Pending Verification'}
                                </span>
                              </div>
                              <p className="text-sm text-slate-600">Payment ID: {payment.id}</p>
                            </div>
                            {/* Amount Badge */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg px-4 py-3 text-right">
                              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Amount</p>
                              <p className="text-2xl font-bold text-blue-900">
                                ₱{(payment.amount / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5 pb-5 border-b border-slate-200">
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                                GCash Reference
                              </p>
                              <p className="text-sm font-mono bg-slate-100 rounded px-2 py-1 text-slate-900 break-all">
                                {payment.gcashTransactionId}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                                Submitted
                              </p>
                              <p className="text-sm text-slate-700">
                                {new Date(payment.submittedAt).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-slate-500">
                                {new Date(payment.submittedAt).toLocaleTimeString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                                Expires
                              </p>
                              <p className={`text-sm font-semibold ${
                                isExpired ? 'text-red-600' : 'text-slate-700'
                              }`}>
                                {new Date(payment.expiresAt).toLocaleDateString()}
                              </p>
                              <p className={`text-xs ${isExpired ? 'text-red-600' : 'text-slate-500'}`}>
                                {new Date(payment.expiresAt).toLocaleTimeString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                                Status
                              </p>
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                isExpired 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {isExpired ? 'Expired' : 'Pending'}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => openPaymentDetailsView(payment)}
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors font-medium"
                              title="View payment details and proof"
                            >
                              <EyeIcon className="w-5 h-5" />
                              View Details
                            </button>
                            <button
                              onClick={() => openPaymentModal(payment, 'verify')}
                              disabled={verifying === payment.id || isExpired}
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              title={isExpired ? 'Cannot approve expired payments' : 'Approve payment'}
                            >
                              <CheckCircleIcon className="w-5 h-5" />
                              Approve
                            </button>
                            <button
                              onClick={() => openPaymentModal(payment, 'reject')}
                              disabled={verifying === payment.id}
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Reject payment"
                            >
                              <XCircleIcon className="w-5 h-5" />
                              Reject
                            </button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Payment Verification Modal */}
      {showModal && modalData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full"
          >
            <div className="p-6 border-b border-blue-100/50">
              <h2 className="text-xl font-bold text-slate-900">
                {action === 'verify' ? 'Approve Payment' : 'Reject Payment'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-600 font-semibold">Plan</p>
                <p className="text-lg text-slate-900 font-semibold">{modalData.planName}</p>
              </div>

              <div>
                <p className="text-sm text-slate-600 font-semibold">Amount</p>
                <p className="text-2xl text-blue-600 font-bold">
                  ₱{(modalData.amount / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-600 font-semibold">Transaction Reference</p>
                <p className="text-sm font-mono text-slate-700">{modalData.gcashTransactionId}</p>
              </div>

              <div>
                <label className="block text-sm text-slate-600 font-semibold mb-2">
                  {action === 'verify' ? 'Approval Notes' : 'Rejection Reason'} (Optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={action === 'verify' ? 'Add any notes...' : 'Explain why this payment is being rejected...'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  rows={4}
                />
              </div>
            </div>

            <div className="p-6 border-t border-blue-100/50 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentSubmit}
                disabled={verifying === modalData.id}
                className={`flex-1 px-4 py-2 text-white rounded-lg font-semibold transition-colors ${
                  action === 'verify'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800'
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                } disabled:opacity-50`}
              >
                {verifying === modalData.id ? 'Processing...' : action === 'verify' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Payment Details Modal */}
      {showPaymentDetails && selectedPaymentDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-blue-100/50 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-900">Payment Details</h2>
              <button
                onClick={() => setShowPaymentDetails(false)}
                className="text-slate-500 hover:text-slate-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Payment Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-600 font-semibold mb-1">Plan Name</p>
                  <p className="text-lg text-slate-900 font-semibold">{selectedPaymentDetails.planName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-semibold mb-1">Amount</p>
                  <p className="text-lg text-blue-600 font-bold">
                    ₱{(selectedPaymentDetails.amount / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-semibold mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedPaymentDetails.status === 'approved' ? 'bg-green-100 text-green-800' :
                    selectedPaymentDetails.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedPaymentDetails.status.charAt(0).toUpperCase() + selectedPaymentDetails.status.slice(1)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-semibold mb-1">GCash Transaction ID</p>
                  <p className="text-sm font-mono text-slate-700 break-all">{selectedPaymentDetails.gcashTransactionId}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-semibold mb-1">Submitted At</p>
                  <p className="text-sm text-slate-700">{new Date(selectedPaymentDetails.submittedAt).toLocaleString('en-PH')}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-semibold mb-1">Expires At</p>
                  <p className="text-sm text-slate-700">{new Date(selectedPaymentDetails.expiresAt).toLocaleString('en-PH')}</p>
                </div>
              </div>

              {/* GCash Proof Image */}
              {paymentMetadata?.gcashProof && (
                <div className="border-t border-slate-200 pt-6">
                  <p className="text-sm text-slate-600 font-semibold mb-4">GCash Payment Proof</p>
                  <div className="flex justify-center">
                    <Image
                      src={paymentMetadata.gcashProof}
                      alt="GCash proof"
                      width={400}
                      height={300}
                      className="max-w-full h-auto rounded-lg border border-slate-300"
                    />
                  </div>
                </div>
              )}

              {/* Additional Metadata */}
              {paymentMetadata && Object.keys(paymentMetadata).length > 0 && paymentMetadata.gcashProof && (
                <div className="border-t border-slate-200 pt-6">
                  <p className="text-sm text-slate-600 font-semibold mb-3">Additional Information</p>
                  <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700">
                    <pre className="font-mono text-xs overflow-auto max-h-40">
                      {JSON.stringify(paymentMetadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-blue-100/50 flex gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowPaymentDetails(false)}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {editingPlan && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setEditingPlan(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Edit Plan</h2>
              <button
                onClick={() => setEditingPlan(null)}
                className="p-1 rounded-lg hover:bg-slate-100"
              >
                <XMarkIcon className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Plan Name
                </label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Price
                </label>
                <input
                  type="number"
                  value={editForm.price || 0}
                  onChange={(e) =>
                    setEditForm({ ...editForm, price: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editForm.description || ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditingPlan(null)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePlan}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 font-medium flex items-center justify-center gap-2"
              >
                <CheckIcon className="w-4 h-4" />
                Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}
