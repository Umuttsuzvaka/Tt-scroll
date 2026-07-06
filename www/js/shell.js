import { sound, vibrate } from './sound.js';
import { floatText, confettiBurst } from './effects.js';
import { addStats } from './profile.js';
import { music } from './music.js';

const OVER_MSGS = [
  'Az kaldı, bir daha! 🔥',
  'Eller ısındı mı? 😏',
  'Rekor seni bekliyor 👀',
  'Pes etmek yok! 💪',
  'Bu sefer olacak! 🚀',
  'Isınma turuydu, değil mi? 😅',
];

// GameShell: her mini oyunun ortak altyapısı.
// Oyun mantığı sadece { init, tap, update, draw } uygular;
// döngü, durum (hazır/oynuyor/bitti), skor ve rekor buradan yönetilir.
export class GameShell {
  constructor(canvas, hud, game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.hud = hud;
    this.game = game;
    this.state = 'ready'; // ready | playing | over
    this.score = 0;
    this.raf = null;
    this.lastTime = 0;
    this.destroyed = false;

    this.resize();
    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);

    this.onTap = (e) => {
      const rect = canvas.getBoundingClientRect();
      const p = e.changedTouches ? e.changedTouches[0] : e;
      this.handleTap(p.clientX - rect.left, p.clientY - rect.top);
    };
    // click hem mouse hem mobil dokunma için yeterli; kaydırma jestleri tetiklemez
    canvas.addEventListener('click', this.onTap);
    hud.overlay.addEventListener('click', this.onTap);

    // parmak takibi: sürükleme (swipe) ve jest (gesture) destekli oyunlar için
    this.pointer = { down: false, x: 0, y: 0, sx: 0, sy: 0 };
    const pt = (e) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    this.onDown = (e) => {
      const p = pt(e);
      this.pointer = { down: true, x: p.x, y: p.y, sx: p.x, sy: p.y };
      if (this.state === 'playing' && this.game.swipe) this.game.swipe(this, p.x, p.y, p.x, p.y);
    };
    this.onMove = (e) => {
      if (!this.pointer.down || this.state !== 'playing') return;
      const p = pt(e);
      if (this.game.swipe) this.game.swipe(this, p.x, p.y, this.pointer.x, this.pointer.y);
      this.pointer.x = p.x;
      this.pointer.y = p.y;
    };
    this.onUp = () => {
      if (this.pointer.down && this.state === 'playing' && this.game.gesture) {
        const dx = this.pointer.x - this.pointer.sx;
        const dy = this.pointer.y - this.pointer.sy;
        if (Math.hypot(dx, dy) > 30) {
          const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
          this.game.gesture(this, dir);
        }
      }
      this.pointer.down = false;
    };
    canvas.addEventListener('pointerdown', this.onDown);
    canvas.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);

    this.showReady();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    this.w = rect.width;
    this.h = rect.height;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  bestKey() { return 'tt-scroll-best-' + this.game.id; }
  getBest() { return Number(localStorage.getItem(this.bestKey()) || 0); }

  setScore(n) {
    this.score = n;
    this.hud.scoreEl.textContent = n;
  }

  addScore(n = 1) {
    this.setScore(this.score + n);
    sound.score();
    vibrate(12);
    // dokunuşla kazanıldıysa dokunulan yerde, değilse skorun altında "+1" göster
    const fresh = this.lastTap && performance.now() - this.lastTap.t < 150;
    const x = fresh ? this.lastTap.x : this.w - 50;
    const y = fresh ? this.lastTap.y - 20 : 80;
    floatText(this.hud.root, '+' + n, x, y);
  }

  showReady() {
    this.state = 'ready';
    this.setScore(0);
    this.hud.bestEl.textContent = 'Rekor: ' + this.getBest();
    this.hud.showOverlay({
      emoji: this.game.emoji,
      title: this.game.name,
      text: this.game.howTo,
      button: 'Başlamak için dokun',
    });
    this.game.init(this);
    this.drawFrame(); // arka planda oyunun ilk karesi görünsün
  }

  // oyun oynanırken akış kaydırılamasın — yanlışlıkla kaydırma oyunu bozmasın
  setScrollLock(lock) {
    document.getElementById('feed')?.classList.toggle('no-scroll', lock);
  }

  start() {
    this.hud.hideOverlay();
    this.setScore(0);
    this.game.init(this);
    this.state = 'playing';
    this.setScrollLock(true);
    music.duck(true); // oyun sırasında müziği kıs
    this.lastTime = performance.now();
    this.loop();
  }

  end() {
    if (this.state !== 'playing') return;
    this.state = 'over';
    this.setScrollLock(false);
    music.duck(false);
    cancelAnimationFrame(this.raf);
    const best = this.getBest();
    const isRecord = this.score > best;
    if (isRecord) localStorage.setItem(this.bestKey(), String(this.score));
    addStats(this.score);
    vibrate(120);
    if (isRecord) {
      sound.record();
      confettiBurst(this.hud.root);
    } else {
      sound.over();
    }
    this.hud.showOverlay({
      emoji: isRecord ? '🏆' : '💀',
      title: 'Oyun Bitti!',
      text: isRecord ? undefined : OVER_MSGS[Math.floor(Math.random() * OVER_MSGS.length)],
      finalScore: this.score,
      record: isRecord,
      button: 'Tekrar oyna',
    });
  }

  handleTap(x, y) {
    if (this.destroyed) return;
    this.lastTap = { x, y, t: performance.now() };
    sound.unlock();
    if (this.state === 'ready' || this.state === 'over') {
      this.start();
    } else if (this.state === 'playing') {
      if (!this.game.quietTaps) sound.tap();
      this.game.tap(this, x, y);
    }
  }

  loop() {
    if (this.destroyed || this.state !== 'playing') return;
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.game.update(this, dt);
    if (this.state === 'playing') this.drawFrame();
    this.raf = requestAnimationFrame(() => this.loop());
  }

  drawFrame() {
    this.ctx.clearRect(0, 0, this.w, this.h);
    this.game.draw(this, this.ctx);
  }

  destroy() {
    this.destroyed = true;
    if (this.state === 'playing') {
      this.setScrollLock(false);
      music.duck(false);
    }
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    this.canvas.removeEventListener('click', this.onTap);
    this.hud.overlay.removeEventListener('click', this.onTap);
    this.canvas.removeEventListener('pointerdown', this.onDown);
    this.canvas.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
  }
}
