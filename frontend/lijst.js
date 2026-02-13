let lijstId = null

document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    window.location.href = 'index.html'
    return
  }

  const urlParams = new URLSearchParams(window.location.search)
  lijstId = urlParams.get('id')
  if (!lijstId) {
    alert('Geen lijst geselecteerd')
    window.location.href = 'dashboard.html'
    return
  }

  document.getElementById('username').textContent = session.user.email
  laadWoorden(session.access_token)
  laadLijstNaam(session.access_token)
})

window.getLijstId = () => lijstId

async function laadLijstNaam(token) {
  const res = await fetch(`/api/lists`, { headers: { 'Authorization': `Bearer ${token}` } })
  const lijsten = await res.json()
  const lijst = lijsten.find(l => l.id == lijstId)
  if (lijst) document.getElementById('lijstNaam').textContent = lijst.name
}

async function laadWoorden(token) {
  const res = await fetch(`/api/words?listId=${lijstId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const woorden = await res.json()
  const container = document.getElementById('woordenContainer')
  container.innerHTML = ''
  if (woorden.length === 0) {
    container.innerHTML = '<p>Nog geen woordjes. Voeg er een toe!</p>'
    return
  }
  woorden.forEach(w => {
    const div = document.createElement('div')
    div.className = 'woord'
    div.innerHTML = `
      <span><strong>${w.source_word}</strong> = ${w.target_word}</span>
      <button onclick="verwijderWoord(${w.id})">🗑️</button>
    `
    container.appendChild(div)
  })
}

document.getElementById('voegWoordBtn').addEventListener('click', async () => {
  const bron = document.getElementById('bronWoord').value.trim()
  const doel = document.getElementById('doelWoord').value.trim()
  if (!bron || !doel) {
    showToast('Vul beide woorden in!', 'warning')
    return
  }
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`/api/words?listId=${lijstId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ source_word: bron, target_word: doel })
  })
  if (res.ok) {
    document.getElementById('bronWoord').value = ''
    document.getElementById('doelWoord').value = ''
    laadWoorden(session.access_token)
    showToast('Woord toegevoegd!', 'success')
  } else {
    showToast('Fout bij toevoegen', 'error')
  }
})

window.verwijderWoord = async function(id) {
  if (!confirm('Weet je zeker dat je dit woord wilt verwijderen?')) return
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`/api/words?listId=${lijstId}&id=${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${session.access_token}` }
  })
  if (res.ok) {
    laadWoorden(session.access_token)
    showToast('Woord verwijderd', 'success')
  } else {
    showToast('Fout bij verwijderen', 'error')
  }
}
