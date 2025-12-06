import { measureTextDimensions } from '../brandstudio-vite/src/components/Editor/CanvasHelpers'

describe('measureTextDimensions', () => {
  it('measures single-line width and height', () => {
    const res = measureTextDimensions('Hello world', 16, 'Arial', 1.2)
    expect(res.width).toBeGreaterThan(0)
    expect(res.height).toBeGreaterThan(0)
  })

  it('wraps into multiple lines when maxWidth set', () => {
    const text = 'This is a long text that should wrap into multiple lines when constrained to a narrow width.'
    const res = measureTextDimensions(text, 16, 'Arial', 1.2, 100)
    expect(res.width).toBeLessThanOrEqual(100 + 1)
    expect(res.height).toBeGreaterThan(16)
  })
})
