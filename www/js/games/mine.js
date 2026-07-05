// Minecraft tarzı madencilik: blokları kaz, elmas topla, TNT'den kaç
const TYPES = [
  { id: 'dirt', hp: 1, pts: 0, weight: 30 },
  { id: 'stone', hp: 2, pts: 1, weight: 35 },
  { id: 'diamond', hp: 1, pts: 5, weight: 12 },
  { id: 'gold', hp: 1, pts: 3, weight: 13 },
  { id: 'tnt', hp: 1, pts: 0, weight: 10 },
];

function randType() {
  const total = TYPES.reduce((a, t) => a + t.weight, 0);
  let r = Math.random() * total;
  for (const t of TYPES) { r -= t.weight; if (r <= 0) return t; }
  return TYPES[0];
}

function newCell() {
  const t = randType();
  // her blok için sabit benek deseni (titremesin diye baştan üret)
  const specks = Array.from({ length: 8 }, () => [Math.random(), Math.random()]);
  return { type: t, hp: t.hp, specks };
}

export const mine = {
  id: 'mine',
  name: 'Maden Kaz',
  emoji: '⛏️',
  howTo: 'Blokları kaz! Elmas +5, altın +3, taş +1. TNT\'ye dokunursan patlar! Süre: 30 sn',

  init(s) {
    s.G = {
      cols: 4, rows: 5,
      grid: Array.from({ length: 20 }, newCell),
      time: 30,
    };
  },

  cellRect(s, i) {
    const g = s.G;
    const size = Math.min(s.w - 24, s.h * 0.62);
    const cell = size / g.cols;
    const ox = (s.w - size) / 2;
    const oy = s.h * 0.18;
    return { x: ox + (i % g.cols) * cell, y: oy + Math.floor(i / g.cols) * cell, cell };
  },

  tap(s, x, y) {
    const g = s.G;
    for (let i = 0; i < g.grid.length; i++) {
      const r = this.cellRect(s, i);
      if (x >= r.x && x < r.x + r.cell && y >= r.y && y < r.y + r.cell) {
        const c = g.grid[i];
        if (c.type.id === 'tnt') return s.end();
        c.hp -= 1;
        if (c.hp <= 0) {
          if (c.type.pts) s.addScore(c.type.pts);
          g.grid[i] = newCell();
        }
        return;
      }
    }
  },

  update(s, dt) {
    s.G.time -= dt;
    if (s.G.time <= 0) s.end();
  },

  draw(s, ctx) {
    const g = s.G;
    ctx.fillStyle = '#2a2118';
    ctx.fillRect(0, 0, s.w, s.h);

    for (let i = 0; i < g.grid.length; i++) {
      const r = this.cellRect(s, i);
      const c = g.grid[i];
      const pad = 3;
      const bx = r.x + pad, by = r.y + pad, bs = r.cell - pad * 2;

      const base = {
        dirt: '#8a5a2b', stone: '#8d8d8d', diamond: '#5bd8d0', gold: '#d9a520', tnt: '#c0392b',
      }[c.type.id];
      ctx.fillStyle = base;
      ctx.fillRect(bx, by, bs, bs);

      // blok kenarı (Minecraft görünümü: üst açık, alt koyu)
      ctx.fillStyle = 'rgba(255,255,255,.25)';
      ctx.fillRect(bx, by, bs, 5);
      ctx.fillStyle = 'rgba(0,0,0,.3)';
      ctx.fillRect(bx, by + bs - 5, bs, 5);

      // benekler
      ctx.fillStyle = 'rgba(0,0,0,.22)';
      for (const [sx, sy] of c.specks) {
        ctx.fillRect(bx + sx * (bs - 8) + 2, by + sy * (bs - 8) + 2, 6, 6);
      }

      // tip simgesi
      const icon = { diamond: '💎', gold: '🪙', tnt: '🧨' }[c.type.id];
      if (icon) {
        ctx.font = `${bs * 0.4}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, bx + bs / 2, by + bs / 2);
      }

      // hasarlı taş çatlağı
      if (c.type.id === 'stone' && c.hp === 1) {
        ctx.strokeStyle = 'rgba(0,0,0,.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx + bs * 0.2, by + bs * 0.3);
        ctx.lineTo(bx + bs * 0.5, by + bs * 0.55);
        ctx.lineTo(bx + bs * 0.35, by + bs * 0.8);
        ctx.moveTo(bx + bs * 0.5, by + bs * 0.55);
        ctx.lineTo(bx + bs * 0.78, by + bs * 0.7);
        ctx.stroke();
      }
    }

    // süre çubuğu
    const frac = Math.max(0, g.time / 30);
    ctx.fillStyle = 'rgba(255,255,255,.15)';
    ctx.fillRect(s.w * 0.1, s.h * 0.13, s.w * 0.8, 10);
    ctx.fillStyle = frac > 0.25 ? '#2de2a3' : '#fe2c55';
    ctx.fillRect(s.w * 0.1, s.h * 0.13, s.w * 0.8 * frac, 10);
    ctx.font = '700 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText(Math.ceil(g.time) + ' sn', s.w / 2, s.h * 0.11);
  },
};
