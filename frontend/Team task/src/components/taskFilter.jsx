function TaskFilters({ filters, members, onChange }) {
  function update(key, value) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
      <input
        type="text"
        value={filters.search}
        onChange={(e) => update('search', e.target.value)}
        placeholder="search here"
        className="p-2 border rounded text-sm"
      />

      <select
        value={filters.assigned_to}
        onChange={(e) => update('assigned_to', e.target.value)}
        className="p-2 border rounded text-sm"
      >
        <option value="">All assignee</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>

      <select
        value={filters.status}
        onChange={(e) => update('status', e.target.value)}
        className="p-2 border rounded text-sm"
      >
        <option value="">All status</option>
        <option value="todo">todo</option>
        <option value="in_progress">in_progress</option>
        <option value="done">done</option>
      </select>
    </div>
  )
}

export default TaskFilters