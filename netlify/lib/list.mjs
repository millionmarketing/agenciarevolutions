import { getStore } from '@netlify/blobs';
import { getSession, json } from './auth.mjs';

const LIMIT = 500;

// Lista os registros de um store do Blobs, do mais novo para o mais antigo
export const listHandler = name => async req => {
  if (!(await getSession(req))) return json({ error: 'Não autorizado' }, 401);

  const store = getStore({ name, consistency: 'strong' });
  const { blobs } = await store.list();
  const keys = blobs.map(b => b.key).sort().reverse().slice(0, LIMIT);
  const items = (await Promise.all(keys.map(k => store.get(k, { type: 'json' })))).filter(Boolean);

  return json({ items, total: blobs.length });
};
