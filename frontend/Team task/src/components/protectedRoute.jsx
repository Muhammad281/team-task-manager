import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import api from '../api/axios'

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="p-6">Loading...</p>
  if (!user) return <Navigate to="/login" replace />

  return children
}

export default ProtectedRoute