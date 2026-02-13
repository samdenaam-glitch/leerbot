// Vervang door jouw Supabase-gegevens!
const SUPABASE_URL = 'https://xxgebftpfslkucdkbila.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4Z2ViZnRwZnNsa3VjZGtiaWxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODMxMDYsImV4cCI6MjA4NjU1OTEwNn0.RLpbmLzwtlxXRPrp24NFB2ai1Cb0bxnKLpsEGC_NxIc'

// Detecteer welke Supabase global beschikbaar is
const SupabaseLib = window.supabaseJs || window.supabase;
if (!SupabaseLib) {
  console.error('Supabase library niet geladen! Controleer de CDN-link.');
  alert('Fout: Kan verbinding maken met de database. Ververs de pagina.');
  throw new Error('Supabase library missing');
}

// Maak een client aan en stop hem in window, zodat andere scripts hem kunnen gebruiken
const supabaseClient = SupabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabase = supabaseClient; // Zet hem op window voor backwards compatibiliteit

// Controleer sessie bij laden
window.addEventListener('load', async () => {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession()
    if (session) {
      toonIngelogd(session.user)
    } else {
      toonUitgelogd()
    }
  } catch (e) {
    console.error('Fout bij ophalen sessie:', e)
  }
})

// Uitloggen
async function logout() {
  await supabaseClient.auth.signOut()
  location.reload()
}

// UI helpers
function toonIngelogd(user) {
  const authDiv = document.getElementById('auth-buttons')
  const userDiv = document.getElementById('user-info')
  if (authDiv) authDiv.style.display = 'none'
  if (userDiv) {
    userDiv.style.display = 'block'
    document.getElementById('username').textContent = user.email
  }
}
function toonUitgelogd() {
  const authDiv = document.getElementById('auth-buttons')
  const userDiv = document.getElementById('user-info')
  if (authDiv) authDiv.style.display = 'block'
  if (userDiv) userDiv.style.display = 'none'
}

// Toast notificaties
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
}
window.showToast = showToast;

// ========== DARK MODE TOGGLE ==========
function initDarkMode() {
  // Voorkom dubbele knop
  if (document.getElementById('darkModeToggle')) return;

  // Maak toggle knop
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'darkModeToggle';
  toggleBtn.style.marginLeft = '10px';
  toggleBtn.style.fontSize = '1.2em';
  toggleBtn.style.padding = '8px 16px';
  
  // Bepaal initiële tekst op basis van opgeslagen voorkeur
  const saved = localStorage.getItem('darkMode');
  if (saved === 'dark') {
    document.body.classList.add('dark-mode');
    toggleBtn.textContent = '☀️';
  } else {
    toggleBtn.textContent = '🌙';
  }

  toggleBtn.onclick = () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark ? 'dark' : 'light');
    toggleBtn.textContent = isDark ? '☀️' : '🌙';
  };

  // Voeg knop toe aan header (bij user-info of auth-buttons)
  const header = document.querySelector('header');
  if (header) {
    let container = document.getElementById('user-info');
    if (!container || container.style.display === 'none') {
      container = document.getElementById('auth-buttons');
    }
    if (!container) {
      // Als geen van beide bestaat, maak een eigen container in de header
      container = document.createElement('div');
      header.appendChild(container);
    }
    container.appendChild(toggleBtn);
  }
}

// Roep dark mode init aan zodra DOM geladen is
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDarkMode);
} else {
  initDarkMode();
}
// ========== EINDE DARK MODE ==========

// Globale functies beschikbaar maken (voor onclick in HTML)
window.logout = logout
