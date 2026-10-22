import { useState } from 'react'
import api from '../api/axios'

function MemberManager({ teamId, members, myRole, myId, onChanged }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    try {
      await api.post(`/teams/${teamId}/members`, { email })
      setEmail('')
      onChanged()
    } catch (err) {
      const data = err.response?.data
      setError(data?.errors?.join(', ') || data?.message || 'Something went wrong')
    }
  }

  async function handleRemove(userId) {
    if (!window.confirm('Are You sure want to remove member?')) return
    try {
      await api.delete(`/teams/${teamId}/members/${userId}`)
      onChanged()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    }
  }

  return (
    <div className="mb-4 p-3 border rounded bg-gray-50">
      <h3 className="font-bold text-sm mb-2">Members</h3>

      <ul className="mb-3 space-y-1">
        {members.map((m) => (
          <li key={m.id} className="flex items-center justify-between text-sm">
            <span>
              {m.name} <span className="text-xs text-gray-500">({m.role})</span>
            </span>
            {myRole === 'owner' && m.id !== myId && (
              <button
                onClick={() => handleRemove(m.id)}
                className="text-xs text-red-600 hover:underline"
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>

      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}

      {myRole === 'owner' && (
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter Member email"
            className="flex-1 p-2 border rounded text-sm"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white text-sm px-3 rounded hover:bg-blue-700"
          >
            Add
          </button>
        </form>
      )}
    </div>
  )
}

export default MemberManager