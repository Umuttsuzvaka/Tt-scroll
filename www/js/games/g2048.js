// 2048 Mini — kaydırarak taşları birleştir
const TILE_COLORS = {
  2: '#eee4da', 4: '#ede0c8', 8: '#f2b179', 16: '#f59563', 32: '#f67c5f',
  64: '#f65e3b', 128: '#edcf72', 256: '#edcc61', 512: '#edc850',
  1024: '#edc53f', 2048: '#edc22e',
};

export const g2048 = {
  id: 'g2048',
  name: '2048 Mini',
  emoji: '🔢',
  howTo: 'Parmağını kaydırarak taşları birleştir! Aynı sayılar toplanır. Hamle kalmayınca oyun biter.',
  quietTaps: true,

  init(s) {
    s.G = { grid: Array(16).fill(0), popAge: Array(16).fill(1) };
    this.addTile(s); this.addTile(s);
  },

  addTile(s) {
    const empty = [];
    s.G.grid.forEach((v, i) => { if (!v) empty.push(i); });
    if (!empty.length) return;
    const i = empty[Math.floor(Math.random() * empty.length)];
    s.G.grid[i] = Math.random() < 0.9 ? 2 : 4;
    s.G.popAge[i] = 0;
  },

  tap() { /* jest tabanlı oyun */ },

  gesture(s, dir) {
    const g = s.G.grid;
    const idx = (r, c) => r * 4 + c;
    let moved = false, gained = 0;
    // her hat için: yönüne göre hücre sırası çıkar, kaydır+birleştir, geri yaz
    for (let line = 0; line < 4; line++) {
      const cells = [];
      for (let k = 0; k < 4; k++) {
        if (dir === 'left') cells.push(idx(line, k));
        if (dir === 'right') cells.push(idx(line, 3 - k));
        if (dir === 'up') cells.push(idx(k, line));
        if (dir === 'down') cells.push(idx(3 - k, line));
      }
      const vals = cells.map(i => g[i]).filter(v => v);
      const merged = [];
      for (let k = 0; k < vals.length; k++) {
        if (vals[k] === vals[k + 1]) {
          merged.push(vals[k] * 2);
          gained += vals[k] * 2;
          k++;
        } else merged.push(vals[k]);
      }
      cells.forEach((ci, k) => {
        const nv = merged[k] || 0;
        if (g[ci] !== nv) { moved = true; if (nv && nv === (merged[k])) s.G.popAge[ci] = 0.5; }
        g[ci] = nv;
      });
    }
    if (moved) {
      if (gained) s.addScore(gained);
      this.addTile(s);
      // hamle kaldı mı?
      const canMove = g.some((v, i) => {
        if (!v) return true;
        const r = Math.floor(i / 4), c = i % 4;
        return (c < 3 && g[i] === g[i + 1]) || (r < 3 && g[i] === g[i + 4]);
      });
      if (!canMove) s.end();
    }
  },

  update(s, dt) {
    s.G.popAge = s.G.popAge.map(a => Math.min(1, a + dt * 5));
  },

  draw(s, ctx) {
    const g = s.G;
    ctx.fillStyle = '#faf8ef';
    ctx.fillRect(0, 0, s.w, s.h);

    const size = Math.min(s.w - 32, s.h * 0.55);
    const cell = size / 4;
    const ox = (s.w - size) / 2, oy = s.h * 0.22;

    ctx.fillStyle = '#bbada0';
    ctx.beginPath();
    ctx.roundRect(ox - 8, oy - 8, size + 16, size + 16, 12);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 16; i++) {
      const x = ox + (i % 4) * cell, y = oy + Math.floor(i / 4) * cell;
      const v = g.grid[i];
      ctx.fillStyle = v ? (TILE_COLORS[v] || '#3c3a32') : 'rgba(238,228,218,.35)';
      const pop = 0.85 + 0.15 * Math.min(1, g.popAge[i]);
      const pad = 5 + cell * (1 - pop) / 2;
      ctx.beginPath();
      ctx.roundRect(x + pad, y + pad, cell - pad * 2, cell - pad * 2, 8);
      ctx.fill();
      if (v) {
        ctx.fillStyle = v <= 4 ? '#776e65' : '#fff';
        ctx.font = `900 ${v < 100 ? cell * 0.42 : v < 1000 ? cell * 0.34 : cell * 0.27}px sans-serif`;
        ctx.fillText(v, x + cell / 2, y + cell / 2 + 2);
      }
    }

    ctx.fillStyle = '#776e65';
    ctx.font = '700 15px sans-serif';
    ctx.fillText('⬅️ ⬆️ ⬇️ ➡️ kaydırarak oyna', s.w / 2, oy + size + 42);
  },
};
