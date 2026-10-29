(() => {
  const WA_NUMBER = '5521991837456';
  const WA_TEXT = 'Olá! Vim pelo site da Revolutions e quero saber mais sobre a gestão de carreira.';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* WhatsApp: mensagem pré-preenchida em todos os links */
  document.querySelectorAll('.js-wa').forEach(a => {
    a.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_TEXT)}`;
  });

  /* Nav: fundo ao rolar + menu mobile */
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const waFloat = document.querySelector('.wa-float');
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 24);
    waFloat.classList.toggle('is-on', y > window.innerHeight * 0.6);
  };
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

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

  /* Reveal ao rolar, com escalonamento entre irmãos */
  const reveals = document.querySelectorAll('.reveal');
  reveals.forEach(el => {
    const siblings = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
    const idx = siblings.indexOf(el);
    if (idx > 0) el.style.setProperty('--delay', `${Math.min(idx, 6) * 0.08}s`);
  });
  document.querySelectorAll('.bars i').forEach((b, i) => b.style.setProperty('--d', i * 70));

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

  /* Brilho que segue o cursor nos cards de serviço */
  document.querySelectorAll('.svc').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* Hero: relógio de madrugada + conversa em loop */
  const clock = document.getElementById('clock');
  let minutes = 3 * 60 + 12;
  const tick = () => {
    minutes = (minutes + 1) % 1440;
    clock.textContent = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  };

  const body = document.getElementById('chatBody');
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
    body.appendChild(el);
    while (body.children.length > 6) body.firstElementChild.remove();
    return el;
  };

  if (reduced) {
    script.filter(s => s[0] !== 'typing').forEach(add);
  } else {
    let i = 0;
    let typingEl = null;
    const step = () => {
      if (typingEl) { typingEl.remove(); typingEl = null; }
      if (i === script.length) {
        i = 0;
        body.style.opacity = '0';
        setTimeout(() => { body.innerHTML = ''; body.style.opacity = '1'; step(); }, 600);
        return;
      }
      const el = add(script[i]);
      if (script[i][0] === 'typing') typingEl = el;
      tick();
      i++;
      setTimeout(step, i === script.length ? 3200 : 1500);
    };
    body.style.transition = 'opacity .5s';
    setTimeout(step, 900);
  }

  /* Formulário (Netlify Forms) */
  const form = document.getElementById('leadForm');
  const done = document.getElementById('formDone');
  const phone = document.getElementById('f-whats');

  phone.addEventListener('input', () => {
    const d = phone.value.replace(/\D/g, '').slice(0, 11);
    let out = d;
    if (d.length > 2) out = `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length > 7) out = `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    phone.value = out;
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Enviando…';
    const data = new FormData(form);

    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data).toString(),
      });
      if (!res.ok) throw new Error(res.status);
      done.hidden = false;
      form.reset();
    } catch {
      // Sem backend de formulário (ex.: abrindo o arquivo localmente): segue pelo WhatsApp
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
      btn.textContent = 'Quero meu diagnóstico';
    }
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
