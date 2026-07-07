const COLORS = [
  { name: 'KIRMIZI', hex: '#fe2c55' },
  { name: 'YEŞİL', hex: '#2de2a3' },
  { name: 'MAVİ', hex: '#3d9bff' },
  { name: 'SARI', hex: '#ffd700' },
];

export const colortap = {
  id: 'colortap',
  name: 'Renk Yakala',
  emoji: '🌈',
  howTo: 'Daire istenen renk olunca dokun! 8 puandan sonra dikkat: yazının RENGİ değil ANLAMI geçerli!',

  // hedefle eşleşmeyen rastgele bir renk indeksi (bedava puanı engeller)
  randOther(idx) {
    return (idx + 1 + Math.floor(Math.random() * (COLORS.length - 1))) % COLORS.length;
  },

  init(s) {
    const targetIdx = Math.floor(Math.random() * COLORS.length);
    s.G = {
      targetIdx,
      inkIdx: targetIdx, // yazının mürekkep rengi (Stroop tuzağı)
      current: this.randOther(targetIdx), // başlangıçta asla hedefle eşleşmesin
      interval: 0.85,
      timer: 0,
      matchDeadline: 0,
      stroopOn: false, // Stroop modu etkin mi
      stroopWarn: 0,   // mod geçiş uyarısının kalan süresi
      t: 0,
    };
  },

  newTarget(s) {
    const g = s.G;
    g.targetIdx = Math.floor(Math.random() * COLORS.length);
    // Stroop modu: 8 puandan sonra yazı yanıltıcı renkte yazılır
    if (s.score >= 8 && Math.random() < 0.7) {
      do { g.inkIdx = Math.floor(Math.random() * COLORS.length); }
      while (g.inkIdx === g.targetIdx);
    } else {
      g.inkIdx = g.targetIdx;
    }
  },

  tap(s) {
    const g = s.G;
    if (g.stroopWarn > 0) return; // uyarı sırasında dokunuş cezalandırılmasın
    if (g.current === g.targetIdx) {
      s.addScore();
      g.interval = Math.max(0.35, g.interval * 0.95);
      this.newTarget(s);
      g.timer = 0;
      g.current = this.randOther(g.targetIdx); // yeni tur da eşleşmeden başlasın
      g.matchDeadline = 0;
    } else {
      s.end();
    }
  },

  update(s, dt) {
    const g = s.G;
    g.t += dt;
    // Stroop moduna geçiş: kısa bir uyarı göster, uyarı boyunca oyunu duraklat
    if (!g.stroopOn && s.score >= 8) {
      g.stroopOn = true;
      g.stroopWarn = 1.4;
    }
    if (g.stroopWarn > 0) {
      g.stroopWarn -= dt;
      return; // oyuncu uyarıyı okusun, süre işlemesin
    }
    g.timer += dt;
    if (g.matchDeadline > 0) {
      g.matchDeadline -= dt;
      if (g.matchDeadline <= 0) return s.end();
    }
    if (g.timer >= g.interval) {
      g.timer = 0;
      g.current = (g.current + 1 + Math.floor(Math.random() * (COLORS.length - 1))) % COLORS.length;
      g.matchDeadline = g.current === g.targetIdx ? g.interval * 0.98 : 0;
    }
  },

  draw(s, ctx) {
    const g = s.G;
    const bg = ctx.createRadialGradient(s.w / 2, s.h * 0.55, 50, s.w / 2, s.h * 0.55, s.h * 0.7);
    bg.addColorStop(0, '#1c1c30');
    bg.addColorStop(1, '#0c0c16');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, s.w, s.h);

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,.8)';
    ctx.font = '700 16px sans-serif';
    ctx.fillText(g.stroopOn ? 'YAZININ ANLAMINA GÖRE!' : 'İSTENEN RENK', s.w / 2, s.h * 0.25);

    // hedef kelime — Stroop: mürekkep rengi yanıltabilir
    ctx.font = '900 46px sans-serif';
    ctx.fillStyle = COLORS[g.inkIdx].hex;
    ctx.shadowColor = COLORS[g.inkIdx].hex;
    ctx.shadowBlur = 24;
    ctx.fillText(COLORS[g.targetIdx].name, s.w / 2, s.h * 0.33);
    ctx.shadowBlur = 0;

    const cx = s.w / 2, cy = s.h * 0.58;
    const r = Math.min(s.w, s.h) * 0.17;
    const cur = COLORS[g.current];

    // eşleşme süre halkası
    if (g.matchDeadline > 0) {
      const frac = g.matchDeadline / (g.interval * 0.98);
      ctx.beginPath();
      ctx.arc(cx, cy, r + 16, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 6;
      ctx.stroke();
    }

    // parlak cam küre görünümü
    ctx.shadowColor = cur.hex;
    ctx.shadowBlur = 40;
    const orb = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r);
    orb.addColorStop(0, '#ffffff');
    orb.addColorStop(0.25, cur.hex);
    orb.addColorStop(1, cur.hex);
    ctx.fillStyle = orb;
    ctx.beginPath();
    ctx.arc(cx, cy, r * (1 + Math.sin(g.t * 5) * 0.02), 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // spekular parlama
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.32, cy - r * 0.42, r * 0.22, r * 0.12, -0.6, 0, Math.PI * 2);
    ctx.fill();

    // Stroop moduna geçiş uyarısı: yanıp sönen banner
    if (g.stroopWarn > 0) {
      const blink = 0.55 + 0.45 * Math.abs(Math.sin(g.t * 9));
      ctx.globalAlpha = blink;
      ctx.fillStyle = '#ffd700';
      ctx.font = '900 34px sans-serif';
      ctx.fillText('DİKKAT!', s.w / 2, s.h * 0.42);
      ctx.font = '800 17px sans-serif';
      ctx.fillText('Artık yazının ANLAMI geçerli', s.w / 2, s.h * 0.46);
      ctx.globalAlpha = 1;
    }
  },
};
