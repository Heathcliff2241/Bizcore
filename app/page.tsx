/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-expressions */
'use client';

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import React, { useRef, useState } from "react";
import {
  ShoppingCart,
  CreditCard,
  Boxes,
  Palette,
  Package,
  DollarSign,
  Heart,
  Clock,
} from "lucide-react";
import { PageWrapper } from "@/components/PageWrapper";
import BizCoreWordmark from '@/components/BizCoreWordmark'
import { ContactForm } from "@/components/landing/ContactForm"

export const dynamic = 'force-dynamic';

/**
 * Premium Dark Blue Landing Page - Apple Grade Design
 * Showcases BizCore's 4 core offerings:
 * 1. Online Ordering
 * 2. Smart POS
 * 3. Inventory Management
 * 4. BrandStudio for Storefront Design
 */

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8 } 
  },
};

const features = [
  {
    icon: ShoppingCart,
    title: "Online Ordering",
    description:
      "Let customers order from anywhere, anytime. It all syncs with your POS so you're never out of sync.",
color: "from-blue-500 to-blue-600",
  },
  {
    icon: CreditCard,
    title: "Point of Sale",
    description:
      "Checkout is fast. Payments are safe. Your team gets it right away. Built for real retail.",
color: "from-cyan-500 to-cyan-600",
  },
  {
    icon: Boxes,
    title: "Inventory",
    description:
      "Know what you have. Know what's running low. Never oversell. That's it.",
color: "from-blue-400 to-blue-500",
  },
  {
    icon: Palette,
    title: "Your Storefront",
    description:
      "Build a beautiful online store that actually converts. No developers needed. Just drag and publish.",
    color: "from-indigo-500 to-indigo-600",
  },
];

const featureDetails: Record<string, { title: string; description: string; details: string; features: string[] }> = {
  0: {
    title: "Online Ordering",
    description: "Let customers order from anywhere, anytime. It all syncs with your POS so you're never out of sync.",
    details: "Your customers can browse and order 24/7 from their phone or computer. When they order, it goes straight to your kitchen or fulfillment team. Payments are secure, inventory stays accurate, and you get a notification for every order.",
    features: [
      "Works on phones and computers",
      "QR codes for easy ordering",
      "Safe payment processing",
      "Real-time order updates",
      "Customizable menus",
      "Track allergies and preferences"
    ]
  },
  1: {
    title: "Point of Sale",
    description: "Checkout is fast. Payments are safe. Your team gets it right away. Built for real retail.",
    details: "This isn't your grandma's POS system. It's fast, it's intuitive, and it just works. Your team won't need training. Every transaction syncs instantly across your business. You'll see sales data in real-time.",
    features: [
      "Blazingly fast checkout",
      "All payment types accepted",
      "Manage your team and permissions",
      "Digital and email receipts",
      "See sales insights instantly",
      "Works online and offline"
    ]
  },
  2: {
    title: "Inventory",
    description: "Know what you have. Know what's running low. Never oversell. That's it.",
    details: "Stop guessing about stock. You'll always know exactly what you have. We'll alert you before you run low. You can even see what's selling so you can order smarter. Multiple locations? We handle that too.",
    features: [
      "Real-time stock counts",
      "Get alerts before you run out",
      "Smart reorder recommendations",
      "Track inventory across locations",
      "See what's selling and why",
      "Reduce waste and dead stock"
    ]
  },
  3: {
    title: "Your Storefront",
    description: "Build a beautiful online store that actually converts. No developers needed. Just drag and publish.",
    details: "You don't need a developer. You don't need to know code. Just choose a design you like, add your products and details, and hit publish. Your store works beautifully on phones, tablets, and desktops.",
    features: [
      "Choose from beautiful designs",
      "Drag to customize",
      "Works perfectly on all devices",
      "Built-in SEO to get found",
      "Publish in one click",
      "Use your own domain"
    ]
  }
};

