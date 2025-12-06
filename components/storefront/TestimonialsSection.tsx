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
      className={`py-16 w-full ${fullWidth ? '' : 'px-8 md:px-16 lg:px-24'}`}
      style={{ backgroundColor }}
    >
      <div className={`w-full ${!fullWidth ? 'max-w-7xl mx-auto' : ''}`}>
        {title && (
          <h2 
            className="text-3xl md:text-4xl font-bold text-center mb-12"
            style={{ color: textColor }}
          >
            {title}
          </h2>
        )}
        
        <div 
          className="grid gap-6"
          style={{ 
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          }}
        >
          {testimonials.map((testimonial) => (
            <div 
              key={testimonial.id}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              {/* Rating */}
              {testimonial.rating && (
                <div className="flex text-yellow-400 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
              )}
              
              {/* Content */}
              <p className="text-gray-700 mb-6 leading-relaxed">
                &quot;{testimonial.content}&quot;
              </p>
              
              {/* Author */}
              <div className="flex items-center">
                {testimonial.avatar ? (
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    width={48}
                    height={48}
                    className="rounded-full mr-4"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-300 mr-4 flex items-center justify-center text-gray-600 font-semibold">
                    {testimonial.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
