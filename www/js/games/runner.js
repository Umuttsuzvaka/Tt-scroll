// Subway Surfers tarzı 3 şeritli koşu — perspektifli sahte-3D görünüm
export const runner = {
  id: 'runner',
  name: 'Koşucu',
  emoji: '🏃',
  howTo: 'Sola/sağa dokunarak şerit değiştir! 🚧 engellerden kaç, 🪙 altın +2. Uzun bariyerlere dikkat!',

  init(s) {
    s.G = {
      lane: 1,
      renderLane: 1, // yumuşak şerit geçişi için
      obstacles: [],
      coins: [],
      speed: s.h * 0.45,
      spawnTimer: 1,
      roadOffset: 0,
      buildings: Array.from({ length: 10 }, (_, i) => ({
        x: i / 10 + Math.random() * 0.05,
        w: 0.05 + Math.random() * 0.05,
        h: 30 + Math.random() * 70,
      })),
    };
  },

  // mantıksal y (0=ufuk çizgisi, s.h=oyuncu hizası) -> perspektif ekran koordinatı
  persp(s, lane, ly) {
    const horizon = s.h * 0.3;
    const t = Math.max(0.02, ly / s.h);
    const tt = t * t;
    const py = horizon + (s.h * 0.92 - horizon) * tt;
    const roadW = s.w * 0.16 + (s.w * 0.98 - s.w * 0.16) * tt;
    const px = s.w / 2 + roadW * ((lane - 1) / 3);
    return { x: px, y: py, scale: 0.2 + 0.8 * tt, roadW };
  },

  tap(s, x) {
    const g = s.G;
    if (x < s.w / 2) g.lane = Math.max(0, g.lane - 1);
    else g.lane = Math.min(2, g.lane + 1);
  },

  update(s, dt) {
    const g = s.G;
    g.roadOffset = (g.roadOffset + g.speed * dt * 0.02) % 1;
    g.speed += 6 * dt;
    g.renderLane += (g.lane - g.renderLane) * Math.min(1, dt * 14);

    g.spawnTimer -= dt;
    if (g.spawnTimer <= 0) {
      g.spawnTimer = Math.max(0.55, 1.05 - s.score * 0.01);
      const open = Math.floor(Math.random() * 3);
      const lanes = [0, 1, 2].filter(l => l !== open);
      const count = Math.random() < 0.4 ? 2 : 1;
      for (const l of lanes.slice(0, count)) {
        // 15 puandan sonra bazen uzun bariyer (tren gibi)
        const long = s.score >= 15 && Math.random() < 0.3;
        g.obstacles.push({ lane: l, y: -60, passed: false, long });
      }
      if (Math.random() < 0.5) g.coins.push({ lane: open, y: -140 });
    }

    const py = s.h * 0.8;
    for (const o of g.obstacles) {
      o.y += g.speed * dt;
      if (!o.passed && o.y > py + 60) { o.passed = true; s.addScore(); }
      const reach = o.long ? 110 : 52;
      if (o.lane === g.lane && Math.abs(o.y - py) < reach) return s.end();
    }
    g.obstacles = g.obstacles.filter(o => o.y < s.h + 160);

    for (let i = g.coins.length - 1; i >= 0; i--) {
      const c = g.coins[i];
      c.y += g.speed * dt;
      if (c.lane === g.lane && Math.abs(c.y - py) < 52) {
        g.coins.splice(i, 1);
        s.addScore(2);
      } else if (c.y > s.h + 60) {
        g.coins.splice(i, 1);
      }
    }
  },

  drawBarrier(s, ctx, o) {
    const p = this.persp(s, o.lane, o.y);
    const w = p.roadW * 0.24;
    const h = (o.long ? 90 : 40) * p.scale;
    const x = p.x - w / 2, y = p.y - h;
    // gövde
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, '#ffd23f');
    grad.addColorStop(1, '#e0a800');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 4 * p.scale);
    ctx.fill();
    // kırmızı-beyaz çizgiler
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 4 * p.scale);
    ctx.clip();
    ctx.fillStyle = '#e63946';
    const stripe = 14 * p.scale;
    for (let sx = -h; sx < w + h; sx += stripe * 2) {
      ctx.beginPath();
      ctx.moveTo(x + sx, y + h);
      ctx.lineTo(x + sx + stripe, y + h);
      ctx.lineTo(x + sx + stripe + h, y);
      ctx.lineTo(x + sx + h, y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // gölge
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 4, w * 0.55, 7 * p.scale, 0, 0, Math.PI * 2);
    ctx.fill();
  },

  draw(s, ctx) {
    const g = s.G;
    const horizon = s.h * 0.3;

    // gökyüzü
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, '#0c1030');
    sky.addColorStop(1, '#33265c');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, s.w, horizon);

    // şehir silüeti
    ctx.fillStyle = '#191341';
    for (const b of g.buildings) {
      ctx.fillRect(b.x * s.w, horizon - b.h, b.w * s.w, b.h);
    }
    // güneş / neon daire
    const sun = ctx.createRadialGradient(s.w * 0.5, horizon - 40, 5, s.w * 0.5, horizon - 40, 90);
    sun.addColorStop(0, 'rgba(254,44,85,.8)');
    sun.addColorStop(1, 'transparent');
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, s.w, horizon);

    // yol kenarı zemin
    const grass = ctx.createLinearGradient(0, horizon, 0, s.h);
    grass.addColorStop(0, '#101c14');
    grass.addColorStop(1, '#16281c');
    ctx.fillStyle = grass;
    ctx.fillRect(0, horizon, s.w, s.h - horizon);

    // perspektifli yol gövdesi
    const top = this.persp(s, 1, 0);
    const bot = this.persp(s, 1, s.h);
    ctx.fillStyle = '#262e3c';
    ctx.beginPath();
    ctx.moveTo(s.w / 2 - top.roadW / 2, top.y);
    ctx.lineTo(s.w / 2 + top.roadW / 2, top.y);
    ctx.lineTo(s.w / 2 + bot.roadW / 2, bot.y);
    ctx.lineTo(s.w / 2 - bot.roadW / 2, bot.y);
    ctx.closePath();
    ctx.fill();

    // kayan şerit çizgileri (perspektif boyunca kesikli)
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    for (let seg = 0; seg < 12; seg++) {
      const ly = ((seg / 12 + g.roadOffset) % 1) * s.h;
      const a = this.persp(s, 1, ly);
      const b2 = this.persp(s, 1, Math.min(s.h, ly + s.h * 0.045));
      for (const laneEdge of [-0.5, 0.5]) {
        const ax = s.w / 2 + a.roadW * laneEdge / 1.5;
        const bx = s.w / 2 + b2.roadW * laneEdge / 1.5;
        ctx.beginPath();
        ctx.moveTo(ax - 2 * a.scale, a.y);
        ctx.lineTo(ax + 2 * a.scale, a.y);
        ctx.lineTo(bx + 2 * b2.scale, b2.y);
        ctx.lineTo(bx - 2 * b2.scale, b2.y);
        ctx.closePath();
        ctx.fill();
      }
    }

    // uzaktakiler önce çizilsin
    const drawables = [
      ...g.obstacles.map(o => ({ kind: 'o', y: o.y, o })),
      ...g.coins.map(c => ({ kind: 'c', y: c.y, c })),
    ].sort((a, b) => a.y - b.y);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const d of drawables) {
      if (d.kind === 'o') {
        this.drawBarrier(s, ctx, d.o);
      } else {
        const p = this.persp(s, d.c.lane, d.c.y);
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 12 * p.scale;
        const coin = ctx.createRadialGradient(p.x - 4, p.y - 24 * p.scale, 2, p.x, p.y - 20 * p.scale, 15 * p.scale);
        coin.addColorStop(0, '#ffe97a');
        coin.addColorStop(1, '#d9a520');
        ctx.fillStyle = coin;
        ctx.beginPath();
        ctx.arc(p.x, p.y - 20 * p.scale, 14 * p.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,255,255,.7)';
        ctx.lineWidth = 2 * p.scale;
        ctx.beginPath();
        ctx.arc(p.x, p.y - 20 * p.scale, 9 * p.scale, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // oyuncu (yumuşak şerit geçişiyle)
    const pp = this.persp(s, g.renderLane, s.h * 0.8);
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.beginPath();
    ctx.ellipse(pp.x, pp.y + 4, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '52px serif';
    ctx.fillText('🏃', pp.x, pp.y - 24);
  },
};
