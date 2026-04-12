export default function StorefrontLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header skeleton */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 h-20 flex items-center justify-between">
          {/* Logo skeleton */}
          <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
          
          {/* Nav skeleton */}
          <div className="hidden md:flex gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
          
          {/* Auth skeleton */}
          <div className="hidden md:flex gap-2 items-center">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Page content skeleton */}
      <div className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 py-12">
        <div className="w-48 h-10 bg-gray-200 rounded animate-pulse mb-8"></div>
        <div className="grid grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-lg overflow-hidden">
              <div className="w-full h-48 bg-gray-200 animate-pulse"></div>
              <div className="p-4 space-y-3">
                <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
