interface DividerBlockProps {
  thickness?: number
  color?: string
  style?: 'solid' | 'dashed' | 'dotted'
  width?: string
  margin?: number
  fullWidth?: boolean
}

export function DividerBlock({
  thickness = 1,
  color = '#e5e7eb',
  style = 'solid',
  width = '100%',
  margin = 20
  , fullWidth = false
}: DividerBlockProps) {
  return (
    <section 
      className="px-8 md:px-16 lg:px-24 w-full"
      style={{ 
        paddingTop: `${margin}px`,
        paddingBottom: `${margin}px`
      }}
    >
      <div className={`w-full ${!fullWidth ? 'max-w-7xl mx-auto' : ''}`}>
        <hr 
          style={{
            height: `${thickness}px`,
            backgroundColor: color,
            border: 'none',
            borderStyle: style,
            width
          }}
        />
      </div>
    </section>
  )
}
