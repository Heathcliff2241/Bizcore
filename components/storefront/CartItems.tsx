"use client"
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useCustomerSession } from './hooks/useCustomerSession'
// No react hooks are needed here other than the custom hook
import { useCart } from './hooks/useCart'

interface CartItem {
  id?: string | number
  name: string
  price: number
  quantity?: number
  description?: string
  imageUrl?: string
  options?: string[]
}

interface CartItemsProps {
  items?: CartItem[]
  currency?: string
  backgroundColor?: string
  borderRadius?: number
  border?: string
  padding?: number
  showImages?: boolean
  showQuantity?: boolean
  showRemove?: boolean
  textColor?: string
}

const FALLBACK_ITEMS: CartItem[] = [
  {
    id: 'item-1',
    name: 'House Specialty Latte',
    price: 5.5,
    quantity: 1,
    description: '12oz • Oat milk • Vanilla syrup'
  },
  {
    id: 'item-2',
    name: 'Avocado Toast',
    price: 9.25,
    quantity: 2,
    description: 'Sourdough • Heirloom tomatoes'
  }
]

export function CartItems({
  items = undefined,
  currency = '$',
  backgroundColor = '#f7fafc',
  borderRadius = 12,
  border = '1px solid rgba(226, 232, 240, 1)',
  padding = 24,
  showImages = true,
  showQuantity = true,
  showRemove = true,
  textColor = '#1f2937'
}: CartItemsProps) {
  // If items not passed, use persisted cart
  const { data: session } = useCustomerSession()
  const isClient = typeof window !== 'undefined'
  const subdomain = isClient ? window.location.pathname.split('/')[2] : undefined
  const cartHook = useCart(subdomain, session?.user?.id)
  const displayItems = (items && items.length > 0) ? items : (cartHook.cart.length > 0 ? cartHook.cart : FALLBACK_ITEMS)

  const itemTotal = (item: CartItem) => (item.price * (item.quantity ?? 1)).toFixed(2)

  return (
    <section
      className="h-full w-full"
      style={{
        backgroundColor,
        borderRadius,
        border,
        padding,
        color: textColor
      }}
    >
      <div className="flex flex-col gap-6">
        {displayItems.map(item => (
          <div
            key={item.id ?? item.name}
            className="flex gap-4 border-b border-slate-200 pb-6 last:border-b-0"
          >
            {showImages && (
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-200">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5V6a3 3 0 013-3h12a3 3 0 013 3v10.5M3 16.5A1.5 1.5 0 004.5 18h15a1.5 1.5 0 001.5-1.5M3 16.5L9.75 9.75m8.25-2.25l3 3" />
                    </svg>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-1 flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold">{item.name}</h3>
                  {item.description && (
                    <p className="text-sm text-slate-500">{item.description}</p>
                  )}
                  {item.options && item.options.length > 0 && (
                    <div className="mt-2 space-y-1 text-xs text-slate-500">
                      {item.options.map((option, index) => (
                        <p key={index}>{option}</p>
                      ))}
                    </div>
                  )}
                </div>

                <span className="text-base font-semibold">
                  {currency}{itemTotal(item)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 text-sm text-slate-500">
                {showQuantity && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-600">Qty</span>
                    <span className="rounded-full border border-slate-200 px-3 py-1">
                      {item.quantity ?? 1}
                    </span>
                  </div>
                )}

                {showRemove && (
                  <button
                    type="button"
                    className="rounded-md px-3 py-1 text-xs font-medium text-red-500 transition hover:bg-red-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
