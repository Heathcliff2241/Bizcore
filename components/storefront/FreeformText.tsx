import type { CSSProperties } from 'react'

type TextValue = string | Record<string, unknown> | null | undefined

type SpacingConfig = {
  x?: number
  y?: number
  top?: number
  right?: number
  bottom?: number
  left?: number
}

type Alignment = 'left' | 'center' | 'right' | 'justify'

export interface FreeformTextProps {
  text?: TextValue
  textType?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  fontStyle?: string
  textDecoration?: string
  color?: string
  align?: Alignment
  textAlign?: Alignment
  lineHeight?: number
  letterSpacing?: number
  uppercase?: boolean
  lowercase?: boolean
  capitalize?: boolean
  backgroundColor?: string
  padding?: number | SpacingConfig
  borderRadius?: number
  opacity?: number
  boxShadow?: string
  maxWidth?: number
  size?: {
    width?: number
    height?: number
  }
}

function resolveTextValue(value: TextValue): { text: string; config: Record<string, unknown> } {
  if (!value) {
    return { text: '', config: {} }
  }

  if (typeof value === 'string') {
    return { text: value, config: {} }
  }

  const textValue = typeof value.text === 'string' ? value.text : ''
  return { text: textValue, config: value }
}

function resolveAlignment(primary?: Alignment, fallback?: Alignment): Alignment {
  if (primary === 'left' || primary === 'center' || primary === 'right' || primary === 'justify') {
    return primary
  }
  if (fallback === 'left' || fallback === 'center' || fallback === 'right' || fallback === 'justify') {
    return fallback
  }
  return 'left'
}

function resolvePadding(padding?: number | SpacingConfig): string | number | undefined {
  if (typeof padding === 'number') {
    return padding
  }

  if (padding && typeof padding === 'object') {
    const { top, right, bottom, left, x, y } = padding
    const topValue = top ?? y ?? 0
    const bottomValue = bottom ?? y ?? 0
    const rightValue = right ?? x ?? 0
    const leftValue = left ?? x ?? 0
    return `${topValue}px ${rightValue}px ${bottomValue}px ${leftValue}px`
  }

  return undefined
}

function resolveTextTransform(options: {
  uppercase?: boolean
  lowercase?: boolean
  capitalize?: boolean
  config?: Record<string, unknown>
}): CSSProperties['textTransform'] {
  const configTransform = typeof options.config?.textTransform === 'string'
    ? options.config.textTransform.toLowerCase()
    : undefined

  if (configTransform === 'uppercase' || configTransform === 'lowercase' || configTransform === 'capitalize' || configTransform === 'none') {
    return configTransform
  }

  if (options.uppercase) return 'uppercase'
  if (options.lowercase) return 'lowercase'
  if (options.capitalize) return 'capitalize'
  return undefined
}

function pickNumber(value: unknown, fallback?: number): number | undefined {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }
  return fallback
}

function isLikelyHtml(content: string): boolean {
  return /<[^>]+>/.test(content)
}

export function FreeformText(props: FreeformTextProps) {
  const { text: textProp, padding, size } = props
  const { text, config } = resolveTextValue(textProp)

  const textType = (typeof config.textType === 'string' ? config.textType : props.textType) || 'paragraph'

  const defaultFontSize = textType === 'heading'
    ? 48
    : textType === 'subheading'
      ? 24
      : textType === 'caption'
        ? 14
        : 18

  const resolvedFontSize = pickNumber(config.fontSize, props.fontSize ?? defaultFontSize) ?? defaultFontSize
  const resolvedFontFamily = (typeof config.fontFamily === 'string' ? config.fontFamily : props.fontFamily) || 'Inter, system-ui, -apple-system, sans-serif'
  const resolvedFontWeight = (typeof config.fontWeight === 'string' ? config.fontWeight : props.fontWeight) || '400'
  const resolvedFontStyle = (typeof config.fontStyle === 'string' ? config.fontStyle : props.fontStyle) || 'normal'
  const resolvedTextDecoration = (typeof config.textDecoration === 'string' ? config.textDecoration : props.textDecoration) || 'none'
  const resolvedColor = (typeof config.color === 'string' ? config.color : props.color) || '#0f172a'
  const resolvedLineHeight = pickNumber(config.lineHeight, props.lineHeight ?? 1.4) ?? 1.4
  const letterSpacingValue = pickNumber(config.letterSpacing, props.letterSpacing)
  const resolvedLetterSpacing = typeof letterSpacingValue === 'number' ? `${letterSpacingValue}px` : undefined
  const resolvedBackgroundColor = (typeof config.backgroundColor === 'string' ? config.backgroundColor : props.backgroundColor) || 'transparent'
  const resolvedBorderRadius = pickNumber(config.borderRadius, props.borderRadius)
  const resolvedOpacity = pickNumber(config.opacity, props.opacity) ?? 1
  const resolvedBoxShadow = (typeof config.boxShadow === 'string' ? config.boxShadow : props.boxShadow) || undefined

  const alignment = resolveAlignment(config.align as Alignment, props.align)
  const textAlign = resolveAlignment(config.textAlign as Alignment, props.textAlign || alignment)

  const resolvedPadding = resolvePadding(config.padding as number | SpacingConfig ?? padding)
  const resolvedTextTransform = resolveTextTransform({
    uppercase: props.uppercase,
    lowercase: props.lowercase,
    capitalize: props.capitalize,
    config
  })

  const style: CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start',
    justifyContent: 'flex-start',
    color: resolvedColor,
    fontFamily: resolvedFontFamily,
    fontSize: `${resolvedFontSize}px`,
    fontWeight: resolvedFontWeight,
    fontStyle: resolvedFontStyle,
    lineHeight: resolvedLineHeight,
    letterSpacing: resolvedLetterSpacing,
    textDecoration: resolvedTextDecoration,
    textTransform: resolvedTextTransform,
    backgroundColor: resolvedBackgroundColor,
    borderRadius: resolvedBorderRadius !== undefined ? `${resolvedBorderRadius}px` : undefined,
    opacity: resolvedOpacity,
    boxShadow: resolvedBoxShadow,
    padding: resolvedPadding,
    textAlign,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflow: 'hidden'
  }

  if (props.maxWidth) {
    style.maxWidth = props.maxWidth
  }

  if (size?.height !== undefined) {
    style.minHeight = size.height
  }

  const trimmedText = text.trim()
  if (trimmedText.length === 0) {
    return <div style={style} />
  }

  if (isLikelyHtml(trimmedText)) {
    return <div style={style} dangerouslySetInnerHTML={{ __html: trimmedText }} />
  }

  return <div style={style}>{trimmedText}</div>
}
