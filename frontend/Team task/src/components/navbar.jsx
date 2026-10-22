import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

function Navbar({ user }) {
  const navigate = useNavigate()

  async function handleLogout() {
    await api.post('/auth/logout')
    navigate('/login')
  }

  return (
    <nav className="bg-white shadow px-6 py-3 flex items-center justify-between">
      <h1 className="text-xl font-bold text-blue-600">Team Task Manager</h1>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-700">Hi, {user.name}</span>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white text-sm px-3 py-1 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}

export default Navbar