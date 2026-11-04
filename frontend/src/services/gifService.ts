import type { Gif } from '../types'
import type { GifService } from './interfaces'

// Giphy public beta key - swap for your own at https://developers.giphy.com for production.
const GIPHY_API_KEY = 'dc6zaTOxFJmzC'
const BASE = 'https://api.giphy.com/v1/gifs'

interface GiphyImageSet {
  fixed_height: { url: string }
  fixed_height_small: { url: string }
}
interface GiphyGif {
  id: string
  title?: string
  images: GiphyImageSet
}

const map = (data: GiphyGif[]): Gif[] =>
  data.map((g) => ({
    id: g.id,
    url: g.images.fixed_height.url,
    previewUrl: g.images.fixed_height_small.url,
    title: g.title,
  }))

export function createGifService(): GifService {
  const load = async (path: string, params: Record<string, string>): Promise<Gif[]> => {
    try {
      const url = new URL(`${BASE}/${path}`)
      url.searchParams.set('api_key', GIPHY_API_KEY)
      url.searchParams.set('limit', '24')
      for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
      const res = await fetch(url)
      if (!res.ok) return []
      const json = (await res.json()) as { data?: GiphyGif[] }
      return map(json.data ?? [])
    } catch {
      return []
    }
  }

  return {
    trending: () => load('trending', {}),
    search: (q) => load('search', { q }),
  }
}
