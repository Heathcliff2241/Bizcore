'use client';

import { motion } from "framer-motion";
import Image from "next/image";
import type { StorefrontContext } from "./types";
import { resolveStorefrontHref } from "./utils/links";

type HeroSectionProps = {
heading?: string;
  headingSize?: number;
  subheading?: string;
  subheadingSize?: number;
  ctaText?: string;
  ctaUrl?: string;
  backgroundImage?: string;
  backgroundColor?: string;
textColor?: string;
  alignment?: "left" | "center" | "right";
  height?: number;
storefront?: StorefrontContext;
  fullWidth?: boolean;
};

export function HeroSection({
heading = "Welcome to Our Store",
  headingSize = 48,
  subheading = "Discover amazing products",
  subheadingSize = 24,
  ctaText = "Shop Now",
  ctaUrl = "#",
  backgroundImage,
  backgroundColor = "#3b82f6",
textColor = "#ffffff",
  alignment = "center",
  height = 600,
storefront,
}: HeroSectionProps) {
  const ctaLink = resolveStorefrontHref(ctaUrl, storefront, { allowEmpty: true, label: ctaText });

  return (
    <section
      className="relative w-full overflow-hidden flex items-center"
      style={{
        height: `${height}px`,
        backgroundColor: backgroundImage ? "transparent" : backgroundColor,
      }}
    >
      {/* Background */}
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={backgroundImage}
            alt="Hero background"
            fill
            className="object-cover scale-105 transition-transform duration-[3s] ease-out hover:scale-110"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/50" />
        </div>
      )}

      {/* Content */}
      <motion.div
        className={`relative z-10 w-full ${
          alignment === "center"
            ? "text-center"
            : alignment === "right"
            ? "text-right"
            : "text-left"
        }`}
        style={{
          paddingLeft: alignment === "left" ? "2rem" : undefined,
          paddingRight: alignment === "right" ? "2rem" : undefined,
        }}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true }}
      >
          <h1
            className="font-bold mb-6 leading-tight tracking-tight"
            style={{ color: textColor, fontSize: `${headingSize}px` }}
          >
            {heading}
          </h1>

          {subheading && (
            <p
              className="mb-8 opacity-90"
              style={{ color: textColor, fontSize: `${subheadingSize}px` }}
            >
              {subheading}
            </p>
          )}

          {ctaText && (
            <motion.a
              href={ctaLink.href}
              target={ctaLink.isExternal ? "_blank" : undefined}
              rel={ctaLink.isExternal ? "noopener noreferrer" : undefined}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="inline-block px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl shadow-md hover:shadow-xl transition-all text-lg"
            >
              {ctaText}
            </motion.a>
          )}
        </motion.div>
      </section>
    );
  }
