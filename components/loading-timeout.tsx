"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LoadingTimeoutProps {
  isLoading: boolean
  timeout?: number // milliseconds, default 5000
  onRetry?: () => void
  children?: React.ReactNode
}

export function LoadingTimeout({ 
  isLoading, 
  timeout = 5000, 
  onRetry,
  children 
}: LoadingTimeoutProps) {
  const [showRetry, setShowRetry] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      setShowRetry(false)
      setIsRetrying(false)
      return
    }

    const timer = setTimeout(() => {
      if (isLoading) {
        setShowRetry(true)
      }
    }, timeout)

    return () => clearTimeout(timer)
  }, [isLoading, timeout])

  const handleRetry = async () => {
    setIsRetrying(true)
    setShowRetry(false)
    
    if (onRetry) {
      await onRetry()
    } else {
      // Fallback: reload the page
      window.location.reload()
    }
    
    setIsRetrying(false)
  }

  if (!isLoading && !isRetrying) {
    return <>{children}</>
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin" />
        <p className="text-[#967948] text-sm">
          {isRetrying ? "Recarregando dados..." : "Carregando..."}
        </p>
      </div>

      {showRetry && !isRetrying && (
        <div className="flex flex-col items-center gap-3 mt-4 animate-in fade-in duration-300">
          <p className="text-xs text-[#967948]/70 text-center max-w-[200px]">
            O carregamento está demorando mais que o esperado
          </p>
          <Button
            onClick={handleRetry}
            variant="outline"
            size="sm"
            className="gap-2 border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059]/10 ripple-effect"
          >
            <RefreshCw className="w-4 h-4" />
            Recarregar Dados
          </Button>
        </div>
      )}
    </div>
  )
}

// Simple loading spinner for smaller components
export function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <Loader2 className="w-6 h-6 text-[#C5A059] animate-spin" />
    </div>
  )
}
