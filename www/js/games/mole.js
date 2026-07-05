export const mole = {
  id: 'mole',
  name: 'Köstebek Avı',
  emoji: '🐹',
  howTo: 'Köstebeklere dokun! Altın köstebek +3 ama çok hızlı. 8 puandan sonra bombalara DOKUNMA!',

  init(s) {
    s.G = {
      grid: Array(9).fill(null), // null | { t, age, type }
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
      const m = g.grid[i];
      if (!m) continue;
      const r = this.cellRect(s, i);
      if (x >= r.x && x < r.x + r.cell && y >= r.y && y < r.y + r.cell) {
        if (m.type === 'bomb') return s.end();
        g.grid[i] = null;
        s.addScore(m.type === 'gold' ? 3 : 1);
        g.spawnEvery = Math.max(0.45, g.spawnEvery * 0.96);
        g.upTime = Math.max(0.6, g.upTime * 0.97);
        return;
      }
    }
  },

  update(s, dt) {
    const g = s.G;
    for (let i = 0; i < 9; i++) {
      const m = g.grid[i];
      if (!m) continue;
      m.t -= dt;
      m.age += dt;
      if (m.t <= 0) {
        g.grid[i] = null;
        if (m.type !== 'bomb') {
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
        const roll = Math.random();
        let type = 'normal';
        if (roll < 0.15) type = 'gold';
        else if (s.score >= 8 && roll < 0.3) type = 'bomb';
        const dur = type === 'gold' ? g.upTime * 0.6 : type === 'bomb' ? g.upTime * 1.2 : g.upTime;
        g.grid[empty[Math.floor(Math.random() * empty.length)]] = { t: dur, age: 0, type };
      }
    }
  },

  draw(s, ctx) {
    const g = s.G;
    const bg = ctx.createLinearGradient(0, 0, 0, s.h);
    bg.addColorStop(0, '#173620');
    bg.addColorStop(1, '#0b1c10');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, s.w, s.h);

    // çimen dokusu şeritleri
    ctx.fillStyle = 'rgba(255,255,255,.03)';
    for (let y = 0; y < s.h; y += 26) ctx.fillRect(0, y, s.w, 12);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 9; i++) {
      const r = this.cellRect(s, i);
      const pad = 8;
      // çim yuvası
      const patch = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.cell);
      patch.addColorStop(0, '#2c5636');
      patch.addColorStop(1, '#1c3a24');
      ctx.fillStyle = patch;
      ctx.beginPath();
      ctx.roundRect(r.x + pad, r.y + pad, r.cell - pad * 2, r.cell - pad * 2, 18);
      ctx.fill();

      const cx = r.x + r.cell / 2;
      const holeY = r.y + r.cell * 0.68;
      // delik + iç gölge
      ctx.fillStyle = '#0a0f0a';
      ctx.beginPath();
      ctx.ellipse(cx, holeY, r.cell * 0.3, r.cell * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(90,60,30,.8)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(cx, holeY, r.cell * 0.3, r.cell * 0.12, 0, Math.PI, Math.PI * 2);
      ctx.stroke();

      const m = g.grid[i];
      if (m) {
        // yaylanarak çıkma animasyonu
        const pop = Math.min(1, m.age * 7);
        const scale = pop < 1 ? 1.15 * pop : 1 + Math.sin(m.age * 10) * 0.03;
        const rise = (1 - Math.min(1, m.age * 7)) * r.cell * 0.2;
        ctx.save();
        ctx.translate(cx, r.y + r.cell * 0.45 + rise);
        ctx.scale(scale, scale);
        if (m.type === 'gold') {
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 26;
        }
        ctx.font = `${r.cell * 0.45}px serif`;
        ctx.fillText(m.type === 'bomb' ? '💣' : '🐹', 0, 0);
        if (m.type === 'gold') {
          ctx.shadowBlur = 0;
          ctx.font = `${r.cell * 0.2}px serif`;
          ctx.fillText('👑', 0, -r.cell * 0.28);
        }
        ctx.restore();
        ctx.shadowBlur = 0;
      }
    }

    ctx.font = '22px serif';
    let hearts = '';
    for (let i = 0; i < 3; i++) hearts += i < 3 - g.missed ? '❤️' : '🖤';
    ctx.fillText(hearts, s.w / 2, s.h * 0.13);
  },
};
