let lijstId = null
let woorden = []
let huidigeIndex = 0
let toonAntwoord = false
let goedCount = 0
let foutCount = 0
let huidigeWoordId = null
let xpTotaalSessie = 0

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
  document.getElementById('voorkant').classList.add('active')
  document.getElementById('achterkant').classList.remove('active')
  document.getElementById('achterkant').textContent = woorden[index].target_word
  document.getElementById('teller').textContent = `${index+1} / ${woorden.length}`
  
  // Update voortgangsbalk
  const progress = ((index + 1) / woorden.length) * 100
  document.getElementById('progressBar').style.width = progress + '%'
}

window.draaiKaart = function() {
  if (woorden.length === 0) return
  toonAntwoord = !toonAntwoord
  if (toonAntwoord) {
    document.getElementById('voorkant').classList.remove('active')
    document.getElementById('achterkant').classList.add('active')
  } else {
    document.getElementById('voorkant').classList.add('active')
    document.getElementById('achterkant').classList.remove('active')
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

// XP update functie
async function geefXP(points, isGoed) {
  const stats = await updateUserStats(points)
  if (stats) {
    xpTotaalSessie += points
    document.getElementById('xpFeedback').textContent = `+${points} XP (totaal deze sessie: ${xpTotaalSessie})`
    // Optioneel: toon toast
    showToast(`+${points} XP!`, 'success')
    
    // Als er een streak is, toon een extra bericht
    if (stats.streak > 0 && stats.streak % 7 === 0) {
      showToast(`🔥 ${stats.streak} dagen streak!`, 'success')
    }
  }
}

// Event listeners voor knoppen
document.getElementById('goedBtn').addEventListener('click', async () => {
  if (woorden.length === 0) return
  goedCount++
  await geefXP(5, true)
  // Toon even een vrolijke animatie? (later)
  volgendeKaart()
})

document.getElementById('foutBtn').addEventListener('click', async () => {
  if (woorden.length === 0) return
  foutCount++
  await geefXP(1, false)
  // Toon het antwoord even voordat we verder gaan
  if (!toonAntwoord) {
    draaiKaart() // toon antwoord
    setTimeout(() => {
      volgendeKaart()
    }, 1500)
  } else {
    volgendeKaart()
  }
})

// Optioneel: toon aan het einde van de lijst een samenvatting
// Dit kan door te checken of we weer bij index 0 zijn na een ronde
// (maar dat is voor later)
