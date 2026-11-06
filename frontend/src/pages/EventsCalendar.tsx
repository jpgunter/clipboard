import { useEffect, useState, type FormEvent } from 'react'
import { useServices } from '../context/ServicesContext'
import type { TeamEvent, RsvpSummary, Team } from '../types'
import { fmtDateTime } from '../lib/format'

export default function EventsCalendar() {
  const services = useServices()
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [events, setEvents] = useState<(TeamEvent & { rsvp: RsvpSummary })[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [eventName, setEventName] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [eventType, setEventType] = useState('GAME')
  const [eventStartTime, setEventStartTime] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')

  const EVENT_TYPES = ['GAME', 'PRACTICE', 'MEETING', 'SOCIAL']

  const loadTeams = async () => {
    setTeams(await services.teams.listMyTeams())
  }

  const loadEvents = async (teamId: string) => {
    setLoading(true)
    setEvents(await services.events.listEvents(teamId))
    setLoading(false)
  }

  useEffect(() => {
    loadTeams()
  }, [])

  const createEvent = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedTeamId || !eventName.trim()) return
    await services.events.createEvent(selectedTeamId, {
      title: eventName.trim(),
      location: eventLocation.trim(),
      eventType,
      startTime: eventStartTime,
      endTime: eventEndTime,
    })
    setShowCreateForm(false)
    setEventName('')
    setEventLocation('')
    setEventType('GAME')
    setEventStartTime('')
    setEventEndTime('')
    await loadEvents(selectedTeamId)
  }

  const eventTypeColor: Record<string, string> = {
    GAME: 'bg-red-900 text-red-200',
    PRACTICE: 'bg-blue-900 text-blue-200',
    MEETING: 'bg-amber-900 text-amber-200',
    SOCIAL: 'bg-green-900 text-green-200',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Events Calendar</h1>
        <p className="mt-1 text-sm text-gray-400">Schedule and RSVP for your teams.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
            <h2 className="font-semibold">Teams</h2>
            <div className="mt-2 space-y-1">
              {teams.map((t) => (
                <button
                  key={t.teamId}
                  onClick={() => {
                    setSelectedTeamId(t.teamId)
                    loadEvents(t.teamId)
                  }}
                  className={`w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-left ${selectedTeamId === t.teamId ? 'border-indigo-400 bg-indigo-900' : 'hover:bg-gray-700'}`}
                >
                  <div className="font-medium">{t.teamName}</div>
                  <div className="text-xs text-gray-400">{t.sport} · {t.season}</div>
                </button>
              ))}
              {teams.length === 0 && <p className="text-sm text-gray-400">No teams yet.</p>}
            </div>
          </div>

          {selectedTeamId && (
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
              <h2 className="font-semibold">Create Event</h2>
              <button
                type="button"
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="mt-2 w-full rounded bg-indigo-600 px-3 py-2 text-sm font-medium hover:bg-indigo-500"
              >
                {showCreateForm ? 'Cancel' : 'New Event'}
              </button>
              {showCreateForm && (
                <form onSubmit={createEvent} className="mt-3 space-y-2">
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
                    {EVENT_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
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
                  <button
                    type="submit"
                    className="w-full rounded bg-indigo-600 px-3 py-2 text-sm font-medium hover:bg-indigo-500"
                  >
                    Schedule Event
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          {selectedTeamId ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Upcoming Events</h2>
              {loading && <p className="text-sm text-gray-400">Loading...</p>}
              {!loading && events.length === 0 && <p className="text-sm text-gray-400">No events scheduled.</p>}
              {!loading && events.map((e) => (
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
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">Select a team to view events.</p>
          )}
        </div>
      </div>
    </div>
  )
}
