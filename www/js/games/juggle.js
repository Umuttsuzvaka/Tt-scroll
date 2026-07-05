export const juggle = {
  id: 'juggle',
  name: 'Top Sektir',
  emoji: '⚽',
  howTo: 'Topa dokunarak havada tut, yere düşürme!',

  init(s) {
    s.G = {
      x: s.w / 2, y: s.h * 0.4,
      vx: 0, vy: 0,
      r: 42,
      gravity: 700,
    };
  },

  tap(s, x, y) {
    const g = s.G;
    const d = Math.hypot(x - g.x, y - g.y);
    if (d <= g.r + 26) {
      g.vy = -(520 + s.score * 6);
      // topun neresine vurduysan o yöne savrulur
      g.vx = Math.max(-320, Math.min(320, (g.x - x) * 14));
      s.addScore();
    }
  },

  update(s, dt) {
    const g = s.G;
    g.vy += g.gravity * dt;
    g.x += g.vx * dt;
    g.y += g.vy * dt;
    g.vx *= 1 - 0.4 * dt;

    if (g.x - g.r < 0) { g.x = g.r; g.vx = Math.abs(g.vx) * 0.8; }
    if (g.x + g.r > s.w) { g.x = s.w - g.r; g.vx = -Math.abs(g.vx) * 0.8; }
    if (g.y - g.r > s.h * 0.2 && g.vy > 0 && g.y + g.r >= s.h - 30) s.end();
    if (g.y - g.r < 60) { g.y = 60 + g.r; g.vy = Math.abs(g.vy) * 0.6; }
  },

  draw(s, ctx) {
    const g = s.G;
    const bg = ctx.createLinearGradient(0, 0, 0, s.h);
    bg.addColorStop(0, '#0f1b3d');
    bg.addColorStop(1, '#1e3c2f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, s.w, s.h);

    // zemin çizgisi
    ctx.strokeStyle = 'rgba(255,255,255,.3)';
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(0, s.h - 30);
    ctx.lineTo(s.w, s.h - 30);
    ctx.stroke();
    ctx.setLineDash([]);

    // gölge
    const shadowScale = Math.max(0.2, 1 - (s.h - 30 - g.y) / s.h);
    ctx.fillStyle = `rgba(0,0,0,${0.35 * shadowScale})`;
    ctx.beginPath();
    ctx.ellipse(g.x, s.h - 26, g.r * shadowScale, 8 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `${g.r * 2}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚽', g.x, g.y);
  },
};
