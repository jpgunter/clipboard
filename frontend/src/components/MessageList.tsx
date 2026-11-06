import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { MessageReactions } from './MessageReactions'
import type { Reaction } from '../types'
import { fmtDateShort } from '../lib/format'

export interface MessageItem {
  msgId: string
  senderId: string
  senderName?: string
  content: string
  createdAt: string
  gifUrl?: string
  imageUrl?: string
  reactions?: Reaction[]
}

interface MessageListProps {
  messages: MessageItem[]
  onReact: (msgId: string, emoji: string) => void
  showSender?: boolean
  emptyText?: string
}

const IMAGE_EXT_REGEX = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i

function extractUrl(content: string): string | null {
  const match = content.match(IMAGE_EXT_REGEX)
  return match ? match[0] : null
}

export function MessageList({ messages, onReact, showSender = false, emptyText = 'No messages yet.' }: MessageListProps) {
  const { user } = useAuth()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <div className="flex min-h-full flex-col justify-end gap-2 p-3">
        {messages.length === 0 && <p className="text-sm text-gray-400">{emptyText}</p>}
        {messages.map((m) => {
          const mine = m.senderId === user?.userId
          const textImageUrl = extractUrl(m.content ?? '')
          const url = m.gifUrl ?? m.imageUrl ?? textImageUrl ?? ''

          // Text with an embedded image link: strip the URL, keep the caption.
          let textContent: string | null = null
          if (url && m.content) {
            const stripped = m.content.split(url).join('').trim()
            textContent = stripped || null
          } else {
            textContent = m.content || null
          }

          const isImage = !!url

          return (
            <div key={m.msgId} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[75%]">
                {showSender && !mine && (
                  <div className="mb-0.5 text-xs font-medium text-indigo-300">{m.senderName ?? m.senderId}</div>
                )}
                {isImage && url ? (
                  <img src={url} alt="" className="max-h-40 rounded-lg" />
                ) : (
                  <div className={`rounded-lg px-3 py-2 ${mine ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-100'}`}>
                    {textContent}
                  </div>
                )}
                <div className={`mt-0.5 text-xs text-gray-500 ${mine ? 'text-right' : ''}`}>
                  {fmtDateShort(m.createdAt)}
                </div>
                <MessageReactions reactions={m.reactions ?? []} onReact={(e) => onReact(m.msgId, e)} align={mine ? 'end' : 'start'} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
