/**
 * Contrôleur auth — login, me
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config');
const userService = require('../services/userService');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await userService.findByEmail(email);
    if (!user) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    const token = jwt.sign(
      { sub: user.id, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    const profile = await userService.findById(user.id);
    res.json({ token, user: profile });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await userService.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await userService.findByEmail(req.user.email);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    await userService.update(req.user.id, { password: newPassword });
    res.json({ message: 'Mot de passe mis à jour' });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, me, changePassword };
