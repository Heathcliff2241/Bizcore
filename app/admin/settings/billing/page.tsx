'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import Link from 'next/link';

// Toast utility
const toast = {
  success: (msg: string) => console.log('✓', msg),
  error: (msg: string) => console.error('✗', msg),
};

interface GCashConfig {
  gcashEnabled: boolean;
  gcashPhoneNumber: string | null;
  gcashAccountName: string | null;
  gcashQrCodeUrl: string | null;
}

export default function BillingSettingsPage() {
  const [config, setConfig] = useState<GCashConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<GCashConfig>({
    gcashEnabled: false,
    gcashPhoneNumber: '',
    gcashAccountName: '',
    gcashQrCodeUrl: '',
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/billing/config');
      if (!res.ok) throw new Error('Failed to fetch config');
      const data = await res.json();
      setConfig(data);
      setFormData(data);
    } catch (error) {
      toast.error('Failed to load billing settings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof GCashConfig, value: string | boolean | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validation
      if (formData.gcashEnabled) {
        if (!formData.gcashPhoneNumber) {
          toast.error('GCash phone number is required');
          return;
        }
        if (!formData.gcashAccountName) {
          toast.error('GCash account name is required');
          return;
        }
        if (!/^\d{11}$/.test(formData.gcashPhoneNumber)) {
          toast.error('Phone number must be 11 digits (Philippine format)');
          return;
        }
      }

      const res = await fetch('/api/admin/billing/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      const updated = await res.json();
      setConfig(updated);
      toast.success('Billing settings updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/settings" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Billing Settings</h1>
        </div>

        {/* GCash Configuration Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">GCash Payment Method</h2>
              <p className="text-sm text-gray-600 mt-1">
                Configure GCash for manual payment verification
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.gcashEnabled}
                onChange={(e) => handleChange('gcashEnabled', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Enabled</span>
            </label>
          </div>

          {formData.gcashEnabled && (
            <div className="space-y-4 bg-blue-50 p-4 rounded border border-blue-200 mb-6">
              <div className="flex gap-2 items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">How GCash payments work:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-blue-700">
                    <li>Customer sees your GCash details during checkout</li>
                    <li>Customer transfers money and submits their reference number</li>
                    <li>You verify the payment in the admin dashboard</li>
                    <li>Subscription is activated once verified</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GCash Phone Number
              </label>
              <input
                type="text"
                placeholder="09XXXXXXXXX"
                value={formData.gcashPhoneNumber || ''}
                onChange={(e) =>
                  handleChange('gcashPhoneNumber', e.target.value || null)
                }
                disabled={!formData.gcashEnabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                11-digit Philippine phone number (e.g., 09171234567)
              </p>
            </div>

            {/* Account Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GCash Account Name
              </label>
              <input
                type="text"
                placeholder="Your Business Name"
                value={formData.gcashAccountName || ''}
                onChange={(e) =>
                  handleChange('gcashAccountName', e.target.value || null)
                }
                disabled={!formData.gcashEnabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Display name for payment verification
              </p>
            </div>

            {/* QR Code URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GCash QR Code URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://example.com/gcash-qr.png"
                value={formData.gcashQrCodeUrl || ''}
                onChange={(e) =>
                  handleChange('gcashQrCodeUrl', e.target.value || null)
                }
                disabled={!formData.gcashEnabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL to your GCash QR code image (displayed to customers)
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            <button
              onClick={fetchConfig}
              disabled={saving}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Current Configuration (Debug) */}
        {config && (
          <div className="mt-6 p-4 bg-gray-100 rounded text-xs font-mono text-gray-600">
            <p className="font-semibold mb-2">Current Configuration:</p>
            <pre>{JSON.stringify(config, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
