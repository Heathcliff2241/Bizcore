import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnalyticsManager } from '../AnalyticsManager'
import { trackEvent } from '@/lib/analytics'

jest.mock('@/lib/analytics')

describe('AnalyticsManager', () => {
  it('toggles filters when filter icon clicked and tracks toggle', async () => {
    render(<AnalyticsManager subdomain="le-advena" />)
    // wait for UI to finish loading and for the header to render
    const filterButton = await screen.findByRole('button', { name: /show filters|hide filters/i })
    await userEvent.click(filterButton)
    await waitFor(() => expect(trackEvent).toHaveBeenCalledWith('analytics_toggle_filters', expect.any(Object)))
  })

  it('calls export handler when Generate Report clicked and tracks export', async () => {
    render(<AnalyticsManager subdomain="le-advena" />)
    const exportButton = await screen.findByRole('button', { name: /generate report/i })
    await userEvent.click(exportButton)
    await waitFor(() => expect(trackEvent).toHaveBeenCalledWith('analytics_export_pdf', { source: 'header' }))
  })
})
