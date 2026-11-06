import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useServices } from '../context/ServicesContext'

export default function CreateTeam() {
  const services = useServices()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [sport, setSport] = useState('select')
  const [season, setSeason] = useState('select')
  const [sportOther, setSportOther] = useState('')
  const [seasonOther, setSeasonOther] = useState('')
  const [loading, setLoading] = useState(false)

  const SPORTS = ['select', 'Soccer', 'Basketball', 'Baseball', 'Volleyball', 'Other']
  const SEASONS = ['select', 'Spring', 'Summer', 'Fall', 'Winter', 'Other']

  const create = async (e: FormEvent) => {
    e.preventDefault()
    const finalSport = sport === 'Other' ? sportOther.trim() : sport
    const finalSeason = season === 'Other' ? seasonOther.trim() : season
    if (!name.trim() || !finalSport || !finalSeason) return
    setLoading(true)
    await services.teams.createTeam({ teamName: name.trim(), sport: finalSport, season: finalSeason })
    setLoading(false)
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <Link to="/" className="text-sm text-indigo-400 hover:text-indigo-300">&larr; Dashboard</Link>
        <h1 className="mt-1 text-2xl font-bold">Create Team</h1>
      </div>

      <form onSubmit={create} className="space-y-3 rounded-lg border border-gray-700 bg-gray-800 p-4">
        <h2 className="font-semibold">Create a team</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Team name"
          className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
        />
        <div>
          <label className="mb-1 block text-sm font-medium">Sport</label>
          <select
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
          >
            {SPORTS.map((s) => (
              <option key={s} value={s}>{s === 'select' ? 'Select sport...' : s}</option>
            ))}
          </select>
          {sport === 'Other' && (
            <input
              value={sportOther}
              onChange={(e) => setSportOther(e.target.value)}
              placeholder="Other sport"
              className="mt-2 w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
            />
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Season</label>
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
          >
            {SEASONS.map((s) => (
              <option key={s} value={s}>{s === 'select' ? 'Select season...' : s}</option>
            ))}
          </select>
          {season === 'Other' && (
            <input
              value={seasonOther}
              onChange={(e) => setSeasonOther(e.target.value)}
              placeholder="Other season"
              className="mt-2 w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
            />
          )}
        </div>
        <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500">
          {loading ? 'Creating...' : 'Create team'}
        </button>
      </form>
    </div>
  )
}
