import { ReactNode } from 'react'

interface FormModalProps {
  title: string
  isOpen: boolean
  onClose: () => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void | Promise<void>
  children: ReactNode
  submitLabel?: string
}

export function FormModal({ title, isOpen, onClose, onSubmit, children, submitLabel }: FormModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">{title}</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void onSubmit(event)
          }}
        >
          <div className="space-y-4">{children}</div>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {submitLabel ?? 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
