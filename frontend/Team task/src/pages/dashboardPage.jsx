import { useEffect, useState } from 'react'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import TeamList from '../components/teamList'
import CreateTeamForm from '../components/createTeamForm'
import TaskList from '../components/taskList'
import TaskModal from '../components/taskModal'

function DashboardPage() {
  const [user, setUser] = useState(null)
  const [teams, setTeams] = useState([])
  const [selectedTeamId, setSelectedTeamId] = useState(null)
  const [tasks, setTasks] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  async function loadTeams() {
    const res = await api.get('/teams')
    setTeams(res.data.teams)
  }

  useEffect(() => {
    api.get('/auth/me').then((res) => setUser(res.data.user))
    loadTeams()
  }, [])

  async function loadTasks() {
    if (!selectedTeamId) {
      setTasks([])
      return
    }
    const res = await api.get('/tasks', { params: { team_id: selectedTeamId } })
    setTasks(res.data.tasks)
  }

  async function handleDeleteTask(taskId) {
    if (!window.confirm('You want to delete this?')) return
    await api.delete(`/tasks/${taskId}`)
    loadTasks()
  }

  useEffect(() => {
    loadTasks()
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
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">Tasks</h2>
                <button
                  onClick={() => {
                    setEditingTask(null)
                    setShowModal(true)
                  }}
                  className="bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700"
                >
                  + Add New Task
                </button>
              </div>
              <TaskList tasks={tasks}
                onEdit={(task) => {
                  setEditingTask(task)
                  setShowModal(true)
                }} onDelete={handleDeleteTask} />
            </>
          ) : (
            <p className="text-sm text-gray-500">Select Team .</p>
          )}
        </section>

        {showModal && (
          <TaskModal
            teamId={selectedTeamId}
            task={editingTask}
            onClose={() => setShowModal(false)}
            onSaved={loadTasks}
          />
        )}
      </main>
    </div>
  )
}

export default DashboardPage