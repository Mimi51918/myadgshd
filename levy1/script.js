const $ = s => document.querySelector(s);
const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const D = window.CONFIG;
const root = $('#root');
let on = false, muted = false, aud, ac, master, timer, idx = 0, t0 = 0;

const el = (t, c, x) => {
  const e = document.createElement(t);
  if (c) e.className = c;
  if (x) e.textContent = x;
  return e;
};

const SKEL = `
<section class="pg" id="p1"><div class="bg"></div><div class="shade"></div><div id="bks"></div><div id="hrs"></div>
  <div class="c1"><p class="kick">a little letter for you</p><h1 id="greet"></h1><div id="words"></div>
  <button class="btn" id="open" type="button">Open my letter ♥</button></div></section>
<section class="pg" id="p2"><div id="bk2"></div><svg class="wheel" id="wheel" viewBox="0 0 200 215" aria-hidden="true"></svg>
  <div class="flags" id="flags"></div><div class="lite"></div>
  <article class="paper"><p class="eb">✦ you’re invited ✦</p><h2>A carnival date with me</h2>
    <div id="letter"></div><p class="sign" id="sign"></p><div class="det" id="det"></div></article>
  <div class="ask" id="ask"><p>Will you come with me?</p><div class="row">
    <button class="btn" id="yes" type="button">Yes, I’ll go with you ♥</button>
    <button class="btn ghost" id="no" type="button">Let me think…</button></div></div>
  <div class="ask" id="done" hidden><h3>It’s a date! 🎡</h3><p>Best answer ever. I can’t wait to see you there.</p></div>
</section>`;

// Soft glowing lights
function bokeh(box, n) {
  for (let i = 0; i < n; i++) {
    const b = el('i', 'bk'), s = rnd(10, 42);
    b.style.cssText = `width:${s}px;height:${s}px;left:${rnd(0, 95)}%;top:${rnd(5, 90)}%;--t:${rnd(3, 7)}s`;
    box.appendChild(b);
  }
}

/* ---------- Build the two pages from config.js ---------- */
function render() {
  root.innerHTML = SKEL;

  // Page 1
  $('#greet').textContent = D.greet;
  $('#words').replaceChildren(...D.words.map((t, i) => {
    const p = el('p', '', t);
    p.style.setProperty('--i', i);
    return p;
  }));
  $('#open').style.animationDelay = (D.words.length * 1.3 + 1.4) + 's';
  if (D.photo) $('.bg').style.backgroundImage = 'url("' + D.photo + '")';
  bokeh($('#bks'), 16);
  for (let i = 0; i < 12; i++) { // little hearts floating up
    const h = el('span', 'hr', '♥');
    h.style.cssText = `left:${rnd(2, 96)}%;font-size:${rnd(11, 22)}px;--t:${rnd(9, 16)}s;--d:${rnd(0, 10)}s`;
    $('#hrs').appendChild(h);
  }

  // Page 2
  bokeh($('#bk2'), 12);
  const FL = ['#ffb3c6', '#ffd9c4', '#fff4ea', '#c9b8ff', '#ffd9a0'];
  $('#flags').replaceChildren(...Array.from({ length: 40 }, (_, i) => {
    const f = el('i');
    f.style.setProperty('--c', FL[i % FL.length]);
    return f;
  }));
  $('#letter').replaceChildren(...D.letter.map(t => el('p', '', t)));
  $('#sign').textContent = D.sign;
  const det = $('#det');
  const items = [['Date', D.date], ['Time', D.time], ['Where', D.place]].filter(x => x[1]);
  if (items.length) {
    det.replaceChildren(...items.map(([k, v]) => {
      const d = el('div');
      d.append(el('small', '', k), el('b', '', v));
      return d;
    }));
  } else {
    det.className = 'det soon';
    det.textContent = 'Date, time and place: coming from me very soon ♥';
  }

  // Ferris wheel in the background
  let w = '<path d="M100 100L62 212M100 100L138 212" stroke="currentColor" stroke-width="3" fill="none"/><circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" stroke-width="2"/>';
  for (let i = 0; i < 12; i++) {
    const a = i / 6 * Math.PI, x = 100 + 80 * Math.cos(a), y = 100 + 80 * Math.sin(a);
    w += `<line x1="100" y1="100" x2="${x}" y2="${y}" stroke="currentColor"/><circle cx="${x}" cy="${y}" r="6" fill="currentColor"/>`;
  }
  $('#wheel').innerHTML = w;

  // Open the letter (also starts the music, because browsers need a tap first)
  $('#open').onclick = () => {
    if (!on && !muted) mOn();
    document.body.classList.add('opened');
    $('#p2').scrollTop = 0;
    burst(innerWidth / 2, innerHeight * .45, 60);
  };

  // Yes!
  $('#yes').onclick = () => {
    $('#ask').hidden = true;
    const d = $('#done');
    d.hidden = false;
    if (D.phone) {
      const a = el('a', 'btn', 'Send my yes ♥');
      a.href = 'sms:' + D.phone.replace(/[^+\d]/g, '') + '?&body=' + encodeURIComponent('Yes! I’ll go to the carnival with you ♥');
      d.appendChild(a);
    }
    d.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    for (let k = 0; k < 8; k++) {
      setTimeout(() => burst(rnd(.15, .85) * innerWidth, rnd(.15, .55) * innerHeight, 70), k * 320);
    }
  };

  // The "think about it" button runs away a few times, then gives in
  const NO = ['Let me think…', 'Hmm, wait…', 'Are you sure?', 'Last chance…', 'Okay, yes!'];
  const no = $('#no');
  let n = 0;
  const dodge = () => {
    if (n >= 4) return;
    n++;
    no.textContent = NO[n];
    no.style.transform = `translate(${rnd(-80, 80)}px,${rnd(-40, 40)}px)`;
  };
  no.onpointerenter = e => { if (e.pointerType === 'mouse') dodge(); };
  no.onclick = () => { n >= 4 ? $('#yes').click() : dodge(); };
}

