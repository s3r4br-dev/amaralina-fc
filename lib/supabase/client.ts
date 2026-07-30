import { createBrowserClient } from '@supabase/ssr'

// Singleton pattern - create client lazily (not at module level)
let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Durante o build/SSR sem env vars, retorna um mock seguro para nao quebrar o prerender.
  // Os contextos sao "use client" e so executam no browser onde as vars estao disponiveis.
  if (!url || !key) {
    const noop = async () => ({})
    const mock = {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: (_: string, cb: () => void) => ({
          data: { subscription: { unsubscribe: () => {} } },
        }),
        signInWithPassword: async () => ({ data: {}, error: null }),
        signOut: async () => ({ error: null }),
        signUp: async () => ({ data: {}, error: null }),
        resetPasswordForEmail: async () => ({ error: null }),
        updateUser: async () => ({ data: {}, error: null }),
      },
      from: (_table: string) => {
        const chain: Record<string, unknown> = {}
        const ret = { data: [], error: null }
        const fn = () => chain
        chain.select = fn
        chain.insert = () => ({ data: null, error: null, select: fn })
        chain.update = fn
        chain.upsert = fn
        chain.delete = fn
        chain.eq = fn
        chain.order = fn
        chain.single = () => ret
        chain.then = (resolve: (v: typeof ret) => void) => resolve(ret)
        return chain
      },
      channel: (_name: string) => ({
        on: () => ({ subscribe: () => ({}) }),
      }),
      removeChannel: noop,
    }
    return mock as unknown as ReturnType<typeof createBrowserClient>
  }

  client = createBrowserClient(url, key)
  return client
}
