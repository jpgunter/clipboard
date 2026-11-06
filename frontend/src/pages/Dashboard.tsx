import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useServices } from '../context/ServicesContext'
import type { Team } from '../types'

export default function Dashboard() {
  const services = useServices()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    setTeams(await services.teams.listMyTeams())
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Teams</h1>
          <p className="mt-1 text-sm text-gray-400">Teams you coach or play on.</p>
        </div>
        <Link
          to="/teams/create"
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500"
        >
          + Create Team
        </Link>
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
    </div>
  )
}
