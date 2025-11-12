'use client'

export default function InventoryPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Inventory</h1>
        <p className="text-gray-600">Manage your product inventory and stock</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center py-12">
          <p className="text-gray-500">No inventory items yet</p>
        </div>
      </div>
    </div>
  )
}
