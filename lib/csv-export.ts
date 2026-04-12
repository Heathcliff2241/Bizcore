/**
 * CSV Export Utility Functions
 * Uses papaparse for CSV generation
 */

import Papa from 'papaparse'

/**
 * Convert data to CSV and trigger download
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
) {
  // If columns are specified, map data to only include those columns with renamed headers
  let processedData: Record<string, unknown>[]

  if (columns) {
    processedData = data.map((row) => {
      const newRow: Record<string, unknown> = {}
      columns.forEach((col) => {
        newRow[col.label] = row[col.key]
      })
      return newRow
    })
  } else {
    processedData = data
  }

  // Generate CSV
  const csv = Papa.unparse(processedData)

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Format date for CSV export
 */
export function formatDateForCSV(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * Format currency for CSV export
 */
export function formatCurrencyForCSV(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '0.00'
  return amount.toFixed(2)
}

/**
 * Format boolean for CSV export
 */
export function formatBooleanForCSV(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return 'No'
  return value ? 'Yes' : 'No'
}

/**
 * Clean text for CSV (remove line breaks, extra spaces)
 */
export function cleanTextForCSV(text: string | null | undefined): string {
  if (!text) return ''
  return text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Export data from API endpoint
 * Fetches data and triggers CSV download
 */
export async function exportFromAPI<T extends Record<string, unknown>>(
  endpoint: string,
  filename: string,
  columns?: { key: keyof T; label: string }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(endpoint)

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`)
    }

    const data = await response.json()

    // Handle different response formats
    const exportData = Array.isArray(data) ? data : data.data || []

    if (exportData.length === 0) {
      return { success: false, error: 'No data to export' }
    }

    exportToCSV(exportData, filename, columns)
    return { success: true }
  } catch (error) {
    console.error('CSV export error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed',
    }
  }
}


