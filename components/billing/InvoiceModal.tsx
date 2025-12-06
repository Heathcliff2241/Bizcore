'use client';

import React, { useState } from 'react';
import { XMarkIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceModalProps {
  isOpen: boolean;
  invoice: {
    id: number;
    invoiceNumber: string;
    status: string;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    issuedAt: string;
    dueDate: string;
    paidAt?: string | null;
    lineItems: LineItem[];
  };
  tenantName: string;
  onClose: () => void;
  theme?: {
    primary: string;
    text: string;
    surface: string;
    background: string;
  };
}

export function InvoiceModal({
  isOpen,
  invoice,
  tenantName,
  onClose,
  theme = {
    primary: '#3B82F6',
    text: '#111827',
    surface: '#f9fafb',
    background: '#ffffff',
  },
}: InvoiceModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount / 100);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return { bg: '#d1fae5', text: '#065f46' };
      case 'issued':
        return { bg: '#dbeafe', text: '#0c4a6e' };
      case 'draft':
        return { bg: '#fef3c7', text: '#92400e' };
      case 'partial':
        return { bg: '#fed7aa', text: '#9a3412' };
      case 'overdue':
        return { bg: '#fee2e2', text: '#991b1b' };
      case 'failed':
      case 'refunded':
        return { bg: '#f3e8ff', text: '#6b21a8' };
      default:
        return { bg: '#f3f4f6', text: '#4b5563' };
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const element = document.getElementById('invoice-content');
      if (!element) {
        alert('Error: Invoice content not found');
        return;
      }

      // Dynamically import html2pdf only when needed (client-side only)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const html2pdf = (await import('html2pdf.js')).default as any;

      const opt = {
        margin: 10,
        filename: `invoice-${invoice.invoiceNumber}.pdf`,
        image: { type: 'png' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait' as const, unit: 'mm', format: 'a4' },
      };

      html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const statusColor = getStatusColor(invoice.status);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: theme.background }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b sticky top-0"
          style={{ borderColor: `${theme.primary}20`, backgroundColor: theme.background }}
        >
          <h2 className="text-2xl font-bold" style={{ color: theme.text }}>
            Invoice {invoice.invoiceNumber}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <XMarkIcon className="w-6 h-6" style={{ color: theme.text }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div id="invoice-content" style={{ backgroundColor: 'white', padding: '40px' }}>
            {/* Header */}
            <div
              className="flex justify-between items-start mb-8 pb-6"
              style={{ borderBottom: `2px solid ${theme.primary}` }}
            >
              <div>
                <h1 className="text-3xl font-bold" style={{ color: theme.primary }}>
                  BizCore
                </h1>
                <p style={{ color: '#666', fontSize: '14px' }}>
                  Business Management Platform
                </p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold" style={{ color: theme.primary }}>
                  INVOICE
                </h2>
                <p style={{ color: theme.primary, fontWeight: '600' }}>
                  {invoice.invoiceNumber}
                </p>
              </div>
            </div>

            {/* Billing Details */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3
                  className="text-xs font-bold uppercase mb-3"
                  style={{ color: theme.primary, letterSpacing: '0.5px' }}
                >
                  Bill To
                </h3>
                <p className="font-bold" style={{ color: theme.text }}>
                  {tenantName}
                </p>
              </div>
              <div className="text-right">
                <h3
                  className="text-xs font-bold uppercase mb-3"
                  style={{ color: theme.primary, letterSpacing: '0.5px' }}
                >
                  Invoice Details
                </h3>
                <p style={{ color: '#666', fontSize: '14px' }}>
                  <strong>Issued:</strong> {formatDate(invoice.issuedAt)}
                </p>
                <p style={{ color: '#666', fontSize: '14px' }}>
                  <strong>Due:</strong> {formatDate(invoice.dueDate)}
                </p>
                <p className="mt-2">
                  <span
                    className="inline-block px-3 py-1 rounded text-xs font-bold uppercase"
                    style={{
                      backgroundColor: statusColor.bg,
                      color: statusColor.text,
                    }}
                  >
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <table
              className="w-full mb-6"
              style={{ borderCollapse: 'collapse' }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6', borderBottom: `2px solid ${theme.primary}` }}>
                  <th
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: theme.text,
                      fontSize: '14px',
                    }}
                  >
                    Description
                  </th>
                  <th
                    style={{
                      padding: '12px',
                      textAlign: 'right',
                      fontWeight: '600',
                      color: theme.text,
                      fontSize: '14px',
                    }}
                  >
                    Qty
                  </th>
                  <th
                    style={{
                      padding: '12px',
                      textAlign: 'right',
                      fontWeight: '600',
                      color: theme.text,
                      fontSize: '14px',
                    }}
                  >
                    Unit Price
                  </th>
                  <th
                    style={{
                      padding: '12px',
                      textAlign: 'right',
                      fontWeight: '600',
                      color: theme.text,
                      fontSize: '14px',
                    }}
                  >
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item, index) => (
                  <tr
                    key={index}
                    style={{ borderBottom: '1px solid #e5e7eb' }}
                  >
                    <td style={{ padding: '12px', fontSize: '14px', color: theme.text }}>
                      {item.description}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontSize: '14px',
                        color: theme.text,
                      }}
                    >
                      {item.quantity}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontSize: '14px',
                        color: theme.text,
                      }}
                    >
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontSize: '14px',
                        color: theme.text,
                        fontWeight: '600',
                      }}
                    >
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div style={{ width: '300px' }}>
                {invoice.discount > 0 && (
                  <div
                    className="flex justify-between mb-2 pb-2"
                    style={{ borderBottom: '1px solid #e5e7eb' }}
                  >
                    <span style={{ color: '#666' }}>Discount</span>
                    <span style={{ color: '#666' }}>
                      -{formatCurrency(invoice.discount)}
                    </span>
                  </div>
                )}
                {invoice.tax > 0 && (
                  <div
                    className="flex justify-between mb-2 pb-2"
                    style={{ borderBottom: '1px solid #e5e7eb' }}
                  >
                    <span style={{ color: '#666' }}>Tax</span>
                    <span style={{ color: '#666' }}>
                      {formatCurrency(invoice.tax)}
                    </span>
                  </div>
                )}
                <div
                  className="flex justify-between mt-4 pt-4"
                  style={{ borderTop: `2px solid ${theme.primary}`, fontSize: '16px' }}
                >
                  <strong style={{ color: theme.primary }}>Total</strong>
                  <strong style={{ color: theme.primary }}>
                    {formatCurrency(invoice.total)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              className="border-t pt-4 text-center"
              style={{ borderColor: theme.primary, color: '#666', fontSize: '12px' }}
            >
              <p>Thank you for your business!</p>
              <p style={{ marginTop: '10px' }}>
                BizCore • All-in-One Business Management Platform
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-semibold transition"
              style={{ backgroundColor: `${theme.primary}20`, color: theme.primary }}
            >
              Close
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="px-4 py-2 rounded-lg font-semibold text-white transition flex items-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: theme.primary }}
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              {isDownloading ? 'Downloading...' : 'Download PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
