export const mole = {
  id: 'mole',
  name: 'Köstebek Avı',
  emoji: '🐹',
  howTo: 'Köstebeklere dokun! 3 tanesini kaçırırsan oyun biter.',

  init(s) {
    s.G = {
      grid: Array(9).fill(null), // null | { t: kalan süre }
      spawnTimer: 0.4,
      spawnEvery: 1.1,
      upTime: 1.4,
      missed: 0,
    };
  },

  cellRect(s, i) {
    const size = Math.min(s.w, s.h * 0.7) - 40;
    const cell = size / 3;
    const ox = (s.w - size) / 2;
    const oy = s.h * 0.2;
    return { x: ox + (i % 3) * cell, y: oy + Math.floor(i / 3) * cell, cell };
  },

  tap(s, x, y) {
    const g = s.G;
    for (let i = 0; i < 9; i++) {
      if (!g.grid[i]) continue;
      const r = this.cellRect(s, i);
      if (x >= r.x && x < r.x + r.cell && y >= r.y && y < r.y + r.cell) {
        g.grid[i] = null;
        s.addScore();
        g.spawnEvery = Math.max(0.45, g.spawnEvery * 0.96);
        g.upTime = Math.max(0.6, g.upTime * 0.97);
        return;
      }
    }
  },

  update(s, dt) {
    const g = s.G;
    for (let i = 0; i < 9; i++) {
      if (g.grid[i]) {
        g.grid[i].t -= dt;
        if (g.grid[i].t <= 0) {
          g.grid[i] = null;
          g.missed++;
          if (g.missed >= 3) return s.end();
        }
      }
    }
    g.spawnTimer -= dt;
    if (g.spawnTimer <= 0) {
      g.spawnTimer = g.spawnEvery;
      const empty = [];
      for (let i = 0; i < 9; i++) if (!g.grid[i]) empty.push(i);
      if (empty.length) {
        g.grid[empty[Math.floor(Math.random() * empty.length)]] = { t: g.upTime };
      }
    }
  },

  draw(s, ctx) {
    const g = s.G;
    ctx.fillStyle = '#14201a';
    ctx.fillRect(0, 0, s.w, s.h);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 9; i++) {
      const r = this.cellRect(s, i);
      const pad = 8;
      ctx.fillStyle = '#233b2e';
      ctx.beginPath();
      ctx.roundRect(r.x + pad, r.y + pad, r.cell - pad * 2, r.cell - pad * 2, 16);
      ctx.fill();
      // delik
      ctx.fillStyle = '#0c130f';
      ctx.beginPath();
      ctx.ellipse(r.x + r.cell / 2, r.y + r.cell * 0.68, r.cell * 0.3, r.cell * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      if (g.grid[i]) {
        ctx.font = `${r.cell * 0.45}px serif`;
        ctx.fillText('🐹', r.x + r.cell / 2, r.y + r.cell * 0.45);
      }
    }

    // kaçan köstebek canları
    ctx.font = '22px serif';
    ctx.textAlign = 'center';
    let hearts = '';
    for (let i = 0; i < 3; i++) hearts += i < 3 - g.missed ? '❤️' : '🖤';
    ctx.fillText(hearts, s.w / 2, s.h * 0.13);
  },
};
