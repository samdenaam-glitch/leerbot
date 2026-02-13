import { supabase } from './_lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'Niet ingelogd' })
  }
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)
  if (userError || !user) {
    return res.status(401).json({ error: 'Ongeldige token' })
  }

  const { id } = req.query
  if (!id) {
    return res.status(400).json({ error: 'ID ontbreekt' })
  }

  const { data: words, error } = await supabase
    .from('shared_list_words')
    .select('*')
    .eq('shared_list_id', id)
    .order('id')

  if (error) {
    return res.status(500).json({ error: error.message })
  }
  return res.status(200).json(words)
}