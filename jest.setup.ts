/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
/*
 * Test setup file for Jest.
 * Many test files require mocking globals or using require/import patterns
 * that are acceptable in test environments; we allow the following rules
 * to be disabled for this file to keep code readable and maintainable:
 *   - @typescript-eslint/no-explicit-any
 *   - @typescript-eslint/no-require-imports
 */
import '@testing-library/jest-dom'
import React from 'react'
import { TextEncoder } from 'util'

interface AnalyticsData {
  success: boolean;
  data: {
    kpis: {
      totalOrders: number;
      totalRevenue: number;
      totalTax: number;
      amountPaid: number;
      averageOrderValue: number;
      outstandingAmount: number;
      inventoryValue: number;
      totalProducts: number;
      outOfStockCount: number;
      lowStockCount: number;
    };
    orders: {
      statusBreakdown: Record<string, unknown>;
      paymentBreakdown: Record<string, unknown>;
      total: number;
      list: unknown[];
    };
    products: {
      topProducts: unknown[];
      categoryData: unknown[];
      total: number;
      outOfStock: unknown[];
      lowStock: unknown[];
    };
    inventory: {
      items: unknown[];
      lowStockItems: unknown[];
      totalValue: number;
      totalItems: number;
    };
    revenue: {
      dailyTrend: unknown[];
      totalRevenue: number;
      averagePerOrder: number;
    };
  };
}

// Mock global fetch default to a successful empty analytics dataset
global.fetch = jest.fn(async (): Promise<Response> => {
  return {
    ok: true,
    json: async (): Promise<AnalyticsData> => ({ success: true, data: { kpis: { totalOrders: 0, totalRevenue: 0, totalTax: 0, amountPaid: 0, averageOrderValue: 0, outstandingAmount: 0, inventoryValue: 0, totalProducts: 0, outOfStockCount: 0, lowStockCount: 0 }, orders: { statusBreakdown: {}, paymentBreakdown: {}, total: 0, list: [] }, products: { topProducts: [], categoryData: [], total: 0, outOfStock: [], lowStock: [] }, inventory: { items: [], lowStockItems: [], totalValue: 0, totalItems: 0 }, revenue: { dailyTrend: [], totalRevenue: 0, averagePerOrder: 0 } } } )
  } as Response;
}) as jest.Mock

// Mock settings context to avoid network dependency
jest.mock('@/lib/settings-context', () => {
  const defaultSettings = {
    brandColors: {
      primary: '#059669',
      secondary: '#10b981',
      accent: '#34d399',
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#111827'
    },
    typography: { titleFont: 'Inter', textFont: 'Inter', contentFont: 'Inter' },
    layout: { headerStyle: 'modern', footerStyle: 'minimal', sectionSpacing: 'comfortable' },
    seo: { metaTitle: '', metaDescription: '', keywords: '' }
  }
  return {
    SettingsProvider: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    useSettings: () => ({ settings: defaultSettings, loading: false, error: null, updateSettings: jest.fn(), refetchSettings: jest.fn() })
  }
})

// Mock next-auth useSession to bypass auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({ data: { user: { id: 1 } } }))
}))

// Mock lib/pdf-utils to avoid jspdf dependency
jest.mock('@/lib/pdf-utils', () => ({
  __esModule: true,
  default: jest.fn(() => ({ pdf: {}, safeAutoTable: jest.fn() })),
  computeNextStartY: jest.fn(() => 0),
  createDidDrawPage: jest.fn(() => undefined),
  createPdfWithAutoTable: jest.fn(() => ({ pdf: { save: jest.fn() }, safeAutoTable: jest.fn() }))
}))

// Also mock the final PDF utils module used by the app
jest.mock('@/lib/pdf-utils.final', () => ({
  __esModule: true,
  default: jest.fn(() => ({ pdf: {}, safeAutoTable: jest.fn() })),
  computeNextStartY: jest.fn(() => 0),
  createDidDrawPage: jest.fn(() => undefined),
  createPdfWithAutoTable: jest.fn(() => ({ pdf: { save: jest.fn() }, safeAutoTable: jest.fn() })),
}))

// Mock the analytics tracker
jest.mock('@/lib/analytics', () => ({
  trackEvent: jest.fn()
}))

// Mock global alert to avoid JSDOM not implemented
global.alert = jest.fn()

// Mock scrollTo used by motion dom
global.scrollTo = jest.fn()

// Polyfill TextEncoder for libs that require it during tests
if (typeof (globalThis as unknown as { TextEncoder?: typeof TextEncoder }).TextEncoder === 'undefined') {
  ;(globalThis as unknown as { TextEncoder?: typeof TextEncoder }).TextEncoder = TextEncoder
}

// Mock jsPDF and jspdf-autotable to prevent loading large libraries during tests
jest.mock('jspdf', () => ({ jsPDF: jest.fn(() => ({
  internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 }, pages: [null] },
  save: jest.fn(),
  addPage: jest.fn(),
  setFontSize: jest.fn(),
  setFont: jest.fn(),
  setTextColor: jest.fn(),
  setDrawColor: jest.fn(),
  line: jest.fn(),
  text: jest.fn()
})) }))

// The PDF utils wrapper is mocked above - we don't mock the temp refactor files here anymore.

jest.mock('jspdf-autotable', () => jest.fn())
