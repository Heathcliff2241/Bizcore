'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Package, Settings, LogOut, X } from 'lucide-react';
import Link from 'next/link';
import { resolveStorefrontHref } from "./utils/links";
import type { StorefrontContext } from './types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  customerEmail: string;
  storefront?: StorefrontContext;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  customerName,
  customerEmail,
  storefront,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  const accountHref = resolveStorefrontHref('/account', storefront, { label: 'My Account' });
  const ordersHref = resolveStorefrontHref('/orders', storefront, { label: 'Orders' });
  const settingsHref = resolveStorefrontHref('/account/profile', storefront, { label: 'Settings' });

  const handleLogout = async () => {
    onClose();
    // Clear localStorage customer session (JWT-based auth)
    localStorage.removeItem('customer-session');
    
    // Also try to clear any NextAuth session cookies
    if (storefront?.subdomain) {
      try {
        await fetch('/api/auth/clear-session', { method: 'POST', credentials: 'include' })
      } catch (err) {
        console.warn('[PROFILE] clear-session failed', err)
      }
      // Reload the storefront page instead of using signOut
      window.location.href = `/storefront/${storefront.subdomain}`;
    } else {
      try {
        await fetch('/api/auth/clear-session', { method: 'POST', credentials: 'include' })
      } catch (err) {
        console.warn('[PROFILE] clear-session failed', err)
      }
      window.location.href = '/';
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] pointer-events-auto"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, type: 'spring', bounce: 0.2 }}
            className="fixed top-16 sm:top-20 right-0 sm:right-4 md:right-8 w-80 sm:w-64 md:w-72 bg-white rounded-2xl shadow-2xl z-[9999] overflow-hidden max-h-[calc(100vh-64px)] sm:max-h-[90vh] overflow-y-auto sm:shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <X size={18} className="text-gray-500" />
            </button>

            {/* Header */}
            <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm sm:text-lg font-semibold flex-shrink-0">
                  {customerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{customerName}</p>
                  <p className="text-xs text-gray-500 truncate">{customerEmail}</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1 sm:py-2">
              {accountHref.isExternal ? (
                <a
                  href={accountHref.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User size={16} className="text-gray-400 flex-shrink-0" />
                  <span>My Account</span>
                </a>
              ) : (
                <Link
                  href={accountHref.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User size={16} className="text-gray-400 flex-shrink-0" />
                  <span>My Account</span>
                </Link>
              )}

              {ordersHref.isExternal ? (
                <a
                  href={ordersHref.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Package size={16} className="text-gray-400 flex-shrink-0" />
                  <span>My Orders</span>
                </a>
              ) : (
                <Link
                  href={ordersHref.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Package size={16} className="text-gray-400 flex-shrink-0" />
                  <span>My Orders</span>
                </Link>
              )}

              {settingsHref.isExternal ? (
                <a
                  href={settingsHref.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings size={16} className="text-gray-400 flex-shrink-0" />
                  <span>Settings</span>
                </a>
              ) : (
                <Link
                  href={settingsHref.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings size={16} className="text-gray-400 flex-shrink-0" />
                  <span>Settings</span>
                </Link>
              )}
            </div>

            {/* Logout */}
            <div className="border-t border-gray-100 py-1 sm:py-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} className="flex-shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};
