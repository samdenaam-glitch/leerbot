// Vervang door jouw Supabase-gegevens!
const SUPABASE_URL = 'https://xxgebftpfslkucdkbila.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4Z2ViZnRwZnNsa3VjZGtiaWxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODMxMDYsImV4cCI6MjA4NjU1OTEwNn0.RLpbmLzwtlxXRPrp24NFB2ai1Cb0bxnKLpsEGC_NxIc'
const supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Controleer sessie bij laden
window.addEventListener('load', async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    toonIngelogd(session.user)
  } else {
    toonUitgelogd()
  }
})

// Inloggen
async function login() {
  const email = prompt('Je e-mailadres:')
  const ww = prompt('Je wachtwoord:')
  if (!email || !ww) return
  const { error } = await supabase.auth.signInWithPassword({ email, password: ww })
  if (error) showToast('Fout: ' + error.message, 'error')
  else location.reload()
}

// Account maken
async function registreer() {
  const email = prompt('E-mailadres:')
  const ww = prompt('Kies een wachtwoord (minstens 6 tekens):')
  if (!email || !ww) return
  const { error } = await supabase.auth.signUp({ 
    email, 
    password: ww,
    options: { data: { username: email.split('@')[0] } }
  })
  if (error) showToast('Fout: ' + error.message, 'error')
  else showToast('Account gemaakt! Check je e-mail om te bevestigen (kan in spam zijn).', 'success')
}

// Uitloggen
async function logout() {
  await supabase.auth.signOut()
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

// Globale functies beschikbaar maken (voor onclick in HTML)
window.login = login
window.registreer = registreer
window.logout = logout
