let currentToken = null

document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    window.location.href = 'index.html'
    return
  }

  // Controleer of de gebruiker admin is
  const checkRes = await fetch('/api/admin/check', {
    headers: { 'Authorization': `Bearer ${session.access_token}` }
  })
  if (!checkRes.ok) {
    alert('Geen admin-toegang')
    window.location.href = 'dashboard.html'
    return
  }
  const checkData = await checkRes.json()
  if (!checkData.admin) {
    alert('Geen admin-toegang')
    window.location.href = 'dashboard.html'
    return
  }

  currentToken = session.access_token
  document.getElementById('username').textContent = session.user.email
  laadLijsten()
})

document.getElementById('newListForm').addEventListener('submit', async (e) => {
  e.preventDefault()
  const name = document.getElementById('listName').value.trim()
  const description = document.getElementById('listDescription').value.trim()
  const language = document.getElementById('listLanguage').value
  const level = document.getElementById('listLevel').value

  const res = await fetch('/api/admin/shared-lists', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentToken}`
    },
    body: JSON.stringify({ name, description, language, level: level || null })
  })

  if (res.ok) {
    alert('Lijst aangemaakt!')
    document.getElementById('newListForm').reset()
    laadLijsten()
  } else {
    const err = await res.json()
    alert('Fout: ' + (err.error || 'onbekend'))
  }
})

async function laadLijsten() {
  const res = await fetch('/api/admin/shared-lists', {
    headers: { 'Authorization': `Bearer ${currentToken}` }
  })
  if (!res.ok) {
    throw new Error('Niet geautoriseerd')
  }
  const lijsten = await res.json()
  toonLijsten(lijsten)
}

function toonLijsten(lijsten) {
  const container = document.getElementById('listsContainer')
  container.innerHTML = ''
  lijsten.forEach(lijst => {
    const div = document.createElement('div')
    div.className = 'lijst-beheer'
    div.innerHTML = `
      <h3>${lijst.name} <small>(${lijst.language} - ${lijst.level || 'geen niveau'})</small></h3>
      <p>${lijst.description || ''}</p>
      <button class="bekijkWoordenBtn" data-id="${lijst.id}">📖 Bekijk woorden</button>
      <button class="verwijderLijstBtn" data-id="${lijst.id}" style="background:#ff6b6b;">🗑️ Verwijder lijst</button>
      <div id="words-${lijst.id}" style="margin-top:15px; display:none;">
        <h4>Woorden in deze lijst</h4>
        <div class="woorden-lijst" id="woorden-${lijst.id}"></div>
        <form class="nieuwWoordForm" data-id="${lijst.id}" style="margin-top:10px;">
          <input type="text" placeholder="Bronwoord (bijv. hello)" required>
          <input type="text" placeholder="Vertaling (bijv. hallo)" required>
          <button type="submit">➕ Woord toevoegen</button>
        </form>
      </div>
    `
    container.appendChild(div)

    div.querySelector('.bekijkWoordenBtn').addEventListener('click', () => {
      const wordsDiv = document.getElementById(`words-${lijst.id}`)
      if (wordsDiv.style.display === 'none') {
        wordsDiv.style.display = 'block'
        laadWoorden(lijst.id)
      } else {
        wordsDiv.style.display = 'none'
      }
    })

    div.querySelector('.verwijderLijstBtn').addEventListener('click', async () => {
      if (confirm(`Weet je zeker dat je de lijst "${lijst.name}" wilt verwijderen?`)) {
        await verwijderLijst(lijst.id)
      }
    })

    div.querySelector('.nieuwWoordForm').addEventListener('submit', async (e) => {
      e.preventDefault()
      const source = e.target.querySelector('input:first-child').value.trim()
      const target = e.target.querySelector('input:nth-child(2)').value.trim()
      await voegWoordToe(lijst.id, source, target)
      e.target.reset()
      laadWoorden(lijst.id)
    })
  })
}

async function laadWoorden(listId) {
  const res = await fetch(`/api/admin/shared-lists/${listId}/words`, {
    headers: { 'Authorization': `Bearer ${currentToken}` }
  })
  if (!res.ok) return
  const woorden = await res.json()
  const container = document.getElementById(`woorden-${listId}`)
  container.innerHTML = ''
  if (woorden.length === 0) {
    container.innerHTML = '<p>Nog geen woorden.</p>'
    return
  }
  woorden.forEach(w => {
    const woordDiv = document.createElement('div')
    woordDiv.className = 'woord-item'
    woordDiv.innerHTML = `
      <span><strong>${w.source_word}</strong> = ${w.target_word}</span>
      <button class="verwijderWoordBtn" data-wordid="${w.id}">🗑️</button>
    `
    container.appendChild(woordDiv)

    woordDiv.querySelector('.verwijderWoordBtn').addEventListener('click', async () => {
      if (confirm('Woord verwijderen?')) {
        await verwijderWoord(w.id)
        laadWoorden(listId)
      }
    })
  })
}

async function verwijderLijst(listId) {
  const res = await fetch(`/api/admin/shared-lists/${listId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${currentToken}` }
  })
  if (res.ok) {
    alert('Lijst verwijderd')
    laadLijsten()
  } else {
    const err = await res.json()
    alert('Fout: ' + err.error)
  }
}

async function voegWoordToe(listId, source, target) {
  const res = await fetch(`/api/admin/shared-lists/${listId}/words`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentToken}`
    },
    body: JSON.stringify({ source_word: source, target_word: target })
  })
  if (!res.ok) {
    const err = await res.json()
    alert('Fout bij toevoegen: ' + err.error)
  }
}

async function verwijderWoord(wordId) {
  const res = await fetch(`/api/admin/words/${wordId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${currentToken}` }
  })
  if (!res.ok) {
    const err = await res.json()
    alert('Fout bij verwijderen: ' + err.error)
  }
}
