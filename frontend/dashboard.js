// Wordt geladen na script.js (dus supabase is al beschikbaar)
const API_BASE = ''  // leeg = zelfde domein (werkt via Vercel rewrite)

document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    window.location.href = 'index.html'
    return
  }
  document.getElementById('username').textContent = session.user.email
  laadLijsten(session.access_token)
  checkAdminAndShowButton(session.access_token)   // nieuw
})

// Nieuwe functie: controleer of de gebruiker admin is en toon knop
async function checkAdminAndShowButton(token) {
  const res = await fetch('/api/admin/check', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (res.ok) {
    const data = await res.json()
    if (data.admin) {
      document.getElementById('adminButtonContainer').innerHTML = '<button onclick="window.location=\'admin.html\'" style="background:#333;">🛠️ Admin</button>'
    }
  }
}

document.getElementById('nieuwLijstBtn').addEventListener('click', async () => {
  const naam = prompt('Naam van de nieuwe lijst (bijv. "Frans H3"):')
  if (!naam) return
  const beschrijving = prompt('Korte beschrijving (niet verplicht):', '')
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch('/api/lists', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ name: naam, description: beschrijving })
  })
  if (res.ok) laadLijsten(session.access_token)
  else alert('Fout bij aanmaken')
})

async function laadLijsten(token) {
  const res = await fetch('/api/lists', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) {
    alert('Kan lijsten niet laden')
    return
  }
  const lijsten = await res.json()
  const container = document.getElementById('lijstenContainer')
  container.innerHTML = ''
  if (lijsten.length === 0) {
    container.innerHTML = '<p>Je hebt nog geen lijsten. Maak er een!</p>'
    return
  }
  lijsten.forEach(lijst => {
    const div = document.createElement('div')
    div.className = 'lijst'
    div.innerHTML = `
      <div>
        <strong>${lijst.name}</strong><br>
        <small>${lijst.description || 'geen beschrijving'}</small>
      </div>
      <div>
        <button onclick="window.location='lijst.html?id=${lijst.id}'">📖 Bekijk</button>
        <button onclick="window.location='oefen.html?id=${lijst.id}'">🎴 Oefenen</button>
      </div>
    `
    container.appendChild(div)
  })
}
