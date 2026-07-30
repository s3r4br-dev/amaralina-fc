"use client"

/**
 * Dashboard Layout - Amaralina FC
 * Version: 32.0 - Fix loading after login + timeout safety
 */
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"
import { Sidebar } from "@/components/sidebar"
import { Loader2 } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading: authLoading } = useAuth()
  const { refreshData } = useData()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [forceShow, setForceShow] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setMounted(true)
    
    // TIMEOUT DE SEGURANCA: Se loading demorar mais de 3s, forcar exibicao
    timeoutRef.current = setTimeout(() => {
      setForceShow(true)
    }, 3000)
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  useEffect(() => {
    // Redirecionar para login apenas quando auth terminou e nao ha usuario
    if (!authLoading && !user && !forceShow) {
      router.push("/login")
    }
  }, [user, authLoading, router, forceShow])

  // Limpar timeout quando auth terminar
  useEffect(() => {
    if (!authLoading && timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [authLoading])

  // IMPORTANTE: Nao bloquear por dataLoading - apenas authLoading
  // forceShow bypassa o loading se demorar mais de 3s

  // Tela de loading APENAS para auth (nao para dados) - com timeout de seguranca
  if (!mounted || (authLoading && !forceShow)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] safe-area-top safe-area-bottom">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#D4B300]" />
          <p className="text-sm text-[#967948]">Carregando...</p>
        </div>
      </div>
    )
  }

  // Se nao ha usuario apos auth terminar E nao estamos em forceShow, redirect em andamento
  if (!user && !forceShow) {
    return null
  }
  
  // Se forceShow mas ainda nao tem user, mostrar mensagem e botao de retry
  if (!user && forceShow) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] safe-area-top safe-area-bottom">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <p className="text-[#D4B300]">Sessao expirada ou erro de conexao</p>
          <button 
            onClick={() => router.push("/login")}
            className="px-4 py-2 bg-[#D4B300] text-[#1a1a1a] rounded-lg font-medium hover:bg-[#D4B300]/90 transition-colors"
          >
            Ir para Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen stadium-background overscroll-none">
      <Sidebar />
      {/* Main content - responsive padding for mobile (pt-16 para header hamburguer, sem bottom nav padding) */}
      <main className="flex-1 ml-0 md:ml-64 p-4 pt-16 md:pt-8 md:p-8 page-transition w-full">
        {children}
      </main>
    </div>
  )
}
