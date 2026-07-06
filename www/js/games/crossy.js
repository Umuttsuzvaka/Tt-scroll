// Yolu Geç (Crossy Road tarzı) — dokun: ilerle, kaydır: yana kaç!
export const crossy = {
  id: 'crossy',
  name: 'Yolu Geç',
  emoji: '🐔',
  howTo: 'Dokun: ileri zıpla! Sola/sağa kaydır: yana geç. Arabalara çarpma!',

  init(s) {
    s.G = {
      cols: 7,
      col: 3,
      row: 0,          // dünya satırı (ileri = artar)
      rows: {},        // satır tanımları önbelleği
      camRow: 0,       // kamera yumuşatma
      hop: 0,
      t: 0,
    };
    this.rowDef(s, 0);
  },

  rowDef(s, r) {
    const g = s.G;
    if (g.rows[r]) return g.rows[r];
    let def;
    if (r < 2) {
      def = { type: 'grass', bushes: [] };
    } else if (Math.random() < 0.55) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      const speed = (70 + Math.random() * 90 + Math.min(120, r * 2)) * dir;
      const cars = [];
      let x = Math.random() * 200;
      while (x < s.w + 300) {
        cars.push(x);
        x += 170 + Math.random() * 240;
      }
      def = { type: 'road', speed, cars, hue: Math.floor(Math.random() * 360) };
    } else {
      const bushes = [];
      for (let c = 0; c < g.cols; c++) if (Math.random() < 0.18) bushes.push(c);
      def = { type: 'grass', bushes };
    }
    g.rows[r] = def;
    return def;
  },

  tap(s) {
    const g = s.G;
    const next = this.rowDef(s, g.row + 1);
    if (next.type === 'grass' && next.bushes.includes(g.col)) return; // çalı engeli
    g.row++;
    g.hop = 0.15;
    if (g.row > s.score) s.setScore(g.row);
  },

  gesture(s, dir) {
    const g = s.G;
    if (dir !== 'left' && dir !== 'right') return;
    const nc = g.col + (dir === 'left' ? -1 : 1);
    if (nc < 0 || nc >= g.cols) return;
    const cur = this.rowDef(s, g.row);
    if (cur.type === 'grass' && cur.bushes.includes(nc)) return;
    g.col = nc;
    g.hop = 0.12;
  },

  update(s, dt) {
    const g = s.G;
    g.t += dt;
    g.hop = Math.max(0, g.hop - dt);
    g.camRow += (g.row - g.camRow) * Math.min(1, dt * 8);

    // görünür satırlardaki arabaları ilerlet + çarpışma
    const rowH = 64;
    for (let r = g.row - 4; r <= g.row + 10; r++) {
      const def = this.rowDef(s, r);
      if (def.type !== 'road') continue;
      for (let i = 0; i < def.cars.length; i++) {
        def.cars[i] += def.speed * dt;
        if (def.speed > 0 && def.cars[i] > s.w + 320) def.cars[i] -= s.w + 640;
        if (def.speed < 0 && def.cars[i] < -320) def.cars[i] += s.w + 640;
      }
      if (r === g.row) {
        const colW = s.w / g.cols;
        const px = (g.col + 0.5) * colW;
        for (const cx of def.cars) {
          if (Math.abs(cx - px) < 46 + colW * 0.28) return s.end();
        }
      }
    }
  },

  draw(s, ctx) {
    const g = s.G;
    const rowH = 64;
    const colW = s.w / g.cols;
    const screenY = (r) => s.h * 0.68 - (r - g.camRow) * rowH;

    ctx.fillStyle = '#0e1a10';
    ctx.fillRect(0, 0, s.w, s.h);

    const lo = Math.floor(g.camRow) - 5, hi = Math.floor(g.camRow) + 12;
    for (let r = lo; r <= hi; r++) {
      if (r < 0) continue;
      const def = this.rowDef(s, r);
      const y = screenY(r);
      if (def.type === 'grass') {
        ctx.fillStyle = r % 2 ? '#2e6b34' : '#357a3b';
        ctx.fillRect(0, y - rowH, s.w, rowH);
        for (const c of def.bushes) {
          const bx = (c + 0.5) * colW;
          ctx.fillStyle = '#1d4a22';
          ctx.beginPath();
          ctx.arc(bx, y - rowH / 2 + 6, 20, 0, Math.PI * 2);
          ctx.arc(bx - 13, y - rowH / 2 + 12, 14, 0, Math.PI * 2);
          ctx.arc(bx + 13, y - rowH / 2 + 12, 14, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = '#2b2f36';
        ctx.fillRect(0, y - rowH, s.w, rowH);
        ctx.strokeStyle = 'rgba(255,255,255,.25)';
        ctx.setLineDash([18, 16]);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, y - rowH / 2);
        ctx.lineTo(s.w, y - rowH / 2);
        ctx.stroke();
        ctx.setLineDash([]);
        // arabalar
        for (const cx of def.cars) {
          const cy = y - rowH / 2;
          ctx.fillStyle = `hsl(${def.hue} 70% 55%)`;
          ctx.beginPath();
          ctx.roundRect(cx - 42, cy - 17, 84, 34, 9);
          ctx.fill();
          ctx.fillStyle = 'rgba(180,220,255,.85)';
          ctx.beginPath();
          ctx.roundRect(cx - 20, cy - 12, 26, 24, 5);
          ctx.fill();
          // farlar
          ctx.fillStyle = '#ffe066';
          const fx = def.speed > 0 ? cx + 38 : cx - 42;
          ctx.fillRect(fx, cy - 12, 4, 7);
          ctx.fillRect(fx, cy + 5, 4, 7);
        }
      }
    }

    // tavuk kahramanımız
    const px = (g.col + 0.5) * colW;
    const py = screenY(g.row) - rowH / 2 - g.hop * 90;
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath();
    ctx.ellipse(px, screenY(g.row) - rowH / 2 + 20, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '38px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐔', px, py);
  },
};
