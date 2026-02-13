// Vervang door jouw Supabase-gegevens!
const SUPABASE_URL = 'https://jouwproject.supabase.co'
const SUPABASE_ANON_KEY = 'jouw-anon-key'
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
  if (error) alert('Fout: ' + error.message)
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
  if (error) alert('Fout: ' + error.message)
  else alert('Account gemaakt! Check je e-mail om te bevestigen (kan in spam zijn).')
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

// Globale functies beschikbaar maken (voor onclick in HTML)
window.login = login
window.registreer = registreer
window.logout = logout