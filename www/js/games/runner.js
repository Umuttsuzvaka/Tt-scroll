// Subway Surfers tarzı 3 şeritli koşu: sola/sağa dokunarak şerit değiştir
export const runner = {
  id: 'runner',
  name: 'Koşucu',
  emoji: '🏃',
  howTo: 'Ekranın soluna/sağına dokunarak şerit değiştir, engellere çarpma!',

  init(s) {
    s.G = {
      lane: 1,
      obstacles: [],
      coins: [],
      speed: s.h * 0.45,
      spawnTimer: 1,
      roadOffset: 0,
    };
  },

  laneX(s, lane) {
    const roadW = s.w * 0.76;
    const left = (s.w - roadW) / 2;
    return left + roadW * (lane + 0.5) / 3;
  },

  tap(s, x) {
    const g = s.G;
    if (x < s.w / 2) g.lane = Math.max(0, g.lane - 1);
    else g.lane = Math.min(2, g.lane + 1);
  },

  update(s, dt) {
    const g = s.G;
    g.roadOffset = (g.roadOffset + g.speed * dt) % 60;
    g.speed += 6 * dt;

    g.spawnTimer -= dt;
    if (g.spawnTimer <= 0) {
      g.spawnTimer = Math.max(0.55, 1.05 - s.score * 0.01);
      // 1 veya 2 şeride engel koy (her zaman en az bir açık şerit kalır)
      const open = Math.floor(Math.random() * 3);
      const lanes = [0, 1, 2].filter(l => l !== open);
      const count = Math.random() < 0.4 ? 2 : 1;
      for (const l of lanes.slice(0, count)) {
        g.obstacles.push({ lane: l, y: -60, passed: false });
      }
      // bazen açık şeride altın
      if (Math.random() < 0.5) g.coins.push({ lane: open, y: -140 });
    }

    const py = s.h * 0.8;
    for (const o of g.obstacles) {
      o.y += g.speed * dt;
      if (!o.passed && o.y > py + 40) { o.passed = true; s.addScore(); }
      if (o.lane === g.lane && Math.abs(o.y - py) < 52) return s.end();
    }
    g.obstacles = g.obstacles.filter(o => o.y < s.h + 80);

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

  draw(s, ctx) {
    const g = s.G;
    ctx.fillStyle = '#101820';
    ctx.fillRect(0, 0, s.w, s.h);

    // yol
    const roadW = s.w * 0.76;
    const left = (s.w - roadW) / 2;
    ctx.fillStyle = '#2c3440';
    ctx.fillRect(left, 0, roadW, s.h);

    // kayan şerit çizgileri
    ctx.strokeStyle = 'rgba(255,255,255,.4)';
    ctx.lineWidth = 4;
    ctx.setLineDash([28, 32]);
    ctx.lineDashOffset = -g.roadOffset;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(left + roadW * i / 3, 0);
      ctx.lineTo(left + roadW * i / 3, s.h);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = '44px serif';
    for (const o of s.G.obstacles) ctx.fillText('🚧', this.laneX(s, o.lane), o.y);
    ctx.font = '34px serif';
    for (const c of s.G.coins) ctx.fillText('🪙', this.laneX(s, c.lane), c.y);

    // oyuncu
    ctx.font = '52px serif';
    ctx.fillText('🏃', this.laneX(s, g.lane), s.h * 0.8);
  },
};
