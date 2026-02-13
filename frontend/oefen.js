let lijstId = null

window.getLijstId = function() {
  if (!lijstId) {
    const urlParams = new URLSearchParams(window.location.search)
    lijstId = urlParams.get('id')
  }
  return lijstId
}

let woorden = []
let huidigeIndex = 0
let toonAntwoord = false
let goedCount = 0
let foutCount = 0
let sessieXP = 0
let woordHistory = []

document.addEventListener('DOMContentLoaded', async () => {
  console.log('oefen.js loaded')
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
    await laadStats(session.access_token)
    await laadWoorden(session.access_token)
  } catch (e) {
    console.error('Fout bij laden:', e)
    showToast('Fout bij laden van oefening', 'error')
  }
  if (woorden.length > 0) {
    toonKaart(0)
    updateProgress()
  } else {
    document.getElementById('flashcard').innerHTML = 'Deze lijst is nog leeg! Voeg eerst woorden toe.'
  }
})

async function laadWoorden(token) {
  const res = await fetch(`/api/words?listId=${lijstId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) {
    throw new Error('Kan woorden niet laden')
  }
  woorden = await res.json()
  woordHistory = new Array(woorden.length).fill(false)
}

async function laadStats(token) {
  try {
    const res = await fetch('/api/user-stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      const stats = await res.json()
      document.getElementById('xpDisplay').textContent = stats.xp || 0
      document.getElementById('levelDisplay').textContent = stats.level || 1
      document.getElementById('streakDisplay').textContent = stats.streak || 0
    } else {
      console.warn('Stats endpoint niet bereikbaar, gebruik standaardwaarden')
    }
  } catch (e) {
    console.warn('Fout bij laden stats, negeer', e)
  }
}

async function updateStats(xpGained) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  try {
    const res = await fetch('/api/user-stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ xpGained })
    })
    if (res.ok) {
      const stats = await res.json()
      document.getElementById('xpDisplay').textContent = stats.xp
      document.getElementById('levelDisplay').textContent = stats.level
      document.getElementById('streakDisplay').textContent = stats.streak
      return stats
    }
  } catch (e) {
    console.warn('Fout bij updaten stats', e)
  }
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
  let nieuweIndex = (huidigeIndex + 1) % woorden.length
  toonKaart(nieuweIndex)
}

window.vorigeKaart = function() {
  if (woorden.length === 0) return
  let nieuweIndex = (huidigeIndex - 1 + woorden.length) % woorden.length
  toonKaart(nieuweIndex)
}

function updateProgress() {
  const beantwoord = woordHistory.filter(v => v).length
  const totaal = woorden.length
  document.getElementById('progressText').textContent = `${beantwoord} / ${totaal} woorden`
  const percentage = (beantwoord / totaal) * 100
  document.getElementById('progressFill').style.width = percentage + '%'
}

function checkSessieVoltooid() {
  if (woordHistory.every(v => v === true)) {
    toonEindeSessie()
  }
}

function toonEindeSessie() {
  const modal = document.getElementById('sessieModal')
  if (!modal) return
  document.getElementById('sessieGoed').textContent = goedCount
  document.getElementById('sessieFout').textContent = foutCount
  document.getElementById('sessieXP').textContent = sessieXP
  modal.style.display = 'block'
}

// Sluit modal
const closeModal = document.querySelector('.close')
if (closeModal) {
  closeModal.addEventListener('click', () => {
    document.getElementById('sessieModal').style.display = 'none'
  })
}
window.addEventListener('click', (e) => {
  const modal = document.getElementById('sessieModal')
  if (e.target === modal) {
    modal.style.display = 'none'
  }
})

document.getElementById('goedBtn').addEventListener('click', async () => {
  if (woorden.length === 0) return
  if (woordHistory[huidigeIndex]) {
    showToast('Deze heb je al beantwoord!', 'info')
    return
  }

  goedCount++
  sessieXP += 5
  woordHistory[huidigeIndex] = true
  updateProgress()

  const stats = await updateStats(5)
  if (stats) {
    showToast(`+5 XP! Totaal: ${stats.xp}`, 'success')
  } else {
    showToast(`+5 XP!`, 'success')
  }

  document.getElementById('flashcard').style.transform = 'scale(1.02)'
  setTimeout(() => {
    document.getElementById('flashcard').style.transform = 'scale(1)'
  }, 200)

  if (huidigeIndex < woorden.length - 1) {
    volgendeKaart()
  } else {
    checkSessieVoltooid()
  }
})

document.getElementById('foutBtn').addEventListener('click', async () => {
  if (woorden.length === 0) return
  if (woordHistory[huidigeIndex]) {
    showToast('Deze heb je al beantwoord!', 'info')
    return
  }

  foutCount++
  sessieXP += 1
  woordHistory[huidigeIndex] = true
  updateProgress()

  const stats = await updateStats(1)
  if (stats) {
    showToast(`+1 XP voor doorzettingsvermogen! Totaal: ${stats.xp}`, 'info')
  } else {
    showToast(`+1 XP voor doorzettingsvermogen!`, 'info')
  }

  if (!toonAntwoord) {
    draaiKaart()
  }

  setTimeout(() => {
    if (huidigeIndex < woorden.length - 1) {
      volgendeKaart()
    } else {
      checkSessieVoltooid()
    }
  }, 1500)
})
