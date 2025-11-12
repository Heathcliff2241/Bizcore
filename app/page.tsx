/* eslint-disable @typescript-eslint/no-unused-expressions */
'use client';

import Link from "next/link";
import dynamicImport from "next/dynamic";
import { motion } from "framer-motion";  // Keep for animations, but minimize
import {
  FaShoppingCart,
  FaCashRegister,
  FaBoxes,
  FaChartLine,
} from "react-icons/fa";

// Type definitions are inferred from usage

export const dynamic = 'force-dynamic';

/**
 * Polished, Apple-style landing page with Emerald Flow theme 🌿
 * - Subtle kinetic motion, blurred nav, soft gradients
 * - Organic emerald-to-teal palette for calm energy
 * - Migrated from old BizCore system to Next.js with SSR optimizations
 */

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.12,
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const heroText = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

const features = [
  {
    icon: <FaShoppingCart className="mb-3 text-3xl text-emerald-600" />,
    title: "Online Ordering",
    description:
      "Customers browse your menu, order for pickup or delivery, and pay online — synced with your POS.",
  },
  {
    icon: <FaCashRegister className="mb-3 text-3xl text-emerald-600" />,
    title: "Smart POS",
    description:
      "Process walk-in and online orders in one interface with fast checkout and receipts.",
  },
  {
    icon: <FaBoxes className="mb-3 text-3xl text-emerald-600" />,
    title: "Real-Time Inventory",
    description:
      "Auto-update stock levels as sales occur. Alerts for low stock and smart reorder hints.",
  },
  {
    icon: <FaChartLine className="mb-3 text-3xl text-emerald-600" />,
    title: "Business Insights",
    description:
      "Simple dashboards and reports that help you make smarter stocking and pricing choices.",
  },
];

const tenants = [
  {
    name: "Dashboard",
    logo: (
      <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
      </svg>
    ),
    tagline: "Manage your business.",
    color: "from-blue-200 to-blue-400",
  },
  {
    name: "BrandStudio",
    logo: (
      <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ),
    tagline: "Design with power.",
    color: "from-purple-200 to-purple-400",
  },
];

// Lazy load non-critical sections for better performance
const ModulesShowcase = dynamicImport(() => import("../components/ModulesShowcase"), { ssr: false });
const CTASection = dynamicImport(() => import("../components/CTASection"), { ssr: false });

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen font-sans text-gray-800 bg-white">
        {/* Apple-inspired Nav - Clean, centered, full-width with subtle blur */}
        <motion.nav
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
          className="fixed top-4 z-50 w-full"
        >
          <div className="max-w-6xl mx-auto px-6 py-3 rounded-xl bg-white/20 backdrop-blur-xl shadow-sm border border-white/10" role="navigation">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-extrabold tracking-tight text-emerald-700">
                  BizCore
                </h1>
                <span className="hidden text-xs text-gray-500 sm:inline">
                  Ordering · POS · Inventory · Design
                </span>
              </div>

              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="text-sm text-gray-700 transition hover:text-emerald-600"
                >
                  Home
                </Link>
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-700 transition hover:text-emerald-600"
                >
                  Dashboard
                </Link>
                <Link
                  href="/auth/signin"
                  className="text-sm text-gray-700 transition hover:text-emerald-600"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="inline-block px-4 py-2 ml-2 text-sm text-white transition rounded-lg shadow-sm bg-emerald-600 hover:bg-emerald-700"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </motion.nav>

      {/* HERO - Optimized with simplified animations */}
      <header className="relative mt-24 overflow-hidden">
        {/* Decorative blurred orbs - Reduced motion for performance */}
        <div className="absolute inset-0 pointer-events-none -z-10">
          <motion.div
            animate={{ x: [-40, 40, -40] }}
            transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
            className="absolute rounded-full opacity-25 left-10 top-8 w-72 h-72 blur-3xl bg-gradient-to-tr from-emerald-400 to-teal-300"
          />
          <motion.div
            animate={{ x: [40, -40, 40] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute w-56 h-56 rounded-full opacity-25 right-16 top-32 blur-3xl bg-gradient-to-tr from-teal-200 to-emerald-200"
          />
        </div>

        <div className="px-6 text-white shadow-2xl bg-gradient-to-r from-emerald-600 to-teal-400 py-28 rounded-b-3xl">
          <motion.div
            initial="hidden"
            animate="show"
            variants={container}
            className="max-w-6xl mx-auto text-center"
          >
            <motion.h1
              variants={heroText}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="mb-4 text-5xl font-extrabold leading-tight md:text-6xl"
            >
              Empower Your Business with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-200 to-white">
                BizCore
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="max-w-3xl mx-auto mb-8 text-lg md:text-xl text-white/90"
            >
              A web-based platform for <strong>Customer Ordering</strong>,{" "}
              <strong>POS</strong>, <strong>Inventory Management</strong>, and{" "}
              <strong>Brand Design</strong> — built for growing SMEs.
            </motion.p>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="flex items-center justify-center gap-4"
            >
              <Link
                className="bg-white text-emerald-700 font-semibold py-3 px-6 rounded-lg shadow hover:translate-y-[-1px] transition"
                href="/dashboard"
              >
                Dashboard
              </Link>
              <Link
                className="px-6 py-3 font-semibold text-white transition border rounded-lg border-white/60 hover:bg-white/10"
                href="/brandstudio"
              >
                BrandStudio
              </Link>
              <Link
                className="ml-4 text-sm underline text-white/90 hover:text-white"
                href="/dashboard"
              >
                Explore Dashboard
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* FEATURES - Static rendering */}
      <section className="py-20 bg-emerald-50">
        <div className="max-w-6xl px-6 mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-10 text-3xl font-bold text-center md:text-4xl text-emerald-800"
          >
            One Platform, Endless Possibilities
          </motion.h2>

          <motion.div
            initial="hidden"
            whileInView="show"
            variants={container}
            viewport={{ once: true }}
            className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
          >
            {features.map((f, i) => (
              <motion.article
                key={i}
                variants={fadeUp}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="p-6 transition transform bg-white shadow-sm md:p-8 rounded-2xl hover:shadow-lg hover:-translate-y-1"
              >
                <div className="flex justify-center w-full mb-2">{f.icon}</div>
                <h3 className="mb-2 text-lg font-semibold text-center text-emerald-700">
                  {f.title}
                </h3>
                <p className="text-sm text-center text-gray-600">
                  {f.description}
                </p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Lazy-Loaded Modules Showcase */}
      <ModulesShowcase tenants={tenants} />

      {/* Lazy-Loaded CTA */}
      <CTASection />

      {/* FOOTER */}
      <footer className="py-6 text-sm text-center text-gray-400 bg-gray-900">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="max-w-6xl px-6 mx-auto">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                © {new Date().getFullYear()} BizCore. All rights reserved.
              </div>
              <div className="flex items-center gap-4 opacity-80">
                <a href="#" className="transition hover:text-white">
                  Docs
                </a>
                <a href="#" className="transition hover:text-white">
                  Contact
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </footer>
    </div>
  );
}