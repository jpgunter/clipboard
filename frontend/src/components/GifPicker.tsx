import { useEffect, useState } from 'react'
import { useServices } from '../context/ServicesContext'
import type { Gif } from '../types'

export function GifPicker({ onSelect }: { onSelect: (gif: Gif) => void }) {
  const services = useServices()
  const [query, setQuery] = useState('')
  const [gifs, setGifs] = useState<Gif[]>([])

  useEffect(() => {
    let active = true
    const run = async () => {
      const list =
        query.trim() === '' ? await services.gif.trending() : await services.gif.search(query.trim())
      if (active) setGifs(list)
    }
    const timer = setTimeout(run, query.trim() === '' ? 0 : 350)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query, services])

  return (
    <div className="space-y-2">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search GIFs..."
        className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
      />
      <div className="grid max-h-64 grid-cols-3 gap-1 overflow-y-auto">
        {gifs.length === 0 && <p className="col-span-3 p-2 text-sm text-gray-500">No GIFs - the picker needs internet (Giphy).</p>}
        {gifs.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => onSelect(g)}
            className="overflow-hidden rounded border border-gray-700 bg-gray-900 hover:border-indigo-500"
          >
            <img src={g.previewUrl ?? g.url} alt={g.title ?? ''} loading="lazy" className="h-24 w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}
