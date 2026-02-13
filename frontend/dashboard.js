const SUPABASE_URL = 'https://jouwproject.supabase.co'
const SUPABASE_ANON_KEY = 'jouw-anon-key'
const supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Controleer login
window.addEventListener('load', async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
        window.location.href = 'index.html'
        return
    }
    laadLijsten(session.access_token)
})

async function laadLijsten(token) {
    const res = await fetch('/api/lists', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    const lists = await res.json()
    const container = document.getElementById('lists-container')
    container.innerHTML = ''
    lists.forEach(list => {
        const div = document.createElement('div')
        div.className = 'list-card'
        div.innerHTML = `
            <h3>${list.name}</h3>
            <p>${list.description || ''}</p>
            <button onclick="bekijkLijst(${list.id})">Bekijk woorden</button>
        `
        container.appendChild(div)
    })
}

// Nieuwe lijst aanmaken
document.getElementById('new-list-btn').addEventListener('click', async () => {
    const name = prompt('Naam van de lijst:')
    if (!name) return
    const description = prompt('Beschrijving (optioneel):')
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/lists', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ name, description })
    })
    if (res.ok) laadLijsten(session.access_token)
    else alert('Fout bij aanmaken')
})