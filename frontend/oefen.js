let lijstId = null
let woorden = []
let huidigeIndex = 0
let toonAntwoord = false

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
  await laadWoorden(session.access_token)
  if (woorden.length > 0) toonKaart(0)
  else document.getElementById('card').innerHTML = 'Deze lijst is nog leeg! Voeg eerst woorden toe.'
})

window.getLijstId = () => lijstId

async function laadWoorden(token) {
  const res = await fetch(`/api/words?listId=${lijstId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  woorden = await res.json()
}

function toonKaart(index) {
  if (woorden.length === 0) return
  huidigeIndex = index
  toonAntwoord = false
  document.getElementById('voorkant').textContent = woorden[index].source_word
  document.getElementById('voorkant').style.display = 'block'
  document.getElementById('achterkant').style.display = 'none'
  document.getElementById('achterkant').textContent = woorden[index].target_word
  document.getElementById('teller').textContent = `${index+1} / ${woorden.length}`
}

window.draaiKaart = function() {
  if (woorden.length === 0) return
  toonAntwoord = !toonAntwoord
  if (toonAntwoord) {
    document.getElementById('voorkant').style.display = 'none'
    document.getElementById('achterkant').style.display = 'block'
  } else {
    document.getElementById('voorkant').style.display = 'block'
    document.getElementById('achterkant').style.display = 'none'
  }
}

window.volgendeKaart = function() {
  if (woorden.length === 0) return
  let nieuweIndex = huidigeIndex + 1
  if (nieuweIndex >= woorden.length) nieuweIndex = 0
  toonKaart(nieuweIndex)
}

window.vorigeKaart = function() {
  if (woorden.length === 0) return
  let nieuweIndex = huidigeIndex - 1
  if (nieuweIndex < 0) nieuweIndex = woorden.length - 1
  toonKaart(nieuweIndex)
}