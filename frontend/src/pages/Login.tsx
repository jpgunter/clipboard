import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    await signIn(email.trim())
    navigate('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-6">
        <h1 className="text-xl font-bold">Sign in to SportsApp</h1>
        <p className="text-sm text-gray-400">Mock auth - enter any email.</p>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
        />
        <button type="submit" className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500">
          Sign in
        </button>
      </form>
    </div>
  )
}