// Icon rotation component for scroll awareness  
function ScrollRotatingIcon({ icon: Icon, className = "" }: { icon: React.ComponentType<any>; className?: string }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 80%", "end 20%"],
  });

  // More dramatic rotation - goes up to 720 degrees for slower, more mechanical feel
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 720]);

  return (
    <motion.div
      ref={ref}
      style={{ rotate }}
      className={className}
    >
      <Icon className="w-full h-full" />
      </motion.div>
    );
}

// Benefits card component with scroll transform - slower, more dramatic movements
function BenefitCard({ title, desc, index }: { title: string; desc: string; index: number }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 80%", "end 20%"],
  });

  // Larger parallax range for more noticeable movement
  const y = useTransform(scrollYProgress, [0, 1], [120, -120]);
  // More dramatic opacity changes - disappears when not in view
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.85, 1, 1, 0.85]);

  return (
    <motion.div
      ref={ref}
      style={{ y, opacity, scale }}
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 1.0, delay: index * 0.15, ease: "easeOut" }}
      whileHover={{
        scale: 1.04,
        transition: { duration: 0.15 }
      }}
      className="p-6 rounded-xl bg-white/90 border border-gray-200 hover:border-blue-500/30 transition cursor-pointer shadow-sm"
    >
      <motion.h4
        className="text-lg font-semibold text-slate-900 mb-2"
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ delay: index * 0.1 + 0.2 }}
      >
        {title}
      </motion.h4>
      <motion.p
        className="text-blue-800"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ delay: index * 0.1 + 0.3 }}
      >
        {desc}
      </motion.p>
    </motion.div>
  );
}

