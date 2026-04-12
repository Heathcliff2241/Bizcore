'use client';

import { motion } from "framer-motion";
import Image from "next/image";
import type { StorefrontContext } from "./types";
import { resolveStorefrontHref } from "./utils/links";

type HeroGlassProps = {
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
  glassOpacity?: number;
  glassBlurAmount?: number;
  glassBorderColor?: string;
  storefront?: StorefrontContext;
  fullWidth?: boolean;
};

export function HeroGlass({
  heading = "Welcome to Our Store",
  headingSize = 48,
  subheading = "Discover amazing products",
  subheadingSize = 24,
  ctaText = "Shop Now",
  ctaUrl = "#",
  backgroundImage,
  backgroundColor = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  textColor = "#ffffff",
  alignment = "center",
  height = 600,
  glassOpacity = 0.1,
  glassBlurAmount = 10,
  glassBorderColor = "rgba(255, 255, 255, 0.2)",
  storefront,
}: HeroGlassProps) {
  const ctaLink = resolveStorefrontHref(ctaUrl, storefront, { allowEmpty: true, label: ctaText });
  
  // Card dimensions - responsive to section size (matching BrandStudio preview exactly)
  // Use consistent base width of 1440px (standard full-width section) for matching proportions
  const baseWidth = 1440;
  const cardWidth = Math.max(baseWidth * 0.75, 300); // 75% of section width
  const cardHeight = Math.max(height * 0.65, 250); // 65% of section height, min 250px
  const cardPadding = Math.max(baseWidth * 0.04, 24);

  return (
    <section
      className="relative w-full overflow-hidden flex items-center justify-center px-4 sm:px-6 md:px-8"
      style={{
        height: `clamp(400px, 60vh, ${height}px)`,
        background: backgroundColor,
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

      {/* Glass morphism overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `rgba(255, 255, 255, ${glassOpacity})`,
          backdropFilter: `blur(${glassBlurAmount}px)`,
          border: `1px solid ${glassBorderColor}`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />

      {/* Glass Card */}
      <motion.div
        className="relative z-10 flex flex-col justify-center"
        style={{
          width: `${cardWidth}px`,
          height: `${cardHeight}px`,
          maxWidth: '90%',
          background: `rgba(255, 255, 255, ${Math.max(glassOpacity * 0.8, 0.05)})`,
          backdropFilter: `blur(${glassBlurAmount * 0.8}px)`,
          border: `1.5px solid ${glassBorderColor}`,
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15), inset 0 0 60px rgba(255, 255, 255, 0.1)',
          padding: `${cardPadding}px`,
          textAlign: alignment as "left" | "center" | "right",
          alignItems: alignment === 'center' ? 'center' : alignment === 'left' ? 'flex-start' : 'flex-end',
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        viewport={{ once: true }}
      >
        {heading && (
          <h1
            className="font-bold leading-tight tracking-tight text-lg sm:text-2xl md:text-4xl"
            style={{
              color: textColor,
              fontSize: `clamp(24px, 6vw, ${Math.max(headingSize * 0.7, 28)}px)`,
              marginBottom: `clamp(0.5rem, 2vw, ${cardPadding * 0.5}px)`,
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
            }}
          >
            {heading}
          </h1>
        )}

        {subheading && (
          <p
            className="opacity-85 text-sm sm:text-base md:text-lg"
            style={{
              color: textColor,
              fontSize: `clamp(14px, 3vw, ${Math.max(subheadingSize * 0.7, 16)}px)`,
              marginBottom: `clamp(0.75rem, 2vw, ${cardPadding}px)`,
              textShadow: '0 1px 4px rgba(0, 0, 0, 0.1)'
            }}
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
            className="inline-block font-semibold rounded-lg border-none transition-all text-sm sm:text-base"
            style={{
              padding: `clamp(0.5rem, 1vw, ${cardPadding * 0.5}px) clamp(0.75rem, 2vw, ${cardPadding}px)`,
              backgroundColor: '#ffffff',
              color: '#111827',
              fontSize: `${Math.max(14, subheadingSize * 0.5)}px`,
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
            }}
          >
            {ctaText}
          </motion.a>
        )}
      </motion.div>

      {/* Background reflective text */}
      <motion.div
        className="absolute z-0 w-full pointer-events-none"
        style={{
          textAlign: alignment as "left" | "center" | "right",
          paddingLeft: alignment === "left" ? "2rem" : undefined,
          paddingRight: alignment === "right" ? "2rem" : undefined,
          opacity: 0.4,
        }}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 0.4, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        viewport={{ once: true }}
      >
        {heading && (
          <h2
            className="font-bold leading-tight"
            style={{
              color: textColor,
              fontSize: `${headingSize * 1.2}px`,
              marginBottom: '24px',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              letterSpacing: '-1px'
            }}
          >
            {heading}
          </h2>
        )}

        {subheading && (
          <p
            style={{
              color: textColor,
              fontSize: `${subheadingSize}px`,
              opacity: 0.7,
              textShadow: '0 1px 4px rgba(0, 0, 0, 0.1)'
            }}
          >
            {subheading}
          </p>
        )}
      </motion.div>
    </section>
  );
}
