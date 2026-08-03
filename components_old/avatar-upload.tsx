"use client"

/**
 * Avatar Upload Component - Amaralina FC
 * Version 2.0 - Com recorte de imagem antes do upload
 */

import { useState, useRef, useCallback } from "react"
import { Camera, Trash2, Loader2, X, Check, Crop } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useData } from "@/contexts/data-context"
import { ImageCropper } from "@/components/image-cropper"

interface AvatarUploadProps {
  jogadorId: number | string
  currentPhoto?: string | null
  onPhotoChange: (newUrl: string | null) => void
  className?: string
}

export function AvatarUpload({
  jogadorId,
  currentPhoto,
  onPhotoChange,
  className,
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [showCropper, setShowCropper] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const supabase = createClient()
  const { refreshData } = useData()

  // Extrair nome do arquivo antigo da URL
  const getOldFilePath = useCallback((url: string | null | undefined): string | null => {
    if (!url) return null
    try {
      // URLs do Supabase Storage: https://xxx.supabase.co/storage/v1/object/public/avatars/filename.jpg
      const match = url.match(/\/avatars\/([^?]+)/)
      return match ? match[1] : null
    } catch {
      return null
    }
  }, [])

  // Quando usuário seleciona arquivo, abrir cropper
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione uma imagem válida")
      return
    }

    // Validar tamanho inicial (max 10MB antes da compressão)
    if (file.size > 10 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 10MB")
      return
    }

    setError(null)

    // Criar URL temporária para o cropper
    const imageUrl = URL.createObjectURL(file)
    setSelectedImage(imageUrl)
    setShowCropper(true)

    // Limpar input para permitir reenvio do mesmo arquivo
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  // Quando o cropper retorna a imagem recortada
  const handleCropComplete = useCallback(async (croppedBlob: Blob) => {
    setIsUploading(true)
    setError(null)

    try {
      // Nome único para o arquivo
      const fileName = `${jogadorId}_${Date.now()}.jpg`
      const filePath = fileName

      // Criar arquivo a partir do blob
      const croppedFile = new File([croppedBlob], fileName, {
        type: "image/jpeg",
        lastModified: Date.now(),
      })

      // Se existe foto antiga, deletar primeiro
      const oldFilePath = getOldFilePath(currentPhoto)
      if (oldFilePath) {
        const { error: deleteError } = await supabase.storage
          .from("avatars")
          .remove([oldFilePath])
        
        if (deleteError) {
          console.warn("Erro ao deletar foto antiga (continuando):", deleteError)
        }
      }

      // Upload da nova foto
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, croppedFile, {
          cacheControl: "3600",
          upsert: true,
        })

      if (uploadError) {
        console.error("Erro no upload:", uploadError)
        throw new Error(uploadError.message)
      }

      // Obter URL pública com cache bust
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath)

      // Adicionar timestamp para evitar cache
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

      // Atualizar no banco de dados
      const { error: updateError } = await supabase
        .from("jogadores")
        .update({ photo_url: publicUrl })
        .eq("id", jogadorId)

      if (updateError) {
        console.error("Erro ao atualizar banco:", updateError)
        throw new Error(updateError.message)
      }

      // Notificar componente pai
      onPhotoChange(publicUrl)
      
      // Atualizar dados em todo o sistema
      await refreshData()
      
    } catch (err) {
      console.error("Erro no upload:", err)
      setError(err instanceof Error ? err.message : "Erro ao fazer upload")
    } finally {
      setIsUploading(false)
      // Limpar URL temporária
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage)
        setSelectedImage(null)
      }
    }
  }, [jogadorId, currentPhoto, onPhotoChange, supabase, getOldFilePath, selectedImage, refreshData])

  // Remover foto
  const handleRemovePhoto = useCallback(async () => {
    setIsUploading(true)
    setError(null)

    try {
      // Deletar arquivo do storage
      const oldFilePath = getOldFilePath(currentPhoto)
      if (oldFilePath) {
        const { error: deleteError } = await supabase.storage
          .from("avatars")
          .remove([oldFilePath])
        
        if (deleteError) {
          console.warn("Erro ao deletar do storage:", deleteError)
        }
      }

      // Limpar campo no banco
      const { error: updateError } = await supabase
        .from("jogadores")
        .update({ photo_url: null })
        .eq("id", jogadorId)

      if (updateError) {
        throw new Error(updateError.message)
      }

      onPhotoChange(null)
      setShowConfirmDelete(false)
      
      // Atualizar dados em todo o sistema
      await refreshData()
      
    } catch (err) {
      console.error("Erro ao remover foto:", err)
      setError(err instanceof Error ? err.message : "Erro ao remover foto")
    } finally {
      setIsUploading(false)
    }
  }, [jogadorId, currentPhoto, onPhotoChange, supabase, getOldFilePath, refreshData])

  // Fechar cropper
  const handleCloseCropper = useCallback((open: boolean) => {
    setShowCropper(open)
    if (!open && selectedImage) {
      URL.revokeObjectURL(selectedImage)
      setSelectedImage(null)
    }
  }, [selectedImage])

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {/* Botões de ação */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059] hover:text-white"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 mr-2" />
              {currentPhoto ? "Trocar Foto" : "Adicionar Foto"}
            </>
          )}
        </Button>

        {currentPhoto && !isUploading && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfirmDelete(true)}
            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 px-3 py-2 rounded-lg">
          <X className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Modal de Recorte */}
      {selectedImage && (
        <ImageCropper
          open={showCropper}
          onOpenChange={handleCloseCropper}
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
          aspectRatio={1}
          cropShape="round"
        />
      )}

      {/* Modal de confirmação para deletar */}
      <Dialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <DialogContent className="sm:max-w-[400px] bg-[#1a1a1a] border-[#333]">
          <DialogHeader>
            <DialogTitle className="text-white">Remover Foto de Perfil</DialogTitle>
            <DialogDescription className="text-[#967948]">
              Tem certeza que deseja remover sua foto de perfil? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDelete(false)}
              disabled={isUploading}
              className="border-[#333] text-[#967948] hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemovePhoto}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removendo...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
