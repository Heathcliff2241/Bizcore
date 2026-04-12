'use client';

import { motion } from "framer-motion";
import Link from "next/link"; 
import Image from "next/image";
import { ShoppingCart, Menu, X, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCart } from "./hooks/useCart";
import type { StorefrontContext } from "./types";
import { resolveStorefrontHref } from "./utils/links";
import { LoginModal, SignupModal } from "./AuthModals";
import { CartModal } from "./CartModal";
import { ProfileModal } from "./ProfileModal";
import { MobileMenuModal } from "./MobileMenuModal";
import { clearOldSessionCookies } from "@/lib/clearOldCookies";
import type { Session } from "next-auth";
interface ExtendedUser {
  id?: string;
  email?: string;
  name?: string | null;
  image?: string | null;
  role?: string;
  tenantId?: string;
  subdomain?: string;
  tenantUsers?: Array<{
    tenantId: number;
    role: string;
  }>;
}

type HeaderSectionProps = {
  logoText?: string;
  logoImage?: string;
  logoUrl?: string;
  navigationLinks?: Array<{ label: string; url: string }>;
  showCart?: boolean;
  backgroundColor?: string;
  textColor?: string;
  height?: number;
  sticky?: boolean;
  storefront?: StorefrontContext;
  fullWidth?: boolean;
  session?: Session | null; // Use proper Session type
};

