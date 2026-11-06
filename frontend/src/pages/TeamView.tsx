import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useServices } from '../context/ServicesContext'
import { GifPicker } from '../components/GifPicker'
import { ImagePicker } from '../components/ImagePicker'
import { MessageList, type MessageItem } from '../components/MessageList'
import type { Gif, RsvpStatus, RsvpSummary, Team, TeamEvent, TeamMembership, TeamMessage } from '../types'
import { fmtDateTime } from '../lib/format'

type Tab = 'messages' | 'events' | 'team'
type Composer = 'text' | 'gif' | 'image'

const eventTypeColor: Record<string, string> = {
  GAME: 'bg-red-900 text-red-200',
  PRACTICE: 'bg-blue-900 text-blue-200',
  MEETING: 'bg-amber-900 text-amber-200',
  SOCIAL: 'bg-green-900 text-green-200',
}

const STATUSES: RsvpStatus[] = ['YES', 'NO', 'MAYBE']

export default function TeamView() {
  const { teamId = '' } = useParams()
  const navigate = useNavigate()
  const services = useServices()
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('messages')
  const [composer, setComposer] = useState<Composer>('text')
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMembership[]>([])
  const [events, setEvents] = useState<(TeamEvent & { rsvp: RsvpSummary })[]>([])
  const [messages, setMessages] = useState<TeamMessage[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const [t, m, ev, msgs] = await Promise.all([
      services.teams.getTeam(teamId),
      services.teams.listMembers(teamId),
      services.events.listEvents(teamId),
      services.messages.listTeamMessages(teamId),
    ])
    setTeam(t)
    setMembers(m)
    setEvents(ev)
    setMessages(msgs)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [teamId])

  const setRsvp = async (eventId: string, status: RsvpStatus) => {
    await services.rsvp.setStatus(eventId, status)
    setEvents(await services.events.listEvents(teamId))
  }

  const send = async (e: FormEvent) => {
    e.preventDefault()
    if (!draft.trim()) return
    await services.messages.postTeamMessage(teamId, draft.trim(), undefined, undefined)
    setDraft('')
    setMessages(await services.messages.listTeamMessages(teamId))
  }

  const sendGif = async (gif: Gif) => {
    await services.messages.postTeamMessage(teamId, '', gif.url)
    setComposer('text')
    setMessages(await services.messages.listTeamMessages(teamId))
  }

  const sendImage = async (imageUrl: string) => {
    await services.messages.postTeamMessage(teamId, '', undefined, imageUrl)
    setComposer('text')
    setMessages(await services.messages.listTeamMessages(teamId))
  }

  const reactTeam = async (msgId: string, emoji: string) => {
    await services.messages.react(msgId, emoji)
    setMessages(await services.messages.listTeamMessages(teamId))
  }

  const dm = (userId: string, name?: string) =>
    navigate(`/messages?to=${userId}${name ? `&name=${encodeURIComponent(name)}` : ''}`)

  if (loading) return <p className="text-gray-400">Loading...</p>
  if (!team) return <p className="text-gray-400">Team not found.</p>

  const players = members.filter((m) => m.teamRole === 'PLAYER')
  const staff = members.filter((m) => m.teamRole !== 'PLAYER')

  const tabClass = (t: Tab) =>
    `px-4 py-2 rounded-md text-sm font-medium ${tab === t ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`

  const composerBtn = (m: Composer) =>
    `rounded px-3 py-1 text-xs font-medium ${composer === m ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`

  const msgBtn = 'rounded bg-gray-700 px-2 py-1 text-xs text-gray-200 hover:bg-gray-600'

  const messageItems: MessageItem[] = messages.map((m) => ({
    msgId: m.msgId,
    senderId: m.senderId,
    senderName: m.sender?.name,
    content: m.content,
    createdAt: m.createdAt,
    gifUrl: m.gifUrl,
    imageUrl: m.imageUrl,
    reactions: m.reactions,
  }))

  return (
    <div className="space-y-6">
      <div>
        <Link to="/" className="text-sm text-indigo-400 hover:text-indigo-300">&larr; Dashboard</Link>
        <h1 className="mt-1 text-2xl font-bold">{team.teamName}</h1>
        <p className="text-sm text-gray-400">{team.sport} · {team.season}</p>
      </div>

      <div className="flex gap-1">
        <button onClick={() => setTab('messages')} className={tabClass('messages')}>Messages</button>
        <button onClick={() => setTab('events')} className={tabClass('events')}>Events</button>
        <button onClick={() => setTab('team')} className={tabClass('team')}>Team</button>
      </div>

      {tab === 'messages' && (
        <section>
          <div className="flex h-[60vh] flex-col rounded-lg border border-gray-700 bg-gray-800">
            <MessageList messages={messageItems} onReact={reactTeam} showSender emptyText="No messages yet." />
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
                    placeholder="Message the team..."
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
        </section>
      )}

      {tab === 'events' && (
        <section className="space-y-3">
          {events.length === 0 && <p className="text-sm text-gray-400">No events scheduled.</p>}
          {events.map((e) => (
            <div key={e.eventId} className="rounded-lg border border-gray-700 bg-gray-800 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-xs ${eventTypeColor[e.eventType] ?? 'bg-gray-700 text-gray-200'}`}>
                      {e.eventType}
                    </span>
                    <span className="font-semibold">{e.title}</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-400">{fmtDateTime(e.startTime)} · {e.location}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    RSVP: {e.rsvp.counts.YES} yes · {e.rsvp.counts.NO} no · {e.rsvp.counts.MAYBE} maybe · {e.rsvp.total} total
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setRsvp(e.eventId, s)}
                      className={`rounded px-2 py-1 text-xs font-medium ${e.rsvp.myStatus === s ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === 'team' && (
        <section className="space-y-6">
          <div>
            <h2 className="mb-2 text-lg font-semibold">Players</h2>
            <ul className="divide-y divide-gray-700 rounded-lg border border-gray-700 bg-gray-800">
              {players.length === 0 && <li className="p-3 text-sm text-gray-400">No players.</li>}
              {players.map((m) => (
                <li key={m.userId} className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{m.user?.name ?? m.userId}</span>
                      {m.jerseyNumber ? <span className="text-xs text-gray-400">#{m.jerseyNumber}</span> : null}
                      <span className="text-xs text-gray-500">Player</span>
                    </div>
                    {m.userId !== user?.userId && (
                      <button onClick={() => dm(m.userId, m.user?.name)} className={msgBtn}>Message</button>
                    )}
                  </div>
                  {(m.guardians ?? []).length > 0 && (
                    <ul className="mt-2 space-y-1 border-l border-gray-700 pl-4">
                      {(m.guardians ?? []).map((g) => (
                        <li key={g.guardian.userId} className="flex items-center justify-between gap-2 text-sm text-gray-300">
                          <span>
                            {g.guardian.name}
                            {g.relation ? <span className="ml-2 text-xs text-gray-500">{g.relation}</span> : null}
                          </span>
                          {g.guardian.userId !== user?.userId && (
                            <button onClick={() => dm(g.guardian.userId, g.guardian.name)} className={msgBtn}>Message</button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {staff.length > 0 && (
            <div>
              <h2 className="mb-2 text-lg font-semibold">Staff</h2>
              <ul className="divide-y divide-gray-700 rounded-lg border border-gray-700 bg-gray-800">
                {staff.map((m) => (
                  <li key={m.userId} className="flex items-center justify-between gap-2 p-3">
                    <div>
                      <div className="font-medium">{m.user?.name ?? m.userId}</div>
                      <div className="text-xs text-gray-400">{m.teamRole}</div>
                    </div>
                    {m.userId !== user?.userId && (
                      <button onClick={() => dm(m.userId, m.user?.name)} className={msgBtn}>Message</button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
