import { supabase } from './_lib/supabase.js'

async function checkAndAwardBadges(userId, xp, streak) {
  // Haal alle badges op die voldoen aan xp <= huidige xp en streak <= huidige streak
  const { data: badges, error } = await supabase
    .from('badges')
    .select('*')
    .lte('required_xp', xp)
    .lte('required_streak', streak)
  if (error) return

  // Haal badges op die gebruiker al heeft
  const { data: userBadges } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId)

  const alreadyOwned = new Set(userBadges?.map(ub => ub.badge_id) || [])
  const toAward = badges.filter(b => !alreadyOwned.has(b.id))

  for (const badge of toAward) {
    await supabase
      .from('user_badges')
      .insert({ user_id: userId, badge_id: badge.id })
    // Optioneel: stuur notificatie (via websocket of push, maar voor nu niet)
  }
}

export default async function handler(req, res) {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Niet ingelogd' })

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)
  if (userError || !user) return res.status(401).json({ error: 'Ongeldige token' })

  // GET: haal stats op
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      return res.status(400).json({ error: error.message })
    }
    // Als nog geen stats bestaan, maak ze aan
    if (!data) {
      const today = new Date().toISOString().split('T')[0]
      const { data: newStats, error: insertError } = await supabase
        .from('user_stats')
        .insert({ user_id: user.id, xp: 0, level: 1, streak: 0, last_active: today })
        .select()
        .single()
      if (insertError) return res.status(400).json({ error: insertError.message })
      return res.status(200).json(newStats)
    }
    return res.status(200).json(data)
  }

  // POST: update stats (bijv. na oefening)
  if (req.method === 'POST') {
    const { xpGained } = req.body
    if (!xpGained || typeof xpGained !== 'number') {
      return res.status(400).json({ error: 'xpGained moet een getal zijn' })
    }

    // Haal huidige stats op
    const { data: current, error: fetchError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      return res.status(400).json({ error: fetchError.message })
    }

    const today = new Date().toISOString().split('T')[0]
    let newStreak = current?.streak || 0
    let lastActive = current?.last_active

    // Update streak
    if (lastActive) {
      const lastDate = new Date(lastActive)
      const todayDate = new Date(today)
      const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24))
      if (diffDays === 1) {
        newStreak += 1
      } else if (diffDays > 1) {
        newStreak = 1 // streak verbroken, begin opnieuw
      }
      // als vandaag al actief, streak niet verhogen (alleen XP toevoegen)
    } else {
      newStreak = 1
    }

    const newXp = (current?.xp || 0) + xpGained
    const newLevel = Math.floor(newXp / 100) + 1 // simpele level berekening: elke 100 XP +1 level

    // Upsert stats
    const { data: updatedStats, error: upsertError } = await supabase
      .from('user_stats')
      .upsert({
        user_id: user.id,
        xp: newXp,
        level: newLevel,
        streak: newStreak,
        last_active: today
      })
      .select()
      .single()

    if (upsertError) return res.status(400).json({ error: upsertError.message })

    // Check badges
    await checkAndAwardBadges(user.id, newXp, newStreak)

    return res.status(200).json(updatedStats)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
