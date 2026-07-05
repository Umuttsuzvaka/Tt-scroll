export const reflex = {
  id: 'reflex',
  name: 'Refleks',
  emoji: '🎯',
  howTo: 'Hedefler kaybolmadan dokun! 5 puandan sonra bombalar gelir — onlara DOKUNMA. 10 puandan sonra çift hedef!',

  init(s) {
    s.G = { targets: [], bombs: [], life: 2.2, t: 0 };
    this.ensureTargets(s);
  },

  spawnPos(s, r) {
    return {
      x: r + 20 + Math.random() * (s.w - r * 2 - 40),
      y: r + 110 + Math.random() * (s.h - r * 2 - 240),
    };
  },

  ensureTargets(s) {
    const g = s.G;
    const want = s.score >= 10 ? 2 : 1;
    while (g.targets.filter(t => !t.dead).length < want) {
      const r = Math.max(26, 44 - s.score * 0.5);
      const p = this.spawnPos(s, r);
      g.targets.push({ ...p, r, life: g.life, timeLeft: g.life, dead: false });
    }
    // 5 puandan sonra ara sıra bomba
    if (s.score >= 5 && g.bombs.length < 1 && Math.random() < 0.5) {
      const p = this.spawnPos(s, 34);
      g.bombs.push({ ...p, r: 34, timeLeft: 1.6 + Math.random() });
    }
  },

  tap(s, x, y) {
    const g = s.G;
    for (const b of g.bombs) {
      if (Math.hypot(x - b.x, y - b.y) <= b.r + 8) return s.end();
    }
    for (const t of g.targets) {
      if (!t.dead && Math.hypot(x - t.x, y - t.y) <= t.r + 12) {
        t.dead = true;
        s.addScore();
        g.life = Math.max(0.55, g.life * 0.94);
        this.ensureTargets(s);
        return;
      }
    }
  },

  update(s, dt) {
    const g = s.G;
    g.t += dt;
    for (const t of g.targets) {
      if (t.dead) continue;
      t.timeLeft -= dt;
      if (t.timeLeft <= 0) return s.end();
    }
    g.targets = g.targets.filter(t => !t.dead);
    for (const b of g.bombs) b.timeLeft -= dt;
    g.bombs = g.bombs.filter(b => b.timeLeft > 0);
    this.ensureTargets(s);
  },

  draw(s, ctx) {
    const g = s.G;
    const bg = ctx.createRadialGradient(s.w / 2, s.h / 2, 40, s.w / 2, s.h / 2, s.h * 0.7);
    bg.addColorStop(0, '#14263c');
    bg.addColorStop(1, '#080f1a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, s.w, s.h);

    // teknik ızgara
    ctx.strokeStyle = 'rgba(90,140,200,.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < s.w; x += 44) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, s.h); ctx.stroke(); }
    for (let y = 0; y < s.h; y += 44) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s.w, y); ctx.stroke(); }

    for (const t of g.targets) {
      const frac = Math.max(0, t.timeLeft / t.life);
      const pulse = 1 + Math.sin(g.t * 6) * 0.04;
      // kalan süre halkası
      ctx.beginPath();
      ctx.arc(t.x, t.y, (t.r + 10) * pulse, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.strokeStyle = frac > 0.35 ? '#2de2a3' : '#fe2c55';
      ctx.lineWidth = 5;
      ctx.stroke();
      // hedef: nişangah tarzı halkalar
      ctx.shadowColor = '#fe2c55';
      ctx.shadowBlur = 22;
      const grad = ctx.createRadialGradient(t.x - t.r * 0.25, t.y - t.r * 0.25, 3, t.x, t.y, t.r);
      grad.addColorStop(0, '#ff7ea4');
      grad.addColorStop(1, '#e0164a');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(t.x, t.y, t.r * pulse, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,.85)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(t.x, t.y, t.r * 0.62, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(t.x, t.y, t.r * 0.28, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(t.x - t.r, t.y); ctx.lineTo(t.x + t.r, t.y);
      ctx.moveTo(t.x, t.y - t.r); ctx.lineTo(t.x, t.y + t.r);
      ctx.stroke();
    }

    for (const b of g.bombs) {
      const blink = b.timeLeft < 0.6 ? Math.abs(Math.sin(g.t * 12)) : 1;
      ctx.globalAlpha = 0.6 + 0.4 * blink;
      ctx.shadowColor = '#ff5400';
      ctx.shadowBlur = 18;
      const grad = ctx.createRadialGradient(b.x - 8, b.y - 8, 3, b.x, b.y, b.r);
      grad.addColorStop(0, '#4a4a5a');
      grad.addColorStop(1, '#15151f');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      // fitil
      ctx.strokeStyle = '#c98b4a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(b.x + b.r * 0.4, b.y - b.r * 0.8);
      ctx.quadraticCurveTo(b.x + b.r * 0.9, b.y - b.r * 1.4, b.x + b.r * 0.5, b.y - b.r * 1.6);
      ctx.stroke();
      // kıvılcım
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.arc(b.x + b.r * 0.5, b.y - b.r * 1.6, 4 + blink * 3, 0, Math.PI * 2); ctx.fill();
      ctx.font = `${b.r * 0.8}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('☠️', b.x, b.y);
      ctx.globalAlpha = 1;
    }
  },
};
