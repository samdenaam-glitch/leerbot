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

  const { id, language, level } = req.query

  // Geval 1: ID is meegegeven → haal woorden van die specifieke lijst op
  if (id) {
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

  // Geval 2: Geen ID → haal alle gedeelde lijsten op (met optionele filters)
  let query = supabase.from('shared_lists').select('*')
  if (language) query = query.eq('language', language)
  if (level) query = query.eq('level', level)

  const { data: lists, error } = await query.order('language').order('level').order('name')
  if (error) {
    return res.status(500).json({ error: error.message })
  }
  return res.status(200).json(lists)
}
