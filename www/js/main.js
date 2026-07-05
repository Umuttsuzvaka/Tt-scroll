import { games } from './games/index.js';
import { GameShell } from './shell.js';

const feed = document.getElementById('feed');
const hint = document.getElementById('hint');

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
  side.innerHTML = `
    <button class="side-btn like">❤️<span class="count">${likeCount}</span></button>
    <button class="side-btn share">↗️<span class="count">Paylaş</span></button>`;
  slide.appendChild(side);

  const likeBtn = side.querySelector('.like');
  likeBtn.addEventListener('click', () => likeBtn.classList.toggle('liked'));
  side.querySelector('.share').addEventListener('click', async () => {
    const data = { title: 'TT Scroll', text: `${game.name} oynuyorum, sen de dene! 🎮` };
    try {
      if (navigator.share) await navigator.share(data);
    } catch { /* kullanıcı iptal etti */ }
  });

  const overlay = document.createElement('div');
  overlay.className = 'overlay hidden';
  slide.appendChild(overlay);

  const hud = {
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
