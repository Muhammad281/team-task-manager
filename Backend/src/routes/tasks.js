const express = require('express');
const Joi = require('joi');
const pool = require('../db/pool');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Is file ke saare routes par login zaroori hai
router.use(requireAuth);

const createTaskSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).required(),
  description: Joi.string().trim().allow('', null).max(2000),
  status: Joi.string().valid('todo', 'in_progress', 'done'),
  due_date: Joi.date().iso().allow(null),
  team_id: Joi.number().integer().positive().required(),
  assigned_to: Joi.number().integer().positive().allow(null),
});

// POST /api/tasks  -> task banao (assign bhi isi me)
router.post('/', validate(createTaskSchema), async (req, res, next) => {
  try {
    const { title, description, status, due_date, team_id, assigned_to } = req.body;

    // Check 1: login user is team ka member hona chahiye
    const access = await pool.query(
      'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
      [team_id, req.user.id]
    );
    if (access.rows.length === 0) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check 2: jisko assign kar rahe hain wo bhi isi team ka member ho
    if (assigned_to) {
      const assignee = await pool.query(
        'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
        [team_id, assigned_to]
      );
      if (assignee.rows.length === 0) {
        return res.status(400).json({ message: 'Assignee must be a member of this team' });
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO tasks (title, description, status, due_date, team_id, assigned_to, created_by)
       VALUES ($1, $2, COALESCE($3, 'todo'), $4, $5, $6, $7)
       RETURNING *`,
      [title, description || null, status || null, due_date || null, team_id, assigned_to || null, req.user.id]
    );

    res.status(201).json({ task: rows[0] });
  } catch (err) {
    next(err);
  }
});


// GET /api/tasks  -> meri teams ke tasks (filters ke saath)
// Misal: /api/tasks?team_id=1&assigned_to=2&search=poster&status=todo
router.get('/', async (req, res, next) => {
  try {
    const { team_id, assigned_to, search, status } = req.query;

    // Base query: sirf wahi tasks jo meri teams ke hain
    const conditions = [
      'EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = t.team_id AND tm.user_id = $1)',
    ];
    const values = [req.user.id];

    if (team_id) {
      const id = parseInt(team_id, 10);
      if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid team_id' });
      values.push(id);
      conditions.push(`t.team_id = $${values.length}`);
    }

    if (assigned_to) {
      const id = parseInt(assigned_to, 10);
      if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid assigned_to' });
      values.push(id);
      conditions.push(`t.assigned_to = $${values.length}`);
    }

    if (status) {
      if (!['todo', 'in_progress', 'done'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      values.push(status);
      conditions.push(`t.status = $${values.length}`);
    }

    if (search) {
      values.push(`%${search}%`);
      conditions.push(
        `(t.title ILIKE $${values.length} OR t.description ILIKE $${values.length})`
      );
    }

    const { rows } = await pool.query(
      `SELECT t.id, t.title, t.description, t.status,
              to_char(t.due_date, 'YYYY-MM-DD') AS due_date,
              t.team_id, tm.name AS team_name,
              t.assigned_to, u.name AS assignee_name,
              t.created_by, t.created_at, t.updated_at
       FROM tasks t
       JOIN teams tm ON tm.id = t.team_id
       LEFT JOIN users u ON u.id = t.assigned_to
       WHERE ${conditions.join(' AND ')}
       ORDER BY t.created_at DESC`,
      values
    );

    res.json({ tasks: rows });
  } catch (err) {
    next(err);
  }
});

const updateTaskSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200),
  description: Joi.string().trim().allow('', null).max(2000),
  status: Joi.string().valid('todo', 'in_progress', 'done'),
  due_date: Joi.date().iso().allow(null),
  assigned_to: Joi.number().integer().positive().allow(null),
}).min(1);

// PUT /api/tasks/:id  -> task update
router.put('/:id', validate(updateTaskSchema), async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (Number.isNaN(taskId)) {
      return res.status(400).json({ message: 'Invalid task id' });
    }

    // Task dhoondo, aur check karo user us team ka member hai
    const taskResult = await pool.query(
      `SELECT t.id, t.team_id FROM tasks t
       JOIN team_members tm ON tm.team_id = t.team_id
       WHERE t.id = $1 AND tm.user_id = $2`,
      [taskId, req.user.id]
    );
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    const teamId = taskResult.rows[0].team_id;

    // Naya assignee isi team ka member hona chahiye
    if (req.body.assigned_to) {
      const assignee = await pool.query(
        'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
        [teamId, req.body.assigned_to]
      );
      if (assignee.rows.length === 0) {
        return res.status(400).json({ message: 'Assignee must be a member of this team' });
      }
    }

    // Sirf wahi fields update hon jo bheji gayi hain
    const fields = [];
    const values = [];
    for (const key of ['title', 'description', 'status', 'due_date', 'assigned_to']) {
      if (req.body[key] !== undefined) {
        values.push(req.body[key]);
        fields.push(`${key} = $${values.length}`);
      }
    }
    fields.push('updated_at = NOW()');
    values.push(taskId);

    const { rows } = await pool.query(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${values.length}
       RETURNING id, title, description, status,
                 to_char(due_date, 'YYYY-MM-DD') AS due_date,
                 team_id, assigned_to, created_by, created_at, updated_at`,
      values
    );

    res.json({ task: rows[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id  -> task delete
router.delete('/:id', async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (Number.isNaN(taskId)) {
      return res.status(400).json({ message: 'Invalid task id' });
    }

    // Sirf tab delete ho jab user us task ki team ka member ho
    const result = await pool.query(
      `DELETE FROM tasks
       WHERE id = $1
         AND EXISTS (
           SELECT 1 FROM team_members tm
           WHERE tm.team_id = tasks.team_id AND tm.user_id = $2
         )`,
      [taskId, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;