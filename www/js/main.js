import { games } from './games/index.js';
import { GameShell } from './shell.js';
import { getProfile, openProfileModal } from './profile.js';
import { heartBurst } from './effects.js';

const feed = document.getElementById('feed');
const hint = document.getElementById('hint');

// İlk açılışta profil oluşturma ekranı
if (!getProfile()) {
  openProfileModal({ firstTime: true, onSave: refreshProfileButtons });
}

function refreshProfileButtons(p) {
  document.querySelectorAll('.side-btn.profile').forEach(btn => {
    btn.firstChild.textContent = p.avatar;
  });
}

// Oyunları karıştırıp sonsuz akış üret; art arda aynı oyun gelmesin
let lastGameId = null;
function nextBatch() {
  let batch;
  do {
    batch = [...games].sort(() => Math.random() - 0.5);
  } while (batch[0].id === lastGameId && games.length > 1);
  lastGameId = batch[batch.length - 1].id;
  return batch;
}

function createSlide(game) {
  const slide = document.createElement('section');
  slide.className = 'slide';
  slide.dataset.game = game.id;

  const canvas = document.createElement('canvas');
  slide.appendChild(canvas);

  const top = document.createElement('div');
  top.className = 'hud-top';
  top.innerHTML = `
    <div class="game-title"><span class="emoji">${game.emoji}</span>${game.name}</div>
    <div class="score-box">
      <div class="score">0</div>
      <div class="best">Rekor: 0</div>
    </div>`;
  slide.appendChild(top);

  const side = document.createElement('div');
  side.className = 'side-bar';
  const likeCount = Math.floor(Math.random() * 900) + 100;
  const avatar = getProfile()?.avatar || '🙂';
  side.innerHTML = `
    <button class="side-btn profile"><span>${avatar}</span><span class="count">Profil</span></button>
    <button class="side-btn like">❤️<span class="count">${likeCount}</span></button>
    <button class="side-btn share">↗️<span class="count">Paylaş</span></button>`;
  slide.appendChild(side);

  side.querySelector('.profile').addEventListener('click', () => {
    openProfileModal({ onSave: refreshProfileButtons });
  });

  const likeBtn = side.querySelector('.like');
  likeBtn.addEventListener('click', () => {
    const liked = likeBtn.classList.toggle('liked');
    if (liked) heartBurst(slide);
  });

  side.querySelector('.share').addEventListener('click', async () => {
    const p = getProfile();
    const best = Number(localStorage.getItem('tt-scroll-best-' + game.id) || 0);
    const who = p ? `${p.avatar} ${p.name}` : 'Bir oyuncu';
    const text = best > 0
      ? `${who}, TT Scroll'da ${game.emoji} ${game.name} oyununda ${best} puan yaptı! Beni geçebilir misin? 🎮🔥`
      : `${who}, TT Scroll'da ${game.emoji} ${game.name} oynuyor. Sen de dene! 🎮`;
    try {
      if (navigator.share) await navigator.share({ title: 'TT Scroll', text });
      else await navigator.clipboard?.writeText(text);
    } catch { /* kullanıcı iptal etti */ }
  });

  const overlay = document.createElement('div');
  overlay.className = 'overlay hidden';
  slide.appendChild(overlay);

  const hud = {
    root: slide,
    scoreEl: top.querySelector('.score'),
    bestEl: top.querySelector('.best'),
    overlay,
    showOverlay({ emoji, title, text, finalScore, record, button }) {
      overlay.innerHTML = `
        <div class="big-emoji">${emoji}</div>
        <h2>${title}</h2>
        ${text ? `<p>${text}</p>` : ''}
        ${finalScore !== undefined ? `<div class="final-score">${finalScore}</div>` : ''}
        ${record ? '<div class="new-record">🏆 YENİ REKOR!</div>' : ''}
        <div class="tap-note">${button}</div>`;
      overlay.classList.remove('hidden');
    },
    hideOverlay() { overlay.classList.add('hidden'); },
  };

  slide._hud = hud;
  slide._canvas = canvas;
  slide._gameDef = game;
  feed.appendChild(slide);
  observer.observe(slide);
}

// Görünür olan slaytın oyununu kur, görünmeyeninkini yok et (pil + bellek dostu)
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    const slide = entry.target;
    if (entry.intersectionRatio >= 0.6) {
      if (!slide._shell) {
        slide._shell = new GameShell(slide._canvas, slide._hud, slide._gameDef);
      }
    } else if (slide._shell) {
      slide._shell.destroy();
      slide._shell = null;
    }
  }
}, { threshold: [0, 0.6] });

function appendBatch() {
  for (const game of nextBatch()) createSlide(game);
}

appendBatch();
appendBatch();

// Sona yaklaşınca yeni oyunlar ekle (sonsuz akış)
feed.addEventListener('scroll', () => {
  hint.classList.add('hidden');
  if (feed.scrollTop + feed.clientHeight * 3 > feed.scrollHeight) {
    appendBatch();
  }
  // Çok geride kalan slaytları temizle (bellek)
  while (feed.children.length > 30 && feed.scrollTop > feed.clientHeight * 5) {
    const first = feed.firstElementChild;
    if (first._shell) first._shell.destroy();
    observer.unobserve(first);
    first.remove();
    feed.scrollTop -= feed.clientHeight;
  }
});
