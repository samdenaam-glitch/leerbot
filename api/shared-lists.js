import { supabase } from './_lib/supabase.js'

export default async function handler(req, res) {
  // Alleen GET toestaan
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Controleer of gebruiker is ingelogd (optioneel, maar we hebben RLS op 'authenticated')
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'Niet ingelogd' })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)
  if (userError || !user) {
    return res.status(401).json({ error: 'Ongeldige token' })
  }

  // Haal alle shared lijsten op (met optionele filtering op taal/niveau via query params)
  const { language, level } = req.query
  let query = supabase.from('shared_lists').select('*')
  if (language) query = query.eq('language', language)
  if (level) query = query.eq('level', level)

  const { data, error } = await query.order('language').order('level').order('name')
  if (error) {
    return res.status(500).json({ error: error.message })
  }
  return res.status(200).json(data)
}