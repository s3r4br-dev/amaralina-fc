"use client"

/**
 * Image Cropper Component - Amaralina FC
 * Versao 2.0 - Usando react-easy-crop para experiencia profissional
 */

import { useState, useCallback } from "react"
import Cropper from "react-easy-crop"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Check, 
  X,
  Crop
} from "lucide-react"

interface ImageCropperProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageSrc: string
  onCropComplete: (croppedImage: Blob) => void
  aspectRatio?: number
  cropShape?: "round" | "rect"
}

interface CroppedAreaPixels {
  x: number
  y: number
  width: number
  height: number
}

// Funcao para criar imagem recortada
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: CroppedAreaPixels,
  outputSize: number = 400
): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("No 2d context")
  }

  // Tamanho de saida fixo para avatares
  canvas.width = outputSize
  canvas.height = outputSize

  // Desenhar imagem recortada
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize
  )

  // Converter para blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error("Canvas is empty"))
        }
      },
      "image/jpeg",
      0.92
    )
  })
}

// Criar elemento Image a partir de src
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", (error) => reject(error))
    // Para URLs de blob local, não precisa de crossOrigin
    if (!url.startsWith("blob:")) {
      image.crossOrigin = "anonymous"
    }
    image.src = url
  })
}

export function ImageCropper({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
  aspectRatio = 1,
  cropShape = "round"
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const onCropCompleteCallback = useCallback(
    (_croppedArea: CroppedAreaPixels, croppedAreaPixels: CroppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  const handleReset = () => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }

  const handleConfirm = useCallback(async () => {
    if (!croppedAreaPixels) return
    
    setIsSaving(true)
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, 400)
      onCropComplete(croppedImage)
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao recortar imagem:", error)
    } finally {
      setIsSaving(false)
    }
  }, [imageSrc, croppedAreaPixels, onCropComplete, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a1a] border-[#333] max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Crop className="w-5 h-5 text-[#C5A059]" />
            Ajustar Foto de Perfil
          </DialogTitle>
        </DialogHeader>

        {/* Area de Crop */}
        <div className="relative w-full h-[300px] sm:h-[350px] bg-[#0a0a0a] rounded-xl overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            cropShape={cropShape}
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteCallback}
            onZoomChange={setZoom}
            style={{
              containerStyle: {
                borderRadius: "12px",
              },
              cropAreaStyle: {
                border: "3px solid #C5A059",
              },
            }}
          />
        </div>

        {/* Controles de Zoom */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-4">
            <ZoomOut className="w-5 h-5 text-[#967948]" />
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(value) => setZoom(value[0])}
              className="flex-1"
            />
            <ZoomIn className="w-5 h-5 text-[#967948]" />
          </div>

          <p className="text-xs text-center text-[#967948]">
            Arraste para posicionar e use o slider para ajustar o zoom
          </p>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="border-[#333] text-[#967948] hover:text-white hover:bg-[#333]"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Resetar
          </Button>
          <div className="flex gap-2 flex-1 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="border-[#333] text-[#967948] hover:text-white hover:bg-[#333]"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!croppedAreaPixels || isSaving}
              className="bg-[#C5A059] hover:bg-[#967948] text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              {isSaving ? "Salvando..." : "Confirmar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
