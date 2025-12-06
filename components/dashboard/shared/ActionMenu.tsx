interface ActionMenuProps {
  onEdit?: () => void
  onDelete?: () => void
  onDeactivate?: () => void
  disableDelete?: boolean
}

export function ActionMenu({ onEdit, onDelete, onDeactivate, disableDelete }: ActionMenuProps) {
  return (
    <div className="flex items-center justify-end gap-3">
      {onDeactivate && (
        <button
          onClick={onDeactivate}
          className="text-xs font-semibold text-amber-600 hover:text-amber-700"
        >
          Toggle
        </button>
      )}
      {onEdit && (
        <button onClick={onEdit} className="text-blue-600 hover:text-blue-900 text-sm font-medium">
          Edit
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          disabled={disableDelete}
          className={`text-sm font-medium ${
            disableDelete ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-900'
          }`}
        >
          Delete
        </button>
      )}
    </div>
  )
}
