'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveStorefrontHref } from './utils/links';
import type { StorefrontContext } from './types';
import { useState, useEffect } from 'react';

interface MobileMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  navigationLinks: Array<{ label: string; url: string }>;
  textColor?: string;
  storefront?: StorefrontContext;
  onAuthClick?: (type: 'signin' | 'signup') => void;
  isLoggedIn?: boolean;
  customerName?: string;
  onProfileClick?: () => void;
}

export function MobileMenuModal({
  isOpen,
  onClose,
  navigationLinks,
  textColor = '#1f2937',
  storefront,
  onAuthClick,
  isLoggedIn = false,
  customerName = 'Customer',
  onProfileClick,
}: MobileMenuModalProps) {
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

  const handleNavClick = () => {
    onClose();
  };

  const renderNavLink = (label: string, url: string, index: number) => {
    const resolved = resolveStorefrontHref(url, storefront, { label });

    if (resolved.href.startsWith('#')) {
      return (
        <a
          key={`${label}-${index}`}
          href={resolved.href}
          className="py-3 sm:py-4 text-base font-medium hover:opacity-70 active:opacity-50 transition-opacity min-h-12 flex items-center"
          style={{ color: textColor }}
          onClick={handleNavClick}
        >
          {label}
        </a>
      );
    }

    if (resolved.isExternal) {
      return (
        <a
          key={`${label}-${index}`}
          href={resolved.href}
          className="py-3 sm:py-4 text-base font-medium hover:opacity-70 active:opacity-50 transition-opacity min-h-12 flex items-center"
          style={{ color: textColor }}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleNavClick}
        >
          {label}
        </a>
      );
    }

    return (
      <Link
        key={`${label}-${index}`}
        href={resolved.href}
        onClick={handleNavClick}
      >
        <span className="py-3 sm:py-4 text-base font-medium hover:opacity-70 active:opacity-50 transition-opacity min-h-12 flex items-center">
          {label}
        </span>
      </Link>
    );
  };

  return (
    mounted ? createPortal(
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100000]"
            />

            {/* Mobile Menu Pop-up */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2, type: 'spring', bounce: 0.2 }}
              className="fixed top-16 left-1/2 transform -translate-x-1/2 w-96 max-w-[calc(100vw-32px)] bg-white shadow-2xl z-[100001] overflow-y-auto rounded-2xl max-h-[calc(100vh-120px)]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl">
                <h2 className="text-lg font-bold" style={{ color: textColor }}>
                  Menu
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close menu"
                >
                  <X size={24} style={{ color: textColor }} />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="px-4 py-4 space-y-1 sm:space-y-0">
                {navigationLinks.length > 0 ? (
                  navigationLinks.map((link, index) => renderNavLink(link.label, link.url, index))
                ) : (
                  <p className="text-sm text-gray-500 py-4">No navigation links</p>
                )}
              </nav>

              {/* Divider */}
              {(isLoggedIn || onAuthClick) && <div className="border-t border-gray-200 mx-4 my-4" />}

              {/* Auth/Profile Section */}
              <div className="px-4 py-4 space-y-2 sm:space-y-3">
                {isLoggedIn ? (
                  <button
                    onClick={() => {
                      onProfileClick?.();
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 sm:py-4 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors text-left min-h-12"
                    style={{ color: textColor }}
                  >
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                      {customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-base font-medium" style={{ color: textColor }}>{customerName}</p>
                      <p className="text-xs" style={{ color: textColor, opacity: 0.7 }}>View Profile</p>
                    </div>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        onAuthClick?.('signin');
                        onClose();
                      }}
                      className="w-full text-base font-medium px-4 py-3 sm:py-4 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors text-left min-h-12"
                      style={{ color: textColor }}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        onAuthClick?.('signup');
                        onClose();
                      }}
                      className="w-full text-base font-semibold px-4 py-3 sm:py-4 bg-black text-white rounded-lg hover:bg-gray-900 active:bg-gray-800 transition-colors min-h-12"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
    ) : null
  );
}
