// Pinpon — parmağınla raketi sürükle, yapay zekâyı yen!
export const pong = {
  id: 'pong',
  name: 'Pinpon',
  emoji: '🏓',
  howTo: 'Parmağınla alttaki raketi sürükle! Rakibi geçen her top +1. Topu kaçırırsan oyun biter.',
  quietTaps: true,

  init(s) {
    s.G = {
      pw: 96, ph: 14,
      px: s.w / 2,          // oyuncu raketi
      ax: s.w / 2,          // yapay zekâ raketi
      ball: { x: s.w / 2, y: s.h / 2, vx: 160, vy: 300, r: 9, trail: [] },
      speed: 1,
    };
  },

  tap() { },

  swipe(s, x) {
    s.G.px = Math.max(s.G.pw / 2, Math.min(s.w - s.G.pw / 2, x));
  },

  // sekme sonrası açı düzeltmesi: dikey bileşen toplam hızın %35'inin altına inmesin
  // (yoksa top sonsuza dek neredeyse yatay sekip durabilir); toplam hızı da sınırla
  fixAngle(b, dirY) {
    let sp = Math.hypot(b.vx, b.vy);
    if (sp > 980) { b.vx *= 980 / sp; b.vy *= 980 / sp; sp = 980; }
    if (Math.abs(b.vy) < sp * 0.35) {
      b.vy = dirY * sp * 0.35;
      b.vx = Math.sign(b.vx || 1) * Math.sqrt(sp * sp - b.vy * b.vy);
    }
  },

  serve(s, down) {
    const g = s.G;
    g.ball.x = s.w / 2;
    g.ball.y = s.h / 2;
    const a = (Math.random() * 0.6 - 0.3);
    const v = 340 * g.speed;
    g.ball.vx = Math.sin(a) * v;
    g.ball.vy = (down ? 1 : -1) * Math.cos(a) * v;
    g.ball.trail = [];
  },

  update(s, dt) {
    const g = s.G;
    const b = g.ball;
    const topY = s.h * 0.12, botY = s.h * 0.9;

    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.trail.push([b.x, b.y]);
    if (b.trail.length > 10) b.trail.shift();

    if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx); }
    if (b.x + b.r > s.w) { b.x = s.w - b.r; b.vx = -Math.abs(b.vx); }

    // yapay zekâ: topu izler ama sınırlı hızda (yenilebilir)
    const aiSpeed = 210 + s.score * 8;
    const diff = b.x - g.ax;
    g.ax += Math.max(-aiSpeed * dt, Math.min(aiSpeed * dt, diff));

    // oyuncu raketi — açı, çarpma noktasına göre değişir
    if (b.vy > 0 && b.y + b.r >= botY && b.y + b.r <= botY + 22 && Math.abs(b.x - g.px) <= g.pw / 2 + b.r) {
      b.vy = -Math.abs(b.vy) * 1.04;
      b.vx += (b.x - g.px) * 5;
      b.y = botY - b.r;
      this.fixAngle(b, -1);
    }
    // yapay zekâ raketi
    if (b.vy < 0 && b.y - b.r <= topY && b.y - b.r >= topY - 22 && Math.abs(b.x - g.ax) <= g.pw / 2 + b.r) {
      b.vy = Math.abs(b.vy) * 1.04;
      b.vx += (b.x - g.ax) * 5;
      b.y = topY + b.r;
      this.fixAngle(b, 1);
    }

    if (b.y < topY - 40) { s.addScore(); g.speed += 0.05; this.serve(s, true); }
    if (b.y > s.h + 20) return s.end();
  },

  draw(s, ctx) {
    const g = s.G;
    const bg = ctx.createLinearGradient(0, 0, 0, s.h);
    bg.addColorStop(0, '#101426');
    bg.addColorStop(1, '#1a1030');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, s.w, s.h);

    // orta çizgi
    ctx.strokeStyle = 'rgba(255,255,255,.18)';
    ctx.setLineDash([14, 14]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, s.h / 2);
    ctx.lineTo(s.w, s.h / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // top izi
    const b = g.ball;
    for (let i = 0; i < b.trail.length; i++) {
      ctx.globalAlpha = (i / b.trail.length) * 0.3;
      ctx.fillStyle = '#ffe066';
      ctx.beginPath();
      ctx.arc(b.trail[i][0], b.trail[i][1], b.r * (i / b.trail.length), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // top
    ctx.shadowColor = '#ffe066';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#ffe066';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // raketler
    const drawPaddle = (x, y, color) => {
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x - g.pw / 2, y, g.pw, g.ph, 7);
      ctx.fill();
      ctx.shadowBlur = 0;
    };
    drawPaddle(g.px, s.h * 0.9, '#2de2a3');
    drawPaddle(g.ax, s.h * 0.12 - g.ph, '#fe2c55');
  },
};
