import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaRocket, FaPalette, FaDatabase } from "react-icons/fa";

interface Tenant {
  name: string;
  logo: React.ReactNode;
  tagline: string;
  color: string;
}

interface ModulesShowcaseProps {
  tenants: Tenant[];
}

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

export default function ModulesShowcase({ tenants }: ModulesShowcaseProps) {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 to-emerald-50">
      <div className="max-w-6xl px-6 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold md:text-4xl text-emerald-800">
            Explore BizCore Modules
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-gray-600">
            Discover the powerful tools that make BizCore your complete business solution
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          variants={container}
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-8 md:grid-cols-2"
        >
          {tenants.map((tenant, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="relative overflow-hidden transition-all duration-300 bg-white shadow-lg group rounded-2xl hover:shadow-xl"
            >
              <div className={`h-2 bg-gradient-to-r ${tenant.color}`} />
              <div className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-100">
                    {tenant.logo}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      {tenant.name}
                    </h3>
                    <p className="text-sm text-gray-500">{tenant.tagline}</p>
                  </div>
                </div>

                <p className="mb-6 text-gray-600">
                  {tenant.name === "Dashboard"
                    ? "Manage orders, inventory, and business analytics all in one place."
                    : "Create stunning brand designs with our powerful visual editor."}
                </p>

                <Link
                  href={tenant.name === "Dashboard" ? "/dashboard" : "/brandstudio"}
                  className="inline-flex items-center gap-2 font-medium transition-colors text-emerald-600 hover:text-emerald-700"
                >
                  Explore {tenant.name}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional Features */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="p-6 bg-white shadow-sm rounded-xl">
              <FaDatabase className="mx-auto mb-3 text-2xl text-emerald-600" />
              <h4 className="mb-2 font-semibold text-gray-800">Database Management</h4>
              <p className="text-sm text-gray-600">Built-in pgAdmin for easy database management</p>
            </div>
            <div className="p-6 bg-white shadow-sm rounded-xl">
              <FaRocket className="mx-auto mb-3 text-2xl text-emerald-600" />
              <h4 className="mb-2 font-semibold text-gray-800">Docker Ready</h4>
              <p className="text-sm text-gray-600">Complete containerized development environment</p>
            </div>
            <div className="p-6 bg-white shadow-sm rounded-xl">
              <FaPalette className="mx-auto mb-3 text-2xl text-emerald-600" />
              <h4 className="mb-2 font-semibold text-gray-800">Modern UI</h4>
              <p className="text-sm text-gray-600">Beautiful, responsive design with smooth animations</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}