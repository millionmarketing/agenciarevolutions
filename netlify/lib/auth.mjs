import { getStore } from '@netlify/blobs';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const COOKIE = 'rv_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

export const ADMIN_EMAIL = () => (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
export const NOTIFY_EMAIL = () => process.env.NOTIFY_EMAIL || ADMIN_EMAIL();

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });

/* Senha: scrypt com salt, formato "salt:hash" */
export const hashPassword = (pw, salt = randomBytes(16).toString('hex')) =>
  `${salt}:${scryptSync(pw, salt, 64).toString('hex')}`;

export const checkPassword = (pw, stored) => {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, 'hex');
  const b = scryptSync(String(pw), salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
};

// A senha trocada pelo painel fica no Blobs; a inicial vem da variável de ambiente
const config = () => getStore({ name: 'config', consistency: 'strong' });
export const getPasswordHash = async () =>
  (await config().get('password_hash')) || process.env.ADMIN_PASSWORD_HASH;
export const setPasswordHash = hash => config().set('password_hash', hash);

/* Sessão: token assinado. A assinatura usa o hash da senha, então trocar a senha derruba as sessões antigas */
const b64 = s => Buffer.from(s).toString('base64url');
const sign = (body, pwHash) =>
  createHmac('sha256', `${process.env.SESSION_SECRET}|${pwHash}`).update(body).digest('base64url');

export const sessionCookie = async email => {
  const body = b64(JSON.stringify({ e: email, x: Date.now() + MAX_AGE * 1000 }));
  const token = `${body}.${sign(body, await getPasswordHash())}`;
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${MAX_AGE}`;
};

export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

export const getSession = async req => {
  if (!process.env.SESSION_SECRET) return null;
  const raw = (req.headers.get('cookie') || '')
    .split(/;\s*/)
    .find(c => c.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  if (!raw) return null;
  const [body, sig] = raw.split('.');
  if (!body || !sig) return null;
  const expected = Buffer.from(sign(body, await getPasswordHash()));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const { e, x } = JSON.parse(Buffer.from(body, 'base64url').toString());
    return x > Date.now() && e === ADMIN_EMAIL() ? { email: e } : null;
  } catch {
    return null;
  }
};
