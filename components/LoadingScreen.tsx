'use client'

import { motion } from 'framer-motion'
import BizCoreWordmark from './BizCoreWordmark'

export default function LoadingScreen() {
  const statements = [
    "Your business, elevated.",
    "Manage. Scale. Succeed.",
    "Built for growth.",
    "Automate everything.",
    "Simple yet powerful.",
    "Your success is our mission.",
  ]

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-white overflow-hidden">
      {/* Soft gradient background with subtle blue accents */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50 to-white backdrop-blur-sm pointer-events-none" />

      {/* Subtle animated orbs (blue accents on white) */}
      <motion.div
        animate={{ x: [-80, 80, -80], y: [0, 40, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        className="absolute top-8 left-16 w-64 h-64 rounded-full bg-gradient-to-br from-blue-200 to-indigo-200 blur-3xl opacity-20 pointer-events-none"
      />
      <motion.div
        animate={{ x: [80, -80, 80], y: [0, -40, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-16 right-12 w-72 h-72 rounded-full bg-gradient-to-br from-indigo-200 to-blue-100 blur-3xl opacity-18 pointer-events-none"
      />

      {/* Background statements with rotating overlays (very subtle, blue) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {statements.map((statement, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.03, 0.12, 0.03] }}
            transition={{
              delay: index * 2.2,
              duration: 7,
              repeat: Infinity,
              repeatType: "mirror"
            }}
            className="absolute text-lg font-semibold text-blue-100"
            style={{
              left: `${Math.random() * 80 + 10}%`,
              top: `${Math.random() * 80 + 10}%`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          >
            {statement}
          </motion.div>
        ))}

        {/* Parallax icons - decorative */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`icon-${i}`}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.01, 0.06, 0.01],
              x: [0, Math.random() * 14 - 7, 0],
              y: [0, Math.random() * 14 - 7, 0],
            }}
            transition={{
              delay: i * 1.6,
              duration: 9,
              repeat: Infinity,
              repeatType: "mirror"
            }}
            className="absolute text-6xl text-blue-100"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          >
            {["●", "○", "◆", "◇", "■", "□", "▲", "△"][i]}
          </motion.div>
        ))}
      </div>

      {/* Creative rotating SVG loader and text */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex flex-col items-center gap-6"
      >
        <div className="relative w-28 h-28">
          <motion.svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            animate={{ rotate: [0, 360] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
          >
            <defs>
              <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1D4ED8" />
                <stop offset="100%" stopColor="#6D28D9" />
              </linearGradient>
              <linearGradient id="lg2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#93C5FD" />
              </linearGradient>
            </defs>

            {/* Outer ring - dashed stroke for motion feel */}
            <circle cx="50" cy="50" r="42" fill="none" stroke="url(#lg1)" strokeWidth="7" strokeLinecap="round" strokeDasharray="84 156" />

            {/* Inner ring rotating opposite direction slightly faster */}
            <motion.circle
              cx="50"
              cy="50"
              r="28"
              fill="none"
              stroke="url(#lg2)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray="60 120"
              animate={{ rotate: [0, -360] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
              style={{ originX: '50%', originY: '50%' }}
            />

            {/* center left intentionally empty; overlayed with BCLogo component */}
          </motion.svg>

          {/* (logo intentionally removed for simplified loading screen) */}
        </div>

        <motion.div
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-center"
        >
          <div className="flex flex-col items-center gap-1">
            <BizCoreWordmark className="text-3xl" />
            <p className="text-blue-600 text-sm mt-1">Setting things up for you...</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="absolute bottom-8 text-center text-sm text-blue-500"
      >
        Secure by default. Cancel anytime.
      </motion.div>
    </div>
  )
}
