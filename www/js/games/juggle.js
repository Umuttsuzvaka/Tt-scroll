export const juggle = {
  id: 'juggle',
  name: 'Top Sektir',
  emoji: '⚽',
  howTo: 'Topa dokunarak havada tut! 12 puandan sonra ikinci top gelir — ikisini de düşürme!',

  init(s) {
    s.G = {
      balls: [this.newBall(s, s.w / 2)],
      gravity: 700,
      secondAdded: false,
      t: 0,
    };
  },

  newBall(s, x) {
    return { x, y: s.h * 0.35, vx: 0, vy: -150, r: 36, trail: [] };
  },

  tap(s, x, y) {
    const g = s.G;
    let best = null, bestD = Infinity;
    for (const b of g.balls) {
      const d = Math.hypot(x - b.x, y - b.y);
      if (d < bestD) { bestD = d; best = b; }
    }
    if (best && bestD <= best.r + 30) {
      best.vy = -(520 + s.score * 6);
      best.vx = Math.max(-340, Math.min(340, (best.x - x) * 14));
      s.addScore();
    }
  },

  update(s, dt) {
    const g = s.G;
    g.t += dt;
    if (!g.secondAdded && s.score >= 12) {
      g.secondAdded = true;
      g.balls.push(this.newBall(s, s.w * 0.3));
    }
    for (const b of g.balls) {
      b.vy += g.gravity * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vx *= 1 - 0.4 * dt;
      if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.8; }
      if (b.x + b.r > s.w) { b.x = s.w - b.r; b.vx = -Math.abs(b.vx) * 0.8; }
      if (b.y - b.r < 60) { b.y = 60 + b.r; b.vy = Math.abs(b.vy) * 0.6; }
      if (b.vy > 0 && b.y + b.r >= s.h - 30) return s.end();
      b.trail.push([b.x, b.y]);
      if (b.trail.length > 9) b.trail.shift();
    }
  },

  draw(s, ctx) {
    const g = s.G;
    const bg = ctx.createLinearGradient(0, 0, 0, s.h);
    bg.addColorStop(0, '#0c1533');
    bg.addColorStop(0.7, '#132b45');
    bg.addColorStop(1, '#173a2c');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, s.w, s.h);

    // stadyum projektörleri
    for (const px of [s.w * 0.15, s.w * 0.85]) {
      const spot = ctx.createLinearGradient(px, 0, s.w / 2, s.h);
      spot.addColorStop(0, 'rgba(255,255,220,.10)');
      spot.addColorStop(1, 'transparent');
      ctx.fillStyle = spot;
      ctx.beginPath();
      ctx.moveTo(px - 20, 0);
      ctx.lineTo(px + 20, 0);
      ctx.lineTo(s.w / 2 + 140, s.h);
      ctx.lineTo(s.w / 2 - 140, s.h);
      ctx.closePath();
      ctx.fill();
    }

    // zemin
    ctx.fillStyle = '#1d4a33';
    ctx.fillRect(0, s.h - 30, s.w, 30);
    ctx.strokeStyle = 'rgba(255,255,255,.35)';
    ctx.setLineDash([12, 10]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, s.h - 30);
    ctx.lineTo(s.w, s.h - 30);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const b of g.balls) {
      // hareket izi
      for (let i = 0; i < b.trail.length; i++) {
        const [tx, ty] = b.trail[i];
        ctx.globalAlpha = (i / b.trail.length) * 0.25;
        ctx.fillStyle = '#9fd8ff';
        ctx.beginPath();
        ctx.arc(tx, ty, b.r * 0.5 * (i / b.trail.length), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // gölge
      const hFrac = Math.max(0.2, 1 - (s.h - 30 - b.y) / s.h);
      ctx.fillStyle = `rgba(0,0,0,${0.35 * hFrac})`;
      ctx.beginPath();
      ctx.ellipse(b.x, s.h - 26, b.r * hFrac, 8 * hFrac, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = `${b.r * 2}px serif`;
      ctx.fillText('⚽', b.x, b.y);
    }
  },
};
