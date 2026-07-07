// Basket At — dönen nişanı doğru anda bırak, sayıyı bas!
export const basket = {
  id: 'basket',
  name: 'Basket At',
  emoji: '🏀',
  howTo: 'Nişan çizgisi sallanıyor — doğru anda dokun ve sayı at! 3 kaçırma hakkın var.',

  init(s) {
    s.G = {
      hoopX: s.w / 2,
      ball: null, // { x, y, vx, vy }
      aim: 0,
      missed: 0,
      t: 0,
      swish: 0,
    };
  },

  startPos(s) { return { x: s.w / 2, y: s.h * 0.82 }; },
  hoop(s) { return { x: s.G.hoopX, y: s.h * 0.24, w: 76 }; },

  tap(s) {
    const g = s.G;
    if (g.ball) return;
    const p = this.startPos(s);
    const angle = -Math.PI / 2 + g.aim;
    const v = s.h * 1.35;
    g.ball = { x: p.x, y: p.y, vx: Math.cos(angle) * v, vy: Math.sin(angle) * v, scored: false };
  },

  update(s, dt) {
    const g = s.G;
    g.t += dt;
    g.swish = Math.max(0, g.swish - dt);
    // nişan salınımı: skorla hızlanır
    g.aim = Math.sin(g.t * (1.6 + s.score * 0.12)) * 0.62;

    if (g.ball) {
      const b = g.ball;
      b.vy += s.h * 1.7 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      const h = this.hoop(s);
      // rim uçlarına basit çarpışma: top çember kenarına gelince gerçekçi biçimde seker
      for (const ex of [h.x - h.w / 2, h.x + h.w / 2]) {
        const dx = b.x - ex, dy = b.y - h.y;
        const d = Math.hypot(dx, dy);
        const rr = 21; // top yarıçapı (18) + rim kalınlığı payı
        if (d > 0.001 && d < rr) {
          const nx = dx / d, ny = dy / d;
          const dot = b.vx * nx + b.vy * ny;
          if (dot < 0) {
            // hızı normale göre yansıt (sönümlü) — top rim ucundan seker
            b.vx -= 1.5 * dot * nx;
            b.vy -= 1.5 * dot * ny;
          }
          // topu rimin dışına it (iç içe sıkışma olmasın)
          b.x = ex + nx * rr;
          b.y = h.y + ny * rr;
        }
      }
      // sayı: çember hizasından aşağı yönlü geçiş
      if (!b.scored && b.vy > 0 && b.y > h.y - 6 && b.y < h.y + 18 && Math.abs(b.x - h.x) < h.w / 2 - 10) {
        b.scored = true;
        s.addScore();
        g.swish = 0.5;
        // pota hemen ışınlanmasın: top sahadan çıkınca yeni yerine geçer
        g.nextHoopX = s.w * 0.25 + Math.random() * s.w * 0.5;
      }
      if (b.y > s.h + 40 || b.x < -40 || b.x > s.w + 40) {
        if (!b.scored) {
          g.missed++;
          if (g.missed >= 3) return s.end();
        }
        g.ball = null;
        if (g.nextHoopX != null) {
          g.hoopX = g.nextHoopX;
          g.nextHoopX = null;
        }
      }
    }
  },

  draw(s, ctx) {
    const g = s.G;
    // salon zemini
    const bg = ctx.createLinearGradient(0, 0, 0, s.h);
    bg.addColorStop(0, '#1a1030');
    bg.addColorStop(0.55, '#2a1a3d');
    bg.addColorStop(0.56, '#8a5a2b');
    bg.addColorStop(1, '#6d4520');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, s.w, s.h);
    // parke çizgileri
    ctx.strokeStyle = 'rgba(0,0,0,.15)';
    ctx.lineWidth = 2;
    for (let y = s.h * 0.56; y < s.h; y += 26) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s.w, y); ctx.stroke();
    }

    const h = this.hoop(s);
    // panya (backboard)
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.beginPath();
    ctx.roundRect(h.x - 55, h.y - 74, 110, 66, 6);
    ctx.fill();
    ctx.strokeStyle = '#e63946';
    ctx.lineWidth = 3;
    ctx.strokeRect(h.x - 22, h.y - 46, 44, 32);
    // çember
    ctx.strokeStyle = g.swish > 0 ? '#2de2a3' : '#e63946';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(h.x - h.w / 2, h.y);
    ctx.lineTo(h.x + h.w / 2, h.y);
    ctx.stroke();
    // file: üstte çember genişliğinde, altta simetrik daralan ağ
    ctx.strokeStyle = 'rgba(255,255,255,.65)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i <= 6; i++) {
      const topX = h.x - h.w / 2 + (h.w / 6) * i;
      const botX = h.x - h.w / 4 + (h.w / 2 / 6) * i;
      ctx.beginPath();
      ctx.moveTo(topX, h.y);
      ctx.lineTo(botX, h.y + 38);
      ctx.stroke();
    }
    // çapraz ağ çizgileri (gerçek file görünümü)
    for (let i = 0; i <= 6; i++) {
      const topX = h.x + h.w / 2 - (h.w / 6) * i;
      const botX = h.x + h.w / 4 - (h.w / 2 / 6) * i;
      ctx.beginPath();
      ctx.moveTo(topX, h.y);
      ctx.lineTo(botX, h.y + 38);
      ctx.stroke();
    }
    if (g.swish > 0) {
      ctx.fillStyle = '#2de2a3';
      ctx.font = '900 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SAYI! 🎉', h.x, h.y - 90);
    }

    const p = this.startPos(s);
    // nişan çizgisi (top yokken)
    if (!g.ball) {
      const angle = -Math.PI / 2 + g.aim;
      ctx.strokeStyle = 'rgba(255,255,255,.5)';
      ctx.setLineDash([4, 10]);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 20);
      ctx.lineTo(p.x + Math.cos(angle) * s.h * 0.34, p.y + Math.sin(angle) * s.h * 0.34);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // basketbol topu (vektör)
    const bp = g.ball || p;
    ctx.save();
    ctx.translate(bp.x, bp.y);
    if (g.ball) ctx.rotate(g.t * 6);
    const ballG = ctx.createRadialGradient(-5, -5, 3, 0, 0, 19);
    ballG.addColorStop(0, '#ff9f4a');
    ballG.addColorStop(1, '#e06d10');
    ctx.fillStyle = ballG;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(60,20,0,.7)';
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(18, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, 18); ctx.stroke();
    ctx.beginPath(); ctx.arc(-22, 0, 16, -Math.PI / 3, Math.PI / 3); ctx.stroke();
    ctx.beginPath(); ctx.arc(22, 0, 16, Math.PI - Math.PI / 3, Math.PI + Math.PI / 3); ctx.stroke();
    ctx.restore();

    // kaçırma hakları
    ctx.font = '18px serif';
    ctx.textAlign = 'center';
    let hearts = '';
    for (let i = 0; i < 3; i++) hearts += i < 3 - g.missed ? '🏀' : '⚫';
    ctx.fillText(hearts, s.w / 2, s.h * 0.94);
  },
};
