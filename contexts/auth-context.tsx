"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

// Emails que são automaticamente reconhecidos como admin
const ADMIN_EMAILS = ["admin@amaralinafc.com"]

export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "user"
  avatar?: string
  linked_player_id?: number | null
}

interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Load user on mount and listen for auth changes
  // IMPORTANTE: Timeout de 5s para evitar loop infinito
  useEffect(() => {
    let isMounted = true
    const timeoutId = setTimeout(() => {
      if (isMounted && isLoading) {
        // Timeout atingido - usuario nao esta logado, liberar a tela de login
        setIsLoading(false)
      }
    }, 3000) // 3 segundos para mobile
    
    const loadUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!isMounted) return
        
        if (authUser) {
          setSupabaseUser(authUser)
          
          // Get profile from database
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", authUser.id)
            .single()
          
          if (profile) {
            // Verificar se é um email de admin e atualizar role se necessário
            const isAdminEmail = ADMIN_EMAILS.includes(authUser.email!.toLowerCase())
            const effectiveRole = isAdminEmail ? "admin" : profile.role
            
            // Se é admin email mas role está como user, atualiza no banco
            if (isAdminEmail && profile.role !== "admin") {
              await supabase.from("profiles").update({ role: "admin" }).eq("id", profile.id)
            }
            
            setUser({
              id: profile.id,
              email: profile.email,
              name: profile.name,
              role: effectiveRole,
              linked_player_id: profile.linked_player_id,
            })
          } else {
            // Create profile if it doesn't exist
            const isAdminEmail = ADMIN_EMAILS.includes(authUser.email!.toLowerCase())
            const newProfile = {
              id: authUser.id,
              email: authUser.email!,
              name: authUser.user_metadata?.name || authUser.email!.split("@")[0],
              role: isAdminEmail ? "admin" as const : "user" as const,
              status: "active" as const,
            }
            
            await supabase.from("profiles").insert(newProfile)
            
            setUser({
              id: newProfile.id,
              email: newProfile.email,
              name: newProfile.name,
              role: newProfile.role,
            })
          }
        }
      } catch (error) {
        console.error("Error loading user:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()

    // Listen for auth changes - com try-catch robusto e timeout
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (event === "SIGNED_IN" && session?.user) {
            setSupabaseUser(session.user)
            
            // Timeout de 3s para buscar profile - se falhar, usa dados basicos
            const profilePromise = supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .single()
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Profile timeout")), 3000)
            )
            
            try {
              const { data: profile } = await Promise.race([profilePromise, timeoutPromise]) as { data: any }
              
              if (profile) {
                const isAdminEmail = ADMIN_EMAILS.includes(session.user.email!.toLowerCase())
                const effectiveRole = isAdminEmail ? "admin" : profile.role
                
                setUser({
                  id: profile.id,
                  email: profile.email,
                  name: profile.name,
                  role: effectiveRole,
                  linked_player_id: profile.linked_player_id,
                })
              } else {
                // Profile nao existe ainda - usar dados basicos do auth
                setUser({
                  id: session.user.id,
                  email: session.user.email!,
                  name: session.user.email!.split("@")[0],
                  role: ADMIN_EMAILS.includes(session.user.email!.toLowerCase()) ? "admin" : "user",
                })
              }
            } catch {
              // Timeout ou erro - usar dados basicos do auth para nao travar
              setUser({
                id: session.user.id,
                email: session.user.email!,
                name: session.user.email!.split("@")[0],
                role: ADMIN_EMAILS.includes(session.user.email!.toLowerCase()) ? "admin" : "user",
              })
            }
            
            // IMPORTANTE: Garantir que isLoading seja false apos login
            setIsLoading(false)
          } else if (event === "SIGNED_OUT") {
            setUser(null)
            setSupabaseUser(null)
          } else if (event === "PASSWORD_RECOVERY") {
            router.push("/reset-password")
          }
        } catch (error) {
          console.error("Auth state change error:", error)
          // Em caso de erro, garantir que nao trave
          setIsLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [supabase, router])

  const login = async (email: string, password: string) => {
    try {
      // NAO setar isLoading aqui - deixar o onAuthStateChange gerenciar
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.user) {
        // Verificar status do profile com timeout curto (1s)
        try {
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("timeout")), 1000)
          )
          const profilePromise = supabase
            .from("profiles")
            .select("status")
            .eq("id", data.user.id)
            .single()
          
          const { data: profile } = await Promise.race([profilePromise, timeoutPromise]) as { data: any }
          
          if (profile?.status === "inactive") {
            await supabase.auth.signOut()
            return { success: false, error: "Conta desativada. Entre em contato com o administrador." }
          }
        } catch {
          // Timeout ou erro - prosseguir com login (verificacao nao e critica)
        }
        
        // Limpar qualquer cache antigo do localStorage que possa causar problemas
        try {
          localStorage.removeItem("auth-error")
          localStorage.removeItem("login-state")
        } catch {}
        
        return { success: true }
      }

      return { success: false, error: "Erro desconhecido" }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Erro ao fazer login" }
    }
  }

  const register = async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            name,
          },
        },
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.user) {
        return { success: true }
      }

      return { success: false, error: "Erro ao criar conta" }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Erro ao registrar" }
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Erro ao enviar email" }
    }
  }

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar senha" }
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSupabaseUser(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        isLoading,
        login,
        logout,
        register,
        resetPassword,
        updatePassword,
        isAdmin: user?.role === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider")
  }
  return context
}
