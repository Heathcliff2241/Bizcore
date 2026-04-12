'use client';

import type { StorefrontContext } from "./types";

type BlankHeaderSectionProps = {
  backgroundColor?: string;
  textColor?: string;
  height?: number;
  sticky?: boolean;
  storefront?: StorefrontContext;
  fullWidth?: boolean;
};

export function BlankHeaderSection({
  backgroundColor = "#ffffff",
  textColor = "#1f2937",
  height = 80,
  sticky = true,
  fullWidth = false,
}: BlankHeaderSectionProps) {
  return (
    <header
      className={`w-full border-b border-gray-200 z-50 overflow-visible ${
        sticky ? "sticky top-0" : "relative"
      }`}
      style={{
        backgroundColor,
        color: textColor,
        height: `clamp(56px, 12vw, ${height}px)`,
      }}
    >
      <div className={`w-full ${!fullWidth ? 'max-w-7xl mx-auto' : ''} px-4 sm:px-6 md:px-8 lg:px-12 h-full overflow-visible`}>
        <div className="flex items-center justify-center h-full">
          <div
            className="text-sm font-medium"
            style={{ color: textColor }}
          >
            Blank Header
          </div>
        </div>
      </div>
    </header>
  );
}
