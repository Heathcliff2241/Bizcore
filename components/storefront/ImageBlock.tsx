import Image from 'next/image'

interface ImageBlockProps {
  src?: string
  alt?: string
  width?: number
  height?: number
  objectFit?: 'cover' | 'contain' | 'fill'
  caption?: string
  borderRadius?: number
  backgroundColor?: string
}

export function ImageBlock({
  src = '/placeholder-image.jpg',
  alt = 'Image',
  width = 800,
  height = 600,
  objectFit = 'cover',
  caption,
  borderRadius = 8,
  backgroundColor = '#f3f4f6'
}: ImageBlockProps) {
  return (
    <section 
      className="py-8 px-8 md:px-16 lg:px-24 w-full"
      style={{ backgroundColor }}
    >
      <div className="w-full max-w-7xl mx-auto">
        <div 
          className="relative overflow-hidden"
          style={{ 
            borderRadius: `${borderRadius}px`
          }}
        >
          <div 
            className="relative"
            style={{ 
              width: '100%',
              aspectRatio: `${width} / ${height}`
            }}
          >
            <Image
              src={src}
              alt={alt}
              fill
              className={`object-${objectFit}`}
            />
          </div>
          
          {caption && (
            <div className="bg-white/90 p-4 text-center">
              <p className="text-sm text-gray-700">{caption}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
