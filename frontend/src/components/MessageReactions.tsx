import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import type { Reaction } from '../types'

const QUICK = ['👍', '❤️', '😂', '🎉', '👏', '😮']

interface Group {
  emoji: string
  count: number
  mine: boolean
}

export function MessageReactions({
  reactions,
  onReact,
  align = 'start',
}: {
  reactions: Reaction[]
  onReact: (emoji: string) => void
  align?: 'start' | 'end'
}) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  const groups: Group[] = []
  for (const r of reactions) {
    let g = groups.find((x) => x.emoji === r.emoji)
    if (!g) {
      g = { emoji: r.emoji, count: 0, mine: false }
      groups.push(g)
    }
    g.count++
    if (r.userId === user?.userId) g.mine = true
  }

  return (
    <div className={`mt-1 flex flex-wrap items-center gap-1 ${align === 'end' ? 'justify-end' : ''}`}>
      {groups.map((g) => (
        <button
          key={g.emoji}
          type="button"
          onClick={() => onReact(g.emoji)}
          className={`rounded-full px-2 py-0.5 text-xs ${g.mine ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
        >
          {g.emoji} {g.count}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-300 hover:bg-gray-600"
      >
        +
      </button>
      {open && (
        <div className="flex gap-1">
          {QUICK.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => {
                onReact(e)
                setOpen(false)
              }}
              className="rounded-full bg-gray-700 px-2 py-0.5 text-sm hover:bg-gray-600"
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
