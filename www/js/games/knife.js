// Bıçak Fırlat (Knife Hit tarzı) — dönen kütüğe bıçak sapla, bıçaklar çakışmasın!
export const knife = {
  id: 'knife',
  name: 'Bıçak Fırlat',
  emoji: '🔪',
  howTo: 'Dokunarak bıçak fırlat! Saplı bıçaklara çarpma. Her 8 bıçakta kütük yenilenir ve hızlanır.',

  init(s) {
    s.G = {
      rot: 0,
      dir: 1,
      baseSpeed: 1.6,
      knives: [],   // kütüğe saplı bıçakların yerel açıları
      flying: null, // { y } fırlatılan bıçak
      shake: 0,     // saplanma sarsıntısı (recoil) zamanlayıcısı
      t: 0,
    };
  },

  center(s) { return { x: s.w / 2, y: s.h * 0.36, r: Math.min(s.w, s.h) * 0.17 }; },

  tap(s) {
    const g = s.G;
    if (g.flying) return; // bıçak zaten havada
    g.flying = { y: s.h * 0.88 };
  },

  update(s, dt) {
    const g = s.G;
    g.t += dt;
    g.shake = Math.max(0, g.shake - dt);
    // hız deseni: skorla artar + dalgalanır, ara sıra yön değişir
    const speed = (g.baseSpeed + s.score * 0.06) * (1 + Math.sin(g.t * 1.3) * 0.35);
    g.rot += speed * g.dir * dt;

    if (g.flying) {
      const c = this.center(s);
      g.flying.y -= 1900 * dt;
      if (g.flying.y <= c.y + c.r) {
        // temas: alttan giren bıçağın kütükteki yerel açısı
        const local = ((Math.PI / 2 - g.rot) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        // çakışma eşiği: bıçak namlusu ~10px genişliğinde — kütük yarıçapında
        // kapladığı gerçek açı + küçük pay; böylece görsel ile his örtüşür
        const thresh = Math.max(0.12, 15 / c.r);
        const clash = g.knives.some(a => {
          let d = Math.abs(a - local) % (Math.PI * 2);
          if (d > Math.PI) d = Math.PI * 2 - d;
          return d < thresh;
        });
        g.flying = null;
        if (clash) return s.end();
        g.knives.push(local);
        g.shake = 0.18; // kütük saplanma anında hafifçe sarsılır
        s.addScore();
        if (s.score % 8 === 0) {
          g.knives = [];            // yeni kütük!
          g.dir = -g.dir;
          g.baseSpeed += 0.35;
        }
      }
    }
  },

  drawKnife(ctx, x, y, angle, len = 52) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    // sap
    ctx.fillStyle = '#6b2737';
    ctx.beginPath();
    ctx.roundRect(-4.5, len * 0.35, 9, len * 0.62, 4);
    ctx.fill();
    ctx.fillStyle = '#9c3848';
    ctx.fillRect(-4.5, len * 0.5, 9, 5);
    // namlu
    const blade = ctx.createLinearGradient(-4, 0, 4, 0);
    blade.addColorStop(0, '#e8ecf1');
    blade.addColorStop(1, '#9aa5b1');
    ctx.fillStyle = blade;
    ctx.beginPath();
    ctx.moveTo(0, -len * 0.5);
    ctx.lineTo(5, len * 0.4);
    ctx.lineTo(-5, len * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },

  draw(s, ctx) {
    const g = s.G;
    const bg = ctx.createRadialGradient(s.w / 2, s.h * 0.36, 40, s.w / 2, s.h / 2, s.h * 0.75);
    bg.addColorStop(0, '#2b2036');
    bg.addColorStop(1, '#120d1a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, s.w, s.h);

    const c = this.center(s);
    // saplanma sarsıntısı: kütük ve bıçaklar birlikte hafifçe titrer
    c.y += g.shake > 0 ? Math.sin(g.shake * 55) * g.shake * 38 : 0;

    // saplı bıçaklar (kütükle döner) — kütükten dışarı sarkar
    for (const a of g.knives) {
      const world = a + g.rot;
      const bx = c.x + Math.cos(world) * (c.r + 24);
      const by = c.y + Math.sin(world) * (c.r + 24);
      this.drawKnife(ctx, bx, by, world + Math.PI / 2);
    }

    // kütük: ahşap doku
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(g.rot);
    const wood = ctx.createRadialGradient(-c.r * 0.2, -c.r * 0.2, 5, 0, 0, c.r);
    wood.addColorStop(0, '#b07d4a');
    wood.addColorStop(0.7, '#8a5a2b');
    wood.addColorStop(1, '#5d3a1e');
    ctx.fillStyle = wood;
    ctx.beginPath();
    ctx.arc(0, 0, c.r, 0, Math.PI * 2);
    ctx.fill();
    // yaş halkaları
    ctx.strokeStyle = 'rgba(60,35,15,.4)';
    ctx.lineWidth = 2;
    for (const rr of [0.35, 0.6, 0.82]) {
      ctx.beginPath();
      ctx.arc(0, 0, c.r * rr, 0, Math.PI * 2);
      ctx.stroke();
    }
    // budak
    ctx.fillStyle = 'rgba(60,35,15,.5)';
    ctx.beginPath();
    ctx.ellipse(c.r * 0.4, -c.r * 0.3, 7, 5, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // dış çember ışıltısı
    ctx.strokeStyle = 'rgba(255,210,63,.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r + 4, 0, Math.PI * 2);
    ctx.stroke();

    // uçan bıçak + bekleyen bıçak
    if (g.flying) {
      this.drawKnife(ctx, s.w / 2, g.flying.y, 0, 58);
    } else {
      this.drawKnife(ctx, s.w / 2, s.h * 0.88, 0, 58);
      // fırlatma ipucu halkası
      ctx.strokeStyle = 'rgba(255,255,255,.15)';
      ctx.beginPath();
      ctx.arc(s.w / 2, s.h * 0.88, 44 + Math.sin(g.t * 5) * 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // sonraki kütüğe kalan bıçak sayısı
    const left = 8 - (s.score % 8);
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    ctx.font = '700 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Yeni kütüğe: ${left} bıçak`, s.w / 2, s.h * 0.66);
  },
};
