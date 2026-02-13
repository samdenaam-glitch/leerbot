import { checkAdmin } from './_lib/checkAdmin.js'
import { supabase } from '../_lib/supabase.js'

export default async function handler(req, res) {
  // Admin-check
  const admin = await checkAdmin(req)
  if (!admin.authorized) {
    return res.status(401).json({ error: admin.error })
  }

  // GET: alle gedeelde lijsten
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('shared_lists')
      .select('*')
      .order('language')
      .order('level')
      .order('name')

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  // POST: nieuwe lijst aanmaken
  if (req.method === 'POST') {
    const { name, description, language, level } = req.body
    if (!name || !language) {
      return res.status(400).json({ error: 'Naam en taal zijn verplicht' })
    }

    const { data, error } = await supabase
      .from('shared_lists')
      .insert([{ name, description, language, level }])
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
