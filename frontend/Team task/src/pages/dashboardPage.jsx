import { useEffect, useState } from 'react'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import TeamList from '../components/teamList'
import CreateTeamForm from '../components/createTeamForm'
import TaskList from '../components/taskList'

function DashboardPage() {
  const [user, setUser] = useState(null)
  const [teams, setTeams] = useState([])
  const [selectedTeamId, setSelectedTeamId] = useState(null)
  const [tasks, setTasks] = useState([])

  async function loadTeams() {
    const res = await api.get('/teams')
    setTeams(res.data.teams)
  }

  useEffect(() => {
    api.get('/auth/me').then((res) => setUser(res.data.user))
    loadTeams()
  }, [])

  useEffect(() => {
    if (!selectedTeamId) {
      setTasks([])
      return
    }
    api
      .get('/tasks', { params: { team_id: selectedTeamId } })
      .then((res) => setTasks(res.data.tasks))
  }, [selectedTeamId])

  if (!user) return <p className="p-6">Loading...</p>

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar user={user} />
      <main className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="md:col-span-1 bg-white p-4 rounded shadow">
          <h2 className="font-bold mb-3">My Teams</h2>
          <TeamList
            teams={teams}
            selectedTeamId={selectedTeamId}
            onSelect={setSelectedTeamId}
          />
          <CreateTeamForm onCreated={loadTeams} />
        </aside>

        <section className="md:col-span-3 bg-white p-4 rounded shadow">
          {selectedTeamId ? (
            <TaskList tasks={tasks} />) : (
            <p className="text-sm text-gray-500">Pehle left side se team chuno.</p>)}
        </section>
      </main>
    </div>
  )
}

export default DashboardPage