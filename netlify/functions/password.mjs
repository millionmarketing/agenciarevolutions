import { checkPassword, getPasswordHash, getSession, hashPassword, json, sessionCookie, setPasswordHash } from '../lib/auth.mjs';

export default async req => {
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);
  const session = await getSession(req);
  if (!session) return json({ error: 'Não autorizado' }, 401);

  const { atual, nova } = await req.json().catch(() => ({}));
  if (!checkPassword(atual || '', await getPasswordHash())) return json({ error: 'Senha atual incorreta.' }, 400);
  if (String(nova || '').length < 8) return json({ error: 'A nova senha precisa ter pelo menos 8 caracteres.' }, 400);

  await setPasswordHash(hashPassword(nova));
  // Sessões antigas caem; esta recebe um cookie novo
  return json({ ok: true }, 200, { 'Set-Cookie': await sessionCookie(session.email) });
};

export const config = { path: '/api/password' };
