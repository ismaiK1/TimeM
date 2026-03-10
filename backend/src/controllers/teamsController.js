/**
 * Contrôleur teams — CRUD (lecture pour tous authentifiés ; écriture Manager)
 */
const teamService = require('../services/teamService');
const { IntegrityError } = require('../services/userService');

async function list(req, res, next) {
  try {
    const teams = await teamService.list();
    res.json(teams);
  } catch (err) {
    next(err);
  }
}

async function get(req, res, next) {
  try {
    const team = await teamService.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Équipe introuvable' });
    res.json(team);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    if (req.user.role !== 'MANAGER') return res.status(403).json({ error: 'Accès refusé' });
    const team = await teamService.create(req.body);
    res.status(201).json(team);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    if (req.user.role !== 'MANAGER') return res.status(403).json({ error: 'Accès refusé' });
    const team = await teamService.update(req.params.id, req.body);
    res.json(team);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Équipe introuvable' });
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    if (req.user.role !== 'MANAGER') return res.status(403).json({ error: 'Accès refusé' });
    await teamService.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    if (err instanceof IntegrityError) return res.status(409).json({ error: err.message });
    if (err.code === 'P2025') return res.status(404).json({ error: 'Équipe introuvable' });
    next(err);
  }
}

module.exports = { list, get, create, update, remove };
