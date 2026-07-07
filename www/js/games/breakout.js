// Tuğla Kır (Arkanoid) — raketi parmağınla sürükle
export const breakout = {
  id: 'breakout',
  name: 'Tuğla Kır',
  emoji: '🧱',
  howTo: 'Raketi parmağınla sürükle, topla tuğlaları kır! Her tuğla +1. Topu düşürme.',
  quietTaps: true,

  init(s) {
    s.G = {
      pw: 100, px: s.w / 2,
      ball: { x: s.w / 2, y: s.h * 0.6, vx: 170, vy: -380, r: 8 },
      bricks: [],
      level: 1,
      sparks: [],
    };
    this.buildLevel(s);
  },

  buildLevel(s) {
    const g = s.G;
    g.bricks = [];
    const cols = 6, rows = 4 + Math.min(3, g.level - 1);
    const bw = (s.w - 24) / cols, bh = 26;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        g.bricks.push({ x: 12 + c * bw, y: s.h * 0.13 + r * (bh + 5), w: bw - 5, h: bh, hue: 340 - r * 38 });
      }
    }
  },

  tap() { },

  swipe(s, x) {
    s.G.px = Math.max(s.G.pw / 2, Math.min(s.w - s.G.pw / 2, x));
  },

  update(s, dt) {
    const g = s.G;
    const b = g.ball;
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx); }
    if (b.x + b.r > s.w) { b.x = s.w - b.r; b.vx = -Math.abs(b.vx); }
    if (b.y - b.r < 0) { b.y = b.r; b.vy = Math.abs(b.vy); }

    // raket — açı, topun rakete çarptığı noktaya göre değişir
    const py = s.h * 0.88;
    if (b.vy > 0 && b.y + b.r >= py && b.y + b.r <= py + 24 && Math.abs(b.x - g.px) <= g.pw / 2 + b.r) {
      b.vy = -Math.abs(b.vy);
      b.vx += (b.x - g.px) * 4.5;
      b.y = py - b.r;
      // toplam hızı sınırla + dikey bileşen eşiği: sonsuz yatay sekmeyi engelle
      let sp = Math.hypot(b.vx, b.vy);
      if (sp > 900) { b.vx *= 900 / sp; b.vy *= 900 / sp; sp = 900; }
      if (Math.abs(b.vy) < sp * 0.35) {
        b.vy = -sp * 0.35;
        b.vx = Math.sign(b.vx || 1) * Math.sqrt(sp * sp - b.vy * b.vy);
      }
    }

    // tuğlalar
    for (let i = g.bricks.length - 1; i >= 0; i--) {
      const br = g.bricks[i];
      if (b.x + b.r > br.x && b.x - b.r < br.x + br.w && b.y + b.r > br.y && b.y - b.r < br.y + br.h) {
        // hangi taraftan çarptı?
        const overlapX = Math.min(b.x + b.r - br.x, br.x + br.w - (b.x - b.r));
        const overlapY = Math.min(b.y + b.r - br.y, br.y + br.h - (b.y - b.r));
        if (overlapX < overlapY) b.vx = -b.vx; else b.vy = -b.vy;
        for (let k = 0; k < 8; k++) {
          g.sparks.push({
            x: b.x, y: b.y,
            vx: (Math.random() - 0.5) * 300, vy: (Math.random() - 0.5) * 300,
            hue: br.hue, life: 0.4,
          });
        }
        g.bricks.splice(i, 1);
        s.addScore();
        if (!g.bricks.length) {
          g.level++;
          b.vx *= 1.08; b.vy *= 1.08;
          this.buildLevel(s);
        }
        break;
      }
    }

    for (const sp of g.sparks) {
      sp.x += sp.vx * dt; sp.y += sp.vy * dt; sp.life -= dt;
    }
    g.sparks = g.sparks.filter(sp => sp.life > 0);

    if (b.y > s.h + 30) return s.end();
  },

  draw(s, ctx) {
    const g = s.G;
    const bg = ctx.createLinearGradient(0, 0, 0, s.h);
    bg.addColorStop(0, '#141227');
    bg.addColorStop(1, '#221030');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, s.w, s.h);

    for (const br of g.bricks) {
      const grad = ctx.createLinearGradient(br.x, br.y, br.x, br.y + br.h);
      grad.addColorStop(0, `hsl(${br.hue} 85% 62%)`);
      grad.addColorStop(1, `hsl(${br.hue} 75% 45%)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(br.x, br.y, br.w, br.h, 5);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.3)';
      ctx.fillRect(br.x + 3, br.y + 2, br.w - 6, 4);
    }

    for (const sp of g.sparks) {
      ctx.globalAlpha = Math.max(0, sp.life / 0.4);
      ctx.fillStyle = `hsl(${sp.hue} 90% 65%)`;
      ctx.fillRect(sp.x, sp.y, 5, 5);
    }
    ctx.globalAlpha = 1;

    // raket
    ctx.shadowColor = '#3d9bff';
    ctx.shadowBlur = 16;
    const pg = ctx.createLinearGradient(g.px - g.pw / 2, 0, g.px + g.pw / 2, 0);
    pg.addColorStop(0, '#3d9bff');
    pg.addColorStop(1, '#7ec9ff');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.roundRect(g.px - g.pw / 2, s.h * 0.88, g.pw, 15, 8);
    ctx.fill();
    ctx.shadowBlur = 0;

    // top
    const b = g.ball;
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  },
};
