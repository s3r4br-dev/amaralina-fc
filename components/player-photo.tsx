"use client"

import { useState, useRef } from "react"
import { Camera, Trash2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PlayerPhotoProps {
  photoUrl?: string | null
  name?: string | null
  nickname?: string | null
  isAdmin?: boolean
  onPhotoChange?: (photoUrl: string | undefined) => void
  size?: "sm" | "md" | "lg"
  editable?: boolean
  // Alias para compatibilidade com variantes de nomes
  currentPhotoUrl?: string | null
  playerName?: string | null
}

// Processar imagem: redimensionar para 400x400 e converter para WebP 60%
async function processImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Canvas não suportado"))
          return
        }

        // Calcular dimensões mantendo proporção (max 400x400)
        const maxSize = 400
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width)
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height)
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height

        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height)

        // Converter para WebP com 60% de qualidade
        const webpData = canvas.toDataURL("image/webp", 0.6)
        resolve(webpData)
      }
      img.onerror = () => reject(new Error("Erro ao carregar imagem"))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error("Erro ao ler arquivo"))
    reader.readAsDataURL(file)
  })
}

// Obter iniciais do nome (com proteção contra null/undefined)
function getInitials(name?: string | null, nickname?: string | null): string {
  const source = (nickname || name || '').trim()
  if (!source) return '??'
  
  const parts = source.split(" ").filter(Boolean)
  if (parts.length >= 2) {
    const first = parts[0]?.[0] || '?'
    const last = parts[parts.length - 1]?.[0] || '?'
    return (first + last).toUpperCase()
  }
  return (source.substring(0, 2) || '??').toUpperCase()
}

export function PlayerPhoto({ 
  photoUrl,
  currentPhotoUrl,
  name, 
  nickname,
  playerName,
  isAdmin = false, 
  onPhotoChange,
  size = "md",
  editable = false,
}: PlayerPhotoProps) {
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Normalizar props (suporta aliases)
  const finalPhotoUrl = photoUrl || currentPhotoUrl || undefined
  const finalName = name || playerName || ''
  const finalNickname = nickname || ''
  
  const sizeClasses = {
    sm: "w-12 h-12 text-sm",
    md: "w-20 h-20 text-xl",
    lg: "w-32 h-32 text-3xl",
  }

  const initials = getInitials(finalName, finalNickname)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onPhotoChange) return

    try {
      setIsLoading(true)
      const processedPhoto = await processImage(file)
      onPhotoChange(processedPhoto)
    } catch (error) {
      console.error("Erro ao processar imagem:", error)
      alert("Erro ao processar imagem. Tente novamente.")
    } finally {
      setIsLoading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const handleRemovePhoto = () => {
    if (onPhotoChange) {
      onPhotoChange(undefined)
    }
  }

  return (
    <div className="relative group">
      {/* Photo or Initials */}
      <div className={cn(
        "rounded-full overflow-hidden flex items-center justify-center font-bold",
        "bg-gradient-to-br from-[#0088CC] to-[#006699] text-white",
        sizeClasses[size],
        isLoading && "opacity-50"
      )}>
        {finalPhotoUrl ? (
          <img 
            src={finalPhotoUrl} 
            alt={finalNickname || finalName || 'Jogador'}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {/* Edit Controls (Admin Only) - sempre visivel no mobile */}
      {isAdmin && editable && onPhotoChange && (
        <div className={cn(
          "absolute inset-0 rounded-full flex items-center justify-center gap-1",
          "bg-black/50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
        )}>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20 bg-black/30"
            onClick={() => inputRef.current?.click()}
            disabled={isLoading}
          >
            <Camera className="h-4 w-4" />
          </Button>
          {finalPhotoUrl && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-400 hover:bg-red-500/20 bg-black/30"
              onClick={handleRemovePhoto}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

// Versão display-only para cards (sem edição)
export function PlayerPhotoDisplay({ 
  photoUrl,
  currentPhotoUrl,
  name, 
  nickname,
  playerName,
  size = "md",
}: Omit<PlayerPhotoProps, "isAdmin" | "onPhotoChange" | "editable">) {
  // Normalizar props (suporta aliases)
  const finalPhotoUrl = photoUrl || currentPhotoUrl || undefined
  const finalName = name || playerName || ''
  const finalNickname = nickname || ''
  
  const sizeClasses = {
    sm: "w-12 h-12 text-sm",
    md: "w-20 h-20 text-xl",
    lg: "w-32 h-32 text-3xl",
  }

  const initials = getInitials(finalName, finalNickname)

  return (
    <div className={cn(
      "rounded-full overflow-hidden flex items-center justify-center font-bold",
      "bg-gradient-to-br from-[#0088CC] to-[#006699] text-white",
      sizeClasses[size]
    )}>
      {finalPhotoUrl ? (
        <img 
          src={finalPhotoUrl} 
          alt={finalNickname || finalName || 'Jogador'}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}
