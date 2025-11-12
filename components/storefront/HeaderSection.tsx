'use client';

import { motion } from "framer-motion";
import Link from "next/link";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useState } from "react";
import type { StorefrontContext } from "./types";
import { resolveStorefrontHref } from "./utils/links";

type HeaderSectionProps = {
  logoText?: string;
  logoUrl?: string;
  navigationLinks?: Array<{ label: string; url: string }>;
  showCart?: boolean;
  cartItemCount?: number;
  backgroundColor?: string;
  textColor?: string;
  height?: number;
  sticky?: boolean;
  storefront?: StorefrontContext;
};

export function HeaderSection({
  logoText = "Your Brand",
  logoUrl = "/",
  navigationLinks = [
    { label: "Home", url: "/" },
    { label: "Shop", url: "/shop" },
    { label: "About", url: "/about" },
    { label: "Contact", url: "/contact" },
  ],
  showCart = true,
  cartItemCount = 0,
  backgroundColor = "#ffffff",
  textColor = "#1f2937",
  height = 80,
  sticky = true,
  storefront,
}: HeaderSectionProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logo = resolveStorefrontHref(logoUrl, storefront, { label: logoText });
  const cart = resolveStorefrontHref("/cart", storefront, { label: "Cart" });

  const renderNavLink = (label: string, url: string, index: number, onClick?: () => void) => {
    const resolved = resolveStorefrontHref(url, storefront, { label });
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
    const resolved = resolveStorefrontHref(url, storefront, { label });
    if (resolved.isExternal) {
      return (
        <a
          key={`${label}-${index}`}
          href={resolved.href}
          className="py-2 text-base font-medium hover:opacity-70 transition-opacity"
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
      className={`w-full border-b border-gray-200 z-50 ${
        sticky ? "sticky top-0" : "relative"
      }`}
      style={{
        backgroundColor,
        color: textColor,
        height: `${height}px`,
      }}
    >
      <div className="w-full max-w-7xl mx-auto px-8 md:px-16 lg:px-24 h-full">
        <div className="flex items-center justify-between h-full">
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
                className="text-2xl font-bold"
                style={{ color: textColor }}
              >
                {logoText}
              </motion.div>
            </a>
          ) : (
            <Link href={logo.href} className="flex-shrink-0">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-2xl font-bold"
                style={{ color: textColor }}
              >
                {logoText}
              </motion.div>
            </Link>
          )}

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationLinks.map((link, index) =>
              renderNavLink(link.label, link.url, index)
            )}
          </nav>

          {/* Right Section: Cart & Mobile Menu */}
          <div className="flex items-center gap-4">
            {/* Cart Button */}
            {showCart && (
              cart.isExternal ? (
                <a
                  href={cart.href}
                  className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                  style={{ color: textColor }}
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
                <Link href={cart.href}>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                    style={{ color: textColor }}
                  >
                    <ShoppingCart size={24} />
                    {cartItemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {cartItemCount > 9 ? "9+" : cartItemCount}
                      </span>
                    )}
                  </motion.button>
                </Link>
              )
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
              style={{ color: textColor }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t border-gray-200"
          style={{ backgroundColor }}
        >
          <nav className="px-8 py-4 space-y-3">
            {navigationLinks.map((link, index) =>
              renderMobileNavLink(link.label, link.url, index)
            )}
          </nav>
        </motion.div>
      )}
    </header>
  );
}
