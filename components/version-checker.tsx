"use client"

/**
 * Version Checker - Cache Busting Component
 * Detecta novas versões e força atualização do navegador
 */
import { useEffect, useState } from "react"
import { RefreshCw, X } from "lucide-react"
import { Button } from "@/components/ui/button"

// Versão atual do app - incrementar a cada deploy
export const APP_VERSION = "2.0.0"

interface VersionData {
  version: string
  buildTime: string
}

export function VersionChecker() {
  const [showUpdateBanner, setShowUpdateBanner] = useState(false)
  const [newVersion, setNewVersion] = useState<string | null>(null)

  useEffect(() => {
    // Verificar versão no localStorage
    const storedVersion = localStorage.getItem("app_version")
    
    if (storedVersion && storedVersion !== APP_VERSION) {
      // Nova versão detectada!
      setNewVersion(APP_VERSION)
      setShowUpdateBanner(true)
    } else {
      // Salvar versão atual
      localStorage.setItem("app_version", APP_VERSION)
    }
    
    // Verificar periodicamente por novas versões (a cada 5 minutos)
    const interval = setInterval(async () => {
      try {
        // Tentar buscar versão do servidor com cache-bust
        const response = await fetch(`/api/version?t=${Date.now()}`, { 
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" }
        })
        if (response.ok) {
          const data: VersionData = await response.json()
          if (data.version !== APP_VERSION) {
            setNewVersion(data.version)
            setShowUpdateBanner(true)
          }
        }
      } catch {
        // Ignorar erros de fetch
      }
    }, 5 * 60 * 1000) // 5 minutos
    
    return () => clearInterval(interval)
  }, [])

  const handleUpdate = () => {
    // Limpar cache e recarregar
    localStorage.setItem("app_version", newVersion || APP_VERSION)
    
    // Limpar service worker cache se existir
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name))
      })
    }
    
    // Forçar reload sem cache
    window.location.reload()
  }

  const handleDismiss = () => {
    setShowUpdateBanner(false)
    // Salvar que usuario viu o banner
    localStorage.setItem("app_version", newVersion || APP_VERSION)
  }

  if (!showUpdateBanner) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[10000] animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 p-4 rounded-lg border shadow-lg"
        style={{ 
          backgroundColor: "#1a1a1a", 
          borderColor: "rgba(212, 179, 0, 0.5)"
        }}
      >
        <RefreshCw className="w-5 h-5 flex-shrink-0 text-[#D4B300]" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">Nova versao disponivel</p>
          <p className="text-xs text-[#967948]">v{newVersion} - Clique para atualizar</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleUpdate}
            style={{ backgroundColor: "#D4B300", color: "#1a1a1a" }}
          >
            Atualizar
          </Button>
          <button
            onClick={handleDismiss}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-[#967948]" />
          </button>
        </div>
      </div>
    </div>
  )
}
