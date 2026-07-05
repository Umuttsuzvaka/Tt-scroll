// Piano Tiles tarzı: düşen siyah karolara dokun, beyaza dokunma!
export const piano = {
  id: 'piano',
  name: 'Piyano Karoları',
  emoji: '🎹',
  howTo: 'Siyah karolara dokun! Boş yere dokunursan veya karo kaçarsa oyun biter.',

  init(s) {
    s.G = {
      lanes: 4,
      tiles: [],
      speed: 300,
      tileH: Math.max(130, s.h / 6),
      nextY: 0,
    };
    // ekranı baştan karolarla doldur
    for (let y = -s.G.tileH; y > -s.h; y -= s.G.tileH) this.spawn(s, y);
  },

  spawn(s, y) {
    const g = s.G;
    g.tiles.push({ lane: Math.floor(Math.random() * g.lanes), y, hit: false });
  },

  tap(s, x, y) {
    const g = s.G;
    const lane = Math.floor(x / (s.w / g.lanes));
    // o şeritteki en alttaki vurulmamış görünür karo
    let target = null;
    for (const t of g.tiles) {
      if (t.lane === lane && !t.hit && t.y + g.tileH > 0) {
        if (!target || t.y > target.y) target = t;
      }
    }
    if (target && target.y + g.tileH > y - 40 && target.y < y + g.tileH) {
      target.hit = true;
      s.addScore();
      g.speed += 5;
    } else {
      s.end(); // boşa bastı
    }
  },

  update(s, dt) {
    const g = s.G;
    let topY = Infinity;
    for (const t of g.tiles) {
      t.y += g.speed * dt;
      if (!t.hit && t.y > s.h) return s.end(); // karo kaçtı
      topY = Math.min(topY, t.y);
    }
    g.tiles = g.tiles.filter(t => t.y < s.h + g.tileH);
    // üstte boşluk oluştuysa yeni karo
    if (topY > 0 || g.tiles.length === 0) {
      this.spawn(s, (g.tiles.length ? topY : 0) - g.tileH);
    }
  },

  draw(s, ctx) {
    const g = s.G;
    ctx.fillStyle = '#f4f2ee';
    ctx.fillRect(0, 0, s.w, s.h);

    const laneW = s.w / g.lanes;
    ctx.strokeStyle = 'rgba(0,0,0,.15)';
    ctx.lineWidth = 1;
    for (let i = 1; i < g.lanes; i++) {
      ctx.beginPath();
      ctx.moveTo(i * laneW, 0);
      ctx.lineTo(i * laneW, s.h);
      ctx.stroke();
    }

    for (const t of g.tiles) {
      ctx.fillStyle = t.hit ? 'rgba(45,226,163,.4)' : '#1a1a24';
      ctx.fillRect(t.lane * laneW + 2, t.y, laneW - 4, g.tileH - 4);
    }
  },
};
