// Zıpla Zıpla (Doodle Jump tarzı) — parmağınla karakteri yönlendir
export const jump = {
  id: 'jump',
  name: 'Zıpla Zıpla',
  emoji: '🦘',
  howTo: 'Parmağını sağa-sola gezdirerek karakteri yönlendir! Platformlara zıpla, yükseldikçe puan kazan.',
  quietTaps: true,

  init(s) {
    s.G = {
      p: { x: s.w / 2, y: s.h * 0.7, vy: -700, targetX: s.w / 2 },
      plats: [],
      height: 0,
      clouds: Array.from({ length: 5 }, () => [Math.random(), Math.random(), 0.5 + Math.random()]),
    };
    // başlangıç platformları
    for (let y = s.h - 20; y > -60; y -= 85) this.addPlat(s, y);
  },

  // zorluk eğrisi: 0 (başlangıç) → 1 (6000px yükseklikte tavan)
  diff(g) { return Math.min(1, g.height / 6000); },

  // yükseldikçe platform aralığı hafif açılır: 85 → 110px
  // (zıplama yüksekliği ~190px, her zaman rahatça yetişilir)
  gap(g) { return 85 + this.diff(g) * 25; },

  addPlat(s, y) {
    const g = s.G;
    const d = this.diff(g);
    // yükseldikçe hareketli platform oranı artar: %25 → %55
    const moving = g.height > 800 && Math.random() < 0.25 + d * 0.3;
    // yükseldikçe platformlar daralır: 74 → 58px
    const w = Math.round(74 - d * 16);
    g.plats.push({
      x: 20 + Math.random() * (s.w - 40 - w), y, w,
      moving, vx: moving ? (Math.random() < 0.5 ? -1 : 1) * (70 + Math.random() * 60) : 0,
    });
  },

  tap() { },

  swipe(s, x) {
    s.G.p.targetX = x;
  },

  update(s, dt) {
    const g = s.G;
    const p = g.p;

    p.x += (p.targetX - p.x) * Math.min(1, dt * 10);
    p.vy += 1500 * dt;
    p.y += p.vy * dt;

    for (const pl of g.plats) {
      if (pl.moving) {
        pl.x += pl.vx * dt;
        if (pl.x < 10 || pl.x + pl.w > s.w - 10) pl.vx = -pl.vx;
      }
      // düşerken platform üstünden geçiş = zıpla
      if (p.vy > 0 && p.y + 16 > pl.y && p.y + 16 < pl.y + 20 && p.x > pl.x - 12 && p.x < pl.x + pl.w + 12) {
        p.vy = -760;
      }
    }

    // kamera: oyuncu üst bölgeye çıkınca dünya aşağı kayar
    if (p.y < s.h * 0.42) {
      const shift = s.h * 0.42 - p.y;
      p.y += shift;
      g.height += shift;
      for (const pl of g.plats) pl.y += shift;
      const newScore = Math.floor(g.height / 60);
      if (newScore > s.score) s.setScore(newScore);
    }

    g.plats = g.plats.filter(pl => pl.y < s.h + 40);
    let topY = Math.min(...g.plats.map(pl => pl.y));
    while (topY > -40) { topY -= this.gap(g); this.addPlat(s, topY); }

    if (p.y > s.h + 30) return s.end();
  },

  draw(s, ctx) {
    const g = s.G;
    const bg = ctx.createLinearGradient(0, 0, 0, s.h);
    bg.addColorStop(0, '#8ed6ff');
    bg.addColorStop(1, '#d9f2ff');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, s.w, s.h);

    // bulutlar (yavaş paralaks)
    for (const [cx, cy, sc] of g.clouds) {
      const y = ((cy * s.h + g.height * 0.15) % (s.h + 80)) - 40;
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      for (const [dx, r] of [[-22, 16], [0, 22], [24, 15]]) {
        ctx.beginPath();
        ctx.arc(cx * s.w + dx * sc, y, r * sc, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // platformlar
    for (const pl of g.plats) {
      ctx.fillStyle = 'rgba(0,0,0,.12)';
      ctx.beginPath();
      ctx.roundRect(pl.x + 2, pl.y + 4, pl.w, 14, 8);
      ctx.fill();
      const grad = ctx.createLinearGradient(pl.x, pl.y, pl.x, pl.y + 14);
      grad.addColorStop(0, pl.moving ? '#5ab8ff' : '#7ed957');
      grad.addColorStop(1, pl.moving ? '#2d8fd9' : '#4c9c33');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(pl.x, pl.y, pl.w, 14, 8);
      ctx.fill();
    }

    // karakter: sevimli yeşil blob
    const p = g.p;
    const squash = p.vy < -300 ? 1.12 : p.vy > 300 ? 0.9 : 1;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(2 - squash, squash);
    const body = ctx.createRadialGradient(-4, -6, 3, 0, 0, 18);
    body.addColorStop(0, '#b7f26e');
    body.addColorStop(1, '#6dbb3c');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    // gözler
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-5, -5, 4.5, 0, Math.PI * 2); ctx.arc(5, -5, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(-4, -4.5, 2, 0, Math.PI * 2); ctx.arc(6, -4.5, 2, 0, Math.PI * 2); ctx.fill();
    // ayaklar
    ctx.fillStyle = '#4c8c2b';
    ctx.beginPath();
    ctx.ellipse(-7, 16, 5, 3.5, 0, 0, Math.PI * 2);
    ctx.ellipse(7, 16, 5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },
};
