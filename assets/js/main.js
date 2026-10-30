(() => {
  const WA_NUMBER = '5521991837456';
  const WA_TEXT = 'Olá! Vim pelo site da Revolutions e quero saber mais sobre a gestão de carreira.';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = id => document.getElementById(id);

  /* WhatsApp: mensagem pré-preenchida em todos os links */
  document.querySelectorAll('.js-wa').forEach(a => {
    a.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_TEXT)}`;
  });

  /* Nav: fundo ao rolar, progresso de leitura e CTA fixo no celular */
  const nav = $('nav');
  const toggle = $('navToggle');
  const progress = $('navProgress');
  const sticky = $('stickyCta');
  const hero = $('topo');
  const contact = $('contato');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle('is-scrolled', y > 24);
    progress?.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    // CTA fixo: aparece depois do hero e some quando o CTA final está na tela
    if (sticky && hero && contact) {
      const contactTop = contact.getBoundingClientRect().top;
      sticky.classList.toggle('is-on', y > hero.offsetHeight * 0.7 && contactTop > innerHeight * 0.85);
    }
  };
  onScroll();
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });

  const closeMenu = () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menu');
  };
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  });
  document.querySelectorAll('#menu a').forEach(a => a.addEventListener('click', closeMenu));
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  /* Menu: destaca a seção que está na tela */
  const links = new Map([...document.querySelectorAll('#menu a[href^="#"]:not(.btn)')].map(a => [a.getAttribute('href').slice(1), a]));
  if ('IntersectionObserver' in window && links.size) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        links.forEach(a => a.classList.remove('is-active'));
        links.get(e.target.id)?.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach((_, id) => { const el = $(id); if (el) spy.observe(el); });
  }

  /* Reveal ao rolar, com escalonamento entre irmãos */
  const reveals = document.querySelectorAll('.reveal');
  reveals.forEach(el => {
    const siblings = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
    const idx = siblings.indexOf(el);
    if (idx > 0) el.style.setProperty('--delay', `${Math.min(idx, 6) * 0.08}s`);
  });

  /* Primeira dobra entra no carregamento, sem depender da rolagem */
  requestAnimationFrame(() => document.querySelectorAll('.hero .reveal, .page-hero .reveal').forEach(el => el.classList.add('is-visible')));

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-visible'));
  }

  /* Brilho que segue o cursor nos cards (só com mouse) */
  if (matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.svc').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* Chat 24h: conversa em loop, pausada quando o card sai da tela */
  const chatBody = $('chatBody');
  if (chatBody) {
    const clock = $('chatClock');
    let minutes = 3 * 60 + 12;
    const tick = (step = 1) => {
      minutes = (minutes + step) % 1440;
      clock.textContent = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    };
    tick(0);

    const script = [
      ['sys', 'Nova assinante · agora'],
      ['in', 'Oi! Acabei de assinar'],
      ['out', 'Que bom te ver aqui! Separei uma surpresa de boas-vindas pra você'],
      ['in', 'Quero o pacote completo'],
      ['typing'],
      ['out', 'Feito. Enviando agora'],
      ['sys', 'Venda concluída · <b>pacote premium</b>'],
    ];
    const add = ([type, text]) => {
      const el = document.createElement('div');
      if (type === 'typing') {
        el.className = 'msg msg--in typing';
        el.innerHTML = '<i></i><i></i><i></i>';
      } else {
        el.className = `msg msg--${type}`;
        el.innerHTML = text;
      }
      chatBody.appendChild(el);
      while (chatBody.children.length > 6) chatBody.firstElementChild.remove();
      return el;
    };

    if (reduced) {
      script.filter(m => m[0] !== 'typing').forEach(add);
    } else {
      let i = 0;
      let typingEl = null;
      let timer = null;
      let running = false;
      const step = () => {
        if (!running) return;
        if (typingEl) { typingEl.remove(); typingEl = null; }
        if (i === script.length) {
          // Fim da conversa: some, avança o relógio e recomeça em outro horário
          i = 0;
          chatBody.style.opacity = '0';
          timer = setTimeout(() => { chatBody.innerHTML = ''; chatBody.style.opacity = '1'; tick(197); step(); }, 600);
          return;
        }
        const el = add(script[i]);
        if (script[i][0] === 'typing') typingEl = el;
        tick();
        i++;
        timer = setTimeout(step, i === script.length ? 3200 : 1500);
      };
      new IntersectionObserver(([e]) => {
        running = e.isIntersecting;
        clearTimeout(timer);
        if (running) timer = setTimeout(step, 500);
      }, { threshold: 0.3 }).observe(chatBody);
    }
  }

  /* FAQ: abre com animação e mantém uma pergunta aberta por vez */
  const faqs = [...document.querySelectorAll('.faq__list details')];
  const setOpen = (d, open) => {
    const body = d.querySelector('.faq__body');
    if (reduced) { d.open = open; return; }
    if (open) d.open = true;
    const from = open ? 0 : body.scrollHeight;
    const to = open ? body.scrollHeight : 0;
    body.style.height = `${from}px`;
    requestAnimationFrame(() => requestAnimationFrame(() => { body.style.height = `${to}px`; }));
    clearTimeout(d._t);
    d._t = setTimeout(() => {
      body.style.height = '';
      if (!open) d.open = false;
    }, 380);
  };
  faqs.forEach(d => {
    const summary = d.querySelector('summary');
    const body = document.createElement('div');
    body.className = 'faq__body';
    while (summary.nextSibling) body.appendChild(summary.nextSibling);
    d.appendChild(body);
    summary.addEventListener('click', e => {
      e.preventDefault();
      const willOpen = !d.open;
      if (willOpen) faqs.filter(o => o !== d && o.open).forEach(o => setOpen(o, false));
      setOpen(d, willOpen);
    });
  });

  /* Máscara de telefone */
  document.querySelectorAll('.js-phone').forEach(phone => {
    phone.addEventListener('input', () => {
      const d = phone.value.replace(/\D/g, '').slice(0, 11);
      let out = d;
      if (d.length > 2) out = `(${d.slice(0, 2)}) ${d.slice(2)}`;
      if (d.length > 7) out = `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
      phone.value = out;
    });
  });

  const postForm = form => fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(new FormData(form)).toString(),
  }).then(res => { if (!res.ok) throw new Error(res.status); });

  /* Popup + formulário de contato (Netlify Forms) */
  const modal = $('leadModal');
  const form = $('leadForm');
  const done = $('formDone');
  if (modal && form) {
    const openModal = e => {
      e.preventDefault();
      closeMenu();
      done.hidden = true;
      modal.showModal();
      document.body.classList.add('modal-open');
      sticky?.classList.remove('is-on');
      if (matchMedia('(hover: hover)').matches) $('f-nome').focus();
    };
    document.querySelectorAll('.js-modal').forEach(a => a.addEventListener('click', openModal));
    modal.querySelector('.modal__close').addEventListener('click', () => modal.close());
    modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });
    modal.addEventListener('close', () => document.body.classList.remove('modal-open'));

    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Enviando…';
      const data = new FormData(form);

      try {
        await postForm(form);
        done.hidden = false;
        form.reset();
      } catch {
        // Sem backend de formulário: segue pelo WhatsApp
        const msg = [
          'Olá! Vim pelo site da Revolutions.',
          `Nome: ${data.get('nome')}`,
          `WhatsApp: ${data.get('whatsapp')}`,
          data.get('perfil') && `Perfil: ${data.get('perfil')}`,
          `Momento: ${data.get('momento')}`,
          data.get('mensagem') && `Mensagem: ${data.get('mensagem')}`,
        ].filter(Boolean).join('\n');
        window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
        done.hidden = false;
      } finally {
        btn.disabled = false;
        btn.textContent = 'Analisar meu perfil';
      }
    });
  }

  /* Formulário de vagas (separado do WhatsApp comercial) */
  const jobForm = $('jobForm');
  if (jobForm) {
    const jobDone = $('jobDone');
    const jobError = $('jobError');
    jobForm.addEventListener('submit', async e => {
      e.preventDefault();
      if (!jobForm.reportValidity()) return;
      const btn = jobForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Enviando…';
      jobError.hidden = true;
      try {
        await postForm(jobForm);
        jobDone.hidden = false;
        jobForm.reset();
      } catch {
        jobError.hidden = false;
      } finally {
        btn.disabled = false;
        btn.textContent = 'Enviar candidatura';
      }
    });
  }

  const year = $('year');
  if (year) year.textContent = new Date().getFullYear();
})();
