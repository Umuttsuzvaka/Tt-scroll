export const reflex = {
  id: 'reflex',
  name: 'Refleks',
  emoji: '🎯',
  howTo: 'Hedef kaybolmadan dokun!',

  init(s) {
    s.G = { life: 2.2, timeLeft: 2.2, x: 0, y: 0, r: 44 };
    this.place(s);
  },

  place(s) {
    const g = s.G;
    g.x = g.r + 20 + Math.random() * (s.w - g.r * 2 - 40);
    g.y = g.r + 100 + Math.random() * (s.h - g.r * 2 - 220);
    g.timeLeft = g.life;
  },

  tap(s, x, y) {
    const g = s.G;
    const d = Math.hypot(x - g.x, y - g.y);
    if (d <= g.r + 12) {
      s.addScore();
      g.life = Math.max(0.55, g.life * 0.94);
      g.r = Math.max(26, g.r - 0.5);
      this.place(s);
    }
  },

  update(s, dt) {
    s.G.timeLeft -= dt;
    if (s.G.timeLeft <= 0) s.end();
  },

  draw(s, ctx) {
    const g = s.G;
    ctx.fillStyle = '#0d1b2a';
    ctx.fillRect(0, 0, s.w, s.h);

    // kalan süre halkası
    const frac = Math.max(0, g.timeLeft / g.life);
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r + 8, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.strokeStyle = frac > 0.35 ? '#2de2a3' : '#fe2c55';
    ctx.lineWidth = 6;
    ctx.stroke();

    const grad = ctx.createRadialGradient(g.x, g.y, 4, g.x, g.y, g.r);
    grad.addColorStop(0, '#ff6b9d');
    grad.addColorStop(1, '#fe2c55');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `${g.r}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎯', g.x, g.y);
  },
};
