// Headline typer, hero wave, mobile menu. The form itself is js/main.js.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Headline: cycle through business types (static "brand" when motion is reduced).
const typer = document.getElementById('typer');
const WORDS = ['brand', 'clinic', 'café', 'law firm', 'hotel'];
if (typer && !reduce) {
  const text = document.createTextNode(WORDS[0]);
  const cursor = document.createElement('span');
  cursor.className = 'typer-cursor';
  cursor.hidden = true;
  typer.replaceChildren(text, cursor);
  let w = 0, n = WORDS[0].length, del = false;
  const tick = () => {
    const word = WORDS[w];
    if (!del && n === word.length) { del = true; cursor.hidden = false; return setTimeout(tick, 2400); }
    if (del && n === 0) { w = (w + 1) % WORDS.length; del = false; return setTimeout(tick, 260); }
    n += del ? -1 : 1;
    text.data = WORDS[w].slice(0, n);
    cursor.hidden = !del && n === WORDS[w].length;
    setTimeout(tick, del ? 34 : 70);
  };
  setTimeout(tick, 2400);
}


// Hero wave: 36 drifting lines on a canvas.
const cv = document.getElementById('wave');
if (cv) {
  const ctx = cv.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const N = 36;
  const stops = [[59, 130, 246], [125, 211, 252], [167, 139, 250], [96, 165, 250], [11, 31, 68]];
  const col = (t) => {
    const x = t * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(x)), f = x - i;
    const a = stops[i], b = stops[i + 1];
    const c = [0, 1, 2].map((k) => Math.round(a[k] + (b[k] - a[k]) * f));
    return `rgba(${c[0]},${c[1]},${c[2]},${t > 0.85 ? 0.28 : 0.5})`;
  };
  let w = 0, h = 0, raf = 0;
  const draw = (time) => {
    const t = time * 0.00016;
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1;
    const mid = h * 0.5, amp = h * 0.3, steps = Math.max(90, Math.round(w / 7));
    for (let i = 0; i < N; i++) {
      const k = i / (N - 1) - 0.5;
      ctx.strokeStyle = col(i / (N - 1));
      ctx.beginPath();
      for (let s = 0; s <= steps; s++) {
        const u = s / steps, x = u * w;
        const spread = Math.sin(u * Math.PI * 2.3 + t * 1.4) * 0.85 + Math.sin(u * Math.PI * 5.2 - t * 0.9) * 0.3;
        const y = mid + Math.sin(u * Math.PI * 3.1 + t) * amp * 0.5 + Math.sin(u * Math.PI * 1.25 - t * 0.6) * amp * 0.38 + k * spread * h * 0.46;
        if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    if (!reduce) raf = requestAnimationFrame(draw);
  };
  const resize = () => {
    const r = cv.getBoundingClientRect();
    w = r.width; h = r.height;
    cv.width = Math.max(1, Math.round(w * dpr)); cv.height = Math.max(1, Math.round(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (reduce) draw(4000);
  };
  resize();
  new ResizeObserver(resize).observe(cv);
  if (!reduce) raf = requestAnimationFrame(draw);
}

// Mobile menu.
const burger = document.getElementById('burger');
const menu = document.getElementById('mmenu');
function setMenu(open) { burger.setAttribute('aria-expanded', String(open)); menu.hidden = !open; }
burger.addEventListener('click', () => setMenu(menu.hidden));
menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

// "Edit details" on the success card returns to the form.
document.getElementById('edit-details').addEventListener('click', () => {
  document.getElementById('snapshot-success').hidden = true;
  const form = document.getElementById('snapshot-form');
  form.hidden = false;
  form.elements.businessName.focus();
});

// Features that are not live yet (Log in, nav items) open one shared "coming soon" dialog.
const soon = document.getElementById('login-dialog');
const soonTitle = document.getElementById('login-title');
const soonText = document.getElementById('login-text');
const LOGIN = ['Log in', 'Customer accounts aren’t available yet. In the meantime, request your free AI Visibility Snapshot and we’ll email you the report.'];
function openSoon(title, text) {
  soonTitle.textContent = title;
  soonText.textContent = text;
  document.getElementById('burger')?.setAttribute('aria-expanded', 'false');
  document.getElementById('mmenu')?.setAttribute('hidden', '');
  soon.showModal();
}
document.getElementById('login-btn')?.addEventListener('click', () => openSoon(...LOGIN));
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-soon]');
  if (el) openSoon(...el.dataset.soon.split('|'));
});
soon?.addEventListener('click', (e) => { if (e.target === soon || e.target.closest('.login-go')) soon.close(); });

// Scroll reveal: blocks fade up once as they enter the view (skipped for reduced motion).
if (!reduce && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('js');
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }, { threshold: 0.15 });
  document.querySelectorAll('.s52, .s57, .s59, .s96, .s123, .s140').forEach((el, i) => {
    el.classList.add('rv');
    io.observe(el);
  });
}

// Header gets a stronger shadow once the page scrolls.
const bar = document.querySelector('.s3');
addEventListener('scroll', () => bar.classList.toggle('scrolled', scrollY > 8), { passive: true });

// Any "get a snapshot" link scrolls to the form and puts the cursor in the first field.
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href="#snapshot"]');
  if (!link || link.classList.contains('s4')) return; // the logo just goes home
  e.preventDefault();
  scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  const field = document.querySelector('#snapshot-form [name="businessName"]');
  if (field && !field.form.hidden) setTimeout(() => field.focus({ preventScroll: true }), reduce ? 0 : 450);
});
