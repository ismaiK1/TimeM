/**
 * Contrôleur users — CRUD (Manager : équipe ; Employee : soi uniquement)
 */
const userService = require('../services/userService');
const { IntegrityError } = require('../services/userService');

async function list(req, res, next) {
  try {
    if (req.user.role === 'MANAGER' && req.user.teamId) {
      const users = await userService.listForManager(req.user.teamId);
      return res.json(users);
    }
    return res.status(403).json({ error: 'Accès refusé' });
  } catch (err) {
    next(err);
  }
}

async function get(req, res, next) {
  try {
    const { id } = req.params;
    if (req.user.id !== id && req.user.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    if (req.user.role === 'MANAGER' && req.user.id !== id) {
      const target = await userService.findById(id);
      if (!target || target.teamId !== req.user.teamId) return res.status(404).json({ error: 'Utilisateur introuvable' });
      return res.json(target);
    }
    const user = await userService.findById(id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    if (req.user.role !== 'MANAGER') return res.status(403).json({ error: 'Accès refusé' });
    const data = { ...req.body, teamId: req.user.teamId };
    const user = await userService.create(data);
    res.status(201).json(user);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    if (req.user.id !== id && req.user.role !== 'MANAGER') return res.status(403).json({ error: 'Accès refusé' });
    if (req.user.role === 'MANAGER' && req.user.id !== id) {
      const target = await userService.findById(id);
      if (!target || target.teamId !== req.user.teamId) return res.status(404).json({ error: 'Utilisateur introuvable' });
    }
    const user = await userService.update(id, req.body);
    res.json(user);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Utilisateur introuvable' });
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    if (req.user.role !== 'MANAGER') return res.status(403).json({ error: 'Accès refusé' });
    const target = await userService.findById(id);
    if (!target || target.teamId !== req.user.teamId) return res.status(404).json({ error: 'Utilisateur introuvable' });
    await userService.remove(id);
    res.status(204).send();
  } catch (err) {
    if (err instanceof IntegrityError) return res.status(409).json({ error: err.message });
    if (err.code === 'P2025') return res.status(404).json({ error: 'Utilisateur introuvable' });
    next(err);
  }
}

module.exports = { list, get, create, update, remove };
