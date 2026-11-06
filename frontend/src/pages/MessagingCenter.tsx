import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useServices } from '../context/ServicesContext'
import { GifPicker } from '../components/GifPicker'
import { ImagePicker } from '../components/ImagePicker'
import { MessageList, type MessageItem } from '../components/MessageList'
import type { DirectMessage, DmThread, Gif } from '../types'
import { fmtDateShort } from '../lib/format'

interface ActiveChat {
  otherUserId: string
  otherUserName: string
}

type Composer = 'text' | 'gif' | 'image'

export default function MessagingCenter() {
  const services = useServices()
  const [params] = useSearchParams()
  const [inbox, setInbox] = useState<DmThread[]>([])
  const [active, setActive] = useState<ActiveChat | null>(null)
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [draft, setDraft] = useState('')
  const [composer, setComposer] = useState<Composer>('text')
  const [loading, setLoading] = useState(true)

  const openByUser = async (otherUserId: string, name?: string) => {
    setActive({ otherUserId, otherUserName: name ?? otherUserId })
    setMessages(await services.dms.listMessages(otherUserId))
  }

  useEffect(() => {
    (async () => {
      const t = await services.dms.listInbox()
      setInbox(t)
      setLoading(false)
      const to = params.get('to')
      const name = params.get('name') ?? undefined
      if (to) {
        await openByUser(to, name)
      } else if (t.length > 0) {
        await openByUser(t[0].otherUserId, t[0].otherUserName)
      }
    })()
  }, [])

  const send = async (e: FormEvent) => {
    e.preventDefault()
    if (!active || !draft.trim()) return
    await services.dms.sendMessage(active.otherUserId, draft.trim())
    setDraft('')
    setMessages(await services.dms.listMessages(active.otherUserId))
    setInbox(await services.dms.listInbox())
  }

  const sendGif = async (gif: Gif) => {
    if (!active) return
    await services.dms.sendMessage(active.otherUserId, '', gif.url)
    setComposer('text')
    setMessages(await services.dms.listMessages(active.otherUserId))
    setInbox(await services.dms.listInbox())
  }

  const sendImage = async (imageUrl: string) => {
    if (!active) return
    await services.dms.sendMessage(active.otherUserId, '', undefined, imageUrl)
    setComposer('text')
    setMessages(await services.dms.listMessages(active.otherUserId))
    setInbox(await services.dms.listInbox())
  }

  const reactDm = async (msgId: string, emoji: string) => {
    if (!active) return
    await services.dms.react(msgId, emoji)
    setMessages(await services.dms.listMessages(active.otherUserId))
  }

  if (loading) return <p className="text-gray-400">Loading...</p>

  const composerBtn = (m: Composer) =>
    `rounded px-3 py-1 text-xs font-medium ${composer === m ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`

  const items: MessageItem[] = messages.map((m) => ({
    msgId: m.msgId,
    senderId: m.senderId,
    content: m.content,
    createdAt: m.createdAt,
    gifUrl: m.gifUrl,
    imageUrl: m.imageUrl,
    reactions: m.reactions,
  }))

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Messages</h1>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-2">
          {inbox.length === 0 && <p className="text-sm text-gray-400">No conversations.</p>}
          {inbox.map((t) => (
            <button
              key={t.dmChannelId}
              onClick={() => openByUser(t.otherUserId, t.otherUserName)}
              className={`w-full rounded-lg border p-3 text-left ${active?.otherUserId === t.otherUserId ? 'border-indigo-700 bg-indigo-900' : 'border-gray-700 bg-gray-800 hover:bg-gray-700'}`}
            >
              <div className="font-medium">{t.otherUserName}</div>
              <div className="truncate text-xs text-gray-400">{t.lastMessage}</div>
              <div className="mt-0.5 text-xs text-gray-500">{fmtDateShort(t.lastMessageAt)}</div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2">
          {active ? (
            <div className="flex h-[60vh] flex-col rounded-lg border border-gray-700 bg-gray-800">
              <div className="border-b border-gray-700 p-3 font-semibold">{active.otherUserName}</div>
              <MessageList messages={items} onReact={reactDm} />
              <div className="space-y-2 border-t border-gray-700 p-3">
                <div className="flex gap-1">
                  <button type="button" onClick={() => setComposer('text')} className={composerBtn('text')}>Text</button>
                  <button type="button" onClick={() => setComposer('gif')} className={composerBtn('gif')}>GIF</button>
                  <button type="button" onClick={() => setComposer('image')} className={composerBtn('image')}>Image</button>
                </div>
                {composer === 'text' ? (
                  <form onSubmit={send} className="flex gap-2">
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
                    />
                    <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500">Send</button>
                  </form>
                ) : composer === 'gif' ? (
                  <GifPicker onSelect={sendGif} />
                ) : (
                  <ImagePicker onSelect={sendImage} />
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-400">Select a conversation.</p>
          )}
        </div>
      </div>
    </div>
  )
}
