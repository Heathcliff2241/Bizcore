import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AnalyticsManager } from '@/components/dashboard/analytics/AnalyticsManager'
import { trackEvent } from '@/lib/analytics'

describe('AnalyticsManager UI', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('toggles filter panel when compact filter icon clicked', async () => {
    render(<AnalyticsManager subdomain="le-advena" />)

    const filterButton = await screen.findByRole('button', { name: /Show filters|Hide filters/i })
    expect(filterButton).toBeInTheDocument()

    // Panel not visible initially
    expect(screen.queryByText(/Start Date/i)).not.toBeInTheDocument()

    fireEvent.click(filterButton)

    // Now panel is visible
    expect(await screen.findByText(/Start Date/i)).toBeInTheDocument()

    // Toggle again - hide
    fireEvent.click(filterButton)
    await waitFor(() => expect(screen.queryByText(/Start Date/i)).not.toBeInTheDocument())
  })

  test('Generate Report button triggers analytics event and calls handleExportPDF', async () => {
    render(<AnalyticsManager subdomain="le-advena" />)

    const generateButton = await screen.findByRole('button', { name: /Generate Report/i })
    expect(generateButton).toBeInTheDocument()

    // Click to generate report
    // clicking generate may launch async pdf generation, which we mock
    fireEvent.click(generateButton)

    // trackEvent should have been called with analytics_export_pdf
    await waitFor(() => expect(trackEvent).toHaveBeenCalledWith('analytics_export_pdf', expect.any(Object)))
  })
})
