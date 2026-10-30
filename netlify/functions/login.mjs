import { ADMIN_EMAIL, checkPassword, getPasswordHash, json, sessionCookie } from '../lib/auth.mjs';

const wait = ms => new Promise(r => setTimeout(r, ms));

export default async req => {
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);
  const { email, senha } = await req.json().catch(() => ({}));
  const okEmail = String(email || '').trim().toLowerCase() === ADMIN_EMAIL();
  const okPass = checkPassword(senha || '', await getPasswordHash());

  if (!okEmail || !okPass || !process.env.SESSION_SECRET) {
    await wait(800); // freia tentativas em sequência
    return json({ error: 'E-mail ou senha incorretos.' }, 401);
  }
  return json({ ok: true }, 200, { 'Set-Cookie': await sessionCookie(ADMIN_EMAIL()) });
};

export const config = { path: '/api/login' };