export default function LandingPage() {
const [expandedFeature, setExpandedFeature] = useState<number | null>(null);
  return (
<PageWrapper>
    <div className="flex flex-col min-h-screen font-sans text-slate-900 bg-white overflow-x-hidden relative">
      {/* Dark blue gradient accent overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-5 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-transparent to-indigo-900" />
      </div>
      
      <div className="relative z-10">
        {/* Apple-inspired Nav - Dark Blue Premium */}
        <motion.nav
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed top-0 z-50 w-full"
        >
          <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="rounded-2xl bg-white/90 backdrop-blur-sm shadow-md border border-gray-200 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                          <div>
                            <BizCoreWordmark className="text-2xl md:text-3xl" />
                            <p className="text-xs text-blue-700">All-in-One Commerce Platform</p>
                          </div>
                      </div>

              <div className="hidden md:flex items-center gap-8">
                <a                   href="#about"                   className="text-sm text-blue-700 hover:text-blue-600 transition">
                  About
                </a>
                <a                   href="#pricing"                   className="text-sm text-blue-700 hover:text-blue-600 transition">
                  Pricing
                </a>
                <a href="#contact" className="text-sm text-blue-700 hover:text-blue-600 transition">
                  Contact
                </a>
                <Link                   href="/auth/signin"                   className="text-sm text-blue-700 hover:text-blue-600 transition"                >
                  Sign In
                </Link>
</div>

              <div className="flex items-center gap-3">
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-700 to-indigo-800 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition shadow-md"
                >
                  Get Started
                </Link>
</div>
              </div>
            </div>
          </div>
        </motion.nav>

      {/* HERO SECTION - Full Screen */}
      <header className="relative min-h-screen flex items-center justify-center overflow-hidden mt-24">
        {/* Animated gradient orbs background */}
        <div className="absolute inset-0 pointer-events-none -z-10">
          <motion.div
            animate={{ x: [-60, 60, -60], y: [0, 30, 0] }}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
            className="absolute rounded-full opacity-20 left-0 top-0 w-96 h-96 blur-3xl bg-gradient-to-br from-blue-500 to-cyan-400"
          />
          <motion.div
            animate={{ x: [60, -60, 60], y: [0, -30, 0] }}
            transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-80 h-80 rounded-full opacity-15 right-0 top-1/3 blur-3xl bg-gradient-to-br from-indigo-500 to-blue-400"
          />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            animate="show"
            variants={container}
            >
            <motion.div
              variants={fadeUp}
              transition={{ duration: 1.0 }}
              className="mb-8 inline-block"
            >
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-300" />
                {/* Badge */}
                <span className="relative px-4 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500/30 to-cyan-500/30 text-blue-200 rounded-full border border-blue-400/50 backdrop-blur-sm shadow-lg shadow-blue-500/20">
                  For businesses that want to do more
                </span>
              </div>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              transition={{ duration: 1.0, delay: 0.1 }}
              className="mb-8 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-tight tracking-tight"
            >
              Stop juggling{" "}
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
                five different apps
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 1.0, delay: 0.2 }}
                            className="max-w-3xl mx-auto mb-12 text-lg sm:text-xl text-blue-700 leading-relaxed"
            >
              Everything you need to run your business is in one place. Orders, payments, inventory, and your storefront. 
              No more switching between tools. Just work.
            </motion.p>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 1.0, delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-2xl hover:shadow-blue-500/50 hover:from-blue-500 hover:to-indigo-500 transition transform hover:scale-105"
                href="/auth/signup"
              >
                Try 14 days free (no credit card)
              </Link>
              <button
                onClick={() => {
                  const element = document.getElementById('features');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 text-lg font-semibold text-blue-300 border-2 border-blue-500/50 rounded-xl hover:bg-blue-500/10 transition backdrop-blur"
              >
                See how it works
              </button>
            </motion.div>

            <motion.p
              variants={fadeUp}
              transition={{ delay: 0.4, duration: 1.0 }}
              className="mt-8 text-blue-700 text-sm"
            >
              <span className="font-semibold">No credit card. No contracts. Cancel whenever.</span> Starting at ₱1,999/month
            </motion.p>
          </motion.div>
        </div>
      </header>

      {/* FEATURES SHOWCASE - 4 Core Offerings */}
      <section id="features" className="py-32 relative border-t-2 border-gray-200 bg-gradient-to-br from-white via-blue-50/30 to-white">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-blue-500/5 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-slate-900">
                The tools you actually need
            </h2>
            <p className="text-xl text-blue-800 max-w-2xl mx-auto">
              Four simple features that work together. No bloat, no complexity.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            variants={container}
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-6"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isExpanded = expandedFeature === index;
              const details = featureDetails[index];
              
              return (
                <motion.div
                  key={index}
                  whileHover={{ y: -8, transition: { duration: 0.15 } }}
                  className="group relative rounded-2xl bg-white border border-gray-200 overflow-hidden transition-all duration-300 shadow-sm"
                >
                    <div className={`p-8 lg:p-10 ${isExpanded ? '' : 'hover:border-blue-500/50'}`}>
                      {/* Hover glow effect */}
                      {!isExpanded && (
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                      )}
                      
                      <div className="relative">
                        {/* Icon with scroll rotation */}
                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 ${!isExpanded && 'group-hover:scale-110'} transition-transform duration-150`}>
                          <ScrollRotatingIcon icon={Icon} className="w-8 h-8 text-white" />
                        </div>

                        <motion.h3 
                          initial={{ opacity: 0, x: -30 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true, margin: "-50px" }}
                          transition={{ duration: 1.0, delay: index * 0.15, ease: "easeOut" }}
                          className="text-2xl font-bold text-slate-900 mb-3"
                        >
                          {feature.title}
                        </motion.h3>
                        
                        <motion.p 
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          viewport={{ once: true, margin: "-50px" }}
                          transition={{ duration: 1.0, delay: index * 0.2, ease: "easeOut" }}
                          className="text-blue-800 text-base leading-relaxed mb-4"
                        >
                          {feature.description}
                        </motion.p>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setExpandedFeature(isExpanded ? null : index)}
                            className="flex items-center gap-2 text-blue-400 font-semibold group-hover:gap-3 transition-all hover:text-blue-300"
                          >
                            <span>{isExpanded ? 'Show less' : 'Learn more'}</span>
                            <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </button>
                        </div>
                    {/* Expanded content */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-gray-200 bg-gray-50 px-8 lg:px-10 py-6"
                      >
                        <p className="text-blue-800 leading-relaxed mb-6">
                          {details.details}
                        </p>
                        <div>
                          <h4 className="text-lg font-semibold text-slate-900 mb-4">Key Features</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {details.features.map((feat, i) => (
                                <motion.div 
                                  key={i} 
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.05 }}
                                  className="flex items-start gap-3"
                                >
                                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-blue-700 text-sm">{feat}</span>
                                </motion.div>
                              ))}
                            </div>
                        </div>
                      </motion.div>
                    )}
                      </div>
                    </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS - Integration Flow */}
      <section className="py-32 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-t-2 border-blue-800">
        <div className="max-w-7xl mx-auto px-6">
            <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-white">
              Get started in minutes
            </h2>
            <p className="text-xl text-blue-200/80 max-w-2xl mx-auto">
              Seriously. Most people are up and running in less than 30 minutes.
            </p>
          </motion.div>          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="space-y-6">
                {[
                  { num: "1", title: "Add your products", desc: "Upload your menu or catalog. Includes prices, descriptions, photos." },
                  { num: "2", title: "Pick a store design", desc: "Choose from our templates or customize your own. Takes minutes." },
                  { num: "3", title: "Go live", desc: "Publish your store and start taking orders." },
                  { num: "4", title: "Grow", desc: "Watch your sales come in. We'll handle the rest." },
                ].map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 1.0, delay: i * 0.2, ease: "easeOut" }}
                    whileHover={{ x: 12, transition: { duration: 0.15 } }}
                    className="flex gap-4 group cursor-pointer"
                  >
                    <motion.div 
                      className="flex-shrink-0"
                      animate={{ 
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 3.5,
                        repeat: Infinity,
                        delay: i * 0.4
                      }}
                    >
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 group-hover:shadow-lg group-hover:shadow-blue-500/50 transition-shadow">
                        <motion.span 
                          className="text-white font-bold"
                          initial={{ opacity: 0, scale: 0.5 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.2 + 0.3 }}
                        >
                          {step.num}
                        </motion.span>
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ delay: i * 0.15 + 0.1 }}
                    >
                      <h4 className="text-lg font-semibold text-white mb-1 group-hover:text-cyan-300 transition">{step.title}</h4>
                      <p className="text-blue-200/80">{step.desc}</p>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl blur-xl" />
              <div className="relative bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Orders today", value: "12", icon: Package },
                    { label: "This month", value: "₱45k", icon: DollarSign },
                    { label: "Happy customers", value: "287", icon: Heart },
                    { label: "Time saved", value: "20hrs/wk", icon: Clock },
                  ].map((stat, i) => {
                    const StatIcon = stat.icon;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.75, y: 40 }}
                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.9, delay: i * 0.18, ease: "easeOut" }}
                        whileHover={{ 
                          scale: 1.05,
                          y: -8,
                          boxShadow: "0 20px 40px rgba(59, 130, 246, 0.2)",
                          transition: { duration: 0.15 }
                        }}
                        className="bg-white/90 rounded-lg p-4 border border-gray-200 hover:border-blue-500/50 transition cursor-pointer shadow-sm"
                      >
                        <motion.div 
                          className="text-blue-400 mb-2"
                          animate={{ 
                            y: [0, -4, 0],
                          }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            delay: i * 0.2
                          }}
                        >
                          <StatIcon className="w-8 h-8" />
                        </motion.div>
                        <motion.div 
                          className="text-2xl font-bold text-slate-900"
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.15 + 0.2 }}
                        >
                          {stat.value}
                        </motion.div>
                        <div className="text-sm text-blue-700">{stat.label}</div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FEATURES HIGHLIGHT - Detailed Benefits */}
      <section className="py-32 border-t-2 border-gray-200 bg-gradient-to-br from-white via-blue-50/40 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-slate-900">
              Why people switch to BizCore
            </h2>
              <p className="text-xl text-blue-800 max-w-2xl mx-auto">
                Simple. Works. Reliable. We don&apos;t overcomplicate things.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Actually fast", desc: "Your customers don't wait. Neither does your POS." },
              { title: "Works everywhere", desc: "Phone. Tablet. Computer. Looks great on all of them." },
              { title: "Always in sync", desc: "One update. Everything changes. No confusion." },
              { title: "Safe money", desc: "Bank-level security. You sleep well at night." },
              { title: "Real support", desc: "Not a bot. Not an email robot. Real humans." },
              { title: "Actually simple", desc: "Setup takes minutes. No IT degree required." },
            ].map((benefit, i) => (
              <BenefitCard key={i} title={benefit.title} desc={benefit.desc} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-32 bg-gradient-to-br from-blue-700 via-indigo-800 to-blue-900 border-t-2 border-indigo-600/50">
        <div className="max-w-4xl px-6 mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="show"
            variants={container}
            viewport={{ once: true }}
            className="text-white"
          >
            <motion.h2
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              Ready to stop juggling?
            </motion.h2>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto"
            >
              Thousands of small businesses are already managing everything from one place.
              You could be running your business better in about 30 minutes.
            </motion.p>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
            >
              <Link
                href="/auth/signup"
                className="bg-white text-blue-600 font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 inline-flex items-center gap-2"
              >
                Start free (no card needed)
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
href="#features"
                className="border-2 border-white text-white font-semibold py-3 px-8 rounded-lg hover:bg-white hover:text-blue-600 transition-all duration-300"
              >
                Learn more
              </Link>
            </motion.div>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto"
            >
              {[
                "14 days free",
                "No credit card",
                "Full access",
                "Cancel anytime",
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 text-blue-100">
                  <svg className="w-5 h-5 text-blue-200 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="py-32 bg-gradient-to-br from-blue-950 via-slate-900 to-blue-950 border-t-2 border-blue-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-white">
              We get it
            </h2>
            <p className="text-xl text-blue-700 max-w-3xl mx-auto">
              Running a business is complicated enough without software making it worse.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.0 }}
            className="space-y-6"
            >
              <p className="text-lg text-blue-700 leading-relaxed">
                We started BizCore because we were frustrated too. Frustrated with software that&apos;s harder to use than running a cash register. Frustrated with vendors who don&apos;t care about helping you grow.
              </p>
              <p className="text-lg text-blue-700 leading-relaxed">
                So we built something different. One place for everything. Easy to use. Honest pricing. Real support from people who actually know what you&apos;re dealing with.
              </p>
              <p className="text-lg text-blue-700 leading-relaxed">
                Thousands of small businesses are already running better. Not because they&apos;re tech-savvy. Because BizCore is just... simpler.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.0 }}
              className="grid grid-cols-2 gap-6"
            >
              {[
                { number: "5k+", label: "Happy businesses" },
                { number: "99.9%", label: "Uptime" },
                { number: "30min", label: "Setup time" },
                { number: "24/7", label: "Support" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.9, delay: i * 0.18, ease: "easeOut" }}
                  whileHover={{ 
                    scale: 1.1,
                    y: -12,
                    boxShadow: "0 25px 50px rgba(59, 130, 246, 0.3)",
                    transition: { duration: 0.15 }
                  }}
                  className="p-6 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 cursor-pointer transition-all"
                >
                  <motion.div 
                    className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"
                    initial={{ opacity: 0, scale: 0.7 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: i * 0.18 + 0.3 }}
                  >
                    {stat.number}
                  </motion.div>
                  <motion.div 
                    className="text-blue-700 mt-2"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: i * 0.12 + 0.3 }}
                  >
                    {stat.label}
                  </motion.div>
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
            variants={container}
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
    </div>
</PageWrapper>
  );
}