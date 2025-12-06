'use client';

import { motion } from "framer-motion";

type GlassElementProps = {
  width?: number;
  height?: number;
  glassBlurAmount?: number;
  glassBorderColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  children?: React.ReactNode;
};

export function GlassElement({
  width = 400,
  height = 300,
  glassBlurAmount = 15,
  glassBorderColor = "rgba(255, 255, 255, 0.3)",
  backgroundColor = "rgba(255, 255, 255, 0.1)",
  borderRadius = 20,
  borderWidth = 1.5,
  children,
}: GlassElementProps) {
  return (
    <motion.div
      className="group relative overflow-hidden flex items-center justify-center"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        background: backgroundColor,
        backdropFilter: `blur(${glassBlurAmount}px)`,
        border: `${borderWidth}px solid ${glassBorderColor}`,
        borderRadius: `${borderRadius}px`,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 0 60px rgba(255, 255, 255, 0.1)',
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      {/* Reflective gradient overlay for interactive glow */}
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 50%, rgba(255, 255, 255, 0.1) 100%)',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: 1,
          transition: 'opacity 0.3s ease',
        }}
        className="group-hover:opacity-100"
      />

      {/* Inner shine effect */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '30%',
          height: '30%',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(20px)',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: 0,
          transition: 'opacity 0.3s ease',
        }}
        className="group-hover:opacity-60"
      />

      {/* Content on top of glass */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>
    </motion.div>
  );
}
