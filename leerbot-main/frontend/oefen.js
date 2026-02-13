// ========== GLOBALE FUNCTIE ==========
window.getLijstId = function() {
  if (window._lijstId) return window._lijstId;
  const urlParams = new URLSearchParams(window.location.search);
  window._lijstId = urlParams.get('id');
  return window._lijstId;
}

// ========== GLOBALE VARIABELEN ==========
let woorden = [];
let huidigeIndex = 0;
let toonAntwoord = false;
let goedCount = 0;
let foutCount = 0;
let sessieXP = 0;
let woordHistory = [];

// ========== HOOFDPROGRAMMA ==========
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎴 oefen.js gestart');

  if (typeof supabase === 'undefined') {
    alert('Fout: Kan geen verbinding maken.');
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
    return;
  }

  const lijstId = window.getLijstId();
  if (!lijstId) {
    alert('Geen lijst geselecteerd');
    window.location.href = 'dashboard.html';
    return;
  }

  document.getElementById('username').textContent = session.user.email;

  await laadStats(session.access_token);
  await laadWoorden(session.access_token, lijstId);

  if (woorden.length > 0) {
    toonKaart(0);
    updateProgress();
  } else {
    document.getElementById('flashcard').innerHTML = 'Deze lijst is leeg! Voeg eerst woorden toe.';
  }

  // Event listeners voor knoppen (als ze bestaan)
  document.getElementById('goedBtn')?.addEventListener('click', goedAntwoord);
  document.getElementById('foutBtn')?.addEventListener('click', foutAntwoord);
});

// ========== FUNCTIES ==========
async function laadWoorden(token, lijstId) {
  try {
    const res = await fetch(`/api/words?listId=${lijstId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Woorden niet geladen');
    woorden = await res.json();
    woordHistory = new Array(woorden.length).fill(false);
  } catch (e) {
    console.error('Fout bij laden woorden:', e);
    showToast('Fout bij laden woorden', 'error');
  }
}

async function laadStats(token) {
  try {
    const res = await fetch('/api/user-stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const stats = await res.json();
      document.getElementById('xpDisplay').textContent = stats.xp || 0;
      document.getElementById('levelDisplay').textContent = stats.level || 1;
      document.getElementById('streakDisplay').textContent = stats.streak || 0;
    }
  } catch (e) {
    console.warn('Stats niet beschikbaar');
  }
}

async function updateStats(xpGained) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  try {
    const res = await fetch('/api/user-stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ xpGained })
    });
    if (res.ok) {
      const stats = await res.json();
      document.getElementById('xpDisplay').textContent = stats.xp;
      document.getElementById('levelDisplay').textContent = stats.level;
      document.getElementById('streakDisplay').textContent = stats.streak;
      return stats;
    }
  } catch (e) {}
}

function toonKaart(index) {
  if (woorden.length === 0) return;
  huidigeIndex = index;
  toonAntwoord = false;
  document.getElementById('voorkant').textContent = woorden[index].source_word;
  document.getElementById('voorkant').classList.add('active');
  document.getElementById('achterkant').classList.remove('active');
  document.getElementById('achterkant').textContent = woorden[index].target_word;
  document.getElementById('teller').textContent = `${index+1} / ${woorden.length}`;
}

window.draaiKaart = function() {
  if (woorden.length === 0) return;
  toonAntwoord = !toonAntwoord;
  if (toonAntwoord) {
    document.getElementById('voorkant').classList.remove('active');
    document.getElementById('achterkant').classList.add('active');
  } else {
    document.getElementById('voorkant').classList.add('active');
    document.getElementById('achterkant').classList.remove('active');
  }
}

window.volgendeKaart = function() {
  if (woorden.length === 0) return;
  huidigeIndex = (huidigeIndex + 1) % woorden.length;
  toonKaart(huidigeIndex);
}

window.vorigeKaart = function() {
  if (woorden.length === 0) return;
  huidigeIndex = (huidigeIndex - 1 + woorden.length) % woorden.length;
  toonKaart(huidigeIndex);
}

function updateProgress() {
  const beantwoord = woordHistory.filter(v => v).length;
  const totaal = woorden.length;
  document.getElementById('progressText').textContent = `${beantwoord} / ${totaal} woorden`;
  document.getElementById('progressFill').style.width = (beantwoord / totaal * 100) + '%';
}

function checkSessieVoltooid() {
  if (woordHistory.every(v => v === true)) {
    document.getElementById('sessieGoed').textContent = goedCount;
    document.getElementById('sessieFout').textContent = foutCount;
    document.getElementById('sessieXP').textContent = sessieXP;
    document.getElementById('sessieModal').style.display = 'block';
  }
}

async function goedAntwoord() {
  if (woorden.length === 0 || woordHistory[huidigeIndex]) return;
  goedCount++;
  sessieXP += 5;
  woordHistory[huidigeIndex] = true;
  updateProgress();
  await updateStats(5);
  showToast('+5 XP!', 'success');
  if (huidigeIndex < woorden.length - 1) {
    volgendeKaart();
  } else {
    checkSessieVoltooid();
  }
}

async function foutAntwoord() {
  if (woorden.length === 0 || woordHistory[huidigeIndex]) return;
  foutCount++;
  sessieXP += 1;
  woordHistory[huidigeIndex] = true;
  updateProgress();
  await updateStats(1);
  showToast('+1 XP', 'info');
  if (!toonAntwoord) draaiKaart();
  setTimeout(() => {
    if (huidigeIndex < woorden.length - 1) {
      volgendeKaart();
    } else {
      checkSessieVoltooid();
    }
  }, 1500);
}

// Modal sluiten
document.querySelector('.close')?.addEventListener('click', () => {
  document.getElementById('sessieModal').style.display = 'none';
});
window.addEventListener('click', (e) => {
  if (e.target === document.getElementById('sessieModal')) {
    document.getElementById('sessieModal').style.display = 'none';
  }
});
