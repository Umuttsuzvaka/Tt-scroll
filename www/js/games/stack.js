export const stack = {
  id: 'stack',
  name: 'Kule Yap',
  emoji: '🏗️',
  howTo: 'Bloğu tam üstüne bırak! Kusursuz bırakırsan blok büyümez ve +2 bonus kazanırsın.',

  init(s) {
    const w0 = Math.min(s.w * 0.6, 260);
    s.G = {
      placed: [{ x: (s.w - w0) / 2, w: w0 }],
      cur: { x: 0, w: w0, dir: 1 },
      speed: 220,
      blockH: 34,
      flash: 0,
      t: 0,
    };
  },

  tap(s) {
    const g = s.G;
    const top = g.placed[g.placed.length - 1];
    // kusursuz bırakma: 7 piksele kadar hizala ve ödüllendir
    if (Math.abs(g.cur.x - top.x) < 7) {
      g.placed.push({ x: top.x, w: top.w });
      g.flash = 0.4;
      s.addScore(2);
    } else {
      const left = Math.max(g.cur.x, top.x);
      const right = Math.min(g.cur.x + g.cur.w, top.x + top.w);
      const overlap = right - left;
      if (overlap <= 6) return s.end();
      g.placed.push({ x: left, w: overlap });
      s.addScore();
    }
    if (g.placed.length > 12) g.placed.shift();
    const newTop = g.placed[g.placed.length - 1];
    g.cur = { x: 0, w: newTop.w, dir: 1 };
    g.speed += 12;
  },

  update(s, dt) {
    const g = s.G;
    g.t += dt;
    g.flash = Math.max(0, g.flash - dt);
    g.cur.x += g.speed * g.cur.dir * dt;
    if (g.cur.x + g.cur.w > s.w) { g.cur.x = s.w - g.cur.w; g.cur.dir = -1; }
    if (g.cur.x < 0) { g.cur.x = 0; g.cur.dir = 1; }
  },

  drawBlock(ctx, x, y, w, h, hue, glow) {
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, `hsl(${hue} 80% 62%)`);
    grad.addColorStop(1, `hsl(${hue} 75% 45%)`);
    if (glow) {
      ctx.shadowColor = `hsl(${hue} 90% 65%)`;
      ctx.shadowBlur = 24;
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 5);
    ctx.fill();
    ctx.shadowBlur = 0;
    // üst yüzey parlaması
    ctx.fillStyle = 'rgba(255,255,255,.3)';
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, w - 4, 5, 3);
    ctx.fill();
    // yan gölge
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    ctx.fillRect(x + w - 6, y + 4, 4, h - 8);
  },

  draw(s, ctx) {
    const g = s.G;
    const bg = ctx.createLinearGradient(0, 0, 0, s.h);
    bg.addColorStop(0, '#191036');
    bg.addColorStop(1, '#0c2233');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, s.w, s.h);

    // arka plan ışık huzmesi
    const beam = ctx.createRadialGradient(s.w / 2, s.h * 0.75, 30, s.w / 2, s.h * 0.75, s.w * 0.8);
    beam.addColorStop(0, 'rgba(120,90,255,.14)');
    beam.addColorStop(1, 'transparent');
    ctx.fillStyle = beam;
    ctx.fillRect(0, 0, s.w, s.h);

    const baseY = s.h - 90;
    const n = g.placed.length;
    for (let i = 0; i < n; i++) {
      const b = g.placed[i];
      const hue = (200 + (s.score - (n - 1 - i)) * 14) % 360;
      this.drawBlock(ctx, b.x, baseY - i * g.blockH, b.w, g.blockH - 3, hue, false);
    }
    // hareketli blok: hafif salınım + ışıltı
    const hue = (200 + (s.score + 1) * 14) % 360;
    const bob = Math.sin(g.t * 8) * 1.5;
    this.drawBlock(ctx, g.cur.x, baseY - n * g.blockH + bob, g.cur.w, g.blockH - 3, hue, true);

    // kusursuz bırakma parlaması
    if (g.flash > 0) {
      ctx.globalAlpha = g.flash * 1.8;
      ctx.fillStyle = '#fff';
      const top = g.placed[g.placed.length - 1];
      ctx.fillRect(top.x - 10, baseY - (n - 1) * g.blockH - 8, top.w + 20, g.blockH + 10);
      ctx.globalAlpha = Math.min(1, g.flash * 2.5);
      ctx.font = '900 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd700';
      ctx.fillText('KUSURSUZ! +2', s.w / 2, baseY - n * g.blockH - 40);
      ctx.globalAlpha = 1;
    }

    // zemin
    ctx.fillStyle = '#231a3f';
    ctx.fillRect(0, baseY + g.blockH - 3, s.w, s.h);
    ctx.fillStyle = 'rgba(255,255,255,.06)';
    ctx.fillRect(0, baseY + g.blockH - 3, s.w, 3);
  },
};
