import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useServices } from '../context/ServicesContext'
import type { RsvpStatus, RsvpSummary, Team } from '../types'
import { fmtDateTime } from '../lib/format'

interface CalEvent {
  eventId: string
  teamId: string
  teamName: string
  title: string
  location: string
  eventType: string
  startTime: string
  rsvp: RsvpSummary
}

const STATUSES: RsvpStatus[] = ['YES', 'NO', 'MAYBE']

export default function EventsCalendar() {
  const services = useServices()
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)

  const loadAll = async (): Promise<CalEvent[]> => {
    const teams: Team[] = await services.teams.listMyTeams()
    const all: CalEvent[] = []
    for (const t of teams) {
      const evs = await services.events.listEvents(t.teamId)
      for (const e of evs) all.push({ ...e, teamName: t.teamName })
    }
    return all.sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  useEffect(() => {
    (async () => {
      setEvents(await loadAll())
      setLoading(false)
    })()
  }, [])

  const setRsvp = async (eventId: string, status: RsvpStatus) => {
    await services.rsvp.setStatus(eventId, status)
    setEvents(await loadAll())
  }

  if (loading) return <p className="text-gray-400">Loading...</p>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Upcoming Events</h1>
      {events.length === 0 && <p className="text-gray-400">No events across your teams.</p>}
      <div className="space-y-3">
        {events.map((e) => (
          <div key={e.eventId} className="rounded-lg border border-gray-700 bg-gray-800 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{e.title}</div>
                <div className="mt-1 text-sm text-gray-400">{fmtDateTime(e.startTime)} · {e.location}</div>
                <Link to={`/teams/${e.teamId}`} className="text-xs text-indigo-400 hover:text-indigo-300">{e.teamName}</Link>
                <div className="mt-1 text-xs text-gray-500">
                  {e.rsvp.counts.YES} yes · {e.rsvp.counts.NO} no · {e.rsvp.counts.MAYBE} maybe
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
      </div>
    </div>
  )
}
