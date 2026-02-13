import { checkAdmin } from '../../_lib/checkAdmin.js'
import { supabase } from '../../../_lib/supabase.js'

export default async function handler(req, res) {
  const admin = await checkAdmin(req)
  if (!admin.authorized) {
    return res.status(401).json({ error: admin.error })
  }

  const { id } = req.query  // shared_list_id
  if (!id) return res.status(400).json({ error: 'Lijst-ID ontbreekt' })

  // Controleer of lijst bestaat (optioneel)
  const { data: list, error: listError } = await supabase
    .from('shared_lists')
    .select('id')
    .eq('id', id)
    .single()
  if (listError || !list) {
    return res.status(404).json({ error: 'Lijst niet gevonden' })
  }

  // GET: woorden van deze lijst
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('shared_list_words')
      .select('*')
      .eq('shared_list_id', id)
      .order('id')

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  // POST: nieuw woord toevoegen
  if (req.method === 'POST') {
    const { source_word, target_word } = req.body
    if (!source_word || !target_word) {
      return res.status(400).json({ error: 'Beide woorden zijn verplicht' })
    }

    const { data, error } = await supabase
      .from('shared_list_words')
      .insert([{ shared_list_id: id, source_word, target_word }])
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
