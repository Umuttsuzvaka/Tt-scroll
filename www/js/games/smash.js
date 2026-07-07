// Smash Hit tarzı: tünelde üzerine gelen camları kırarak ilerle
export const smash = {
  id: 'smash',
  name: 'Cam Kır',
  emoji: '💎',
  howTo: 'Üzerine gelen camlara dokunarak kır. Cam sana ulaşırsa oyun biter!',

  init(s) {
    s.G = {
      panes: [{ z: 1, ox: 0, baseOx: 0, osc: false, phase: 0, broken: false }],
      speed: 0.28,
      spawnTimer: 1.3,
      shards: [],
      dist: 0,
    };
  },

  // z=1 uzak, z=0 oyuncunun yüzü; ekrana yansıt
  project(s, pane) {
    const t = 1 - pane.z;
    const pw = 50 + t * t * s.w * 0.85;
    const ph = pw * 1.15;
    const cx = s.w / 2 + pane.ox * s.w * 0.4 * t;
    const cy = s.h * 0.42 + t * s.h * 0.1;
    return { x: cx - pw / 2, y: cy - ph / 2, w: pw, h: ph, t };
  },

  tap(s, x, y) {
    const g = s.G;
    // en yakın (en büyük görünen) kırılmamış camdan başla
    const sorted = [...g.panes].filter(p => !p.broken).sort((a, b) => a.z - b.z);
    for (const p of sorted) {
      const r = this.project(s, p);
      if (x >= r.x - 14 && x <= r.x + r.w + 14 && y >= r.y - 14 && y <= r.y + r.h + 14) {
        p.broken = true;
        s.addScore();
        g.speed = Math.min(0.5, g.speed + 0.008); // hız tavanı: oynanabilir kalsın
        for (let i = 0; i < 14; i++) {
          g.shards.push({
            x: r.x + Math.random() * r.w, y: r.y + Math.random() * r.h,
            vx: (Math.random() - 0.5) * 500, vy: -Math.random() * 300,
            size: 4 + r.t * 10, life: 0.7,
          });
        }
        return;
      }
    }
  },

  update(s, dt) {
    const g = s.G;
    // öğrenme eğrisi: ilk 2 cam belirgin şekilde yavaş gelsin
    const spd = g.speed * (s.score < 2 ? 0.65 : 1);
    g.dist += spd * dt;
    for (const p of g.panes) {
      p.z -= spd * dt;
      // 8 puandan sonra bazı camlar yanlara kayar
      if (p.osc) {
        p.phase += dt * 2.2;
        p.ox = p.baseOx + Math.sin(p.phase) * 0.3;
      }
      if (p.z <= 0.02 && !p.broken) return s.end();
    }
    g.panes = g.panes.filter(p => p.z > 0.02);

    g.spawnTimer -= dt;
    if (g.spawnTimer <= 0) {
      g.spawnTimer = Math.max(0.7, 1.3 - s.score * 0.02);
      const baseOx = Math.random() * 1.4 - 0.7;
      g.panes.push({
        z: 1, ox: baseOx, baseOx,
        osc: s.score >= 8 && Math.random() < 0.45,
        phase: Math.random() * Math.PI * 2,
        broken: false,
      });
    }

    for (const sh of g.shards) {
      sh.vy += 900 * dt;
      sh.x += sh.vx * dt;
      sh.y += sh.vy * dt;
      sh.life -= dt;
    }
    g.shards = g.shards.filter(sh => sh.life > 0);
  },

  draw(s, ctx) {
    const g = s.G;
    const bg = ctx.createLinearGradient(0, 0, 0, s.h);
    bg.addColorStop(0, '#0b1030');
    bg.addColorStop(1, '#101a45');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, s.w, s.h);

    // tünel derinlik halkaları — ilerledikçe üzerine akar
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
      const t = ((i / 8) + (g.dist % 1)) % 1;
      const pw = 50 + t * t * s.w * 0.95;
      const ph = pw * 1.15;
      ctx.strokeStyle = `rgba(120,160,255,${0.05 + t * 0.2})`;
      ctx.strokeRect(s.w / 2 - pw / 2, s.h * 0.42 + t * s.h * 0.1 - ph / 2, pw, ph);
    }

    // uzak camlar önce çizilsin
    const sorted = [...g.panes].sort((a, b) => b.z - a.z);
    for (const p of sorted) {
      if (p.broken) continue;
      const r = this.project(s, p);
      // cam yüzeyi: köşeden aydınlanan gradyan
      const glass = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
      glass.addColorStop(0, `rgba(190, 240, 255, ${0.35 + r.t * 0.25})`);
      glass.addColorStop(0.5, `rgba(110, 200, 250, ${0.2 + r.t * 0.2})`);
      glass.addColorStop(1, `rgba(70, 150, 220, ${0.3 + r.t * 0.25})`);
      ctx.fillStyle = glass;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      // ışıldayan çerçeve
      ctx.shadowColor = '#7fdfff';
      ctx.shadowBlur = 8 + r.t * 14;
      ctx.strokeStyle = 'rgba(210, 245, 255, .95)';
      ctx.lineWidth = 2 + r.t * 2.5;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.shadowBlur = 0;
      // çift parlama çizgisi
      ctx.strokeStyle = 'rgba(255,255,255,.55)';
      ctx.lineWidth = 1.5 + r.t * 2;
      ctx.beginPath();
      ctx.moveTo(r.x + r.w * 0.15, r.y + r.h * 0.82);
      ctx.lineTo(r.x + r.w * 0.55, r.y + r.h * 0.15);
      ctx.moveTo(r.x + r.w * 0.32, r.y + r.h * 0.9);
      ctx.lineTo(r.x + r.w * 0.72, r.y + r.h * 0.23);
      ctx.stroke();
    }

    ctx.fillStyle = '#aee6ff';
    for (const sh of g.shards) {
      ctx.globalAlpha = Math.max(0, sh.life / 0.7);
      ctx.fillRect(sh.x, sh.y, sh.size, sh.size);
    }
    ctx.globalAlpha = 1;

    // kenar karartması (vinyet)
    const vin = ctx.createRadialGradient(s.w / 2, s.h / 2, s.h * 0.3, s.w / 2, s.h / 2, s.h * 0.75);
    vin.addColorStop(0, 'transparent');
    vin.addColorStop(1, 'rgba(0,0,10,.55)');
    ctx.fillStyle = vin;
    ctx.fillRect(0, 0, s.w, s.h);
  },
};
