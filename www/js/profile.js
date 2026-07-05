// Profil ve istatistik yönetimi (localStorage)
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

export function openProfileModal({ firstTime = false, onSave } = {}) {
  const existing = getProfile();
  let avatar = existing?.avatar || AVATARS[Math.floor(Math.random() * AVATARS.length)];
  const stats = getStats();

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-avatar">${avatar}</div>
      <h2>${firstTime ? 'Profilini Oluştur! 🎮' : 'Profilim'}</h2>
      ${firstTime ? '<p class="modal-sub">Adını yaz, avatarını seç, rekorları devir!</p>' : `
        <div class="stats-row">
          <div><b>${stats.games}</b><span>oyun</span></div>
          <div><b>${stats.score}</b><span>toplam skor</span></div>
        </div>`}
      <input class="name-input" maxlength="15" placeholder="Adını yaz...">
      <div class="avatar-grid">
        ${AVATARS.map(a => `<button class="avatar-opt${a === avatar ? ' sel' : ''}" data-a="${a}">${a}</button>`).join('')}
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
  modal.querySelectorAll('.avatar-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      avatar = btn.dataset.a;
      avatarPreview.textContent = avatar;
      modal.querySelectorAll('.avatar-opt').forEach(b => b.classList.toggle('sel', b === btn));
    });
  });

  modal.querySelector('.save-btn').addEventListener('click', () => {
    const name = input.value.trim() || 'Oyuncu';
    const p = { name, avatar };
    saveProfile(p);
    localStorage.setItem('tt-scroll-muted', modal.querySelector('.sound-chk').checked ? '0' : '1');
    modal.remove();
    onSave?.(p);
  });

  modal.querySelector('.close-btn')?.addEventListener('click', () => modal.remove());

  document.body.appendChild(modal);
  return modal;
}
