import { getSupabaseWithAuth } from './_lib/supabase'

export const config = { runtime: 'nodejs' }

export default async function handler(req, res) {

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Missing token' })

  const supabase = getSupabaseWithAuth(token)

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return res.status(401).json({ error: 'Invalid user' })

  const resource = req.query.resource

  if (req.method === 'GET' && resource === 'lists') {
    const { data, error } = await supabase
      .from('lists')
      .select(`*, words(count)`)
      .eq('user_id', user.id)

    if (error) return res.status(500).json(error)

    const lists = (data||[]).map(l => ({
      ...l,
      woord_count: l.words?.[0]?.count || 0
    }))

    return res.json(lists)
  }

  if (req.method === 'POST' && resource === 'lists') {
    const { name } = req.body || {}
    const { data, error } = await supabase
      .from('lists')
      .insert([{ name, user_id: user.id }])
      .select()

    if (error) return res.status(500).json(error)
    return res.json(data)
  }

  return res.status(404).json({ error: 'Not found' })
}
