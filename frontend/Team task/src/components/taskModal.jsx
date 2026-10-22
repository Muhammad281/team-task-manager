import { useEffect, useState } from 'react'
import api from '../api/axios'

function TaskModal({ teamId, task, onClose, onSaved }) {
    const [title, setTitle] = useState(task?.title || '')
    const [description, setDescription] = useState(task?.description || '')
    const [status, setStatus] = useState(task?.status || 'todo')
    const [dueDate, setDueDate] = useState(task?.due_date || '')
    const [assignedTo, setAssignedTo] = useState(task?.assigned_to ? String(task.assigned_to) : '')
    const [members, setMembers] = useState([])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        api.get(`/teams/${teamId}`).then((res) => setMembers(res.data.members))
    }, [teamId])

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const payload = {
                title,
                description,
                status,
                due_date: dueDate || null,
                assigned_to: assignedTo ? Number(assignedTo) : null,
            }

            if (task) {
                await api.put(`/tasks/${task.id}`, payload)
            } else {
                await api.post('/tasks', { ...payload, team_id: teamId })
            }
            onSaved()
            onClose()
        } catch (err) {
            const data = err.response?.data
            setError(data?.errors?.join(', ') || data?.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md bg-white p-6 rounded-lg shadow"
            >
                <h2 className="text-xl font-bold mb-4">{task? 'Edit Task' : 'New Task'}</h2>

                {error && (
                    <p className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
                )}

                <label className="block mb-1 text-sm font-medium">Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full mb-3 p-2 border rounded"
                    required
                />

                <label className="block mb-1 text-sm font-medium">Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full mb-3 p-2 border rounded"
                    rows="3"
                />

                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <label className="block mb-1 text-sm font-medium">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full p-2 border rounded"
                        >
                            <option value="todo">todo</option>
                            <option value="in_progress">in_progress</option>
                            <option value="done">done</option>
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium">Due date</label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                </div>

                <label className="block mb-1 text-sm font-medium">Assign to</label>
                <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full mb-5 p-2 border rounded"
                >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                        <option key={m.id} value={m.id}>
                            {m.name}
                        </option>
                    ))}
                </select>

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default TaskModal