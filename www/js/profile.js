// Profil ve istatistik yönetimi (localStorage)
import { googleConfigured, signInWithGoogle } from './google-auth.js';

const KEY = 'tt-scroll-profile';
const STATS_KEY = 'tt-scroll-stats';

export const AVATARS = ['😎', '🦊', '🐼', '🦄', '👾', '🐯', '🐸', '🤖', '👻', '🐙', '🦁', '🐨'];

export function getProfile() {
  try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
}

export function saveProfile(p) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function getStats() {
  try { return JSON.parse(localStorage.getItem(STATS_KEY)) || { games: 0, score: 0 }; }
  catch { return { games: 0, score: 0 }; }
}

export function addStats(score) {
  const s = getStats();
  s.games += 1;
  s.score += score;
  localStorage.setItem(STATS_KEY, JSON.stringify(s));
}

const GOOGLE_ICON = `<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.2 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.2 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>`;

export function openProfileModal({ firstTime = false, onSave } = {}) {
  const existing = getProfile();
  let avatar = existing?.avatar || AVATARS[Math.floor(Math.random() * AVATARS.length)];
  let photo = existing?.photo || null;
  const stats = getStats();

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-avatar">${photo ? `<img src="${photo}" alt="">` : avatar}</div>
      <h2>${firstTime ? 'Profilini Oluştur! 🎮' : 'Profilim'}</h2>
      ${firstTime ? '<p class="modal-sub">Google ile gir veya misafir profili oluştur!</p>' : `
        <div class="stats-row">
          <div><b>${stats.games}</b><span>oyun</span></div>
          <div><b>${stats.score}</b><span>toplam skor</span></div>
        </div>`}
      <button class="google-btn">${GOOGLE_ICON} Google ile giriş yap</button>
      <div class="modal-note hidden"></div>
      <div class="or-row"><span></span>veya misafir profili<span></span></div>
      <input class="name-input" maxlength="15" placeholder="Adını yaz...">
      <div class="avatar-grid">
        ${AVATARS.map(a => `<button class="avatar-opt${a === avatar && !photo ? ' sel' : ''}" data-a="${a}">${a}</button>`).join('')}
      </div>
      <label class="sound-row">
        <input type="checkbox" class="sound-chk" ${localStorage.getItem('tt-scroll-muted') === '1' ? '' : 'checked'}>
        🔊 Ses efektleri
      </label>
      <button class="save-btn">${firstTime ? 'Oynamaya Başla! 🚀' : 'Kaydet'}</button>
      ${firstTime ? '' : '<button class="close-btn">Kapat</button>'}
    </div>`;

  const input = modal.querySelector('.name-input');
  input.value = existing?.name || '';

  const avatarPreview = modal.querySelector('.modal-avatar');
  const note = modal.querySelector('.modal-note');

  modal.querySelectorAll('.avatar-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      avatar = btn.dataset.a;
      photo = null; // emoji seçilince Google fotoğrafını bırak
      avatarPreview.textContent = avatar;
      modal.querySelectorAll('.avatar-opt').forEach(b => b.classList.toggle('sel', b === btn));
    });
  });

  modal.querySelector('.google-btn').addEventListener('click', async () => {
    if (!googleConfigured()) {
      note.textContent = 'Google girişi henüz yapılandırılmadı. Kurulum adımları README dosyasındaki "Google ile Giriş" bölümünde. Şimdilik misafir profiliyle oynayabilirsin! 👇';
      note.classList.remove('hidden');
      return;
    }
    try {
      const acc = await signInWithGoogle();
      input.value = acc.name;
      photo = acc.photo;
      if (photo) avatarPreview.innerHTML = `<img src="${photo}" alt="">`;
      note.textContent = `Hoş geldin ${acc.name}! 🎉 Kaydet'e basarak devam et.`;
      note.classList.remove('hidden');
    } catch {
      note.textContent = 'Google girişi tamamlanamadı. Misafir profiliyle devam edebilirsin.';
      note.classList.remove('hidden');
    }
  });

  modal.querySelector('.save-btn').addEventListener('click', () => {
    const name = input.value.trim() || 'Oyuncu';
    const p = { name, avatar, photo };
    saveProfile(p);
    localStorage.setItem('tt-scroll-muted', modal.querySelector('.sound-chk').checked ? '0' : '1');
    modal.remove();
    onSave?.(p);
  });

  modal.querySelector('.close-btn')?.addEventListener('click', () => modal.remove());

  document.body.appendChild(modal);
  return modal;
}
