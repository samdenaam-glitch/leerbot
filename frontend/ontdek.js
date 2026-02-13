let currentFilter = { language: '', level: '' }

document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    window.location.href = 'index.html'
    return
  }
  document.getElementById('username').textContent = session.user.email
  laadLijsten(session.access_token)
})

document.getElementById('filterBtn').addEventListener('click', () => {
  const taal = document.getElementById('taalFilter').value
  const niveau = document.getElementById('niveauFilter').value
  currentFilter = { language: taal, level: niveau }
  const { data: { session } } = supabase.auth.getSession()
  laadLijsten(session.access_token)
})

async function laadLijsten(token) {
  let url = '/api/shared-lists?'
  if (currentFilter.language) url += `language=${currentFilter.language}&`
  if (currentFilter.level) url += `level=${currentFilter.level}`

  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) {
    alert('Fout bij laden van voorbeeldlijsten')
    return
  }
  const lijsten = await res.json()
  const container = document.getElementById('lijstenContainer')
  container.innerHTML = ''
  if (lijsten.length === 0) {
    container.innerHTML = '<p>Geen lijsten gevonden.</p>'
    return
  }
  lijsten.forEach(lijst => {
    const div = document.createElement('div')
    div.className = 'lijst-card'
    div.innerHTML = `
      <h3>${lijst.name}</h3>
      <p>${lijst.description || ''}</p>
      <p><strong>Taal:</strong> ${vertaalTaal(lijst.language)} | <strong>Niveau:</strong> ${lijst.level || '-'}</p>
      <button class="kopieerBtn" data-id="${lijst.id}">📋 Kopieer naar mijn lijsten</button>
      <button class="bekijkBtn" data-id="${lijst.id}">👁️ Bekijk woorden</button>
    `
    container.appendChild(div)
  })

  // Voeg event listeners toe aan de knoppen
  document.querySelectorAll('.kopieerBtn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id
      await kopieerLijst(id, token)
    })
  })
  document.querySelectorAll('.bekijkBtn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id
      toonWoorden(id, token)
    })
  })
}

function vertaalTaal(code) {
  const talen = { en: 'Engels', fr: 'Frans', de: 'Duits' }
  return talen[code] || code
}

async function kopieerLijst(sharedListId, token) {
  const res = await fetch('/api/copy-shared-list', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ sharedListId })
  })
  if (res.ok) {
    const data = await res.json()
    alert('Lijst gekopieerd! Je kunt hem nu vinden in "Mijn lijsten".')
    // Optioneel: direct naar de nieuwe lijst gaan
    if (confirm('Wil je de lijst nu bekijken?')) {
      window.location.href = `lijst.html?id=${data.listId}`
    }
  } else {
    const err = await res.json()
    alert('Fout bij kopiëren: ' + (err.error || 'Onbekende fout'))
  }
}

async function toonWoorden(sharedListId, token) {
  const res = await fetch(`/api/shared-list?id=${sharedListId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) {
    alert('Kan woorden niet laden')
    return
  }
  const woorden = await res.json()
  // Toon een simpele popup of modal (voor nu een alert, maar beter is een modal)
  let bericht = 'Woorden in deze lijst:\n'
  woorden.forEach(w => {
    bericht += `${w.source_word} = ${w.target_word}\n`
  })
  alert(bericht)
}
