// gamification.js
async function updateUserStats(xpGained) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  try {
    const res = await fetch('/api/user-stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ xpGained })
    })
    if (!res.ok) throw new Error('Fout bij updaten stats')
    const stats = await res.json()
    return stats
  } catch (e) {
    console.error(e)
    return null
  }
}

async function loadUserStats() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  try {
    const res = await fetch('/api/user-stats', {
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    })
    if (!res.ok) throw new Error('Fout bij laden stats')
    return await res.json()
  } catch (e) {
    console.error(e)
    return null
  }
}

async function loadUserBadges() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []
  try {
    const res = await fetch('/api/user-badges', {
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    })
    if (!res.ok) return []
    return await res.json()
  } catch (e) {
    return []
  }
}

// Toon stats in elementen (handig voor dashboard)
function displayStats(stats) {
  const xpEl = document.getElementById('xpValue')
  const levelEl = document.getElementById('levelValue')
  const streakEl = document.getElementById('streakValue')
  if (xpEl) xpEl.textContent = stats.xp || 0
  if (levelEl) levelEl.textContent = stats.level || 1
  if (streakEl) streakEl.textContent = stats.streak || 0
}

// Toon badges in container
function displayBadges(badges, containerId) {
  const container = document.getElementById(containerId)
  if (!container) return
  container.innerHTML = ''
  if (badges.length === 0) {
    container.innerHTML = '<p>Nog geen badges behaald. Blijf oefenen!</p>'
    return
  }
  badges.forEach(badge => {
    const div = document.createElement('div')
    div.className = 'badge-item'
    div.innerHTML = `
      <span class="badge-icon">${badge.icon || '🏅'}</span>
      <div class="badge-info">
        <strong>${badge.name}</strong>
        <small>${badge.description}</small>
      </div>
    `
    container.appendChild(div)
  })
}

window.updateUserStats = updateUserStats
window.loadUserStats = loadUserStats
window.loadUserBadges = loadUserBadges
window.displayStats = displayStats
window.displayBadges = displayBadges
