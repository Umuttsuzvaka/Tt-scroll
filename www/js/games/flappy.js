export const flappy = {
  id: 'flappy',
  name: 'Zıp Kuş',
  emoji: '🐤',
  howTo: 'Dokunarak zıpla, borulara çarpma!',

  init(s) {
    s.G = {
      y: s.h / 2, vy: 0,
      pipes: [],
      timer: 0,
      speed: 160,
    };
  },

  tap(s) {
    s.G.vy = -380;
  },

  update(s, dt) {
    const g = s.G;
    g.vy += 1100 * dt;
    g.y += g.vy * dt;

    g.timer -= dt;
    if (g.timer <= 0) {
      g.timer = 1.6;
      const gap = Math.max(150, 220 - s.score * 3);
      const cy = 90 + Math.random() * (s.h - 180 - gap) + gap / 2;
      g.pipes.push({ x: s.w + 40, cy, gap, passed: false });
    }

    const bx = s.w * 0.28, r = 16;
    for (const p of g.pipes) {
      p.x -= g.speed * dt;
      if (!p.passed && p.x + 30 < bx) { p.passed = true; s.addScore(); g.speed += 4; }
      // çarpışma
      if (bx + r > p.x && bx - r < p.x + 60) {
        if (g.y - r < p.cy - p.gap / 2 || g.y + r > p.cy + p.gap / 2) return s.end();
      }
    }
    g.pipes = g.pipes.filter(p => p.x > -80);

    if (g.y < -20 || g.y + r > s.h) return s.end();
  },

  draw(s, ctx) {
    const g = s.G;
    const sky = ctx.createLinearGradient(0, 0, 0, s.h);
    sky.addColorStop(0, '#12122b');
    sky.addColorStop(1, '#2b1a4a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, s.w, s.h);

    ctx.fillStyle = '#2de2a3';
    for (const p of g.pipes) {
      ctx.fillRect(p.x, 0, 60, p.cy - p.gap / 2);
      ctx.fillRect(p.x, p.cy + p.gap / 2, 60, s.h - p.cy - p.gap / 2);
    }

    ctx.font = '32px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(s.w * 0.28, g.y);
    ctx.rotate(Math.max(-0.5, Math.min(0.8, g.vy / 600)));
    ctx.fillText('🐤', 0, 0);
    ctx.restore();
  },
};
