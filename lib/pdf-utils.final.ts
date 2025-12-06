/*
 * pdf-utils.final.ts
 * Clean consolidated PDF helpers. Temporary file used to replace the corrupted `pdf-utils.ts`.
 */

export type PageSize = {
  getWidth?: () => number
  getHeight?: () => number
  width?: number
  height?: number
}

type PdfInternal = {
  pageSize?: PageSize
  pages?: unknown[]
}

export type JsPdf = {
  internal?: PdfInternal
  setFontSize?: (v: number) => void
  setTextColor?: (...args: unknown[]) => void
  setFont?: (...args: unknown[]) => void
  setDrawColor?: (...args: unknown[]) => void
  line?: (...args: unknown[]) => void
  setPage?: (i: number) => void
  text?: (text: string, x: number, y: number, opts?: { align?: string }) => void
  addPage?: () => void
  save?: (filename: string) => void
  getNumberOfPages?: () => number
  lastAutoTable?: { finalY?: number }
  autoTable?: (options: Record<string, unknown>) => void
}

type JsPdfConstructor = new (opts?: unknown) => JsPdf
type AutoTableFn = (...args: unknown[]) => unknown

export type CreatePdfResult = {
  pdf: JsPdf
  safeAutoTable: (options: Record<string, unknown>) => void
  jsPDF?: JsPdfConstructor | ((opts?: unknown) => JsPdf)
  autoTable?: AutoTableFn
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function createPdfWithAutoTable(jsPDFModule: unknown, autoTableModule: unknown, opts?: unknown): CreatePdfResult {
  // Resolve module shapes (CJS/ESM/default/UMD)
  // Resolve interchangeable module shapes (cjs/esm/UMD)
  const jsPDFCtorRaw = ((jsPDFModule as unknown) as Record<string, unknown>)?.jsPDF ?? ((jsPDFModule as unknown) as Record<string, unknown>)?.default ?? jsPDFModule
  const autoTableRaw = ((autoTableModule as unknown) as Record<string, unknown>)?.default ?? autoTableModule

  let pdf: JsPdf = {} as JsPdf
  const jsPDF = jsPDFCtorRaw as JsPdfConstructor | ((opts?: unknown) => JsPdf) | undefined

  try {
    if (typeof jsPDF === 'function') {
      try {
        // prefer the constructor path
        pdf = new (jsPDF as JsPdfConstructor)(opts ?? { orientation: 'portrait', unit: 'mm', format: 'a4' })
      } catch {
        // fallback to callable constructor (UMD/legacy shape)
        pdf = (jsPDF as (opts?: unknown) => JsPdf)(opts ?? { orientation: 'portrait', unit: 'mm', format: 'a4' })
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[pdf-utils.final] failed to initialize jsPDF', err)
    pdf = {} as JsPdf
  }

  // Try to register plugin on constructor first; then try instance
  if (typeof autoTableRaw === 'function') {
    try {
      (autoTableRaw as AutoTableFn)(jsPDF)
    } catch (err) {
      try {
        (autoTableRaw as AutoTableFn)(pdf)
      } catch {
        // eslint-disable-next-line no-console
        console.warn('[pdf-utils.final] failed to register jspdf-autotable on constructor or instance', err)
      }
    }
  }

  const cloneArrayLike = (val: unknown): unknown => {
    if (!Array.isArray(val)) return val
    return (val as unknown[]).map((row) => (Array.isArray(row) ? [...(row as unknown[])] : row))
  }

  const safeAutoTable = (options: Record<string, unknown>) => {
    try {
      const api = pdf || ({} as JsPdf)
      if (typeof api.autoTable === 'function') {
        const opt = { ...(options ?? {}) } as Record<string, unknown> & { head?: unknown; body?: unknown }
        if (Array.isArray(opt.head)) opt.head = cloneArrayLike(opt.head)
        if (Array.isArray(opt.body)) opt.body = cloneArrayLike(opt.body)
        api.autoTable(opt)
        return
      }

      if (typeof autoTableRaw === 'function') {
        const opt2 = { ...(options ?? {}) } as Record<string, unknown> & { head?: unknown; body?: unknown }
        if (Array.isArray(opt2.head)) opt2.head = cloneArrayLike(opt2.head)
        if (Array.isArray(opt2.body)) opt2.body = cloneArrayLike(opt2.body)
        ;(autoTableRaw as AutoTableFn)(pdf, opt2)
        return
      }

      // eslint-disable-next-line no-console
      console.warn('[pdf-utils.final] jspdf-autotable plugin not found (no-op)')
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[pdf-utils.final] safeAutoTable error:', err)
    }
  }

  return { pdf, safeAutoTable, jsPDF: jsPDF as JsPdfConstructor | ((opts?: unknown) => JsPdf), autoTable: autoTableRaw as AutoTableFn }
}

export default createPdfWithAutoTable

export function getNumberOfPages(pdf: JsPdf): number {
  try {
    if (typeof pdf.getNumberOfPages === 'function') return pdf.getNumberOfPages()
    // some builds expose getNumberOfPages under internal
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (pdf.internal && typeof (pdf.internal as any)?.getNumberOfPages === 'function') return (pdf.internal as any).getNumberOfPages()
    if (pdf.internal && Array.isArray(pdf.internal.pages)) return Math.max(0, pdf.internal.pages.length - 1)
  } catch {
    // ignore
  }
  return 1
}

export function computeNextStartY(pdf: JsPdf | undefined, defaultY = 10, gap = 6): number {
  const finalY = pdf?.lastAutoTable?.finalY
  if (Number.isFinite(finalY as unknown as number)) return (finalY as unknown as number) + gap
  return defaultY
}

export type DidDrawPageOpts = {
  footerText?: string
  fontSize?: number
  margin?: { left?: number; right?: number }
}

export function createDidDrawPage(pdf: JsPdf, opts?: DidDrawPageOpts) {
  const { footerText, fontSize = 8 } = opts || {}
  return function didDrawPage(): void {
    try {
      const pageCount = getNumberOfPages(pdf)

      const width =
        (pdf.internal && pdf.internal.pageSize && typeof (pdf.internal.pageSize as PageSize)?.getWidth === 'function' && (pdf.internal.pageSize as PageSize).getWidth?.()) ||
        (pdf.internal?.pageSize?.width as number) ||
        210

      const height =
        (pdf.internal && pdf.internal.pageSize && typeof (pdf.internal.pageSize as PageSize)?.getHeight === 'function' && (pdf.internal.pageSize as PageSize).getHeight?.()) ||
        (pdf.internal?.pageSize?.height as number) ||
        297

      pdf.setFontSize?.(fontSize)
      pdf.setTextColor?.(150)

      for (let i = 1; i <= pageCount; i++) {
        try {
          pdf.setPage?.(i)
          const text = footerText ? `${footerText} | Page ${i} of ${pageCount}` : `Page ${i} of ${pageCount}`
          pdf.text?.(`${text}`, width / 2, height - 10, { align: 'center' })
        } catch {
          // continue silently for per-page failures
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[pdf-utils.final] createDidDrawPage failed', err)
    }
  }
}
