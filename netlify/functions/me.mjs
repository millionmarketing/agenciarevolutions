import { NOTIFY_EMAIL, getSession, json } from '../lib/auth.mjs';

export default async req => {
  const session = await getSession(req);
  if (!session) return json({ error: 'Não autorizado' }, 401);
  return json({ email: session.email, notifyEmail: NOTIFY_EMAIL() });
};

export const config = { path: '/api/me' };
