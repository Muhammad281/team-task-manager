import TaskCard from "./taskCard";

function TaskList ({tasks, onEdit, onDelete}){

    if(tasks.lenght === 0){
        return(
            <p className="text-sm text-gray-500">No task in team yet</p>
        )
    }

    return(
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
    )
}

export default TaskList