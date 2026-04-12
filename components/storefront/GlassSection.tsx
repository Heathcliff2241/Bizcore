'use client';

import type { StorefrontContext } from "./types";

type GlassSectionProps = {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  glassBlurAmount?: number;
  height?: number;
  storefront?: StorefrontContext;
  fullWidth?: boolean;
};

export function GlassSection({
  backgroundColor = "rgba(255, 255, 255, 0.1)",
  borderColor = "rgba(255, 255, 255, 0.3)",
  borderWidth = 1.5,
  glassBlurAmount = 15,
  height = 400,
  fullWidth = false,
}: GlassSectionProps) {
  return (
    <section
      className={`w-full overflow-visible relative ${fullWidth ? '' : 'max-w-7xl mx-auto'}`}
      style={{
        minHeight: `clamp(200px, 50vh, ${height}px)`,
        position: 'relative',
        zIndex: 0,
      }}
    >
      {/* Glass morphism background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: backgroundColor,
          backdropFilter: `blur(${glassBlurAmount}px)`,
          WebkitBackdropFilter: `blur(${glassBlurAmount}px)`,
          border: `${borderWidth}px solid ${borderColor}`,
          borderRadius: '16px',
          boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.1)',
          pointerEvents: 'none',
        }}
      />

      {/* Content container */}
      <div className={`w-full ${!fullWidth ? 'px-4 sm:px-6 md:px-8 lg:px-12' : ''} h-full overflow-visible relative z-10`}>
        {/* Glass section content - supports child elements overlay */}
      </div>
    </section>
  );
}
