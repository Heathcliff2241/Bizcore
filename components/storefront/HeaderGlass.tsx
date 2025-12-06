'use client';

import { motion } from "framer-motion";
import Link from "next/link"; 
import Image from "next/image";
import { ShoppingCart, Menu, X, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useCustomerSession } from "./hooks/useCustomerSession";
import { useCart } from "./hooks/useCart";
import type { StorefrontContext } from "./types";
import { resolveStorefrontHref } from "./utils/links";
import { LoginModal, SignupModal } from "./AuthModals";
import { CartModal } from "./CartModal";
import { ProfileModal } from "./ProfileModal";
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

type HeaderGlassProps = {
  logoText?: string;
  logoImage?: string;
  logoUrl?: string;
  navigationLinks?: Array<{ label: string; url: string }>;
  showCart?: boolean;
  height?: number;
  sticky?: boolean;
  storefront?: StorefrontContext;
  fullWidth?: boolean;
  session?: Session | null;
  // Glass effect properties - simplified
  backgroundColor?: string; // Full background (gradient or color)
  glassOpacity?: number; // 0-1 for rgba opacity
  glassBlurAmount?: number; // 0-30 for blur
  glassBorderColor?: string; // RGBA color
  textColor?: string;
};

export function HeaderGlass({
  logoText = "Your Brand",
  logoImage,
  logoUrl = "/",
  navigationLinks = [
    { label: "Home", url: "/" },
    { label: "Shop", url: "/shop" },
    { label: "About", url: "/about" },
    { label: "Contact", url: "/contact" },
  ],
  showCart = true,
  height = 80,
  sticky = true,
  storefront,
  fullWidth = false,
  session: serverSession,
  backgroundColor = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  glassOpacity = 0.1,
  glassBlurAmount = 10,
  glassBorderColor = 'rgba(255, 255, 255, 0.2)',
  textColor = "#ffffff",
}: HeaderGlassProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { data: clientSession, status: clientStatus } = useCustomerSession();
  
  const customerSession = serverSession ?? clientSession;
  const customerStatus = serverSession ? 'authenticated' : clientStatus;
  
  const { cart: cartItems } = useCart(storefront?.subdomain, (customerSession?.user as ExtendedUser)?.id);
  const cartItemCount = cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    const resolved = resolveStorefrontHref(url, storefront, { label });
    if (resolved.isExternal) {
      return (
        <a
          key={`${label}-${index}`}
          href={resolved.href}
          className="text-sm font-medium transition-opacity hover:opacity-80"
          style={{ color: textColor, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
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
          className="text-sm font-medium transition-opacity hover:opacity-80"
          style={{ color: textColor, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
        >
          {label}
        </motion.span>
      </Link>
    );
  };

  const renderMobileNavLink = (label: string, url: string, index: number) => {
    const resolved = resolveStorefrontHref(url, storefront, { label });
    if (resolved.isExternal) {
      return (
        <a
          key={`${label}-${index}`}
          href={resolved.href}
          className="py-2 text-base font-medium hover:opacity-80 transition-opacity"
          style={{ color: textColor, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
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
          className="py-2 text-base font-medium hover:opacity-80 transition-opacity"
          style={{ color: textColor, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
        >
          {label}
        </motion.div>
      </Link>
    );
  };

  return (
    <header
      className={`w-full z-50 overflow-visible ${
        sticky ? "sticky top-0" : "relative"
      }`}
      style={{
        background: backgroundColor,
        height: `${height}px`,
      }}
    >
      {/* Glass background overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `rgba(255, 255, 255, ${glassOpacity})`,
          backdropFilter: `blur(${glassBlurAmount}px)`,
          border: `1px solid ${glassBorderColor}`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />

      {/* Content */}
      <div className={`relative z-10 w-full ${!fullWidth ? 'max-w-7xl mx-auto' : ''} px-8 md:px-16 lg:px-24 h-full overflow-visible flex items-center justify-between`}>
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
                style={{ color: textColor, textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
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
                style={{ color: textColor, textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
              >
                {logoText}
              </div>
            </motion.div>
          </Link>
        )}

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navigationLinks.map((link, index) =>
            renderNavLink(link.label, link.url, index)
          )}
        </nav>

        {/* Right Section: Cart, Auth & Mobile Menu */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center gap-2 overflow-visible">
            {!mounted || customerStatus === 'loading' ? (
              <div className="text-sm text-gray-300">Loading...</div>
            ) : isCustomerLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setProfileModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
                  style={{
                    color: textColor,
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(5px)',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {getCustomerInitials(customerName)}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">
                    {customerName.split(' ')[0]}
                  </span>
                  <ChevronDown size={16} className={`transition-transform ${profileModalOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="text-sm font-medium px-4 py-2 rounded-lg transition-all"
                  style={{
                    color: textColor,
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(5px)',
                  }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setSignupModalOpen(true)}
                  className="text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:opacity-90"
                  style={{
                    color: 'white',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(5px)',
                  }}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Cart Button */}
          {showCart && (
            cart.isExternal ? (
              <a
                href={cart.href}
                className="relative p-2 rounded-full transition-all"
                style={{
                  color: textColor,
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(5px)',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ShoppingCart size={24} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemCount > 9 ? "9+" : cartItemCount}
                  </span>
                )}
              </a>
            ) : (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCartModalOpen(true)}
                className="relative p-2 rounded-full transition-all"
                style={{
                  color: textColor,
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(5px)',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                }}
              >
                <ShoppingCart size={24} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemCount > 9 ? "9+" : cartItemCount}
                  </span>
                )}
              </motion.button>
            )
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-full transition-all"
            style={{
              color: textColor,
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(5px)',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden relative z-10 border-t"
          style={{
            borderColor: glassBorderColor,
            background: `rgba(255, 255, 255, ${glassOpacity})`,
            backdropFilter: `blur(${glassBlurAmount}px)`,
            borderLeft: `1px solid ${glassBorderColor}`,
            borderRight: `1px solid ${glassBorderColor}`,
            borderBottom: `1px solid ${glassBorderColor}`,
          }}
        >
          <nav className="px-8 py-4 space-y-3">
            {navigationLinks.map((link, index) =>
              renderMobileNavLink(link.label, link.url, index)
            )}
          </nav>
        </motion.div>
      )}

      {/* Auth, Cart & Profile Modals */}
      {mounted && (
        <>
          <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} storefront={storefront} />
          <SignupModal isOpen={signupModalOpen} onClose={() => setSignupModalOpen(false)} storefront={storefront} />
          <CartModal isOpen={cartModalOpen} onClose={() => setCartModalOpen(false)} storefront={storefront} />
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
