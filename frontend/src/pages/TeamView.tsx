import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useServices } from '../context/ServicesContext'
import { GifPicker } from '../components/GifPicker'
import { ImagePicker } from '../components/ImagePicker'
import { MessageList, type MessageItem } from '../components/MessageList'
import type { Gif, RsvpStatus, RsvpSummary, Team, TeamEvent, TeamMembership, TeamMessage, EventType } from '../types'
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
  const [sendingImage, setSendingImage] = useState(false)
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [playerJerseyNumber, setPlayerJerseyNumber] = useState<number | undefined>(undefined)
  const [playerParentEmail, setPlayerParentEmail] = useState('')
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [eventName, setEventName] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [eventType, setEventType] = useState('GAME')
  const [eventStartTime, setEventStartTime] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')

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

  const createEvent = async (e: FormEvent) => {
    e.preventDefault()
    if (!eventName.trim() || !eventLocation.trim() || !eventStartTime || !eventEndTime) return
    await services.events.createEvent(teamId, {
      title: eventName.trim(),
      location: eventLocation.trim(),
      eventType: eventType as EventType,
      startTime: eventStartTime,
      endTime: eventEndTime,
    })
    setShowCreateEvent(false)
    setEventName('')
    setEventLocation('')
    setEventType('GAME')
    setEventStartTime('')
    setEventEndTime('')
    setEvents(await services.events.listEvents(teamId))
  }

  const addPlayer = async (e: FormEvent) => {
    e.preventDefault()
    if (!playerName.trim()) return
    await services.teams.addMember(teamId, {
      name: playerName.trim(),
      jerseyNumber: playerJerseyNumber || undefined,
      parentEmail: playerParentEmail?.trim(),
    })
    setMembers(await services.teams.listMembers(teamId))
    setShowAddPlayer(false)
    setPlayerName('')
    setPlayerJerseyNumber(undefined)
    setPlayerParentEmail('')
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
    const tempId = `temp-${Date.now()}`
    const placeholderMsg: TeamMessage = {
      msgId: tempId,
      teamId,
      senderId: user?.userId ?? 'temp',
      content: '',
      createdAt: new Date().toISOString(),
      imageUrl,
    }
    setMessages((prev) => [placeholderMsg, ...prev])

    setSendingImage(true)
    try {
      await new Promise((r) => setTimeout(r, 2000)) // mock upload (2s)
      const realMsg = await services.messages.postTeamMessage(teamId, '', undefined, imageUrl)
      setMessages((prev) => prev.map((m) => (m.msgId === tempId ? realMsg : m)))
    } finally {
      setSendingImage(false)
      setComposer('text')
      setMessages(await services.messages.listTeamMessages(teamId))
    }
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
                  <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500">
                    Send
                  </button>
                </form>
              ) : composer === 'gif' ? (
                <GifPicker onSelect={sendGif} />
              ) : (
                <ImagePicker onSelect={sendImage} sending={sendingImage} />
              )}
            </div>
          </div>
        </section>
      )}

      {tab === 'events' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Events</h2>
            <button
              type="button"
              onClick={() => setShowCreateEvent(!showCreateEvent)}
              className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium hover:bg-indigo-500"
            >
              {showCreateEvent ? 'Cancel' : '+ New Event'}
            </button>
          </div>
          {showCreateEvent && (
            <form onSubmit={createEvent} className="space-y-2 rounded-lg border border-gray-700 bg-gray-800 p-4">
              <h3 className="font-semibold">Create Event</h3>
              <input
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Event title"
                className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
              />
              <input
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="Location"
                className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
              />
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
              >
                <option value="GAME">GAME</option>
                <option value="PRACTICE">PRACTICE</option>
                <option value="MEETING">MEETING</option>
                <option value="SOCIAL">SOCIAL</option>
              </select>
              <input
                type="datetime-local"
                value={eventStartTime}
                onChange={(e) => setEventStartTime(e.target.value)}
                className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
              />
              <input
                type="datetime-local"
                value={eventEndTime}
                onChange={(e) => setEventEndTime(e.target.value)}
                className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
              />
              <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500">
                Schedule Event
              </button>
            </form>
          )}
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
            <div className="mb-4">
              <button
                onClick={() => setShowAddPlayer(true)}
                className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium hover:bg-indigo-500"
              >
                Add Player
              </button>
            </div>
            {showAddPlayer && (
              <form onSubmit={addPlayer} className="space-y-2 rounded-lg border border-gray-700 bg-gray-800 p-3">
                <input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Player name"
                  className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  value={playerJerseyNumber || ''}
                  onChange={(e) => setPlayerJerseyNumber(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Jersey number (optional)"
                  className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
                />
                <input
                  type="email"
                  value={playerParentEmail}
                  onChange={(e) => setPlayerParentEmail(e.target.value)}
                  placeholder="Parent email (optional)"
                  className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500">
                    Add Player
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddPlayer(false)}
                    className="rounded bg-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            <ul className="divide-y divide-gray-700 rounded-lg border border-gray-700 bg-gray-800">
              {players.length === 0 && <li className="p-3 text-sm text-gray-400">No players.</li>}
              {players.map((m) => (
                <li key={m.userId} className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{m.user?.name ?? m.userId}</span>
                      {m.jerseyNumber ? <span className="text-xs text-gray-400">#{m.jerseyNumber}</span> : null}
                      <span className="text-xs text-gray-500">Player</span>
                      {m.parentEmail && (
                        <span className="text-xs text-indigo-400">(guardian: {m.parentEmail})</span>
                      )}
                    </div>
                    {m.userId !== user?.userId && !m.parentEmail && (
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
