import { supabase } from './_lib/supabase.js'

export default async function handler(req, res) {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Niet ingelogd' })

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Ongeldige token' })

  // GET: profiel ophalen
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()
    if (error && error.code !== 'PGRST116') {
      return res.status(400).json({ error: error.message })
    }
    return res.status(200).json({ username: data?.username || user.email })
  }

  // POST: gebruikersnaam instellen
  if (req.method === 'POST') {
    const { username } = req.body
    if (!username) return res.status(400).json({ error: 'Gebruikersnaam verplicht' })
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, username })
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ username })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
