export const flappy = {
  id: 'flappy',
  name: 'Zıp Kuş',
  emoji: '🐤',
  howTo: 'Dokunarak zıpla! Borulara çarpma, ⭐ topla (+2). Dikkat: ileride borular hareket eder!',

  init(s) {
    s.G = {
      y: s.h / 2, vy: 0, wing: 0, t: 0,
      pipes: [], stars: [],
      bgStars: Array.from({ length: 40 }, () => [Math.random(), Math.random(), 1 + Math.random() * 3]),
      timer: 0, speed: 160, ground: 0,
    };
  },

  tap(s) {
    s.G.vy = -380;
    s.G.wing = 0.25;
  },

  update(s, dt) {
    const g = s.G;
    g.t += dt;
    g.wing = Math.max(0, g.wing - dt);
    g.vy += 1100 * dt;
    g.y += g.vy * dt;
    g.ground = (g.ground + g.speed * dt) % 40;

    g.timer -= dt;
    if (g.timer <= 0) {
      g.timer = 1.6;
      // zorluk eğrisi: ilk borular geniş (ilk 5 puan ulaşılabilir), 20+ gerçekten dar
      const gap = Math.max(140, 228 - s.score * 3.2);
      const cy = 100 + Math.random() * (s.h - 220 - gap) + gap / 2;
      g.pipes.push({
        x: s.w + 40, cy, baseCy: cy, gap, passed: false,
        // dikey hareket 8 puandan sonra başlar, olasılığı ve genliği skorla artar
        osc: s.score >= 8 && Math.random() < Math.min(0.6, 0.25 + (s.score - 8) * 0.025),
        amp: 28 + Math.min(24, Math.max(0, s.score - 8) * 1.5),
        phase: Math.random() * Math.PI * 2,
      });
      if (Math.random() < 0.35) {
        g.stars.push({ x: s.w + 40 + g.speed * 0.8, y: 120 + Math.random() * (s.h - 280), got: false });
      }
    }

    const bx = s.w * 0.28, r = 15;
    for (const p of g.pipes) {
      p.x -= g.speed * dt;
      if (p.osc) {
        p.phase += dt * 1.6;
        p.cy = p.baseCy + Math.sin(p.phase) * p.amp;
      }
      if (!p.passed && p.x + 34 < bx) { p.passed = true; s.addScore(); g.speed = Math.min(300, g.speed + 4); }
      if (bx + r > p.x && bx - r < p.x + 68) {
        if (g.y - r < p.cy - p.gap / 2 || g.y + r > p.cy + p.gap / 2) return s.end();
      }
    }
    g.pipes = g.pipes.filter(p => p.x > -90);

    for (const st of g.stars) {
      st.x -= g.speed * dt;
      if (!st.got && Math.hypot(st.x - bx, st.y - g.y) < 30) { st.got = true; s.addScore(2); }
    }
    g.stars = g.stars.filter(st => st.x > -30 && !st.got);

    if (g.y < -20 || g.y + r > s.h - 46) return s.end();
  },

  draw(s, ctx) {
    const g = s.G;
    const sky = ctx.createLinearGradient(0, 0, 0, s.h);
    sky.addColorStop(0, '#0d1033');
    sky.addColorStop(0.6, '#2a1852');
    sky.addColorStop(1, '#4a2160');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, s.w, s.h);

    // parlayıp sönen yıldızlı gökyüzü
    for (const [fx, fy, sz] of g.bgStars) {
      ctx.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(g.t * 1.5 + fx * 20));
      ctx.fillStyle = '#cdd8ff';
      ctx.fillRect(fx * s.w, fy * s.h * 0.7, sz, sz);
    }
    ctx.globalAlpha = 1;

    // borular: gövde gradyanı + kapak
    for (const p of g.pipes) {
      const grad = ctx.createLinearGradient(p.x, 0, p.x + 68, 0);
      grad.addColorStop(0, '#157347');
      grad.addColorStop(0.4, '#2de2a3');
      grad.addColorStop(1, '#0e5c38');
      const topH = p.cy - p.gap / 2;
      const botY = p.cy + p.gap / 2;
      ctx.fillStyle = grad;
      ctx.fillRect(p.x + 4, 0, 60, topH - 18);
      ctx.fillRect(p.x + 4, botY + 18, 60, s.h - botY);
      // kapaklar
      ctx.fillStyle = '#20c98a';
      ctx.beginPath();
      ctx.roundRect(p.x, topH - 20, 68, 20, 4);
      ctx.roundRect(p.x, botY, 68, 20, 4);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.25)';
      ctx.fillRect(p.x + 8, 0, 8, topH - 18);
      ctx.fillRect(p.x + 8, botY + 18, 8, s.h - botY);
    }

    // yıldız bonusları
    for (const st of g.stars) {
      ctx.save();
      ctx.translate(st.x, st.y);
      ctx.rotate(g.t * 2);
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const rr = i % 2 === 0 ? 13 : 6;
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // kuş: vektör çizim
    const bx = s.w * 0.28;
    ctx.save();
    ctx.translate(bx, g.y);
    ctx.rotate(Math.max(-0.45, Math.min(0.75, g.vy / 650)));
    // gövde
    const body = ctx.createRadialGradient(-4, -5, 3, 0, 0, 17);
    body.addColorStop(0, '#ffe97a');
    body.addColorStop(1, '#ffb703');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, 0, 17, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    // kanat (zıplayınca çırpar)
    ctx.fillStyle = '#f48c06';
    ctx.beginPath();
    ctx.ellipse(-4, 2, 9, 6, g.wing > 0 ? -0.9 : 0.5, 0, Math.PI * 2);
    ctx.fill();
    // göz
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(7, -5, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1a24';
    ctx.beginPath(); ctx.arc(8.5, -5, 2.4, 0, Math.PI * 2); ctx.fill();
    // gaga
    ctx.fillStyle = '#ff6d00';
    ctx.beginPath();
    ctx.moveTo(14, 0); ctx.lineTo(24, 3); ctx.lineTo(14, 7);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    // kayan zemin
    ctx.fillStyle = '#1e1233';
    ctx.fillRect(0, s.h - 46, s.w, 46);
    ctx.fillStyle = '#3c2a63';
    for (let x = -g.ground; x < s.w; x += 40) {
      ctx.fillRect(x, s.h - 46, 22, 6);
    }
  },
};
