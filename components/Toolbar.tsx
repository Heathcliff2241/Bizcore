export default function Toolbar() {
  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center px-4 space-x-4">
      <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
        Rectangle
      </button>
      <button className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
        Text
      </button>
      <button className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600">
        Image
      </button>
    </div>
  )
}