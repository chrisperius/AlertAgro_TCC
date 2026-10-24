import * as authService from '../service/auth.service.js';

const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const validEmail = (email) => typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
const validPassword = (password) => typeof password === 'string' && password.length >= 8 && password.length <= 72;

export const register = asyncHandler(async (req, res) => {
  const { full_name, email, telefone, password } = req.body || {};
  if (typeof full_name !== 'string' || full_name.trim().length < 2 || !validEmail(email) || !validPassword(password)) {
    return res.status(400).json({ message: 'Informe nome, e-mail válido e senha com pelo menos 8 caracteres (máximo 72).' });
  }
  const result = await authService.register({ full_name, email, telefone, password });
  return res.status(201).json(result);
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmail(req.body?.token || req.query?.token);
  return res.status(200).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!validEmail(email) || typeof password !== 'string' || !password) {
    return res.status(400).json({ message: 'Informe um e-mail válido e a senha.' });
  }
  return res.status(200).json(await authService.login({ email, password }));
});

export const me = asyncHandler(async (req, res) => res.json({ user: req.user }));

export const forgotPassword = asyncHandler(async (req, res) => {
  if (!validEmail(req.body?.email)) return res.status(400).json({ message: 'Informe um e-mail válido.' });
  return res.status(200).json(await authService.forgotPassword(req.body.email));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body || {};
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
    return res.status(400).json({ message: 'A nova senha deve ter entre 8 e 72 caracteres.' });
  }
  return res.status(200).json(await authService.resetPassword({ token, password }));
});

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const status = Number.isInteger(error.status) ? error.status : 500;
  if (status >= 500) console.error('[API]', error);
  const message =
    status === 500 ? 'Erro interno do servidor.' : error.message;
  return res.status(status).json({ message });
}
