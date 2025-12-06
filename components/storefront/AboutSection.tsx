'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import type { StorefrontContext } from './types';

type AboutSectionProps = {
  heading?: string;
  subheading?: string;
  description?: string;
  image?: string;
  imagePosition?: 'left' | 'right';
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  padding?: number;
  storefront?: StorefrontContext;
  fullWidth?: boolean;
  size?: { width: number; height: number };
};

export function AboutSection({
  heading = 'About Us',
  subheading = 'Our Story',
  description = 'We are a team of passionate individuals dedicated to creating exceptional products and experiences.',
  image,
  imagePosition = 'left',
  backgroundColor = '#ffffff',
  textColor = '#000000',
  accentColor = '#3b82f6',
  padding = 60,
  fullWidth = true,
}: AboutSectionProps) {
  return (
    <section
      className="w-full overflow-hidden"
      style={{
        backgroundColor,
        padding: `${padding}px`,
      }}
    >
      <motion.div
        className={`${fullWidth ? 'w-full' : 'max-w-6xl mx-auto'}`}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center ${imagePosition === 'right' ? 'md:grid-cols-2' : ''}`}>
          {/* Image - Left */}
          {image && imagePosition === 'left' && (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="relative w-full aspect-square rounded-lg overflow-hidden shadow-lg"
            >
              <Image
                src={image}
                alt={heading}
                fill
                className="object-cover"
                priority
              />
            </motion.div>
          )}

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: imagePosition === 'left' ? 30 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            {subheading && (
              <motion.p
                className="text-sm font-semibold uppercase tracking-wide mb-2"
                style={{ color: accentColor }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
              >
                {subheading}
              </motion.p>
            )}

            <motion.h2
              className="text-4xl font-bold mb-6 leading-tight"
              style={{ color: textColor }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
            >
              {heading}
            </motion.h2>

            <motion.p
              className="text-lg leading-relaxed mb-8 opacity-90"
              style={{ color: textColor }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              viewport={{ once: true }}
            >
              {description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              viewport={{ once: true }}
              className="flex gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="px-6 py-3 rounded-lg font-semibold text-white transition-all"
                style={{ backgroundColor: accentColor }}
              >
                Learn More
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Image - Right */}
          {image && imagePosition === 'right' && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="relative w-full aspect-square rounded-lg overflow-hidden shadow-lg"
            >
              <Image
                src={image}
                alt={heading}
                fill
                className="object-cover"
                priority
              />
            </motion.div>
          )}
        </div>
      </motion.div>
    </section>
  );
}
