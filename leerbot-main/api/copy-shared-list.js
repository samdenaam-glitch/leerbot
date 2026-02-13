import { supabase } from './_lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

  const { sharedListId } = req.body
  if (!sharedListId) {
    return res.status(400).json({ error: 'sharedListId ontbreekt' })
  }

  // Haal de gedeelde lijst op (naam, beschrijving)
  const { data: sharedList, error: listError } = await supabase
    .from('shared_lists')
    .select('name, description')
    .eq('id', sharedListId)
    .single()
  if (listError || !sharedList) {
    return res.status(404).json({ error: 'Gedeelde lijst niet gevonden' })
  }

  // Maak een nieuwe lijst aan voor de gebruiker
  const { data: newList, error: insertError } = await supabase
    .from('lists')
    .insert({
      user_id: user.id,
      name: sharedList.name + ' (kopie)',
      description: sharedList.description || 'Gekopieerd van voorbeeldlijst'
    })
    .select()
    .single()
  if (insertError) {
    return res.status(500).json({ error: insertError.message })
  }

  // Haal alle woorden van de gedeelde lijst op
  const { data: words, error: wordsError } = await supabase
    .from('shared_list_words')
    .select('source_word, target_word')
    .eq('shared_list_id', sharedListId)
  if (wordsError) {
    // Als dit mislukt, verwijder dan de aangemaakte lijst om inconsistentie te voorkomen
    await supabase.from('lists').delete().eq('id', newList.id)
    return res.status(500).json({ error: wordsError.message })
  }

  if (words.length === 0) {
    // Lijst heeft geen woorden – toch ok, maar dan is het een lege lijst
    return res.status(201).json({ listId: newList.id })
  }

  // Voeg alle woorden toe aan de nieuwe lijst
  const wordsToInsert = words.map(w => ({
    list_id: newList.id,
    source_word: w.source_word,
    target_word: w.target_word
  }))

  const { error: insertWordsError } = await supabase
    .from('words')
    .insert(wordsToInsert)
  if (insertWordsError) {
    // Verwijder de lijst om opschoning te doen
    await supabase.from('lists').delete().eq('id', newList.id)
    return res.status(500).json({ error: insertWordsError.message })
  }

  return res.status(201).json({ listId: newList.id })
}