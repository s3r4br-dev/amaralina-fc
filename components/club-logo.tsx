"use client"

// Club Logo - v17 (simplificado - usa useData com fallback)
import { useRef, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"
import { Upload, X, Check, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface BrandLogoDisplayProps {
  size?: "sm" | "md" | "lg"
  className?: string
  /** Se true, mostra apenas logo padrao sem tentar buscar do contexto */
  staticLogo?: boolean
}

interface BrandLogoUploadProps {
  className?: string
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
}

// Logo padrao AFC (exportado para uso em paginas sem DataProvider)
export function StaticLogo({ size = "md", className }: { size?: "sm" | "md" | "lg", className?: string }) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl bg-gradient-to-br from-[#D4B300] to-[#967948] flex items-center justify-center shadow-lg",
      sizeClasses[size],
      className
    )}>
      <div className="text-[#1a1a1a] font-bold text-center leading-none">
        <span className="text-[0.7em]">AFC</span>
      </div>
    </div>
  )
}

export function BrandLogoDisplay({ size = "md", className, staticLogo = false }: BrandLogoDisplayProps) {
  // Se staticLogo, mostrar logo padrao sem usar contexto
  if (staticLogo) {
    return <StaticLogo size={size} className={className} />
  }
  
  // Usar useData normalmente - este componente so deve ser usado dentro de DataProvider
  const { brandLogo } = useData()
  
  if (brandLogo) {
    return (
      <div className={cn("relative overflow-hidden rounded-lg", sizeClasses[size], className)}>
        <Image
          src={brandLogo}
          alt="Logo do clube"
          fill
          className="object-contain"
          unoptimized
        />
      </div>
    )
  }
  
  return <StaticLogo size={size} className={className} />
}

export function BrandLogoUpload({ className }: BrandLogoUploadProps) {
  const { isAdmin } = useAuth()
  const { brandLogo, setBrandLogo } = useData()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  if (!isAdmin) return null
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione uma imagem válida.")
      return
    }
    
    setError(null)
    setIsProcessing(true)
    
    try {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        setBrandLogo(base64)
        setIsProcessing(false)
      }
      reader.onerror = () => {
        setError("Erro ao processar imagem.")
        setIsProcessing(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setError("Erro ao processar imagem.")
      setIsProcessing(false)
    }
  }
  
  const handleRemoveLogo = () => {
    setBrandLogo(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }
  
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-4">
        <div className="relative">
          {brandLogo ? (
            <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-[#C5A059]">
              <Image
                src={brandLogo}
                alt="Logo do clube"
                fill
                className="object-contain"
                unoptimized
              />
              <button
                onClick={handleRemoveLogo}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-lg border-2 border-dashed border-[#E5E0D8] flex items-center justify-center bg-[#F9F9F9]">
              <ImageIcon className="w-8 h-8 text-[#967948]" />
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059]/10"
          >
            {isProcessing ? (
              <>
                <span className="animate-spin mr-2">...</span>
                Processando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {brandLogo ? "Alterar Logo" : "Enviar Logo"}
              </>
            )}
          </Button>
          <p className="text-xs text-[#967948] mt-1">
            PNG, JPG ou SVG. Máx. 2MB
          </p>
        </div>
      </div>
      
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm">
          <X className="w-4 h-4" />
          {error}
        </div>
      )}
      
      {brandLogo && (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <Check className="w-4 h-4" />
          Logo personalizado ativo
        </div>
      )}
    </div>
  )
}

export default BrandLogoDisplay
