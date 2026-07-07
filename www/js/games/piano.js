// Piano Tiles tarzı: düşen siyah karolara dokun — her dokunuş şarkının bir notasını çalar!
import { sound } from '../sound.js';
import { randomMelody } from '../melodies.js';

export const piano = {
  id: 'piano',
  name: 'Piyano Karoları',
  emoji: '🎹',
  howTo: 'Siyah karolara dokun — her dokunuş şarkıyı çalar! 🎵 Boşa basma, karo kaçırma. 15 puandan sonra ÇİFT karolar!',
  quietTaps: true, // dokunma "bip"i melodiyi bozmasın

  init(s) {
    s.G = {
      lanes: 4,
      tiles: [],
      speed: 300,
      tileH: Math.max(130, s.h / 6),
      ripples: [],
      song: randomMelody(),
      noteIdx: 0,
      missFlash: 0, // kaçan karonun kırmızı yanma süresi
    };
    // ekranı baştan karolarla doldur
    for (let y = -s.G.tileH; y > -s.h; y -= s.G.tileH) this.spawn(s, y);
  },

  spawn(s, y) {
    const g = s.G;
    const lane = Math.floor(Math.random() * g.lanes);
    g.tiles.push({ lane, y, hit: false });
    // 15 puandan sonra %25 ihtimalle aynı sırada ikinci karo
    if (s.score >= 15 && Math.random() < 0.25) {
      const lane2 = (lane + 1 + Math.floor(Math.random() * (g.lanes - 1))) % g.lanes;
      g.tiles.push({ lane: lane2, y, hit: false });
    }
  },

  tap(s, x, y) {
    const g = s.G;
    if (g.missFlash > 0) return; // kaçırma animasyonu sırasında dokunuş yok
    const lane = Math.min(g.lanes - 1, Math.max(0, Math.floor(x / (s.w / g.lanes))));
    // o şeritteki en alttaki vurulmamış görünür karo (çift karoda her şerit ayrı hedef)
    let target = null;
    for (const t of g.tiles) {
      if (t.lane === lane && !t.hit && t.y + g.tileH > 0) {
        if (!target || t.y > target.y) target = t;
      }
    }
    // tolerans: karonun 40px altına ve yarım karo üstüne kadar geçerli
    if (target && y > target.y - g.tileH * 0.5 && y < target.y + g.tileH + 40) {
      target.hit = true;
      // şarkının sıradaki notasını çal 🎵
      sound.pianoNote(g.song.notes[g.noteIdx]);
      g.noteIdx = (g.noteIdx + 1) % g.song.notes.length;
      s.addScore();
      g.speed += 5;
      g.ripples.push({ x: (target.lane + 0.5) * (s.w / g.lanes), y: target.y + g.tileH / 2, r: 10, life: 0.4 });
    } else {
      s.end(); // boşa bastı
    }
  },

  update(s, dt) {
    const g = s.G;
    // kaçan karo geri bildirimi: sahne donar, karo kırmızı yanar, sonra oyun biter
    if (g.missFlash > 0) {
      g.missFlash -= dt;
      if (g.missFlash <= 0) s.end();
      return;
    }
    let topY = Infinity;
    for (const t of g.tiles) {
      t.y += g.speed * dt;
      if (!t.hit && t.y > s.h) { // karo kaçtı
        t.missed = true;
        t.y = s.h - g.tileH; // yanma animasyonu görünür kalsın
        g.missFlash = 0.6;
        return;
      }
      topY = Math.min(topY, t.y);
    }
    g.tiles = g.tiles.filter(t => t.y < s.h + g.tileH);
    // üstte boşluk oluştuysa yeni karo
    if (topY > 0 || g.tiles.length === 0) {
      this.spawn(s, (g.tiles.length ? topY : 0) - g.tileH);
    }
    for (const rp of g.ripples) { rp.r += 340 * dt; rp.life -= dt; }
    g.ripples = g.ripples.filter(rp => rp.life > 0);
  },

  draw(s, ctx) {
    const g = s.G;
    // fildişi zemin + şerit gölgelendirmesi
    ctx.fillStyle = '#f4f2ee';
    ctx.fillRect(0, 0, s.w, s.h);
    const laneW = s.w / g.lanes;
    for (let i = 0; i < g.lanes; i += 2) {
      ctx.fillStyle = 'rgba(0,0,0,.03)';
      ctx.fillRect(i * laneW, 0, laneW, s.h);
    }

    ctx.strokeStyle = 'rgba(0,0,0,.15)';
    ctx.lineWidth = 1;
    for (let i = 1; i < g.lanes; i++) {
      ctx.beginPath();
      ctx.moveTo(i * laneW, 0);
      ctx.lineTo(i * laneW, s.h);
      ctx.stroke();
    }

    for (const t of g.tiles) {
      if (t.hit) {
        ctx.fillStyle = 'rgba(45,226,163,.35)';
        ctx.fillRect(t.lane * laneW + 2, t.y, laneW - 4, g.tileH - 4);
        continue;
      }
      if (t.missed) {
        // kaçan karo: kırmızı yanıp söner
        const blink = 0.45 + 0.45 * Math.abs(Math.sin(g.missFlash * 22));
        ctx.fillStyle = `rgba(254,44,85,${blink})`;
        ctx.beginPath();
        ctx.roundRect(t.lane * laneW + 2, t.y, laneW - 4, g.tileH - 4, 6);
        ctx.fill();
        continue;
      }
      const tile = ctx.createLinearGradient(0, t.y, 0, t.y + g.tileH);
      tile.addColorStop(0, '#2b2b3d');
      tile.addColorStop(1, '#101018');
      ctx.fillStyle = tile;
      ctx.beginPath();
      ctx.roundRect(t.lane * laneW + 2, t.y, laneW - 4, g.tileH - 4, 6);
      ctx.fill();
      // üst parlama
      ctx.fillStyle = 'rgba(255,255,255,.09)';
      ctx.fillRect(t.lane * laneW + 6, t.y + 3, laneW - 12, 4);
    }

    // dokunma dalgaları
    for (const rp of g.ripples) {
      ctx.globalAlpha = Math.max(0, rp.life / 0.4);
      ctx.strokeStyle = '#2de2a3';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // çalan şarkının adı + ilerleme
    const prog = Math.round((g.noteIdx / g.song.notes.length) * 100);
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.beginPath();
    ctx.roundRect(s.w / 2 - 110, s.h - 54, 220, 34, 17);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '700 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🎵 ${g.song.name} · %${prog}`, s.w / 2, s.h - 37);
  },
};
