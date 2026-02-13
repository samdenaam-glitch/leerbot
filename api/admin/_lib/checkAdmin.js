import { supabase } from '../../_lib/supabase.js'

// Vervang dit door jouw e-mailadres (of meerdere)
const ADMIN_EMAILS = ['jouw-email@example.com']  // ← JOUW E-MAIL HIER

export async function checkAdmin(req) {
  const authHeader = req.headers.authorization
  if (!authHeader) return { authorized: false, error: 'Niet ingelogd' }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return { authorized: false, error: 'Ongeldige token' }

  if (!ADMIN_EMAILS.includes(user.email)) {
    return { authorized: false, error: 'Geen admin-rechten' }
  }

  return { authorized: true, user }
}
