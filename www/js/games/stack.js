export const stack = {
  id: 'stack',
  name: 'Kule Yap',
  emoji: '🏗️',
  howTo: 'Bloğu tam üstüne bırakmak için dokun!',

  init(s) {
    const w0 = Math.min(s.w * 0.6, 260);
    s.G = {
      placed: [{ x: (s.w - w0) / 2, w: w0 }],
      cur: { x: 0, w: w0, dir: 1 },
      speed: 220,
      blockH: 34,
    };
  },

  tap(s) {
    const g = s.G;
    const top = g.placed[g.placed.length - 1];
    const left = Math.max(g.cur.x, top.x);
    const right = Math.min(g.cur.x + g.cur.w, top.x + top.w);
    const overlap = right - left;
    if (overlap <= 6) return s.end();
    g.placed.push({ x: left, w: overlap });
    if (g.placed.length > 12) g.placed.shift();
    g.cur = { x: 0, w: overlap, dir: 1 };
    g.speed += 12;
    s.addScore();
  },

  update(s, dt) {
    const g = s.G;
    g.cur.x += g.speed * g.cur.dir * dt;
    if (g.cur.x + g.cur.w > s.w) { g.cur.x = s.w - g.cur.w; g.cur.dir = -1; }
    if (g.cur.x < 0) { g.cur.x = 0; g.cur.dir = 1; }
  },

  draw(s, ctx) {
    const g = s.G;
    const bg = ctx.createLinearGradient(0, 0, 0, s.h);
    bg.addColorStop(0, '#1a0f2e');
    bg.addColorStop(1, '#0f2027');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, s.w, s.h);

    const baseY = s.h - 90;
    const n = g.placed.length;
    for (let i = 0; i < n; i++) {
      const b = g.placed[i];
      const hue = (200 + (s.score - (n - 1 - i)) * 14) % 360;
      ctx.fillStyle = `hsl(${hue} 75% 55%)`;
      ctx.fillRect(b.x, baseY - i * g.blockH, b.w, g.blockH - 3);
    }
    // hareketli blok
    const hue = (200 + (s.score + 1) * 14) % 360;
    ctx.fillStyle = `hsl(${hue} 85% 65%)`;
    ctx.fillRect(g.cur.x, baseY - n * g.blockH, g.cur.w, g.blockH - 3);
  },
};
