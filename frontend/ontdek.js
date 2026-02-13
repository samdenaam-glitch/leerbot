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
    container.innerHTML = '<p style="text-align:center;">Geen lijsten gevonden.</p>'
    return
  }
  lijsten.forEach(lijst => {
    const div = document.createElement('div')
    div.className = 'list-card'
    div.innerHTML = `
      <h3>${lijst.name}</h3>
      <p>${lijst.description || ''}</p>
      <div class="list-meta">
        <span>${vertaalTaal(lijst.language)}</span>
        <span>${lijst.level || '-'}</span>
      </div>
      <div class="list-actions">
        <button class="kopieerBtn btn small" data-id="${lijst.id}">📋 Kopiëren</button>
        <button class="bekijkBtn btn small secondary" data-id="${lijst.id}">👁️ Bekijk</button>
      </div>
    `
    container.appendChild(div)
  })

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
