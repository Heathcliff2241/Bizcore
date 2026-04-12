'use client';

import type { StorefrontContext } from "./types";

type BlankSectionProps = {
  backgroundColor?: string;
  textColor?: string;
  height?: number;
  storefront?: StorefrontContext;
  fullWidth?: boolean;
};

export function BlankSection({
  backgroundColor = "#ffffff",
  textColor = "#1f2937",
  height = 400,
  fullWidth = false,
}: BlankSectionProps) {
  return (
    <section
      className={`w-full overflow-visible ${fullWidth ? '' : 'max-w-7xl mx-auto'}`}
      style={{
        backgroundColor,
        color: textColor,
        minHeight: `clamp(200px, 50vh, ${height}px)`,
        position: 'relative',
        zIndex: 0,
      }}
    >
      <div className={`w-full ${!fullWidth ? 'px-4 sm:px-6 md:px-8 lg:px-12' : ''} h-full overflow-visible`}>
        {/* Blank section content - supports child elements overlay */}
      </div>
    </section>
  );
}

