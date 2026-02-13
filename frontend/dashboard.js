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
})

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
  else showToast('Fout bij aanmaken', 'error')
})

async function laadLijsten(token) {
  const res = await fetch('/api/lists', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) {
    showToast('Kan lijsten niet laden', 'error')
    return
  }
  const lijsten = await res.json()
  const container = document.getElementById('lijstenContainer')
  container.innerHTML = ''
  if (lijsten.length === 0) {
    container.innerHTML = `
      <div class="onboarding-card">
        <h2>👋 Welkom bij Leerbot!</h2>
        <p>Je hebt nog geen woordenlijsten. Begin met een van deze opties:</p>
        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
          <button onclick="window.location='ontdek.html'">🌟 Ontdek voorbeeldlijsten</button>
          <button id="nieuwLijstOnboarding">➕ Maak je eigen lijst</button>
        </div>
        <p style="margin-top: 20px;">Of leer hoe het werkt in <a href="#">de handleiding</a>.</p>
      </div>
    `;
    document.getElementById('nieuwLijstOnboarding').addEventListener('click', async () => {
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
      else showToast('Fout bij aanmaken', 'error')
    })
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
