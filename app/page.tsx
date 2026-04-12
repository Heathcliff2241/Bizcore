/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-expressions */
'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import React, { useState } from "react";
import {
  ShoppingCart,
  CreditCard,
  Boxes,
  Palette,
  Package,
  DollarSign,
  Heart,
  Clock,
  ArrowRight,
  Check,
  Play,
} from "lucide-react";
import { PageWrapper } from "@/components/PageWrapper";
import { ContactForm } from "@/components/landing/ContactForm"

export const dynamic = 'force-dynamic';

/**
 * BizCore Landing Page - Apple-Inspired Premium Design
 * Clean, minimal, sophisticated with warm cream tones and dark blue accents
 */

// Apple-style animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6 } 
  },
};

const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5 }
  },
};

// Design tokens - Apple-inspired color palette
const colors = {
  cream: '#FAFAF8',
  creamDark: '#F5F5F0',
  darkBlue: '#0A1628',
  blue: '#1E3A5F',
  blueAccent: '#2563EB',
  blueMuted: '#64748B',
  text: '#1E293B',
  textMuted: '#475569',
};

const features = [
  {
    icon: ShoppingCart,
    title: "Online Ordering",
    subtitle: "24/7 availability",
    description: "Let customers place orders anytime. Direct integration with your POS and inventory.",
  },
  {
    icon: CreditCard,
    title: "Point of Sale",
    subtitle: "Lightning fast",
    description: "Intuitive checkout. Secure payments. Real-time insights.",
  },
  {
    icon: Boxes,
    title: "Inventory",
    subtitle: "Always accurate",
    description: "Real-time tracking. Smart alerts. Never oversell again.",
  },
  // {
  //   icon: Palette,
  //   title: "Storefront",
  //   subtitle: "No code needed",
  //   description: "Beautiful templates. Drag to customize. Publish instantly.",
  // },
];

const featureDetails: Record<number, { title: string; description: string; details: string; features: string[] }> = {
  0: {
    title: "Online Ordering",
    description: "Let customers place orders anytime, anywhere.",
    details: "Your customers can order 24/7 through multiple channels - web, mobile, and QR codes. All orders route directly to your team, with instant payment processing and automatic inventory updates.",
    features: [
      "Mobile & desktop optimized",
      "QR code ordering",
      "Secure payments",
      "Real-time updates",
      "Custom catalogs",
      "Order tracking"
    ]
  },
  1: {
    title: "Point of Sale",
    description: "Fast, intuitive, just works.",
    details: "No training needed. Every transaction syncs instantly. See sales data in real-time.",
    features: [
      "Fast checkout",
      "All payment types",
      "Team management",
      "Digital receipts",
      "Sales insights",
      "Offline mode"
    ]
  },
  2: {
    title: "Inventory",
    description: "Know what you have. Always.",
    details: "Real-time stock visibility. Alerts before you run low. Multi-location support.",
    features: [
      "Live stock counts",
      "Low stock alerts",
      "Smart reorder",
      "Multi-location",
      "Sales analytics",
      "Waste reduction"
    ]
  },
  // 3: {
  //   title: "Storefront",
  //   description: "Your store, your way.",
  //   details: "Choose a design, add your products, publish. Works beautifully everywhere.",
  //   features: [
  //     "Premium templates",
  //     "Drag & drop",
  //     "All devices",
  //     "Built-in SEO",
  //     "One-click publish",
  //     "Custom domains"
  //   ]
  // }
};

