import { checkAdmin } from '../_lib/checkAdmin.js'
import { supabase } from '../../_lib/supabase.js'

export default async function handler(req, res) {
  const admin = await checkAdmin(req)
  if (!admin.authorized) {
    return res.status(401).json({ error: admin.error })
  }

  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'ID ontbreekt' })

  // DELETE: lijst verwijderen (cascade naar woorden)
  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('shared_lists')
      .delete()
      .eq('id', id)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(204).send()
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
