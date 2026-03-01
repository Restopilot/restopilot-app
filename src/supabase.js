import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase non configuré. Ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env')
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

// ============ AUTH ============
export async function loginUser(email, password) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('password_hash', password)
    .single()
  if (error || !data) return null
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role,
    restaurantId: data.restaurant_id,
  }
}

// ============ RESTAURANTS ============
export async function fetchRestaurants() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) { console.error(error); return [] }
  return data.map(r => ({
    id: r.id,
    name: r.name,
    address: r.address || '',
    color: r.color || '#007AFF',
    objectives: r.objectives || {},
    dateOverrides: r.date_overrides || {},
  }))
}

export async function createRestaurant({ name, address, color, objectives }) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('restaurants')
    .insert([{ name, address, color, objectives, date_overrides: {} }])
    .select()
    .single()
  if (error) { console.error(error); return null }
  return { id: data.id, name: data.name, address: data.address, color: data.color, objectives: data.objectives, dateOverrides: {} }
}

export async function updateRestaurant(id, updates) {
  if (!supabase) return false
  const payload = {}
  if (updates.name !== undefined) payload.name = updates.name
  if (updates.address !== undefined) payload.address = updates.address
  if (updates.color !== undefined) payload.color = updates.color
  if (updates.objectives !== undefined) payload.objectives = updates.objectives
  if (updates.dateOverrides !== undefined) payload.date_overrides = updates.dateOverrides
  const { error } = await supabase.from('restaurants').update(payload).eq('id', id)
  if (error) { console.error(error); return false }
  return true
}

// ============ USERS ============
export async function fetchUsers() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) { console.error(error); return [] }
  return data.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    restaurantId: u.restaurant_id,
    password: u.password_hash,
  }))
}

export async function createUser({ name, email, password, role, restaurantId }) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('users')
    .insert([{ name, email, password_hash: password, role, restaurant_id: restaurantId }])
    .select()
    .single()
  if (error) { console.error(error); return null }
  return { id: data.id, name: data.name, email: data.email, role: data.role, restaurantId: data.restaurant_id, password: data.password_hash }
}

export async function deleteUser(id) {
  if (!supabase) return false
  const { error } = await supabase.from('users').delete().eq('id', id)
  if (error) { console.error(error); return false }
  return true
}

// ============ DAILY ENTRIES + INVOICES ============
export async function fetchDailyData(restaurantId) {
  if (!supabase || !restaurantId) return []
  const { data: entries, error: e1 } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('date', { ascending: true })
  if (e1) { console.error(e1); return [] }

  const { data: invoices, error: e2 } = await supabase
    .from('invoices')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('date', { ascending: true })
  if (e2) { console.error(e2); return [] }

  return entries.map(entry => ({
    date: entry.date,
    ca: parseFloat(entry.ca),
    objectif: parseFloat(entry.objectif),
    entryId: entry.id,
    invoices: invoices
      .filter(i => i.daily_entry_id === entry.id)
      .map(i => ({
        id: i.id,
        fournisseur: i.fournisseur,
        montant: parseFloat(i.montant),
        categorie: i.categorie,
        date: i.date,
      })),
  }))
}

export async function saveDailyEntry(restaurantId, { date, ca, objectif, invoices }) {
  if (!supabase) return false

  // Upsert daily entry
  const { data: existing } = await supabase
    .from('daily_entries')
    .select('id')
    .eq('restaurant_id', restaurantId)
    .eq('date', date)
    .single()

  let entryId
  if (existing) {
    entryId = existing.id
    await supabase.from('daily_entries').update({ ca, objectif }).eq('id', entryId)
    // Delete old invoices
    await supabase.from('invoices').delete().eq('daily_entry_id', entryId)
  } else {
    const { data: newEntry, error } = await supabase
      .from('daily_entries')
      .insert([{ restaurant_id: restaurantId, date, ca, objectif }])
      .select()
      .single()
    if (error) { console.error(error); return false }
    entryId = newEntry.id
  }

  // Insert invoices
  if (invoices.length > 0) {
    const rows = invoices.map(i => ({
      daily_entry_id: entryId,
      restaurant_id: restaurantId,
      fournisseur: i.fournisseur,
      montant: i.montant,
      categorie: i.categorie,
      date: i.date || date,
    }))
    const { error } = await supabase.from('invoices').insert(rows)
    if (error) { console.error(error); return false }
  }

  return true
}
