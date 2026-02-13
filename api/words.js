import { supabase } from './_lib/supabase'

export default async function handler(req, res) {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Niet ingelogd' })
  
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Ongeldige token' })

  const { listId } = req.query

  // Controleer of de lijst van deze gebruiker is
  const { data: list, error: listError } = await supabase
    .from('lists')
    .select('id')
    .eq('id', listId)
    .eq('user_id', user.id)
    .single()

  if (listError || !list) {
    return res.status(403).json({ error: 'Geen toegang tot deze lijst' })
  }

  // GET: alle woorden in deze lijst
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .eq('list_id', listId)
      .order('created_at', { ascending: true })

    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json(data)
  }

  // POST: nieuw woord toevoegen
  if (req.method === 'POST') {
    const { source_word, target_word } = req.body
    if (!source_word || !target_word) {
      return res.status(400).json({ error: 'Beide woorden zijn verplicht' })
    }

    const { data, error } = await supabase
      .from('words')
      .insert([{ list_id: listId, source_word, target_word }])
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })
    return res.status(201).json(data)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
