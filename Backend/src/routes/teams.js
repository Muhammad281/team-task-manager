const express = require('express');
const Joi = require('joi');
const pool = require('../db/pool');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

const teamSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
});

router.post('/', validate(teamSchema), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      'INSERT INTO teams (name, created_by) VALUES ($1, $2) RETURNING id, name, created_by, created_at',
      [req.body.name, req.user.id]
    );
    const team = rows[0];

    await client.query(
      'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)',
      [team.id, req.user.id, 'owner']
    );

    await client.query('COMMIT');
    res.status(201).json({ team });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.id, t.name, t.created_by, t.created_at, tm.role,
              (SELECT COUNT(*) FROM team_members WHERE team_id = t.id)::int AS member_count
       FROM teams t
       JOIN team_members tm ON tm.team_id = t.id
       WHERE tm.user_id = $1
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    res.json({ teams: rows });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    if (Number.isNaN(teamId)) {
      return res.status(400).json({ message: 'Invalid team id' });
    }

    const access = await pool.query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, req.user.id]
    );
    if (access.rows.length === 0) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const teamResult = await pool.query(
      'SELECT id, name, created_by, created_at FROM teams WHERE id = $1',
      [teamId]
    );

    const membersResult = await pool.query(
      `SELECT u.id, u.name, u.email, tm.role, tm.joined_at
       FROM team_members tm
       JOIN users u ON u.id = tm.user_id
       WHERE tm.team_id = $1
       ORDER BY tm.joined_at ASC`,
      [teamId]
    );

    res.json({
      team: { ...teamResult.rows[0], my_role: access.rows[0].role },
      members: membersResult.rows,
    });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validate(teamSchema), async (req, res, next) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    if (Number.isNaN(teamId)) {
      return res.status(400).json({ message: 'Invalid team id' });
    }

    const access = await pool.query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, req.user.id]
    );
    if (access.rows.length === 0) {
      return res.status(404).json({ message: 'Team not found' });
    }
    if (access.rows[0].role !== 'owner') {
      return res.status(403).json({ message: 'Only the team owner can update the team' });
    }

    const { rows } = await pool.query(
      'UPDATE teams SET name = $1 WHERE id = $2 RETURNING id, name, created_by, created_at',
      [req.body.name, teamId]
    );
    res.json({ team: rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    if (Number.isNaN(teamId)) {
      return res.status(400).json({ message: 'Invalid team id' });
    }

    const access = await pool.query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, req.user.id]
    );
    if (access.rows.length === 0) {
      return res.status(404).json({ message: 'Team not found' });
    }
    if (access.rows[0].role !== 'owner') {
      return res.status(403).json({ message: 'Only the team owner can delete the team' });
    }

    await pool.query('DELETE FROM teams WHERE id = $1', [teamId]);
    res.json({ message: 'Team deleted' });
  } catch (err) {
    next(err);
  }
});

const memberSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
});

router.post('/:id/members', validate(memberSchema), async (req, res, next) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    if (Number.isNaN(teamId)) {
      return res.status(400).json({ message: 'Invalid team id' });
    }

    const access = await pool.query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, req.user.id]
    );
    if (access.rows.length === 0) {
      return res.status(404).json({ message: 'Team not found' });
    }
    if (access.rows[0].role !== 'owner') {
      return res.status(403).json({ message: 'Only the team owner can add members' });
    }

    const userResult = await pool.query(
      'SELECT id, name, email FROM users WHERE email = $1',
      [req.body.email]
    );
    const newMember = userResult.rows[0];
    if (!newMember) {
      return res.status(404).json({ message: 'No user found with this email' });
    }

    const existing = await pool.query(
      'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, newMember.id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'User is already a team member' });
    }

    await pool.query(
      'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)',
      [teamId, newMember.id, 'member']
    );
    res.status(201).json({ member: { ...newMember, role: 'member' } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/teams/:id/members/:userId  -> member remove (owner) ya khud leave
router.delete('/:id/members/:userId', async (req, res, next) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    const userId = parseInt(req.params.userId, 10);
    if (Number.isNaN(teamId) || Number.isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const access = await pool.query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, req.user.id]
    );
    if (access.rows.length === 0) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const isOwner = access.rows[0].role === 'owner';
    const isSelf = userId === req.user.id;

    if (!isOwner && !isSelf) {
      return res.status(403).json({ message: 'Only the team owner can remove other members' });
    }

    // Owner khud ko nahi hata sakta
    if (isOwner && isSelf) {
      return res.status(400).json({ message: 'Owner cannot leave the team. Delete the team instead' });
    }

    const result = await pool.query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Member not found in this team' });
    }

    res.json({ message: 'Member removed' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;