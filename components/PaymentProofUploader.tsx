'use client'

import React, { useState, useRef } from 'react'
import { PaymentProofUploader, estimateBase64Size } from '@/lib/paymentProof'

interface PaymentProofUploaderProps {
  onProofChange: (base64Data: string | null) => void
  disabled?: boolean
  maxFileSizeMB?: number
}

/**
 * React component for uploading payment proof images
 * Converts images to base64 and validates them before submission
 */
export const PaymentProofUploadComponent: React.FC<PaymentProofUploaderProps> = ({
  onProofChange,
  disabled = false,
  maxFileSizeMB = 5
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [fileSize, setFileSize] = useState<string | null>(null)

  const uploader = new PaymentProofUploader(maxFileSizeMB)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      // Convert file to base64
      const conversion = await uploader.convert(file)

      if (!conversion.success) {
        setError(conversion.error || 'Failed to process file')
        setSelectedFile(null)
        setPreview(null)
        onProofChange(null)
      } else {
        // Store the file and preview
        setSelectedFile(file)
        setPreview(conversion.data || null)
        setSuccess(true)

        // Calculate and display file size
        const sizeBytes = estimateBase64Size(conversion.data || '')
        const sizeMB = (sizeBytes / 1024 / 1024).toFixed(2)
        setFileSize(`${sizeMB}MB`)

        // Notify parent component
        onProofChange(conversion.data || null)

        // Clear after 2 seconds
        setTimeout(() => setSuccess(false), 2000)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to process file: ${message}`)
      onProofChange(null)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setSelectedFile(null)
    setPreview(null)
    setError(null)
    setSuccess(false)
    setFileSize(null)
    onProofChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Payment Proof</h3>

      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : 'border-blue-300 bg-blue-50 hover:border-blue-400 cursor-pointer'
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) {
            e.currentTarget.classList.add('border-blue-500', 'bg-blue-100')
          }
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          e.currentTarget.classList.remove('border-blue-500', 'bg-blue-100')
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.currentTarget.classList.remove('border-blue-500', 'bg-blue-100')
          if (!disabled && e.dataTransfer.files[0]) {
            if (fileInputRef.current) {
              fileInputRef.current.files = e.dataTransfer.files
              const event = new Event('change', { bubbles: true })
              fileInputRef.current.dispatchEvent(event)
            }
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
          onChange={handleFileSelect}
          disabled={disabled || loading}
          className="hidden"
        />

        <button
          onClick={() => !disabled && !loading && fileInputRef.current?.click()}
          disabled={disabled || loading}
          className="text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400"
        >
          {loading ? 'Processing...' : 'Click to upload or drag and drop'}
        </button>

        <p className="text-sm text-gray-500 mt-2">
          PNG, JPG, WebP or GIF up to {maxFileSizeMB}MB
        </p>
      </div>

      {/* Preview */}
      {preview && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
          <div className="relative w-full h-48 rounded-lg border border-gray-200 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Payment proof preview"
              className="w-full h-full object-cover"
            />
          </div>
          {fileSize && <p className="text-xs text-gray-500 mt-2">Size: {fileSize}</p>}
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 flex items-center">
            <span className="mr-2">❌</span>
            {error}
          </p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 flex items-center">
            <span className="mr-2">✓</span>
            Payment proof uploaded successfully
          </p>
        </div>
      )}

      {/* Actions */}
      {selectedFile && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleClear}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:bg-gray-100"
          >
            Clear
          </button>
          <button
            disabled={!selectedFile || loading || disabled}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
          >
            {loading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      )}
    </div>
  )
}

export default PaymentProofUploadComponent
