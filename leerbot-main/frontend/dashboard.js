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
  const res = await fetch('/api?resource=lists', {
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
  const res = await fetch('/api?resource=lists', {
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
        <h2>👋 Welkom!</h2>
        <p>Je hebt nog geen lijsten. Start met een voorbeeld of maak je eigen lijst.</p>
        <div style="display:flex; gap:16px; justify-content:center; flex-wrap:wrap;">
          <button onclick="window.location='ontdek.html'" class="btn">🌟 Ontdek voorbeelden</button>
          <button id="nieuwLijstOnboarding" class="btn secondary">➕ Eigen lijst</button>
        </div>
      </div>
    `
    document.getElementById('nieuwLijstOnboarding').addEventListener('click', async () => {
      const naam = prompt('Naam van de nieuwe lijst:')
      if (!naam) return
      const beschrijving = prompt('Korte beschrijving (niet verplicht):', '')
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api?resource=lists', {
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
    div.className = 'list-card'
    div.innerHTML = `
      <h3>${lijst.name}</h3>
      <p>${lijst.description || 'Geen beschrijving'}</p>
      <div class="list-meta">
        <span>${lijst.woord_count || 0} woorden</span>
      </div>
      <div class="list-actions">
        <button onclick="window.location='lijst.html?id=${lijst.id}'" class="btn small">📖 Bekijk</button>
        <button onclick="window.location='oefen.html?id=${lijst.id}'" class="btn small secondary">🎴 Oefenen</button>
      </div>
    `
    container.appendChild(div)
  })
}
