import { supabase } from './_lib/supabase.js'

export default async function handler(req, res) {
  // Alleen ingelogde gebruikers toestaan (via JWT)
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'Niet ingelogd' })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return res.status(401).json({ error: 'Ongeldige token' })
  }

  // GET: alle lijsten van deze gebruiker
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('lists')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json(data)
  }

  // POST: nieuwe lijst aanmaken
  if (req.method === 'POST') {
    const { name, description } = req.body
    if (!name) return res.status(400).json({ error: 'Naam verplicht' })

    const { data, error } = await supabase
      .from('lists')
      .insert([{ user_id: user.id, name, description }])
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })
    return res.status(201).json(data)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
