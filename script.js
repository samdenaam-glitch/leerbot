// Supabase config (JOUW URL en ANON KEY)
const SUPABASE_URL = 'https://jouwproject.supabase.co'
const SUPABASE_ANON_KEY = 'jouw-anon-key'
const supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Controleer of gebruiker ingelogd is bij laden
window.addEventListener('load', async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
        toonIngelogdeStatus(session.user)
    } else {
        toonUitgelogdeStatus()
    }
})

// Inloggen / registreren via popup (email)
document.getElementById('login-btn')?.addEventListener('click', async () => {
    const email = prompt('E-mailadres:')
    const password = prompt('Wachtwoord:')
    if (email && password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) alert('Fout: ' + error.message)
        else location.reload()
    }
})

document.getElementById('signup-btn')?.addEventListener('click', async () => {
    const email = prompt('E-mailadres:')
    const password = prompt('Wachtwoord (min. 6 tekens):')
    if (email && password) {
        const { data, error } = await supabase.auth.signUp({ 
            email, 
            password,
            options: {
                data: { username: email.split('@')[0] }  // tijdelijke gebruikersnaam
            }
        })
        if (error) alert('Fout: ' + error.message)
        else alert('Account aangemaakt! Check je e-mail voor bevestiging.')
    }
})

document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await supabase.auth.signOut()
    location.reload()
})

function toonIngelogdeStatus(user) {
    document.getElementById('auth-buttons').style.display = 'none'
    document.getElementById('user-info').style.display = 'block'
    document.getElementById('username').textContent = user.email
}

function toonUitgelogdeStatus() {
    document.getElementById('auth-buttons').style.display = 'block'
    document.getElementById('user-info').style.display = 'none'
}