(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  const api = async (path, opts = {}) => {
    const res = await fetch(path, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && path !== '/api/login') showLogin();
    if (!res.ok) throw Object.assign(new Error(data.error || 'Erro'), { status: res.status });
    return data;
  };

  const busy = (btn, on, text) => {
    btn.disabled = on;
    btn.querySelector('.js-label').textContent = text;
  };

  const showError = (el, msg) => {
    el.textContent = msg;
    el.hidden = !msg;
  };

  /* ---------- Login ---------- */
  const showLogin = () => {
    $('app').hidden = true;
    $('login').hidden = false;
    $('l-email').focus();
  };

  $('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    const btn = form.querySelector('button');
    busy(btn, true, 'Entrando…');
    showError($('loginError'), '');
    try {
      await api('/api/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      form.reset();
      start();
    } catch (err) {
      showError($('loginError'), err.status === 401 ? err.message : 'Não foi possível entrar agora. Tenta de novo.');
    } finally {
      busy(btn, false, 'Entrar');
    }
  });

  /* ---------- Navegação ---------- */
  const views = ['contatos', 'candidaturas', 'configuracoes'];
  const route = () => {
    const current = views.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'contatos';
    views.forEach(v => { $(`view-${v}`).hidden = v !== current; });
    document.querySelectorAll('.side__link').forEach(a => {
      const on = a.dataset.view === current;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  };
  addEventListener('hashchange', route);

  /* ---------- Contatos ---------- */
  const fmtDate = iso => {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const firstName = nome => String(nome).trim().split(/\s+/)[0];

  const waLink = (phone, text) => {
    let n = String(phone).replace(/\D/g, '');
    if (n.length === 10 || n.length === 11) n = `55${n}`;
    return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
  };

  // Só vira link o que for http(s); o resto aparece como texto
  const safeUrl = v => {
    const s = String(v).trim();
    if (/^https?:\/\//i.test(s)) return s;
    if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(s)) return `https://${s}`;
    return '';
  };

  const icon = {
    phone: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>',
    user: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/></svg>',
    mail: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5 12 13l8.5-6.5"/></svg>',
    pin: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    trash: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 12a2 2 0 0 0 2 1.8h7a2 2 0 0 0 2-1.8l1-12M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/></svg>',
    link: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/></svg>',
    wa: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.8 14.1c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-5-4.3-5.1-4.5-.2-.2-1.2-1.6-1.2-3s.8-2.2 1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.4z"/></svg>',
  };

  const card = ({ list, key, nome, tag, createdAt, meta, wa, texto }) => `
    <li class="lead" data-list="${list}" data-key="${esc(key)}">
      <div>
        <div class="lead__top">
          <span class="lead__name">${esc(nome) || 'Sem nome'}</span>
          ${tag ? `<span class="pill pill--xs pill--soft">${esc(tag)}</span>` : ''}
          <span class="lead__date">${esc(fmtDate(createdAt))}</span>
        </div>
        <div class="lead__meta">${meta.filter(Boolean).join('')}</div>
      </div>
      <div class="lead__actions">
        <a class="btn btn--sm lead__wa" href="${esc(wa)}" target="_blank" rel="noopener">${icon.wa}Chamar no WhatsApp</a>
        <button class="lead__del js-del" type="button" aria-label="Excluir ${esc(nome) || 'registro'}" title="Excluir">${icon.trash}</button>
      </div>
      ${texto ? `<p class="lead__msg">${esc(texto)}</p>` : ''}
    </li>`;

  const renderLead = l => card({
    list: 'leads',
    key: l.key,
    nome: l.nome,
    tag: l.momento,
    createdAt: l.createdAt,
    meta: [
      `<span>${icon.phone}${esc(l.whatsapp)}</span>`,
      l.perfil && `<span>${icon.user}${esc(l.perfil)}</span>`,
    ],
    wa: waLink(l.whatsapp, `Oi, ${firstName(l.nome)}! Aqui é da Revolutions. Recebemos o seu contato pelo site e queremos conhecer melhor o seu perfil. Podemos conversar?`),
    texto: l.mensagem,
  });

  const renderCandidatura = c => {
    const url = safeUrl(c.link);
    return card({
      list: 'candidaturas',
      key: c.key,
      nome: c.nome,
      tag: c.vaga,
      createdAt: c.createdAt,
      meta: [
        `<span>${icon.phone}${esc(c.whatsapp)}</span>`,
        c.email && `<span>${icon.mail}<a href="mailto:${esc(c.email)}">${esc(c.email)}</a></span>`,
        c.cidade && `<span>${icon.pin}${esc(c.cidade)}</span>`,
        c.link && `<span>${icon.link}${url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(c.link)}</a>` : esc(c.link)}</span>`,
      ],
      wa: waLink(c.whatsapp, `Oi, ${firstName(c.nome)}! Aqui é da Revolutions. Recebemos a sua candidatura para a vaga de ${c.vaga || 'nossa equipe'} e queremos conversar com você. Podemos falar agora?`),
      texto: c.experiencia,
    });
  };

  const lists = {
    leads: { url: '/api/leads', render: renderLead, one: '1 contato recebido', many: n => `${n} contatos recebidos` },
    candidaturas: { url: '/api/candidaturas', render: renderCandidatura, one: '1 candidatura recebida', many: n => `${n} candidaturas recebidas` },
  };

  const loadList = async name => {
    const l = lists[name];
    $(`${name}Error`).hidden = true;
    try {
      const { items, total } = await api(l.url);
      $(name).innerHTML = items.map(l.render).join('');
      $(`${name}Empty`).hidden = items.length > 0;
      $(`${name}Count`).textContent = total === 1 ? l.one : l.many(total);
    } catch (err) {
      if (err.status !== 401) $(`${name}Error`).hidden = false;
    }
  };

  const loadAll = async () => {
    const btns = document.querySelectorAll('.js-reload');
    btns.forEach(b => { b.disabled = true; });
    await Promise.all(Object.keys(lists).map(loadList));
    btns.forEach(b => { b.disabled = false; });
  };
  document.querySelectorAll('.js-reload').forEach(b => b.addEventListener('click', loadAll));

  /* Excluir: confirma num diálogo antes de apagar */
  const delDialog = $('delDialog');
  let pending = null;

  document.querySelectorAll('.leads').forEach(ul => ul.addEventListener('click', e => {
    const btn = e.target.closest('.js-del');
    if (!btn) return;
    const li = btn.closest('.lead');
    pending = li;
    $('delName').textContent = li.querySelector('.lead__name').textContent;
    $('delKind').textContent = li.dataset.list === 'leads' ? 'este contato' : 'esta candidatura';
    showError($('delError'), '');
    delDialog.showModal();
  }));

  $('delCancel').addEventListener('click', () => delDialog.close());
  delDialog.addEventListener('click', e => { if (e.target === delDialog) delDialog.close(); });

  $('delConfirm').addEventListener('click', async () => {
    if (!pending) return;
    const btn = $('delConfirm');
    const { list, key } = pending.dataset;
    busy(btn, true, 'Excluindo…');
    try {
      await api(lists[list].url, { method: 'DELETE', body: JSON.stringify({ key }) });
      delDialog.close();
      await loadList(list);
    } catch (err) {
      if (err.status === 404) {
        delDialog.close();
        await loadList(list);
      } else if (err.status !== 401) {
        showError($('delError'), 'Não foi possível excluir agora. Tenta de novo.');
      }
    } finally {
      busy(btn, false, 'Excluir');
    }
  });

  /* ---------- Configurações ---------- */
  $('logout').addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
    location.hash = '';
    showLogin();
  });

  $('passForm').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    $('passOk').hidden = true;
    showError($('passError'), '');
    if (!form.reportValidity()) return;
    if (data.nova !== data.confirmar) return showError($('passError'), 'A confirmação não bate com a nova senha.');

    const btn = form.querySelector('button');
    busy(btn, true, 'Salvando…');
    try {
      await api('/api/password', { method: 'POST', body: JSON.stringify({ atual: data.atual, nova: data.nova }) });
      form.reset();
      $('passOk').hidden = false;
    } catch (err) {
      if (err.status !== 401) showError($('passError'), err.message);
    } finally {
      busy(btn, false, 'Salvar nova senha');
    }
  });

  /* ---------- Início ---------- */
  const start = async () => {
    try {
      const me = await api('/api/me');
      $('meEmail').textContent = me.email;
      $('meNotify').textContent = me.notifyEmail;
      $('login').hidden = true;
      $('app').hidden = false;
      route();
      loadAll();
    } catch {
      showLogin();
    }
  };
  start();
})();
