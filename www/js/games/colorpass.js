// Renk Geçidi (Color Switch tarzı) — topunla aynı renkteki bölümden geç!
const CP_COLORS = ['#fe2c55', '#ffd23f', '#2de2a3', '#3d9bff'];

export const colorpass = {
  id: 'colorpass',
  name: 'Renk Geçidi',
  emoji: '🎡',
  howTo: 'Dokun: top zıplar! Dönen halkanın SENİN RENGİNDEKİ bölümünden geç, diğer renklere değme!',

  init(s) {
    s.G = {
      ball: { y: s.h * 0.72, vy: 0, r: 12, color: Math.floor(Math.random() * 4) },
      rings: [{ y: -60, rot: Math.random() * Math.PI * 2, passed: false }],
      speed: 55,
      t: 0,
    };
  },

  tap(s) {
    s.G.ball.vy = -330;
  },

  update(s, dt) {
    const g = s.G;
    g.t += dt;
    const b = g.ball;
    b.vy += 850 * dt;
    b.y += b.vy * dt;
    // top ekranda kalsın
    if (b.y > s.h * 0.86) { b.y = s.h * 0.86; b.vy = 0; }
    if (b.y < s.h * 0.1) { b.y = s.h * 0.1; b.vy = 60; }

    const R = s.w * 0.34, band = 15;
    for (const ring of g.rings) {
      ring.y += g.speed * dt;
      ring.rot += dt * (0.9 + s.score * 0.05);
      // top halka bandının içinde mi? (top hep merkez sütununda)
      const dy = Math.abs(b.y - ring.y);
      if (dy > R - band && dy < R + band) {
        // temas açısı: top halkanın altında mı üstünde mi
        const angle = b.y > ring.y ? Math.PI / 2 : -Math.PI / 2;
        let local = ((angle - ring.rot) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const seg = Math.floor(local / (Math.PI / 2));
        if (seg !== b.color) return s.end();
      }
      if (!ring.passed && ring.y - R > b.y + b.r) {
        ring.passed = true;
        s.addScore();
        b.color = Math.floor(Math.random() * 4); // yeni renk!
      }
    }
    g.rings = g.rings.filter(r => r.y < s.h + R + 40);
    const minY = Math.min(...g.rings.map(r => r.y));
    if (minY > s.h * 0.15) {
      // halka aralığı en az 2R + pay: bir halka geçilip yeni renk atandığında
      // top bir sonraki halkanın bandına asla değiyor olamaz (anında ölüm yok)
      const gap = Math.max(s.h * 0.62, R * 2 + 120);
      g.rings.push({ y: minY - gap, rot: Math.random() * Math.PI * 2, passed: false });
    }
    g.speed = 55 + s.score * 2.5;
  },

  draw(s, ctx) {
    const g = s.G;
    ctx.fillStyle = '#0d0d18';
    ctx.fillRect(0, 0, s.w, s.h);

    // yıldız tozu
    ctx.fillStyle = 'rgba(255,255,255,.25)';
    for (let i = 0; i < 25; i++) {
      const x = (i * 137.5) % s.w;
      const y = ((i * 97 + g.t * 25) % s.h);
      ctx.fillRect(x, y, 2, 2);
    }

    const R = s.w * 0.34;
    for (const ring of g.rings) {
      for (let seg = 0; seg < 4; seg++) {
        ctx.strokeStyle = CP_COLORS[seg];
        ctx.lineWidth = 16;
        ctx.lineCap = 'butt';
        ctx.beginPath();
        ctx.arc(s.w / 2, ring.y, R, ring.rot + seg * Math.PI / 2 + 0.06, ring.rot + (seg + 1) * Math.PI / 2 - 0.06);
        ctx.stroke();
      }
    }

    // top
    const b = g.ball;
    ctx.shadowColor = CP_COLORS[b.color];
    ctx.shadowBlur = 22;
    ctx.fillStyle = CP_COLORS[b.color];
    ctx.beginPath();
    ctx.arc(s.w / 2, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.beginPath();
    ctx.arc(s.w / 2 - 4, b.y - 4, 4, 0, Math.PI * 2);
    ctx.fill();

    // renk hatırlatıcısı
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.font = '600 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Senin rengin ⬆', s.w / 2, s.h * 0.93);
  },
};
