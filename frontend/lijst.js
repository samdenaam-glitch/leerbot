let lijstId = null

// Functie beschikbaar maken voor HTML (moet direct beschikbaar zijn)
window.getLijstId = function() {
  if (!lijstId) {
    // Fallback: probeer opnieuw uit URL te halen
    const urlParams = new URLSearchParams(window.location.search)
    lijstId = urlParams.get('id')
  }
  return lijstId
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('lijst.js loaded')
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
  try {
    await laadLijstNaam(session.access_token)
    await laadWoorden(session.access_token)
  } catch (e) {
    console.error('Fout bij laden:', e)
    showToast('Fout bij laden van lijst', 'error')
  }
})

async function laadLijstNaam(token) {
  const res = await fetch(`/api/lists`, { headers: { 'Authorization': `Bearer ${token}` } })
  if (!res.ok) {
    throw new Error('Kan lijsten niet laden')
  }
  const lijsten = await res.json()
  const lijst = lijsten.find(l => l.id == lijstId)
  if (lijst) document.getElementById('lijstNaam').textContent = lijst.name
}

async function laadWoorden(token) {
  const res = await fetch(`/api/words?listId=${lijstId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) {
    throw new Error('Kan woorden niet laden')
  }
  const woorden = await res.json()
  const container = document.getElementById('woordenContainer')
  container.innerHTML = ''
  if (woorden.length === 0) {
    container.innerHTML = '<p style="text-align:center;">Nog geen woordjes. Voeg er een toe!</p>'
    return
  }
  woorden.forEach(w => {
    const div = document.createElement('div')
    div.className = 'word-item'
    div.innerHTML = `
      <div class="word-pair">
        <span class="source">${w.source_word}</span>
        <span>→</span>
        <span class="target">${w.target_word}</span>
      </div>
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
  if (!session) {
    showToast('Niet ingelogd', 'error')
    return
  }
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
    const err = await res.json().catch(() => ({}))
    showToast('Fout bij toevoegen: ' + (err.error || 'Onbekende fout'), 'error')
  }
})

window.verwijderWoord = async function(id) {
  if (!confirm('Weet je zeker dat je dit woord wilt verwijderen?')) return
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    showToast('Niet ingelogd', 'error')
    return
  }
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
