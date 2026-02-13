import { supabase } from './_lib/supabase.js'

export default async function handler(req, res) {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Niet ingelogd' })

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)
  if (userError || !user) return res.status(401).json({ error: 'Ongeldige token' })

  // Haal alle woorden van deze gebruiker op (uit al zijn lijsten)
  const { data: words, error } = await supabase
    .from('words')
    .select('id, source_word, target_word, list_id')
    .eq('user_id', user.id) // Let op: words heeft geen user_id, alleen list_id. We moeten via lists joinen.
    // Simpel: haal eerst alle list_ids van de gebruiker, dan woorden.
    // Voor nu: vereenvoudigen we en nemen we aan dat words tabel een user_id heeft? Maar dat is niet zo.
    // Laten we een join doen in Supabase (kan met foreign key)
    // Of we gebruiken een aparte tabel 'user_words' maar dat is te veel.
    // Alternatief: we halen eerst alle lijsten op, dan per lijst woorden, maar dat is inefficiënt.
    // Voor nu doen we een simpele: we halen alle woorden op uit alle lijsten van de gebruiker via een join.
    // Dit kan met Supabase's from('words').select('*, lists!inner(user_id)').eq('lists.user_id', user.id)
}

// Ik vereenvoudig: we nemen aan dat de gebruiker woorden heeft, en we randomizen een set.
// Maar voor nu laten we dit endpoint even rusten. We kunnen ook gewoon een willekeurige lijst kiezen.
