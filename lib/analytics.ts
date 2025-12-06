export function trackEvent(name: string, payload: Record<string, unknown> = {}) {
  try {
    if (typeof window !== 'undefined') {
      const win = window as Window & { dataLayer?: Array<Record<string, unknown>> }
      if (Array.isArray(win.dataLayer)) {
        win.dataLayer.push({ event: name, ...payload })
        return
      }
      // Add other analytics providers here if needed (e.g., posthog, amplitude, gtag)
      console.log('[analytics] Event:', name, payload)
    }
  } catch (err: unknown) {
    // noop - analytics should not block normal app behavior
    console.error('[analytics] Track error', err)
  }
}
