// Oduncu (Timberman tarzı) — sola/sağa dokunarak ağacı kes, dallardan kaç!
export const lumber = {
  id: 'lumber',
  name: 'Oduncu',
  emoji: '🪓',
  howTo: 'Sola/sağa dokunarak ağacı kes! Dallar sana çarpmasın. Süre azalır, her vuruş süre ekler!',

  init(s) {
    s.G = {
      segs: [],   // alttan üste: { branch: 'none'|'left'|'right' }
      side: 'left',
      time: 5, maxTime: 5,
      chop: 0,     // balta sallama animasyonu
    };
    for (let i = 0; i < 8; i++) {
      s.G.segs.push({ branch: i < 3 ? 'none' : this.randBranch(s.G.segs[i - 1]) });
    }
  },

  randBranch(prev) {
    // art arda aynı taraf gelmesin diye hafif denge
    const r = Math.random();
    if (r < 0.35) return 'none';
    if (prev && prev.branch === 'left') return r < 0.75 ? 'right' : 'none';
    if (prev && prev.branch === 'right') return r < 0.75 ? 'left' : 'none';
    return r < 0.68 ? 'left' : 'right';
  },

  tap(s, x) {
    const g = s.G;
    g.side = x < s.w / 2 ? 'left' : 'right';
    // yana geçtiğinde o hizadaki dal öldürür
    if (g.segs[0].branch === g.side) return s.end();
    // kes!
    g.segs.shift();
    g.segs.push({ branch: this.randBranch(g.segs[g.segs.length - 1]) });
    // yeni inen dal üstüne düşerse ölürsün
    if (g.segs[0].branch === g.side) { s.addScore(); return s.end(); }
    s.addScore();
    g.time = Math.min(g.maxTime, g.time + 0.32);
    g.maxTime = Math.max(3, 5 - s.score * 0.02);
    g.chop = 0.15;
  },

  update(s, dt) {
    const g = s.G;
    g.time -= dt;
    g.chop = Math.max(0, g.chop - dt);
    if (g.time <= 0) s.end();
  },

  draw(s, ctx) {
    const g = s.G;
    const bg = ctx.createLinearGradient(0, 0, 0, s.h);
    bg.addColorStop(0, '#2c1f4a');
    bg.addColorStop(0.7, '#4a2a5c');
    bg.addColorStop(1, '#1c3a24');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, s.w, s.h);

    // ay
    ctx.fillStyle = '#f4ecd6';
    ctx.shadowColor = '#f4ecd6';
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(s.w * 0.82, s.h * 0.14, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // zemin
    ctx.fillStyle = '#14290f';
    ctx.fillRect(0, s.h * 0.86, s.w, s.h * 0.14);

    const trunkW = 74;
    const segH = 66;
    const cx = s.w / 2;
    const baseY = s.h * 0.86;

    // gövde parçaları + dallar
    for (let i = 0; i < g.segs.length; i++) {
      const y = baseY - (i + 1) * segH;
      const grad = ctx.createLinearGradient(cx - trunkW / 2, 0, cx + trunkW / 2, 0);
      grad.addColorStop(0, '#5d3a1e');
      grad.addColorStop(0.5, '#8a5a2b');
      grad.addColorStop(1, '#4a2d15');
      ctx.fillStyle = grad;
      ctx.fillRect(cx - trunkW / 2, y, trunkW, segH + 1);
      // kabuk çizgisi
      ctx.fillStyle = 'rgba(0,0,0,.18)';
      ctx.fillRect(cx - trunkW / 2, y + segH - 3, trunkW, 3);

      const br = g.segs[i].branch;
      if (br !== 'none') {
        const dir = br === 'left' ? -1 : 1;
        const bx = cx + dir * trunkW / 2;
        ctx.fillStyle = '#5d3a1e';
        ctx.beginPath();
        ctx.roundRect(Math.min(bx, bx + dir * 92), y + 16, 92, 20, 8);
        ctx.fill();
        // yapraklar
        ctx.fillStyle = '#3f8c3f';
        ctx.beginPath();
        ctx.arc(bx + dir * 96, y + 26, 26, 0, Math.PI * 2);
        ctx.arc(bx + dir * 70, y + 14, 18, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // oduncu: mini vektör adam
    const px = cx + (g.side === 'left' ? -trunkW / 2 - 34 : trunkW / 2 + 34);
    const py = baseY - 30;
    const flip = g.side === 'left' ? 1 : -1;
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(flip, 1);
    // gövde
    ctx.fillStyle = '#c1121f';
    ctx.beginPath();
    ctx.roundRect(-13, -22, 26, 34, 8);
    ctx.fill();
    // kafa
    ctx.fillStyle = '#f1c27d';
    ctx.beginPath(); ctx.arc(0, -33, 11, 0, Math.PI * 2); ctx.fill();
    // şapka
    ctx.fillStyle = '#f77f00';
    ctx.beginPath();
    ctx.roundRect(-11, -46, 22, 8, 3);
    ctx.fill();
    // balta (vuruşta sallanır)
    const swing = g.chop > 0 ? -0.9 : -0.2;
    ctx.save();
    ctx.translate(10, -14);
    ctx.rotate(swing);
    ctx.fillStyle = '#7a5230';
    ctx.fillRect(0, -3, 30, 6);
    ctx.fillStyle = '#c9ccd1';
    ctx.beginPath();
    ctx.moveTo(30, -12); ctx.lineTo(42, 0); ctx.lineTo(30, 10);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    // bacaklar
    ctx.fillStyle = '#1d3557';
    ctx.fillRect(-11, 12, 9, 16);
    ctx.fillRect(2, 12, 9, 16);
    ctx.restore();

    // süre çubuğu
    const frac = Math.max(0, g.time / g.maxTime);
    ctx.fillStyle = 'rgba(255,255,255,.15)';
    ctx.beginPath();
    ctx.roundRect(s.w * 0.2, s.h * 0.09, s.w * 0.6, 12, 6);
    ctx.fill();
    ctx.fillStyle = frac > 0.3 ? '#2de2a3' : '#fe2c55';
    ctx.beginPath();
    ctx.roundRect(s.w * 0.2, s.h * 0.09, s.w * 0.6 * frac, 12, 6);
    ctx.fill();
  },
};
