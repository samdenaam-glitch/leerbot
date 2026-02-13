async function laadWoorden(token) {
  const res = await fetch(`/api/words?listId=${lijstId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
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
