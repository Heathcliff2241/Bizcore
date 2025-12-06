/**
 * Payment Proof Types
 * Type definitions for payment proof functionality
 */

/**
 * Payment proof data structure
 * Represents image data encoded as base64 data URL
 */
export interface PaymentProof {
  /** Base64 encoded image data (e.g., 'data:image/png;base64,...') */
  data: string;
  /** MIME type of the image (e.g., 'image/png', 'image/jpeg') */
  mimeType: 'image/png' | 'image/jpeg' | 'image/jpg' | 'image/webp' | 'image/gif';
  /** Original filename if available */
  filename?: string;
  /** File size in bytes */
  size?: number;
  /** Timestamp when proof was uploaded */
  uploadedAt?: Date;
}

/**
 * Order with payment proof information
 * Extends the basic Order type with payment proof details
 */
export interface OrderWithPaymentProof {
  id: number;
  tenantId: number;
  orderNumber: string;
  status: string;
  paymentStatus: 'unpaid' | 'paid' | 'pending' | 'failed';
  paymentMethod?: string;
  paymentProof?: string; // Base64 encoded data URL
  amountPaid: number;
  total: number;
  tax: number;
  discount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Request payload for creating an order with payment proof
 */
export interface CreateOrderWithProofRequest {
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
  }>;
  deliveryType: 'dine-in' | 'takeout' | 'delivery';
  address?: string;
  subtotal: number;
  paymentMethod: string;
  paymentProof?: string; // Optional base64 data URL
  tip?: number;
  discount?: number;
  deliveryFee?: number;
}

/**
 * Response for order creation
 */
export interface CreateOrderResponse {
  success: boolean;
  data: OrderWithPaymentProof;
  message?: string;
}

/**
 * Utility function to validate base64 string
 */
export function isValidBase64(str: string): boolean {
  try {
    // Check if it's a data URL format
    if (str.startsWith('data:')) {
      const base64Part = str.split(',')[1];
      return /^[A-Za-z0-9+/=]+$/.test(base64Part);
    }
    // Plain base64 string
    return /^[A-Za-z0-9+/=]+$/.test(str) && str.length % 4 === 0;
  } catch {
    return false;
  }
}

/**
 * Convert File object to base64 data URL
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Extract MIME type from base64 data URL
 */
export function extractMimeType(dataUrl: string): string {
  const match = dataUrl.match(/data:([^;]+);/);
  return match ? match[1] : 'image/png';
}

/**
 * Get approximate file size from base64 string
 * Note: Base64 is 33% larger than binary
 */
export function estimateBase64Size(base64String: string): number {
  const base64Part = base64String.includes(',') ? base64String.split(',')[1] : base64String;
  // Remove padding to get actual byte count
  const padding = (base64Part.match(/=/g) || []).length;
  return Math.ceil((base64Part.length * 3) / 4 - padding);
}

/**
 * Validate payment proof file
 */
export interface PaymentProofValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validatePaymentProof(file?: File | string): PaymentProofValidation {
  const validation: PaymentProofValidation = {
    valid: true,
    errors: [],
    warnings: []
  };

  if (!file) {
    // Payment proof is optional
    return validation;
  }

  if (typeof file === 'string') {
    // Validate base64 string
    if (!isValidBase64(file)) {
      validation.valid = false;
      validation.errors.push('Invalid base64 format');
    }

    const sizeBytes = estimateBase64Size(file);
    const sizeMB = sizeBytes / 1024 / 1024;

    if (sizeMB > 5) {
      validation.warnings.push(`File size is ${sizeMB.toFixed(2)}MB, consider compressing for better performance`);
    }
  } else {
    // Validate File object
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      validation.valid = false;
      validation.errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum of 5MB`);
    }

    const validMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!validMimes.includes(file.type)) {
      validation.valid = false;
      validation.errors.push(`File type ${file.type} not supported. Supported: ${validMimes.join(', ')}`);
    }
  }

  return validation;
}

/**
 * Payment proof upload helper
 */
export class PaymentProofUploader {
  private readonly maxFileSize: number;
  private readonly supportedMimes: string[];

  constructor(maxFileSizeMB: number = 5) {
    this.maxFileSize = maxFileSizeMB * 1024 * 1024;
    this.supportedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
  }

  /**
   * Convert file to base64 and validate
   */
  async convert(file: File): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      // Validate file
      if (file.size > this.maxFileSize) {
        return {
          success: false,
          error: `File size exceeds ${this.maxFileSize / 1024 / 1024}MB limit`
        };
      }

      if (!this.supportedMimes.includes(file.type)) {
        return {
          success: false,
          error: `Unsupported file type: ${file.type}`
        };
      }

      // Convert to base64
      const base64 = await fileToBase64(file);
      return { success: true, data: base64 };
    } catch (error) {
      return {
        success: false,
        error: `Failed to convert file: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate and send order with payment proof
   */
  async submitOrder(
    orderData: CreateOrderWithProofRequest,
    file?: File
  ): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
    try {
      let paymentProof: string | undefined;

      if (file) {
        const conversion = await this.convert(file);
        if (!conversion.success) {
          return { success: false, error: conversion.error };
        }
        paymentProof = conversion.data;
      }

      // Submit order
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...orderData,
          paymentProof
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Failed to create order' };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: `Failed to submit order: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

/**
 * Export all types and utilities
 */
const paymentProofExports = {
  isValidBase64,
  fileToBase64,
  extractMimeType,
  estimateBase64Size,
  validatePaymentProof,
  PaymentProofUploader
};

export default paymentProofExports;