export function HeaderSection({
  logoText = "Your Brand",
  logoImage,
  logoUrl = "/",
  navigationLinks,
  showCart = true,
  backgroundColor = "#ffffff",
  textColor = "#1f2937",
  height = 80,
  sticky = true,
  storefront,
  fullWidth = false,
  session: serverSession, // Rename to avoid conflict
}: HeaderSectionProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Only use navigation links that are explicitly passed (from page sections)
  // Don't use any defaults - if no links are passed, the navigation will be empty
  const finalNavigationLinks = navigationLinks || [];
  
  // Use NextAuth session hook for customer authentication
  const { data: clientSession, status: clientStatus } = useSession();
  
  // Use server session if provided (from props), otherwise use client session
  // Server session will be available immediately on page load via SessionProvider
  const customerSession = serverSession ?? clientSession;
  const customerStatus = serverSession ? 'authenticated' : clientStatus;
  
  const { cart: cartItems } = useCart(storefront?.subdomain, (customerSession?.user as ExtendedUser)?.id);
  const cartItemCount = cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  useEffect(() => {
    // Clear any old cookies on component mount
    clearOldSessionCookies();
    setMounted(true);
    
    // Handle auth query param for auto-opening modals (from redirects)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const authAction = urlParams.get('auth');
      if (authAction === 'signin') {
        setLoginModalOpen(true);
        // Clean up URL without reload
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, '', newUrl);
      } else if (authAction === 'signup') {
        setSignupModalOpen(true);
        // Clean up URL without reload
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, []);

  // Get customer initials
  const getCustomerInitials = (name?: string | null) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  };

  const customerName = customerSession?.user?.name || 'Customer';
  const isCustomerLoggedIn = customerStatus === 'authenticated' && (((customerSession?.user as ExtendedUser)?.role === 'customer') || !!((customerSession?.user as ExtendedUser)?.id));
  const logo = resolveStorefrontHref(logoUrl, storefront, { label: logoText });
  const cart = resolveStorefrontHref("/cart", storefront, { label: "Cart" });

  const renderNavLink = (label: string, url: string, index: number, onClick?: () => void) => {
    // Only convert URLs to anchor links if they already start with # or are explicitly marked as anchors
    // Don't auto-convert /shop to #shop - let regular paths work as-is
    let processedUrl = url;
    if (!url.startsWith('#') && !url.startsWith('/') && !url.startsWith('http')) {
      // If it's not a path and not an anchor, make it an anchor
      processedUrl = `#${url}`;
    }
    // Otherwise keep the URL as-is (either #anchor, /path, or http://external)
    
    const resolved = resolveStorefrontHref(processedUrl, storefront, { label });
    
    // For anchor links (hash URLs), use native anchor tag instead of Next Link
    if (resolved.href.startsWith('#')) {
      return (
        <a
          key={`${label}-${index}`}
          href={resolved.href}
          className="text-sm font-medium transition-colors hover:opacity-70"
          style={{ color: textColor }}
          onClick={onClick}
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
          className="text-sm font-medium transition-colors hover:opacity-70"
          style={{ color: textColor }}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClick}
        >
          {label}
        </a>
      );
    }

    return (
      <Link key={`${label}-${index}`} href={resolved.href} onClick={onClick}>
        <motion.span
          whileHover={{ y: -2 }}
          className="text-sm font-medium transition-colors hover:opacity-70"
          style={{ color: textColor }}
        >
          {label}
        </motion.span>
      </Link>
    );
  };

  const renderMobileNavLink = (label: string, url: string, index: number) => {
    // Only convert URLs to anchor links if they already start with # or are explicitly marked as anchors
    // Don't auto-convert /shop to #shop - let regular paths work as-is
    let processedUrl = url;
    if (!url.startsWith('#') && !url.startsWith('/') && !url.startsWith('http')) {
      // If it's not a path and not an anchor, make it an anchor
      processedUrl = `#${url}`;
    }
    // Otherwise keep the URL as-is (either #anchor, /path, or http://external)
    
    const resolved = resolveStorefrontHref(processedUrl, storefront, { label });
    
    // For anchor links (hash URLs), use native anchor tag instead of Next Link
    if (resolved.href.startsWith('#')) {
      return (
        <a
          key={`${label}-${index}`}
          href={resolved.href}
          className="py-2 text-base font-medium hover:opacity-70 transition-opacity block"
          style={{ color: textColor }}
          onClick={() => setMobileMenuOpen(false)}
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
          className="py-2 text-base font-medium hover:opacity-70 transition-opacity block"
          style={{ color: textColor }}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setMobileMenuOpen(false)}
        >
          {label}
        </a>
      );
    }

    return (
      <Link
        key={`${label}-${index}`}
        href={resolved.href}
        onClick={() => setMobileMenuOpen(false)}
      >
        <motion.div
          whileTap={{ scale: 0.98 }}
          className="py-2 text-base font-medium hover:opacity-70 transition-opacity"
          style={{ color: textColor }}
        >
          {label}
        </motion.div>
      </Link>
    );
  };

  return (
    <header
      className={`w-full border-b border-gray-200 z-50 overflow-visible ${
        sticky ? "sticky top-0" : "relative"
      }`}
      style={{
        backgroundColor,
        color: textColor,
        height: `clamp(56px, 12vw, ${height}px)`,
      }}
    >
      <div className={`w-full ${!fullWidth ? 'max-w-7xl mx-auto' : ''} px-3 sm:px-4 md:px-6 lg:px-8 h-full overflow-visible`}>
        <div className="flex items-center justify-between h-full gap-2 sm:gap-3 md:gap-4">
          {/* Logo */}
          {logo.isExternal ? (
            <a
              href={logo.href}
              className="flex-shrink-0"
              target="_blank"
              rel="noopener noreferrer"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 sm:gap-3"
              >
                {logoImage && (
                  <Image
                    src={logoImage}
                    alt={logoText}
                    height={Math.round(height * 0.6)}
                    width={120}
                    className="h-8 sm:h-10 w-auto object-contain"
                    style={{ maxHeight: `${height * 0.6}px` }}
                    priority
                  />
                )}
                <div
                  className="text-lg sm:text-xl md:text-2xl font-bold"
                  style={{ color: textColor }}
                >
                  {logoText}
                </div>
              </motion.div>
            </a>
          ) : (
            <Link href={logo.href} className="flex-shrink-0">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3"
              >
                {logoImage && (
                  <Image
                    src={logoImage}
                    alt={logoText}
                    height={Math.round(height * 0.6)}
                    width={120}
                    className="h-10 w-auto object-contain"
                    style={{ maxHeight: `${height * 0.6}px` }}
                    priority
                  />
                )}
                <div
                  className="text-2xl font-bold"
                  style={{ color: textColor }}
                >
                  {logoText}
                </div>
              </motion.div>
            </Link>
          )}

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8 flex-1 justify-center">
            {finalNavigationLinks.map((link, index) =>
              renderNavLink(link.label, link.url, index)
            )}
          </nav>

          {/* Right Section: Cart, Auth & Mobile Menu */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 ml-auto">
            {/* Auth Section (Profile on all, text only on desktop) */}
            <div className="flex items-center gap-2 overflow-visible">
              {!mounted || customerStatus === 'loading' ? (
                // Loading skeleton for auth section
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              ) : isCustomerLoggedIn ? (
                // Authenticated customer - Profile Modal (visible on all sizes)
                <button
                  onClick={() => setProfileModalOpen(true)}
                  className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-10 min-w-10"
                  style={{ color: textColor }}
                  title={customerName}
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold flex-shrink-0">
                    {getCustomerInitials(customerName)}
                  </div>
                  <span className="text-sm font-medium hidden md:inline">
                    {customerName.split(' ')[0]}
                  </span>
                  <ChevronDown size={16} className={`hidden md:block transition-transform ${profileModalOpen ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                // Unauthenticated user - Auth Buttons (Desktop only, mobile uses menu)
                <div className="hidden lg:flex items-center gap-2">
                  <button
                    onClick={() => setLoginModalOpen(true)}
                    className="text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors whitespace-nowrap min-h-10"
                    style={{ color: textColor }}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setSignupModalOpen(true)}
                    className="text-sm font-semibold px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 active:bg-black transition-colors whitespace-nowrap min-h-10"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>

            {/* Cart Button */}
            {showCart && (
              cart.isExternal ? (
                <a
                  href={cart.href}
                  className="relative p-2 sm:p-2 md:p-1.5 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-10 min-w-10 flex items-center justify-center"
                  style={{ color: textColor }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ShoppingCart size={20} className="h-5 sm:h-5 md:h-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartItemCount > 9 ? "9+" : cartItemCount}
                    </span>
                  )}
                </a>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCartModalOpen(true)}
                  className="relative p-2 sm:p-2 md:p-1.5 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-10 min-w-10 flex items-center justify-center"
                  style={{ color: textColor }}
                  title="Shopping cart"
                >
                  <ShoppingCart size={20} className="h-5 sm:h-5 md:h-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartItemCount > 9 ? "9+" : cartItemCount}
                    </span>
                  )}
                </motion.button>
              )
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => {
                console.log('[HeaderSection] Mobile menu button clicked, current state:', mobileMenuOpen);
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              className="lg:hidden p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-10 min-w-10 flex items-center justify-center"
              style={{ color: textColor }}
              aria-label="Toggle mobile menu"
              title={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X size={20} className="w-5 h-5" /> : <Menu size={20} className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Auth, Cart, Menu & Profile Modals */}
      {mounted && (
        <>
          <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} storefront={storefront} />
          <SignupModal isOpen={signupModalOpen} onClose={() => setSignupModalOpen(false)} storefront={storefront} />
          <CartModal isOpen={cartModalOpen} onClose={() => setCartModalOpen(false)} storefront={storefront} />
          <MobileMenuModal
            isOpen={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            navigationLinks={finalNavigationLinks}
            textColor={textColor}
            storefront={storefront}
            isLoggedIn={isCustomerLoggedIn}
            customerName={customerName}
            onAuthClick={(type) => {
              if (type === 'signin') {
                setLoginModalOpen(true);
              } else {
                setSignupModalOpen(true);
              }
            }}
            onProfileClick={() => setProfileModalOpen(true)}
          />
          <ProfileModal
            isOpen={profileModalOpen}
            onClose={() => setProfileModalOpen(false)}
            customerName={customerName}
            customerEmail={customerSession?.user?.email || ''}
            storefront={storefront}
          />
        </>
      )}
    </header>
  );
}
