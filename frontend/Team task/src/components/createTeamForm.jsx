import { useState } from 'react'
import api from '../api/axios'


function CreateTeamForm({ onCreated }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/teams', { name })
      setName('')
      onCreated()
    } catch (err) {
      const data = err.response?.data
      setError(data?.errors?.join(', ') || data?.message || 'Something went wrong')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter Team Name"
        className="w-full p-2 border rounded mb-2 text-sm"
        required
      />
      <button
        type="submit"
        className="w-full bg-blue-600 text-white text-sm py-2 rounded hover:bg-blue-700"
      >
        Create Team
      </button>
    </form>
  )
}

export default CreateTeamForm