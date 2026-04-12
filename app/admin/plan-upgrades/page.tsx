/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
} from '@heroicons/react/24/outline'

interface UpgradeRequest {
  id: number
  tenantId: string
  tenantName: string
  currentPlan: string
  newPlan: string
  amountDue: number
  status: 'pending' | 'payment_submitted' | 'approved' | 'applied' | 'cancelled' | 'expired'
  requestedAt: string
  paymentSubmittedAt?: string
  approvedAt?: string
  appliedAt?: string
  cancelledAt?: string
  expiresAt?: string
  paymentId?: string
  gcashTransactionId?: string
  paymentProof?: string
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

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800',
    icon: ClockIcon,
  },
  payment_submitted: {
    label: 'Payment Submitted',
    color: 'bg-blue-100 text-blue-800',
    icon: EyeIcon,
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircleIcon,
  },
  applied: {
    label: 'Applied',
    color: 'bg-emerald-100 text-emerald-800',
    icon: CheckIcon,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-800',
    icon: XMarkIcon,
  },
  expired: {
    label: 'Expired',
    color: 'bg-red-100 text-red-800',
    icon: ExclamationTriangleIcon,
  },
}

export default function PlanUpgradesPage() {
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'payment_submitted' | 'approved' | 'applied'>('all')
  const [verifying, setVerifying] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalData, setModalData] = useState<UpgradeRequest | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [action, setAction] = useState<'approve' | 'reject'>('approve')
  const [showPaymentDetails, setShowPaymentDetails] = useState(false)
  const [selectedPaymentDetails, setSelectedPaymentDetails] = useState<UpgradeRequest | null>(null)

  useEffect(() => {
    fetchUpgradeRequests()
  }, [])

  const fetchUpgradeRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/upgrade-requests')
      if (response.ok) {
        const data = await response.json()
        setUpgradeRequests(data.upgradeRequests || [])
      }
    } catch (error) {
      console.error('Error fetching upgrade requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const openModal = (request: UpgradeRequest, requestAction: 'approve' | 'reject') => {
    setModalData(request)
    setAction(requestAction)
    setAdminNotes('')
    setShowModal(true)
  }

  const openPaymentDetailsView = (request: UpgradeRequest) => {
    setSelectedPaymentDetails(request)
    setShowPaymentDetails(true)
  }

  const handleSubmit = async () => {
    if (!modalData) return

    try {
      setVerifying(modalData.id)
      const res = await fetch(`/api/admin/upgrade-requests/${modalData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          adminNotes,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }

      setShowModal(false)
      fetchUpgradeRequests()
    } catch (error) {
      console.error('Error processing upgrade request:', error)
      alert(error instanceof Error ? error.message : 'Failed to process upgrade request')
    } finally {
      setVerifying(null)
    }
  }

  const filteredRequests = upgradeRequests.filter(request => {
    if (activeTab === 'all') return true
    return request.status === activeTab
  })

  const getTabCount = (status: string) => {
    if (status === 'all') return upgradeRequests.length
    return upgradeRequests.filter(r => r.status === status).length
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
          <div className="flex items-center gap-3 mb-2">
            <ArrowUpIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-blue-900">Plan Upgrades</h1>
          </div>
          <p className="text-blue-700 mt-2">Manage tenant plan upgrade requests and payment verification</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8"
        >
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100/50">
            <p className="text-sm text-blue-600">Total Requests</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">{upgradeRequests.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100/50">
            <p className="text-sm text-blue-600">Pending</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {getTabCount('pending')}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100/50">
            <p className="text-sm text-blue-600">Payment Submitted</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {getTabCount('payment_submitted')}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100/50">
            <p className="text-sm text-blue-600">Approved</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {getTabCount('approved')}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100/50">
            <p className="text-sm text-blue-600">Applied</p>
            <p className="text-3xl font-bold text-emerald-600 mt-2">
              {getTabCount('applied')}
            </p>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          variants={itemVariants}
          className="flex gap-2 mb-6 border-b border-blue-100/50 overflow-x-auto"
        >
          {[
            { key: 'all', label: 'All Requests' },
            { key: 'pending', label: 'Pending' },
            { key: 'payment_submitted', label: 'Payment Submitted' },
            { key: 'approved', label: 'Approved' },
            { key: 'applied', label: 'Applied' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === key
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-blue-600 hover:text-blue-900'
              }`}
            >
              {label} ({getTabCount(key)})
            </button>
          ))}
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <motion.div variants={itemVariants} className="space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-20">
                <ArrowUpIcon className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-blue-900 mb-2">No upgrade requests found</h3>
                <p className="text-blue-600">There are no upgrade requests in this category.</p>
              </div>
            ) : (
              filteredRequests.map((request) => {
                const statusInfo = statusConfig[request.status]
                const StatusIcon = statusInfo.icon
                const isExpired = request.expiresAt && new Date(request.expiresAt) < new Date()

                return (
                  <motion.div
                    key={request.id}
                    variants={itemVariants}
                    className={`bg-white rounded-lg shadow-sm border-2 transition-all hover:shadow-md p-6 ${
                      isExpired && request.status === 'payment_submitted'
                        ? 'border-red-200 bg-red-50/30'
                        : 'border-blue-100'
                    }`}
                  >
                    {/* Header with Tenant and Status */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-slate-900">
                            {request.tenantName}
                          </h3>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                            <StatusIcon className="w-4 h-4 inline mr-1" />
                            {statusInfo.label}
                          </span>
                          {isExpired && request.status === 'payment_submitted' && (
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              EXPIRED
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">Request ID: #{request.id}</p>
                        <p className="text-sm text-slate-600">
                          {request.currentPlan} → {request.newPlan}
                        </p>
                      </div>
                      {/* Amount Badge */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg px-4 py-3 text-right">
                        <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Amount Due</p>
                        <p className="text-2xl font-bold text-blue-900">
                          ₱{(request.amountDue / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5 pb-5 border-b border-slate-200">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          Requested
                        </p>
                        <p className="text-sm text-slate-700">
                          {new Date(request.requestedAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(request.requestedAt).toLocaleTimeString()}
                        </p>
                      </div>
                      {request.paymentSubmittedAt && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                            Payment Submitted
                          </p>
                          <p className="text-sm text-slate-700">
                            {new Date(request.paymentSubmittedAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(request.paymentSubmittedAt).toLocaleTimeString()}
                          </p>
                        </div>
                      )}
                      {request.expiresAt && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                            Expires
                          </p>
                          <p className={`text-sm font-semibold ${
                            isExpired ? 'text-red-600' : 'text-slate-700'
                          }`}>
                            {new Date(request.expiresAt).toLocaleDateString()}
                          </p>
                          <p className={`text-xs ${isExpired ? 'text-red-600' : 'text-slate-500'}`}>
                            {new Date(request.expiresAt).toLocaleTimeString()}
                          </p>
                        </div>
                      )}
                      {request.approvedAt && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                            Approved
                          </p>
                          <p className="text-sm text-slate-700">
                            {new Date(request.approvedAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(request.approvedAt).toLocaleTimeString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* GCash Reference if available */}
                    {request.gcashTransactionId && (
                      <div className="mb-5 pb-5 border-b border-slate-200">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                            GCash Reference
                          </p>
                          <p className="text-sm font-mono bg-slate-100 rounded px-2 py-1 text-slate-900 break-all">
                            {request.gcashTransactionId}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 justify-end">
                      {request.status === 'payment_submitted' && request.paymentProof && (
                        <button
                          onClick={() => openPaymentDetailsView(request)}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors font-medium"
                          title="View payment proof"
                        >
                          <EyeIcon className="w-5 h-5" />
                          View Payment Proof
                        </button>
                      )}
                      {request.status === 'payment_submitted' && !isExpired && (
                        <>
                          <button
                            onClick={() => openModal(request, 'approve')}
                            disabled={verifying === request.id}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <CheckCircleIcon className="w-5 h-5" />
                            Approve
                          </button>
                          <button
                            onClick={() => openModal(request, 'reject')}
                            disabled={verifying === request.id}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-700 hover:to-rose-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <XCircleIcon className="w-5 h-5" />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )
              })
            )}
          </motion.div>
        )}
      </div>

      {/* Approval/Rejection Modal */}
      {showModal && modalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              {action === 'approve' ? 'Approve' : 'Reject'} Upgrade Request
            </h3>
            <p className="text-slate-600 mb-4">
              {action === 'approve'
                ? `Approve the upgrade request for ${modalData.tenantName} from ${modalData.currentPlan} to ${modalData.newPlan}?`
                : `Reject the upgrade request for ${modalData.tenantName}?`
              }
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Admin Notes (Optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Add any notes about this decision..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={verifying === modalData.id}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  action === 'approve'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {verifying === modalData.id ? 'Processing...' : action === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Payment Proof Modal */}
      {showPaymentDetails && selectedPaymentDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Payment Proof</h3>
                <button
                  onClick={() => setShowPaymentDetails(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Tenant</p>
                    <p className="text-slate-900">{selectedPaymentDetails.tenantName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Amount</p>
                    <p className="text-slate-900">
                      ₱{(selectedPaymentDetails.amountDue / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500">GCash Reference</p>
                    <p className="text-slate-900 font-mono text-sm">{selectedPaymentDetails.gcashTransactionId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Submitted</p>
                    <p className="text-slate-900">
                      {selectedPaymentDetails.paymentSubmittedAt
                        ? new Date(selectedPaymentDetails.paymentSubmittedAt).toLocaleString()
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>

                {selectedPaymentDetails.paymentProof && (
                  <div>
                    <p className="text-sm font-semibold text-slate-500 mb-2">Payment Proof Image</p>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <Image
                        src={selectedPaymentDetails.paymentProof}
                        alt="Payment proof"
                        width={800}
                        height={600}
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}