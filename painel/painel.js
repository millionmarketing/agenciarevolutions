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

  // "agora", "há 5 min", "há 3 h", "ontem" ou a data
  const ago = iso => {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    const min = Math.round((Date.now() - d) / 60000);
    if (min < 1) return 'agora';
    if (min < 60) return `há ${min} min`;
    if (min < 60 * 24) return `há ${Math.round(min / 60)} h`;
    const yest = new Date(); yest.setDate(yest.getDate() - 1);
    if (d.toDateString() === yest.toDateString()) return 'ontem';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  };
  const clock = iso => {
    const d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', ' ·');
  };
  const isNew = iso => Date.now() - new Date(iso) < 24 * 60 * 60 * 1000;

  const initials = nome => {
    const parts = String(nome).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    return ((parts[0][0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  };

  const chevron = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

  const row = ({ list, key, nome, sub, createdAt, cells, wa, detail }) => {
    const fresh = isNew(createdAt);
    return `
    <li class="lead${detail ? ' lead--expandable' : ''}" data-list="${list}" data-key="${esc(key)}">
      <div class="lead__row">
        <div class="cell cell--who">
          <span class="avatar${fresh ? ' is-new' : ''}" aria-hidden="true" title="${fresh ? 'Novo, chegou nas últimas 24 h' : ''}">${esc(initials(nome))}</span>
          <span class="who">
            <span class="lead__name">${esc(nome) || 'Sem nome'}</span>
            ${sub ? `<span class="lead__sub">${sub}</span>` : ''}
          </span>
        </div>
        ${cells.join('')}
        <div class="cell cell--when">
          <span class="time${fresh ? ' is-new' : ''}" title="${esc(fmtDate(createdAt))}"><b>${esc(ago(createdAt))}</b><small>${esc(clock(createdAt))}</small></span>
        </div>
        <div class="cell cell--actions">
          <a class="lead__wa" href="${esc(wa)}" target="_blank" rel="noopener">${icon.wa}WhatsApp</a>
          <button class="icon-btn lead__toggle js-toggle" type="button" aria-expanded="false" aria-label="Ver detalhes" title="Ver detalhes"${detail ? '' : ' disabled'}>${chevron}</button>
          <button class="icon-btn lead__del js-del" type="button" aria-label="Excluir ${esc(nome) || 'registro'}" title="Excluir">${icon.trash}</button>
        </div>
      </div>
      ${detail ? `<div class="lead__detail" hidden>${detail}</div>` : ''}
    </li>`;
  };

  const renderLead = l => row({
    list: 'leads',
    key: l.key,
    nome: l.nome,
    sub: l.perfil ? esc(l.perfil) : '',
    createdAt: l.createdAt,
    cells: [
      `<div class="cell cell--opt cell--a"><span class="mono">${esc(l.whatsapp)}</span></div>`,
      `<div class="cell cell--opt cell--b${l.momento ? '' : ' is-empty'}">${l.momento ? `<span class="pill pill--xs pill--soft">${esc(l.momento)}</span>` : '<span class="muted">—</span>'}</div>`,
      `<div class="cell cell--opt cell--c cell--msg${l.mensagem ? '' : ' is-empty'}">${l.mensagem ? `<span class="preview">${esc(l.mensagem)}</span>` : '<span class="muted">Sem mensagem</span>'}</div>`,
    ],
    wa: waLink(l.whatsapp, `Oi, ${firstName(l.nome)}! Aqui é da Revolutions. Recebemos o seu contato pelo site e queremos conhecer melhor o seu perfil. Podemos conversar?`),
    detail: l.mensagem ? `<h4>Mensagem</h4><p class="lead__msg">${esc(l.mensagem)}</p>` : '',
  });

  const renderCandidatura = c => {
    const url = safeUrl(c.link);
    const facts = [
      c.cidade && `<span>${icon.pin}${esc(c.cidade)}</span>`,
      c.link && `<span>${icon.link}${url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(c.link)}</a>` : esc(c.link)}</span>`,
    ].filter(Boolean).join('');
    return row({
      list: 'candidaturas',
      key: c.key,
      nome: c.nome,
      sub: c.cidade ? esc(c.cidade) : '',
      createdAt: c.createdAt,
      cells: [
        `<div class="cell cell--opt cell--b">${c.vaga ? `<span class="pill pill--xs pill--soft">${esc(c.vaga)}</span>` : '<span class="muted">—</span>'}</div>`,
        `<div class="cell cell--opt cell--a"><span class="stack"><span class="mono">${esc(c.whatsapp)}</span>${c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : ''}</span></div>`,
      ],
      wa: waLink(c.whatsapp, `Oi, ${firstName(c.nome)}! Aqui é da Revolutions. Recebemos a sua candidatura para a vaga de ${c.vaga || 'nossa equipe'} e queremos conversar com você. Podemos falar agora?`),
      detail: (c.experiencia ? `<h4>Experiência</h4><p class="lead__msg">${esc(c.experiencia)}</p>` : '') + (facts ? `<div class="lead__facts">${facts}</div>` : ''),
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
      $(`${name}Table`).hidden = items.length === 0;
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

  /* Linha expansível: clique na linha ou na seta mostra a mensagem completa */
  const toggleRow = li => {
    const detail = li.querySelector('.lead__detail');
    if (!detail) return;
    const open = detail.hidden;
    detail.hidden = !open;
    li.classList.toggle('is-open', open);
    li.querySelector('.js-toggle').setAttribute('aria-expanded', String(open));
  };

  document.querySelectorAll('.leads').forEach(ul => ul.addEventListener('click', e => {
    if (!e.target.closest('a, .js-del, .lead__detail') && e.target.closest('.lead__row')) {
      toggleRow(e.target.closest('.lead'));
      return;
    }
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
