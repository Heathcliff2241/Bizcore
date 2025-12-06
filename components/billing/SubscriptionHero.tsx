'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, CalendarIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';

interface Theme {
  primary: string;
  secondary: string;
  accent?: string;
  background?: string;
  surface?: string;
  text?: string;
}

interface SubscriptionHeroProps {
  plan: {
    name: string;
    price: number;
    cycle: string;
    features?: Record<string, unknown>;
  };
  subscription: {
    status: string;
    renewalDate: string | null;
    daysRemaining: number | null;
    autoRenew: boolean;
  };
  onUpgrade?: () => void;
  onManage?: () => void;
  onCancel?: () => void;
  theme?: Theme;
}

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function SubscriptionHero({
  plan,
  subscription,
  onUpgrade,
  onManage,
  onCancel,
  theme = {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#6366F1',
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#111827',
  },
}: SubscriptionHeroProps) {
  const isActive = subscription.status === 'active' || subscription.status === 'trial';
  const isTrial = subscription.status === 'trial';
  const [countdown, setCountdown] = useState<CountdownState>({
    days: subscription.daysRemaining || 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!isTrial || !subscription.renewalDate) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const renewalTime = new Date(subscription.renewalDate!).getTime();
      const difference = renewalTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setCountdown({ days, hours, minutes, seconds });
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isTrial, subscription.renewalDate]);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl p-8 border"
      style={{
        backgroundColor: `${theme.primary}08`,
        borderColor: `${theme.primary}30`,
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left side - Plan details */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1">
              <h2 className="text-4xl font-bold" style={{ color: theme.text }}>{plan.name}</h2>
              <p
                className="text-sm mt-1"
                style={{
                  color: isActive ? theme.secondary : `${theme.text}99`,
                }}
              >
                {isActive && <CheckCircleIcon className="w-4 h-4 inline mr-1" />}
                {subscription.status === 'active' && 'Active'}
                {subscription.status === 'trial' && 'Free Trial'}
                {subscription.status === 'paused' && 'Paused'}
                {subscription.status === 'cancelled' && 'Cancelled'}
              </p>
            </div>
          </div>

          {/* Price */}
          <div className="mb-6">
            {plan.price > 0 ? (
              <>
                <div className="text-5xl font-bold" style={{ color: theme.text }}>
                  {formatPrice(plan.price)}
                </div>
                <p className="mt-1" style={{ color: `${theme.text}99` }}>/{plan.cycle}</p>
              </>
            ) : (
              <div className="text-3xl font-bold" style={{ color: theme.secondary }}>Free</div>
            )}
          </div>

          {/* Status info */}
          {subscription.renewalDate && (
            <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: theme.background, borderColor: `${theme.primary}20`, border: '1px solid' }}>
              {isTrial ? (
                <>
                  <p className="text-sm" style={{ color: `${theme.text}99` }}>Trial ends in</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: theme.text }}>
                    {countdown.days}d {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
                  </p>
                  <p className="text-xs mt-2" style={{ color: `${theme.text}66` }}>
                    {formatDate(subscription.renewalDate)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm" style={{ color: `${theme.text}99` }}>Next renewal</p>
                  <p className="text-lg font-semibold mt-1" style={{ color: theme.text }}>
                    {formatDate(subscription.renewalDate)}
                  </p>
                  <p className="text-sm mt-2" style={{ color: `${theme.text}99` }}>
                    You&apos;ll be charged {formatPrice(plan.price)}
                  </p>
                </>
              )}
            </div>
          )}

          {/* Auto-renew status */}
          <div className="flex items-center gap-2 text-sm" style={{ color: `${theme.text}99` }}>
            <CalendarIcon className="w-4 h-4" />
            <span>
              {subscription.autoRenew
                ? 'Auto-renews enabled'
                : 'Subscription will expire'}
            </span>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex flex-col justify-between">
          <div></div>

          <div className="space-y-3">
            {isTrial && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onUpgrade}
                className="w-full text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all"
                style={{ backgroundColor: theme.primary }}
              >
                Upgrade Now
              </motion.button>
            )}

            {!isTrial && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onUpgrade}
                className="w-full text-white font-semibold py-3 rounded-lg transition-colors"
                style={{ 
                  backgroundColor: theme.primary,
                }}
              >
                Change Plan
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onManage}
              className="w-full border font-semibold py-3 rounded-lg transition-colors"
              style={{
                backgroundColor: theme.background,
                borderColor: `${theme.primary}30`,
                color: theme.primary,
              }}
            >
              View Billing
            </motion.button>

            {isActive && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                className="w-full font-semibold py-3 hover:underline transition-colors text-sm"
                style={{ color: `${theme.text}99` }}
              >
                Pause or Cancel
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
