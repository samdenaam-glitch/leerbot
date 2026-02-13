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
    showToast('Fout bij laden van voorbeeldlijsten', 'error')
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
    showToast('Lijst gekopieerd! Je kunt hem nu vinden in "Mijn lijsten".', 'success')
    if (confirm('Wil je de lijst nu bekijken?')) {
      window.location.href = `lijst.html?id=${data.listId}`
    }
  } else {
    const err = await res.json()
    showToast('Fout bij kopiëren: ' + (err.error || 'Onbekende fout'), 'error')
  }
}

async function toonWoorden(sharedListId, token) {
  const res = await fetch(`/api/shared-lists/${sharedListId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) {
    showToast('Kan woorden niet laden', 'error')
    return
  }
  const woorden = await res.json()
  const modal = document.getElementById('woordModal')
  const lijstDiv = document.getElementById('modalWoordenLijst')
  lijstDiv.innerHTML = ''
  if (woorden.length === 0) {
    lijstDiv.innerHTML = '<p>Deze lijst heeft nog geen woorden.</p>'
  } else {
    woorden.forEach(w => {
      const p = document.createElement('p')
      p.textContent = `${w.source_word} = ${w.target_word}`
      lijstDiv.appendChild(p)
    })
  }
  modal.style.display = 'block'
}

// Sluit modal als op de X wordt geklikt
document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.querySelector('.close')
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.getElementById('woordModal').style.display = 'none'
    })
  }
})

// Sluit modal als buiten de content wordt geklikt
window.addEventListener('click', (e) => {
  const modal = document.getElementById('woordModal')
  if (e.target === modal) {
    modal.style.display = 'none'
  }
})
