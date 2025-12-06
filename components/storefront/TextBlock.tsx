import DOMPurify from 'dompurify'

interface TextBlockProps {
  text?: string
  fontSize?: number
  fontFamily?: string
  color?: string
  backgroundColor?: string
  padding?: number
  textAlign?: 'left' | 'center' | 'right'
  fullWidth?: boolean
}

export function TextBlock({
  text = '<p>Add your text content here</p>',
  fontSize = 16,
  fontFamily = 'Arial, sans-serif',
  color = '#000000',
  backgroundColor = 'transparent',
  padding = 40,
  textAlign = 'left'
  , fullWidth = true
}: TextBlockProps) {
  const sanitized = (typeof window !== 'undefined' && DOMPurify) ? DOMPurify.sanitize(text) : text.replace(/<[^>]+>/g, '')

  return (
    <section 
      className="w-full"
      style={{ 
        backgroundColor,
        padding: `${padding}px ${fullWidth ? '0' : '8px'}`
      }}
    >
      <div className={`w-full ${!fullWidth ? 'max-w-7xl mx-auto' : ''} px-8 md:px-16 lg:px-24`}>
        <div 
          className="prose prose-lg max-w-none"
          style={{
            fontSize: `${fontSize}px`,
            fontFamily,
            color,
            textAlign
          }}
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />
      </div>
    </section>
  )
}
