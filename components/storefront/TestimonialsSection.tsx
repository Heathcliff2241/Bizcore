import Image from 'next/image'

interface Testimonial {
  id: number
  name: string
  role: string
  content: string
  avatar?: string
  rating?: number
}

interface TestimonialsSectionProps {
  title?: string
  testimonials?: Testimonial[]
  columns?: number
  backgroundColor?: string
  textColor?: string
  fullWidth?: boolean
}

export function TestimonialsSection({
  title = 'What Our Customers Say',
  testimonials = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Verified Buyer',
      content: 'Amazing products! The quality exceeded my expectations. Will definitely order again.',
      rating: 5
    },
    {
      id: 2,
      name: 'Mike Chen',
      role: 'Customer',
      content: 'Great customer service and fast shipping. Highly recommend this store.',
      rating: 5
    },
    {
      id: 3,
      name: 'Emily Davis',
      role: 'Regular Customer',
      content: 'Love the variety of products. Everything I ordered was exactly as described.',
      rating: 5
    }
  ],
  columns = 3,
  backgroundColor = '#f9fafb',
  textColor = '#000000'
  , fullWidth = true
}: TestimonialsSectionProps) {
  return (
    <section 
      className={`py-8 sm:py-12 md:py-16 w-full px-4 sm:px-6 md:px-8 ${fullWidth ? '' : 'px-8 md:px-16 lg:px-24'}`}
      style={{ backgroundColor }}
    >
      <div className={`w-full ${!fullWidth ? 'max-w-7xl mx-auto' : ''}`}>
        {title && (
          <h2 
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-10 md:mb-12"
            style={{ color: textColor }}
          >
            {title}
          </h2>
        )}
        
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6"
          style={{ 
            gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, max(280px, (100% - (2 * 1.5rem)) / ${columns})), 1fr))`,
          }}
        >
          {testimonials.map((testimonial) => (
            <div 
              key={testimonial.id}
              className="bg-white p-4 sm:p-5 md:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              {/* Rating */}
              {testimonial.rating && (
                <div className="flex text-yellow-400 mb-3 sm:mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-4 sm:w-5 h-4 sm:h-5 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
              )}
              
              {/* Content */}
              <p className="text-gray-700 mb-4 sm:mb-5 md:mb-6 leading-relaxed text-sm sm:text-base">
                &quot;{testimonial.content}&quot;
              </p>
              
              {/* Author */}
              <div className="flex items-center gap-3">
                {testimonial.avatar ? (
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    width={48}
                    height={48}
                    className="rounded-full w-10 h-10 sm:w-12 sm:h-12"
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-sm sm:text-base flex-shrink-0">
                    {testimonial.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-sm sm:text-base">{testimonial.name}</p>
                  <p className="text-xs sm:text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
