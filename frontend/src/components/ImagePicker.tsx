import { useState } from 'react'
import { useServices } from '../context/ServicesContext'

export function ImagePicker({ onSelect }: { onSelect: (imageUrl: string) => void }) {
  const services = useServices()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    // In production, upload to server and get URL
    // For now, use local object URL as a demo
    setError(null)
    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)
    onSelect(localUrl)
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className="block w-full cursor-pointer rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-center hover:border-indigo-500"
        >
          {previewUrl ? 'Image selected' : 'Select Image (PNG, JPG, GIF up to 5MB)'}
        </label>
        {previewUrl && (
          <div className="mt-2 text-center">
            <img
              src={previewUrl}
              alt="Preview"
              className="mx-auto max-h-32 rounded border border-gray-700"
            />
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <p className="text-xs text-gray-500">
        Note: Images are stored locally in this demo. In production, they would be uploaded to a server.
      </p>
    </div>
  )
}