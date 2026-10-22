// The Supabase client is created lazily and loaded as a separate chunk, so players who never use the cloud
// features download nothing extra. With no keys configured the app is fully local.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
export const cloudEnabled = Boolean(url && key)

let pending = null
export function getClient() {
  if (!cloudEnabled) return Promise.resolve(null)
  if (!pending) {
    pending = import('@supabase/supabase-js').then((m) =>
      m.createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
    )
  }
  return pending
}
