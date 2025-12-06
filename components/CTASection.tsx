import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaArrowRight, FaCheckCircle } from "react-icons/fa";

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

interface CTASectionProps {
  storefront?: unknown
}

export default function CTASection({ storefront }: CTASectionProps) {
  const benefits = [
    "Free 14-day trial",
    "No credit card required",
    "Full access to all features",
    "Priority support included",
  ];

  return (
    <section className="py-20 bg-gradient-to-r from-emerald-600 to-teal-500">
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
            Ready to Transform Your Business?
          </motion.h2>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-emerald-100 mb-8 max-w-2xl mx-auto"
          >
            Join thousands of businesses already using BizCore to streamline operations,
            boost efficiency, and create amazing brand experiences.
          </motion.p>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          >
            <Link
              href="/auth/signup"
              className="bg-white text-emerald-600 font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 inline-flex items-center gap-2"
            >
              Start Free Trial
              <FaArrowRight className="text-sm" />
            </Link>
            <Link
              href="/dashboard"
              className="border-2 border-white text-white font-semibold py-3 px-8 rounded-lg hover:bg-white hover:text-emerald-600 transition-all duration-300"
            >
              View Demo
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto"
          >
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-2 text-emerald-100">
                <FaCheckCircle className="text-emerald-200 flex-shrink-0" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}