export default function LandingPage() {
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);
  
  return (
    <PageWrapper>
      <div className="flex flex-col min-h-screen font-sans antialiased overflow-x-hidden" style={{ backgroundColor: colors.cream }}>
        
        {/* ========== NAVIGATION - Apple-style minimal ========== */}
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="fixed top-0 z-50 w-full"
          style={{ backgroundColor: 'rgba(250, 250, 248, 0.8)', backdropFilter: 'saturate(180%) blur(20px)' }}
        >
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center justify-between h-14">
              {/* Logo */}
              <Link href="/" className="flex items-center">
                <span className="text-xl font-bold tracking-tight" style={{ color: colors.darkBlue }}>
                  BizCore
                </span>
              </Link>

              {/* Center Navigation */}
              <div className="hidden md:flex items-center gap-8">
                {['Features', 'Pricing', 'About'].map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="text-sm font-medium transition-colors duration-200 hover:opacity-60"
                    style={{ color: colors.text }}
                  >
                    {item}
                  </a>
                ))}
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-4">
                <Link
                  href="/auth/signin"
                  className="text-sm font-medium transition-colors duration-200 hover:opacity-60"
                  style={{ color: colors.text }}
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 text-sm font-medium text-white rounded-full transition-all duration-200 hover:scale-105"
                  style={{ backgroundColor: colors.blueAccent }}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
          <div className="h-px w-full" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }} />
        </motion.nav>

        {/* ========== HERO SECTION - Apple-inspired clean & bold ========== */}
        <header className="relative min-h-screen flex items-center justify-center pt-14">
          {/* Subtle gradient background */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{ 
              background: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37, 99, 235, 0.08) 0%, transparent 50%)` 
            }}
          />
          
          <div className="relative max-w-4xl mx-auto px-6 text-center">
            <motion.div
              initial="hidden"
              animate="show"
              variants={staggerContainer}
            >
              {/* Eyebrow */}
              <motion.div variants={fadeIn} className="mb-6">
                <span 
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full"
                  style={{ 
                    backgroundColor: 'rgba(37, 99, 235, 0.08)',
                    color: colors.blueAccent
                  }}
                >
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: colors.blueAccent }} />
                  Now available for businesses in the Philippines
                </span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                variants={fadeIn}
                className="mb-6 text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.1]"
                style={{ color: colors.darkBlue }}
              >
                One platform.
                <br />
                <span style={{ color: colors.blueAccent }}>Everything you need.</span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                variants={fadeIn}
                className="max-w-2xl mx-auto mb-10 text-xl leading-relaxed"
                style={{ color: colors.textMuted }}
              >
                Orders, payments, inventory, and your online store — all in one place. 
                Built for businesses that want to grow without the complexity.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                variants={fadeIn}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
              >
                <Link
                  href="/auth/signup"
                  className="group inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  style={{ backgroundColor: colors.blueAccent }}
                >
                  Start free trial
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <button
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="group inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold rounded-full border-2 transition-all duration-300 hover:scale-105"
                  style={{ 
                    color: colors.text,
                    borderColor: 'rgba(0,0,0,0.12)',
                    backgroundColor: 'transparent'
                  }}
                >
                  <Play className="w-5 h-5" />
                  See how it works
                </button>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                variants={fadeIn}
                className="flex flex-wrap items-center justify-center gap-6 text-sm"
                style={{ color: colors.textMuted }}
              >
                {['No credit card required', '14-day free trial', 'Cancel anytime'].map((item, i) => (
                  <span key={i} className="flex items-center gap-2">
                    <Check className="w-4 h-4" style={{ color: colors.blueAccent }} />
                    {item}
                  </span>
                ))}
              </motion.div>
            </motion.div>
          </div>
          
          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-6 h-10 rounded-full border-2 flex items-start justify-center pt-2"
              style={{ borderColor: 'rgba(0,0,0,0.15)' }}
            >
              <div className="w-1 h-2 rounded-full" style={{ backgroundColor: colors.textMuted }} />
            </motion.div>
          </motion.div>
        </header>

        {/* ========== FEATURES SECTION - Clean grid ========== */}
        <section id="features" className="py-32 relative" style={{ backgroundColor: colors.cream }}>
          <div className="max-w-6xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="text-center mb-20"
            >
              <h2 
                className="text-4xl md:text-5xl font-bold tracking-tight mb-5"
                style={{ color: colors.darkBlue }}
              >
                Everything works together.
              </h2>
              <p 
                className="text-xl max-w-2xl mx-auto"
                style={{ color: colors.textMuted }}
              >
                Four powerful tools, one seamless experience. No integrations needed.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="show"
              variants={staggerContainer}
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const isExpanded = expandedFeature === index;
                const details = featureDetails[index];
                
                return (
                  <motion.div
                    key={index}
                    variants={scaleIn}
                    className="group relative rounded-3xl overflow-hidden transition-all duration-300"
                    style={{ 
                      backgroundColor: 'white',
                      boxShadow: isExpanded ? '0 25px 50px -12px rgba(0, 0, 0, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    <div className="p-8 lg:p-10">
                      {/* Icon */}
                      <div 
                        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: 'rgba(37, 99, 235, 0.08)' }}
                      >
                        <Icon className="w-7 h-7" style={{ color: colors.blueAccent }} />
                      </div>

                      {/* Content */}
                      <div className="mb-4">
                        <span 
                          className="text-xs font-semibold uppercase tracking-wider"
                          style={{ color: colors.blueAccent }}
                        >
                          {feature.subtitle}
                        </span>
                      </div>
                      
                      <h3 
                        className="text-2xl font-bold mb-3"
                        style={{ color: colors.darkBlue }}
                      >
                        {feature.title}
                      </h3>
                      
                      <p 
                        className="text-base leading-relaxed mb-6"
                        style={{ color: colors.textMuted }}
                      >
                        {feature.description}
                      </p>

                      {/* Learn more button */}
                      <button
                        onClick={() => setExpandedFeature(isExpanded ? null : index)}
                        className="inline-flex items-center gap-2 text-sm font-semibold transition-all duration-200 hover:gap-3"
                        style={{ color: colors.blueAccent }}
                      >
                        {isExpanded ? 'Show less' : 'Learn more'}
                        <ArrowRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>

                      {/* Expanded content */}
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-8 pt-8"
                          style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
                        >
                          <p 
                            className="mb-6 leading-relaxed"
                            style={{ color: colors.textMuted }}
                          >
                            {details.details}
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            {details.features.map((feat, i) => (
                              <motion.div 
                                key={i} 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex items-center gap-2"
                              >
                                <Check className="w-4 h-4 flex-shrink-0" style={{ color: colors.blueAccent }} />
                                <span className="text-sm" style={{ color: colors.text }}>{feat}</span>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* ========== HOW IT WORKS - Dark blue section ========== */}
        <section className="py-32 relative" style={{ backgroundColor: colors.darkBlue }}>
          {/* Subtle gradient overlay */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-50"
            style={{ 
              background: 'radial-gradient(ellipse 100% 100% at 50% 0%, rgba(37, 99, 235, 0.2) 0%, transparent 50%)'
            }}
          />
          
          <div className="relative max-w-6xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="text-center mb-20"
            >
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5 text-white">
                Up and running in minutes.
              </h2>
              <p className="text-xl text-white/60 max-w-2xl mx-auto">
                Most businesses are live in under 30 minutes. Here&apos;s how.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Steps */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="space-y-8"
              >
                {[
                  { num: "01", title: "Add your products", desc: "Import your catalog or add items manually. Photos, prices, descriptions." },
                  { num: "02", title: "Enable online ordering", desc: "Activate ordering channels for web, mobile, and QR code ordering." },
                  { num: "03", title: "Go live", desc: "Launch your ordering system with one click. Start accepting orders immediately." },
                  { num: "04", title: "Watch it grow", desc: "Track sales, manage inventory, and scale your business." },
                ].map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="flex gap-6 group cursor-pointer"
                  >
                    <div className="flex-shrink-0">
                      <span 
                        className="block text-sm font-bold transition-colors duration-200"
                        style={{ color: 'rgba(255,255,255,0.3)' }}
                      >
                        {step.num}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
                        {step.title}
                      </h4>
                      <p className="text-white/60 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Stats Card */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <div 
                  className="rounded-3xl p-8 lg:p-10"
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { label: "Orders today", value: "12", icon: Package },
                      { label: "This month", value: "₱45k", icon: DollarSign },
                      { label: "Happy customers", value: "287", icon: Heart },
                      { label: "Time saved", value: "20hrs", icon: Clock },
                    ].map((stat, i) => {
                      const StatIcon = stat.icon;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, delay: i * 0.1 }}
                          className="p-6 rounded-2xl transition-all duration-300 hover:scale-105"
                          style={{ 
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.08)'
                          }}
                        >
                          <StatIcon className="w-6 h-6 mb-3" style={{ color: colors.blueAccent }} />
                          <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                          <div className="text-sm text-white/50">{stat.label}</div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ========== WHY BIZCORE - Benefits section ========== */}
        <section className="py-32" style={{ backgroundColor: colors.creamDark }}>
          <div className="max-w-6xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="text-center mb-20"
            >
              <h2 
                className="text-4xl md:text-5xl font-bold tracking-tight mb-5"
                style={{ color: colors.darkBlue }}
              >
                Why businesses choose BizCore.
              </h2>
              <p 
                className="text-xl max-w-2xl mx-auto"
                style={{ color: colors.textMuted }}
              >
                Simple, reliable, and built for the way you actually work.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="show"
              variants={staggerContainer}
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {[
                { title: "Lightning fast", desc: "No lag, no waiting. Your business moves fast, so does BizCore." },
                { title: "Works everywhere", desc: "Phone, tablet, or desktop. Always looks perfect, always works." },
                { title: "Always in sync", desc: "One change updates everything. No more double entry." },
                { title: "Bank-level security", desc: "Your data and your customers' payments are always protected." },
                { title: "Human support", desc: "Real people who understand your business, not chatbots." },
                { title: "Setup in minutes", desc: "No IT team needed. If you can use a smartphone, you can use this." },
              ].map((benefit, i) => (
                <motion.div
                  key={i}
                  variants={scaleIn}
                  className="p-8 rounded-3xl transition-all duration-300 hover:scale-[1.02]"
                  style={{ 
                    backgroundColor: 'white',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <h4 
                    className="text-xl font-semibold mb-3"
                    style={{ color: colors.darkBlue }}
                  >
                    {benefit.title}
                  </h4>
                  <p style={{ color: colors.textMuted }} className="leading-relaxed">
                    {benefit.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ========== CTA SECTION - Clean & compelling ========== */}
        <section className="py-32" style={{ backgroundColor: colors.blueAccent }}>
          <div className="max-w-4xl px-6 mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-white">
                Ready to simplify your business?
              </h2>
              <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
                Join thousands of businesses already running better with BizCore. 
                Start your free trial today — no credit card required.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
                <Link
                  href="/auth/signup"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 hover:scale-105"
                  style={{ backgroundColor: 'white', color: colors.blueAccent }}
                >
                  Start free trial
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold rounded-full border-2 border-white/30 text-white transition-all duration-300 hover:bg-white/10"
                >
                  Learn more
                </a>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-white/70">
                {['14-day free trial', 'No credit card', 'Cancel anytime', 'Full access'].map((item, i) => (
                  <span key={i} className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ========== ABOUT SECTION ========== */}
        <section id="about" className="py-32" style={{ backgroundColor: colors.cream }}>
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Text Content */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 
                  className="text-4xl md:text-5xl font-bold tracking-tight mb-6"
                  style={{ color: colors.darkBlue }}
                >
                  We built what we wished existed.
                </h2>
                <div className="space-y-6" style={{ color: colors.textMuted }}>
                  <p className="text-lg leading-relaxed">
                    Running a business is hard enough without software making it harder. 
                    We were tired of tools that don&apos;t talk to each other, dashboards that 
                    need a PhD to understand, and support that&apos;s anything but supportive.
                  </p>
                  <p className="text-lg leading-relaxed">
                    So we built BizCore. One place for everything. Simple to use. 
                    Honest pricing. Real humans who pick up when you call.
                  </p>
                  <p className="text-lg leading-relaxed">
                    Thousands of businesses across the Philippines now run better because of it. 
                    Not because they&apos;re tech experts — because they don&apos;t need to be.
                  </p>
                </div>
              </motion.div>

              {/* Stats Grid */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="grid grid-cols-2 gap-6"
              >
                {[
                  { number: "5,000+", label: "Businesses" },
                  { number: "99.9%", label: "Uptime" },
                  { number: "30min", label: "Setup time" },
                  { number: "24/7", label: "Support" },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className="p-8 rounded-3xl transition-all duration-300 hover:scale-[1.02]"
                    style={{ 
                      backgroundColor: 'white',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    <div 
                      className="text-4xl font-bold mb-2"
                      style={{ color: colors.blueAccent }}
                    >
                      {stat.number}
                    </div>
                    <div style={{ color: colors.textMuted }}>{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-32 bg-gradient-to-br from-white via-blue-50/30 to-white border-t-2 border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-slate-900">
              Pricing that makes sense
            </h2>
            <p className="text-xl text-blue-800 max-w-2xl mx-auto">
              No surprises. No hidden fees. Just honest pricing that grows with you.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            variants={staggerContainer}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                id: 'trial',
                name: "Free Trial",
                price: "₱0",
                billingCycle: "14 days",
                description: "Full Access for 14 Days",
                tagline: "No credit card required",
                features: [
                  "All features included",
                  "No credit card needed",
                  "Full POS system",
                  "Online ordering",
                  "Inventory management",
                  "Store builder"
                ],
                cta: "Try for free",
                ctaHref: "/auth/signup",
                highlighted: false,
                badge: null,
                bgColor: "from-blue-50 to-cyan-50",
                textColor: "text-slate-900",
                priceColor: "text-blue-600",
                badgeColor: ""
              },
              {
                id: 'monthly',
                name: "Standard Monthly",
                price: "₱1,999",
                billingCycle: "month",
                description: "Perfect for getting started",
                tagline: "Flexible, cancel anytime",
                features: [
                  "Full POS system",
                  "Online ordering",
                  "Inventory management",
                  "Store builder",
                  "Email support",
                  "Cancel anytime"
                ],
                cta: "Subscribe monthly",
                ctaHref: "/auth/signup?plan=monthly",
                highlighted: false,
                badge: "FLEXIBLE",
                bgColor: "from-slate-800 to-slate-900",
                textColor: "text-white",
                priceColor: "text-white",
                badgeColor: "bg-blue-600/20 text-blue-300"
              },
              {
                id: 'yearly',
                name: "Standard Yearly",
                price: "₱19,999",
                monthlyBreakdown: 1666,
                savings: 3989,
                billingCycle: "year",
                description: "Save ₱3,989 (2 months free!)",
                tagline: "Lock in price for 12 months",
                features: [
                  "Everything in monthly",
                  "₱1,666/month (billed yearly)",
                  "Lock in price 12 months",
                  "Priority updates",
                  "Priority support",
                  "VIP assistance"
                ],
                cta: "Save now, subscribe yearly",
                ctaHref: "/auth/signup?plan=yearly",
                highlighted: true,
                badge: "BEST VALUE ⭐",
                bgColor: "from-emerald-600 to-teal-700",
                textColor: "text-white",
                priceColor: "text-white",
                badgeColor: "bg-yellow-400/30 text-yellow-100"
              }
            ].map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 1.0, delay: i * 0.2, ease: "easeOut" }}
                whileHover={plan.highlighted ? { scale: 1.05, transition: { duration: 0.15 } } : { y: -10, transition: { duration: 0.15 } }}
                className={`rounded-2xl p-8 border transition-all ${
                  plan.highlighted
                    ? `bg-gradient-to-br ${plan.bgColor} border-emerald-500 shadow-2xl relative overflow-hidden`
                    : `bg-gradient-to-br ${plan.bgColor} border-slate-700 hover:border-blue-500/50`
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute inset-0 bg-white/5 pointer-events-none" />
                )}
                {plan.badge && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: i * 0.2 + 0.2 }}
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 ${plan.badgeColor}`}
                  >
                    {plan.badge}
                  </motion.div>
                )}
                <motion.h3 
                  className={`text-2xl font-bold mb-2 ${plan.textColor}`}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.2 + 0.3 }}
                >
                  {plan.name}
                </motion.h3>
                <motion.p 
                  className={`text-sm mb-4 ${
                    plan.id === 'trial' ? 'text-slate-600' : plan.highlighted ? 'text-emerald-100' : 'text-blue-200'
                  }`}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.15 + 0.25 }}
                >
                  {plan.description}
                </motion.p>
                <motion.div 
                  className={`text-4xl font-bold mb-2 ${plan.priceColor}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.15 + 0.3 }}
                >
                  {plan.price}
                </motion.div>
                {plan.id === 'yearly' && (
                  <motion.div
                    className="text-sm text-emerald-100 mb-1"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: i * 0.15 + 0.35 }}
                  >
                    per year
                  </motion.div>
                )}
                {plan.id === 'yearly' && (
                  <motion.div
                    className="border-t border-emerald-400/30 my-3 pt-3 pb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: i * 0.15 + 0.4 }}
                  >
                    <div className="text-lg font-semibold text-white mb-1">₱1,666/month</div>
                    <div className="text-xs text-emerald-100">(billed yearly)</div>
                    <div className="text-sm font-bold text-yellow-300 mt-2">💰 Save ₱3,989/year (2 months free!)</div>
                  </motion.div>
                )}
                {plan.id !== 'yearly' && (
                  <div className="text-sm mb-6 ${
                    plan.id === 'trial' ? 'text-slate-600' : 'text-emerald-100'
                  }">
                    per {plan.billingCycle}
                  </div>
                )}
                {plan.id === 'yearly' && (
                  <div className="text-xs text-emerald-100 mb-6">
                    Lock in price for 12 months
                  </div>
                )}
                <div className="space-y-3 mb-8">
                  {plan.features.map((feature: string, j: number) => (
                    <motion.div 
                      key={j} 
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ delay: i * 0.15 + 0.35 + j * 0.05 }}
                      className={`flex items-center gap-3 ${
                        plan.id === 'trial' ? 'text-slate-700' : plan.highlighted ? 'text-emerald-50' : 'text-slate-300'
                      }`}
                    >
                      <motion.svg 
                        className={`w-5 h-5 flex-shrink-0 ${
                          plan.id === 'trial' ? 'text-blue-500' : plan.highlighted ? 'text-emerald-200' : 'text-blue-400'
                        }`} 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.15 + 0.4 + j * 0.05 }}
                      >
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </motion.svg>
                  {feature}
                </motion.div>
                  ))}
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.15 + 0.5 }}
                >
                  <Link
                    href={plan.ctaHref}
                    className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-all transform hover:scale-105 ${
                      plan.id === 'yearly'
                        ? 'bg-white text-teal-700 hover:bg-emerald-50 shadow-lg font-bold'
                        : plan.id === 'trial'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="py-32 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-t-2 border-blue-800">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-white">
              Let&apos;s chat
            </h2>
            <p className="text-xl text-blue-200/80">
              Questions? Ideas? We&apos;re here and we actually read messages.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.0 }}
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 md:p-12 border border-blue-700/30 shadow-xl shadow-blue-900/50"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {[
                { symbol: "✦", label: "Email", value: "support@bizcore.com" },
                { symbol: "✦", label: "Phone", value: "+63 2 1234 5678" },
                { symbol: "✦", label: "Address", value: "Manila, Philippines" },
              ].map((contact, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 1.0, delay: i * 0.2, ease: "easeOut" }}
                  whileHover={{ 
                    scale: 1.1,
                    y: -12,
                    transition: { duration: 0.15 }
                  }} 
                  className="text-center cursor-pointer group"
                >
                  <motion.div 
                    className="text-4xl mb-3 text-cyan-400 group-hover:text-blue-300 transition"
                    animate={{ 
                      y: [0, -10, 0],
                    }}
                    transition={{
                      duration: 3.5,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: "easeInOut"
                    }}
                  >
                    {contact.symbol}
                  </motion.div>
                  <motion.h4 
                    className="text-lg font-semibold text-blue-100 mb-2"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 + 0.2 }}
                  >
                    {contact.label}
                  </motion.h4>
                  <motion.p 
                    className="text-blue-300/80 group-hover:text-blue-200 transition"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 + 0.3 }}
                  >
                    {contact.value}
                  </motion.p>
                </motion.div>
              ))}
            </div>

            <form className="space-y-5">
              <ContactForm />
            </form>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="py-12 border-t-2 border-gray-300 bg-gradient-to-r from-gray-50 to-blue-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <h4 className="font-semibold text-slate-900 mb-4">Product</h4>
                <ul className="space-y-2 text-blue-700">
                  <li><Link href="/auth/signin" className="hover:text-blue-600 transition">Dashboard</Link></li>
                  <li><a href="#pricing" className="hover:text-blue-600 transition">Pricing</a></li>
                  <li><a href="#features" className="hover:text-blue-600 transition">Features</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-4">Company</h4>
                <ul className="space-y-2 text-blue-700">
                  <li><a href="#about" className="hover:text-blue-600 transition">About</a></li>
                  <li><a href="mailto:support@bizcore.dev" className="hover:text-blue-600 transition">Support</a></li>
                  <li><a href="#contact" className="hover:text-blue-600 transition">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-4">Legal</h4>
                <ul className="space-y-2 text-blue-700">
                  <li><a href="#" className="hover:text-blue-600 transition">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-blue-600 transition">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-blue-600 transition">Refund Policy</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-8 text-center text-blue-700">
              <p>© {new Date().getFullYear()} BizCore. All rights reserved.</p>
            </div>
          </motion.div>
        </div>
      </footer>
      </div>
    </PageWrapper>
  );
}