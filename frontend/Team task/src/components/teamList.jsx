function TeamList({ teams, selectedTeamId, onSelect }) {
  if (teams.length === 0) {
    return <p className="text-sm text-gray-500">No team part</p>
  }

  return (
    <ul className="space-y-2">
      {teams.map((team) => (
        <li key={team.id}>
          <button
            onClick={() => onSelect(team.id)}
            className={`w-full text-left p-2 rounded border text-sm ${
              selectedTeamId === team.id
                ? 'bg-blue-50 border-blue-500'
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <span className="font-medium">{team.name}</span>
            <span className="block text-xs text-gray-500">
              {team.role} · {team.member_count} member(s)
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

export default TeamList