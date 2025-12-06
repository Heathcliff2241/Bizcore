'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Theme {
  primary: string;
  secondary: string;
  accent?: string;
  background?: string;
  surface?: string;
  text?: string;
}

interface FeatureUsageCardProps {
  metric: string;
  value: number;
  limit: number | null;
  percentage: number;
  onUpgrade?: () => void;
  theme?: Theme;
}

const METRIC_LABELS: Record<string, { label: string; unit: string }> = {
  orders_created: { label: 'Orders Created', unit: 'this month' },
  employees_added: { label: 'Team Members', unit: 'added' },
  storage_gb: { label: 'Storage Used', unit: 'GB' },
  api_calls: { label: 'API Calls', unit: 'this month' },
};

export default function FeatureUsageCard({
  metric,
  value,
  limit,
  percentage,
  onUpgrade,
  theme = {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#6366F1',
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#111827',
  },
}: FeatureUsageCardProps) {
  const config = METRIC_LABELS[metric] || { label: metric, unit: '' };

  // Determine color based on usage percentage
  let barColor = theme.secondary;
  let statusColor = theme.secondary;
  let statusBg = `${theme.secondary}10`;

  if (percentage >= 80 && percentage < 100) {
    barColor = '#f59e0b';
    statusColor = '#f59e0b';
    statusBg = '#fef3c710';
  } else if (percentage >= 100) {
    barColor = '#ef4444';
    statusColor = '#ef4444';
    statusBg = '#fee2e210';
  }

  const displayValue = limit === null ? `${value}` : `${value} of ${limit}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl p-6 border"
      style={{
        backgroundColor: statusBg,
        borderColor: `${theme.primary}20`,
      }}
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold" style={{ color: theme.text }}>
          {config.label}
        </h3>
        <p className="text-2xl font-bold mt-2" style={{ color: theme.text }}>{displayValue}</p>
      </div>

      {/* Progress bar */}
      {limit !== null && (
        <div className="mb-4">
          <div className="w-full rounded-full h-2 overflow-hidden" style={{ backgroundColor: `${theme.text}20` }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percentage, 100)}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: barColor }}
            />
          </div>
          <p className="text-xs mt-2" style={{ color: `${theme.text}99` }}>{percentage}% used</p>
        </div>
      )}

      {/* Status message */}
      <div className="text-sm mb-4" style={{ color: statusColor }}>
        {percentage < 80 && 'Plenty of space available'}
        {percentage >= 80 && percentage < 100 && 'Approaching limit'}
        {percentage >= 100 && 'Limit exceeded'}
      </div>

      {/* Upgrade CTA for trial/limited plans */}
      {limit !== null && percentage >= 80 && onUpgrade && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onUpgrade}
          className="w-full text-sm font-semibold py-2 rounded-lg transition-colors"
          style={{ color: theme.primary, backgroundColor: `${theme.primary}10` }}
        >
          Upgrade to increase limit
        </motion.button>
      )}
    </motion.div>
  );
}
