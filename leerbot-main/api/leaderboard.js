import { supabase } from './_lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { data, error } = await supabase
    .from('user_stats')
    .select('user_id, xp, level, streak, profiles(username)')
    .order('xp', { ascending: false })
    .limit(10)

  if (error) return res.status(400).json({ error: error.message })

  // Formatteer data
  const leaderboard = data.map((item, index) => ({
    rank: index + 1,
    username: item.profiles?.username || 'Gebruiker',
    xp: item.xp,
    level: item.level,
    streak: item.streak
  }))

  return res.status(200).json(leaderboard)
}
