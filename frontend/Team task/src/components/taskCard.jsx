const statusColors = {
  todo: 'bg-gray-200 text-gray-800',
  in_progress: 'bg-yellow-200 text-yellow-800',
  done: 'bg-green-200 text-green-800',
}

function TaskCard({ task, onEdit, onDelete }) {
  return (
    <div className="p-4 border rounded bg-white shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold">{task.title}</h3>
        <span
          className={`text-xs px-2 py-1 rounded whitespace-nowrap ${statusColors[task.status]}`}
        >
          {task.status}
        </span>
      </div>

      {task.description && (
        <p className="mt-1 text-sm text-gray-600">{task.description}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
        <span>Assignee: {task.assignee_name || 'Unassigned'}</span>
        <span>Due: {task.due_date || 'No date'}</span>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onEdit(task)}
          className="text-xs px-2 py-1 border rounded hover:bg-gray-50">
          Edit
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="text-xs px-2 py-1 border border-red-300 text-red-600 rounded hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export default TaskCard