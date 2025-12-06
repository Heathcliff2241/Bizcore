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
        height: `${height}px`,
      }}
    >
      <div className={`w-full ${!fullWidth ? 'px-8 md:px-16 lg:px-24' : ''} h-full overflow-visible`}>
        <div className="flex items-center justify-center h-full">
          <div
            className="text-sm font-medium"
            style={{ color: textColor }}
          >
            Blank Section
          </div>
        </div>
      </div>
    </section>
  );
}

