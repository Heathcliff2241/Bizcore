'use client';

import { useEffect, useState } from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Toast utility
const toast = {
  success: (msg: string) => console.log('✓', msg),
  error: (msg: string) => console.error('✗', msg),
};

interface PendingPayment {
  id: string;
  subscriptionId: string;
  planName: string;
  amount: number;
  currency: string;
  gcashTransactionId: string;
  submittedAt: string;
  expiresAt: string;
  status: string;
}

interface VerificationModalData {
  paymentId: string;
  planName: string;
  amount: number;
  gcashTransactionId: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<VerificationModalData | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [action, setAction] = useState<'verify' | 'reject'>('verify');

  useEffect(() => {
    fetchPayments();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPayments, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/payments');
      if (!res.ok) throw new Error('Failed to fetch payments');
      const data = await res.json();
      setPayments(data);
    } catch (error) {
      toast.error('Failed to load payments');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (payment: PendingPayment, action: 'verify' | 'reject') => {
    setModalData({
      paymentId: payment.id,
      planName: payment.planName,
      amount: payment.amount,
      gcashTransactionId: payment.gcashTransactionId,
    });
    setAction(action);
    setAdminNotes('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!modalData) return;

    try {
      setVerifying(modalData.paymentId);
      const res = await fetch('/api/admin/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: modalData.paymentId,
          action,
          adminNotes,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      toast.success(
        action === 'verify'
          ? 'Payment verified and subscription activated'
          : 'Payment rejected'
      );
      setShowModal(false);
      fetchPayments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to process');
      console.error(error);
    } finally {
      setVerifying(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600">Loading payments...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/40 to-white p-8 relative">
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Link href="/admin" className="text-slate-600 hover:text-blue-600 transition-colors">
            <ArrowLeftIcon className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Payment Verification</h1>
            <p className="text-sm text-slate-600 mt-1">
              {payments.length} pending payment{payments.length !== 1 ? 's' : ''} awaiting verification
            </p>
          </div>
        </motion.div>

        {payments.length === 0 ? (
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-lg shadow-sm border border-blue-100/50 p-12 text-center"
          >
            <ClockIcon className="w-12 h-12 text-blue-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg">No pending payments at the moment</p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {payments.map((payment) => {
              const isExpired = new Date(payment.expiresAt) < new Date();

              return (
                <motion.div
                  key={payment.id}
                  variants={itemVariants}
                  className="bg-white rounded-lg shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {payment.planName}
                          </h3>
                          <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
                            Pending Verification
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Amount
                            </p>
                            <p className="text-xl font-bold text-slate-900 mt-1">
                              ₱{payment.amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Reference
                            </p>
                            <p className="text-sm font-mono text-slate-700 mt-1">
                              {payment.gcashTransactionId}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Submitted
                            </p>
                            <p className="text-sm text-slate-700 mt-1">
                              {new Date(payment.submittedAt).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Expires
                            </p>
                            <p
                              className={`text-sm font-semibold mt-1 ${
                                isExpired ? 'text-red-600' : 'text-slate-700'
                              }`}
                            >
                              {new Date(payment.expiresAt).toLocaleString()}
                              {isExpired && ' (EXPIRED)'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 ml-6">
                        <button
                          onClick={() => openModal(payment, 'verify')}
                          disabled={verifying === payment.id}
                          className="p-2 rounded-lg text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50"
                          title="Approve payment"
                        >
                          <CheckCircleIcon className="w-6 h-6" />
                        </button>
                        <button
                          onClick={() => openModal(payment, 'reject')}
                          disabled={verifying === payment.id}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                          title="Reject payment"
                        >
                          <XCircleIcon className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Verification Modal */}
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
                    ₱{modalData.amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  onClick={handleSubmit}
                  disabled={verifying === modalData.paymentId}
                  className={`flex-1 px-4 py-2 text-white rounded-lg font-semibold transition-colors ${
                    action === 'verify'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800'
                      : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                  } disabled:opacity-50`}
                >
                  {verifying === modalData.paymentId ? 'Processing...' : action === 'verify' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
