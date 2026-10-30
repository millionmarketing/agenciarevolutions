import { getStore } from '@netlify/blobs';
import { getSession, json } from './auth.mjs';

const LIMIT = 500;

// GET lista os registros de um store do Blobs, do mais novo para o mais antigo; DELETE remove um pela chave
export const listHandler = name => async req => {
  if (!(await getSession(req))) return json({ error: 'Não autorizado' }, 401);

  const store = getStore({ name, consistency: 'strong' });

  if (req.method === 'DELETE') {
    const { key } = await req.json().catch(() => ({}));
    if (typeof key !== 'string' || !key || !(await store.getMetadata(key))) {
      return json({ error: 'Registro não encontrado.' }, 404);
    }
    await store.delete(key);
    return json({ ok: true });
  }

  const { blobs } = await store.list();
  const keys = blobs.map(b => b.key).sort().reverse().slice(0, LIMIT);
  const items = (await Promise.all(keys.map(async key => {
    const data = await store.get(key, { type: 'json' });
    return data && { ...data, key };
  }))).filter(Boolean);

  return json({ items, total: blobs.length });
};
