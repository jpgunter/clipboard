import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useServices } from '../context/ServicesContext'
import type { Team } from '../types'

export default function Dashboard() {
  const services = useServices()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [sport, setSport] = useState<string>('select')
  const [season, setSeason] = useState<string>('select')

  const SPORTS = ['select', 'Soccer', 'Basketball', 'Baseball', 'Volleyball', 'Other']
  const SEASONS = ['select', 'Spring', 'Summer', 'Fall', 'Winter', 'Other']

  const load = async () => {
    setLoading(true)
    setTeams(await services.teams.listMyTeams())
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const create = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || sport === 'select' || season === 'select') return
    await services.teams.createTeam({ teamName: name.trim(), sport: sport.trim(), season: season.trim() })
    setName('')
    setSport('select')
    setSeason('select')
    await load()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Your Teams</h1>
        <p className="mt-1 text-sm text-gray-400">Teams you coach or play on.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading && <p className="text-gray-400">Loading...</p>}
        {!loading && teams.length === 0 && <p className="text-gray-400">No teams yet. Create one below.</p>}
        {teams.map((t) => (
          <Link
            key={t.teamId}
            to={`/teams/${t.teamId}`}
            className="block rounded-lg border border-gray-700 bg-gray-800 p-4 hover:bg-gray-700"
          >
            <div className="text-lg font-semibold">{t.teamName}</div>
            <div className="mt-1 text-sm text-gray-400">{t.sport} · {t.season}</div>
          </Link>
        ))}
      </div>

      <form onSubmit={create} className="max-w-md space-y-3 rounded-lg border border-gray-700 bg-gray-800 p-4">
        <h2 className="font-semibold">Create a team</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Team name"
          className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
        />
        <select
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
        >
          {SPORTS.map((s) => (
            <option key={s} value={s}>{s === 'select' ? 'Select sport...' : s}</option>
          ))}
        </select>
        <select
          value={season}
          onChange={(e) => setSeason(e.target.value)}
          className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
        >
          {SEASONS.map((s) => (
            <option key={s} value={s}>{s === 'select' ? 'Select season...' : s}</option>
          ))}
        </select>
        <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500">
          Create team
        </button>
      </form>
    </div>
  )
}
