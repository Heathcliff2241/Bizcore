interface TextBlockProps {
  text?: string
  fontSize?: number
  fontFamily?: string
  color?: string
  backgroundColor?: string
  padding?: number
  textAlign?: 'left' | 'center' | 'right'
}

export function TextBlock({
  text = '<p>Add your text content here</p>',
  fontSize = 16,
  fontFamily = 'Arial, sans-serif',
  color = '#000000',
  backgroundColor = 'transparent',
  padding = 40,
  textAlign = 'left'
}: TextBlockProps) {
  return (
    <section 
      className="w-full"
      style={{ 
        backgroundColor,
        padding: `${padding}px 0`
      }}
    >
      <div className="w-full max-w-7xl mx-auto px-8 md:px-16 lg:px-24">
        <div 
          className="prose prose-lg max-w-none"
          style={{
            fontSize: `${fontSize}px`,
            fontFamily,
            color,
            textAlign
          }}
          dangerouslySetInnerHTML={{ __html: text }}
        />
      </div>
    </section>
  )
}