/* ---------- Fireworks (sparkles and little hearts) ---------- */
const cv = el('canvas');
cv.id = 'fx';
cv.setAttribute('aria-hidden', 'true');
const ctx = cv.getContext('2d');
const COLS = ['#ffd9a0', '#ffb3c6', '#fff4ea', '#c9b8ff', '#ffd9c4'];
let W, H, ps = [], raf = 0, last = 0;

function fit() {
  const d = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  cv.width = W * d; cv.height = H * d;
  ctx.setTransform(d, 0, 0, d, 0, 0);
}
function burst(x, y, n) {
  if (reduce) return;
  for (let i = 0; i < n; i++) {
    const a = rnd(0, TAU), s = rnd(60, 260);
    ps.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, l: rnd(.8, 1.5), c: COLS[(Math.random() * 5) | 0], h: Math.random() < .45 });
  }
  if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
}
function loop(t) {
  const dt = Math.min(.05, (t - last) / 1000);
  last = t;
  ctx.clearRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i];
    p.l -= dt;
    if (p.l <= 0) { ps.splice(i, 1); continue; }
    const f = Math.exp(-1.8 * dt);
    p.vx *= f; p.vy = p.vy * f + 200 * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    ctx.globalAlpha = Math.min(1, p.l * 1.6);
    ctx.fillStyle = p.c;
    if (p.h) { ctx.font = '15px sans-serif'; ctx.fillText('♥', p.x, p.y); }
    else { ctx.beginPath(); ctx.arc(p.x, p.y, 2.4, 0, TAU); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
  raf = ps.length ? requestAnimationFrame(loop) : 0;
}

/* ---------- Music: your own song if set, otherwise a soft built-in romantic loop ---------- */
const CH = [[48, [60, 64, 67, 72]], [43, [59, 62, 67, 71]], [45, [60, 64, 69, 72]], [41, [60, 65, 69, 72]]];
const fq = m => 440 * Math.pow(2, (m - 69) / 12);

function tone(m, t, d, v, ty, at) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = ty; o.frequency.value = fq(m);
  g.gain.setValueAtTime(.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + (at || .01));
  g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + d + .05);
}
function sched() {
  while (t0 < ac.currentTime + .4) {
    const s = idx % 32, [r, tr] = CH[s >> 3], e = s % 8;
    if (e === 0) { // soft pad and low note on each chord change
      tone(r, t0, 3.6, .2, 'sine', .05);
      tr.slice(0, 3).forEach(m => tone(m - 12, t0, 3.8, .035, 'sine', .9));
    }
    tone(tr[[0, 1, 2, 1, 3, 2, 1, 2][e]], t0, 1.1, .06, 'triangle'); // gentle arpeggio
    if (e % 4 === 2 && Math.random() < .55) tone(tr[(Math.random() * 4) | 0] + 12, t0, 1.6, .05, 'sine', .02); // little bells
    t0 += .4286; idx++;
  }
}
function gen() {
  if (!ac) {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain();
    const cvb = ac.createConvolver(), n = ac.sampleRate * 2.6, b = ac.createBuffer(2, n, ac.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.5);
    }
    cvb.buffer = b;
    const wg = ac.createGain(); wg.gain.value = .5;
    cvb.connect(wg); wg.connect(ac.destination);
    master.connect(ac.destination); master.connect(cvb);
  }
  ac.resume();
  master.gain.cancelScheduledValues(ac.currentTime);
  master.gain.setTargetAtTime(.7, ac.currentTime, .3);
  idx = 0; t0 = ac.currentTime + .1;
  clearInterval(timer);
  timer = setInterval(sched, 100);
}

const mus = el('button', '', '♪ Music off');
mus.id = 'mus';
mus.type = 'button';

function mOn() {
  if (D.song) {
    if (!aud) { aud = new Audio(D.song.url); aud.loop = true; aud.volume = .8; }
    aud.play().catch(() => {});
  } else gen();
  on = true;
  mus.textContent = '♪ Music on';
}
function mOff() {
  if (aud) aud.pause();
  if (ac) { clearInterval(timer); master.gain.setTargetAtTime(0, ac.currentTime, .1); }
  on = false;
  mus.textContent = '♪ Music off';
}
mus.onclick = () => {
  if (on) { mOff(); muted = true; } else { mOn(); muted = false; }
};
document.addEventListener('visibilitychange', () => { // pause when you leave the tab
  if (!on) return;
  if (document.hidden) { aud && aud.pause(); ac && ac.suspend(); }
  else { aud && aud.play().catch(() => {}); ac && ac.resume(); }
});

/* ---------- Start ---------- */
document.body.append(cv, mus);
fit();
addEventListener('resize', fit);
render();