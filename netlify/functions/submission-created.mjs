import { getStore } from '@netlify/blobs';

// Campos guardados de cada formulário do site e o store onde ficam
const FORMS = {
  contato: { store: 'leads', fields: ['nome', 'whatsapp', 'perfil', 'momento', 'mensagem'] },
  vagas: { store: 'candidaturas', fields: ['vaga', 'nome', 'whatsapp', 'email', 'cidade', 'link', 'experiencia'] },
};

// Disparada pela Netlify a cada envio válido (spam já filtrado) do Netlify Forms
export default async req => {
  const { payload } = await req.json();
  const form = FORMS[payload?.form_name];
  if (!form) return new Response('ignorado');

  const d = payload.data || {};
  const createdAt = payload.created_at || new Date().toISOString();
  const item = { id: payload.id, createdAt };
  form.fields.forEach(f => { item[f] = d[f] || ''; });

  // Chave começa pela data para a listagem sair em ordem cronológica
  await getStore(form.store).setJSON(`${createdAt}_${payload.id}`, item);
  return new Response('ok');
};
