interface SpacerBlockProps {
  height?: number
  backgroundColor?: string
}

export function SpacerBlock({
  height = 40,
  backgroundColor = 'transparent'
}: SpacerBlockProps) {
  return (
    <div 
      style={{ 
        height: `${height}px`,
        backgroundColor 
      }} 
    />
  )
}
