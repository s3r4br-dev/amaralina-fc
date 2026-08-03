"use client"

/**
 * ProfileCard - Amaralina FC
 * Sistema de camadas com imagens reais:
 * - Camada 0: Card Base (fundo)
 * - Camada 1: Foto do Jogador (centro do escudo)
 * - Camada 2: Moldura de Nível (overlay)
 * - Camada 3: Textos e Dados (superfície)
 */

import { useState, useCallback, useEffect, useRef } from "react"
import Image from "next/image"
import { Share2, Download, Lock, Check, Camera } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getProfileTier, ProfileTier } from "@/lib/achievements"
import { AvatarUpload } from "@/components/avatar-upload"
import { calculateMarketValue, formatCurrency } from "@/lib/market-value"
import { HallOfFameSection, HallOfFameIcon } from "@/components/hall-of-fame-section"
import type { JogadorStats } from "@/contexts/data-context"

// Tipos de moldura
export type FrameTier = "bronze" | "silver" | "gold" | "emerald" | "sapphire" | "ruby" | "diamond"

// Mapear de PT para EN
const tierPtToEn: Record<ProfileTier, FrameTier> = {
  bronze: "bronze",
  prata: "silver",
  ouro: "gold",
  esmeralda: "emerald",
  safira: "sapphire",
  rubi: "ruby",
  diamante: "diamond",
}

// URLs das molduras COM TRANSPARENCIA (furo para foto) - Assets finais Amaralina FC
const frameImages: Record<FrameTier, string> = {
  bronze: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1775339247708.png%20%289%29-l0rGzlc3BtamzQOpoTSXT6VxKxQ3xi.png",
  silver: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1775339247708.png%20%288%29-SAMXeCJZDBzvib9Inb8CIhw5PfyC0S.png",
  gold: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1775339247708.png%20%287%29-QH7q4ctVHLIhlcKA03pJ8zXZoJGjBk.png",
  emerald: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1775339247708.png%20%286%29-dmiaDofQWePynw0iurqEKqcq2xhv5p.png",
  sapphire: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1775339247708.png%20%283%29-8QYNlz3C1hIIc69CS83fXxp9OypfbH.png",
  ruby: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1775339247708.png%20%284%29-0Q3h0CgV5Atrsd1U0h8oXtBzVL7t5i.png",
  diamond: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1775339247708.png%20%282%29-YLV1Qg8uxsJJRAf4yjYE50Unt9xbzG.png",
}

// URL do card base (prata sem cristais)
const baseCardImage = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1775339247708.png%20%2810%29-XxOOl6KyVJnby5os5jS1fs4W0TW3la.png"

// Nomes em português
const frameNames: Record<FrameTier, string> = {
  bronze: "Bronze",
  silver: "Prata",
  gold: "Ouro",
  emerald: "Esmeralda",
  sapphire: "Safira",
  ruby: "Rubi",
  diamond: "Diamante",
}

// Cores por tier para textos
const tierTextColors: Record<FrameTier, string> = {
  bronze: "#CD7F32",
  silver: "#E8E8E8",
  gold: "#FFD700",
  emerald: "#50C878",
  sapphire: "#5DADEC",
  ruby: "#FF6B6B",
  diamond: "#B9F2FF",
}

// Ordem dos tiers: Bronze, Prata, Ouro, Esmeralda, Rubi, Safira, Diamante
const tierOrder: FrameTier[] = ["bronze", "silver", "gold", "emerald", "ruby", "sapphire", "diamond"]

interface PlayerStats {
  id: string | number
  name: string
  nickname?: string
  position?: string
  photo?: string
  goals: number
  assists: number
  matches: number
  marketValue?: number
  rating?: number // Overall real calculado pelo sistema (do data-context)
  goalsConceded?: number // Gols tomados como goleiro
  goalkeeperMatches?: number // Partidas como goleiro
  winRate?: number // Aproveitamento
}

interface ProfileCardProps {
  player: PlayerStats
  profileProgress: number
  selectedFrame?: FrameTier
  onFrameChange?: (frame: FrameTier) => void
  onPhotoChange?: (newUrl: string | null) => void
  editable?: boolean
  unlockedFrames?: FrameTier[] // Para admin: lista de molduras desbloqueadas manualmente
}

// Formatar valor de mercado
function formatMarketValueLegacy(value: number | string): string {
  // Se já for string (retornado pela nova função), retornar direto
  if (typeof value === 'string') return value
  
  // Caso contrário, usar formatação legada
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}K`
  }
  return `R$ ${value.toLocaleString("pt-BR")}`
}

// Calcular valor de mercado usando a função avançada da lib
function getPlayerMarketValue(stats: PlayerStats): string {
  // Converter PlayerStats para JogadorStats
  const jogadorStats: Partial<JogadorStats> = {
    id: 0,
    name: stats.name || '',
    nickname: stats.nickname || '',
    position: stats.position || '',
    number: 0,
    status: 'active',
    goals: stats.goals,
    assists: stats.assists,
    matches: stats.matches,
    rating: stats.rating || 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsConceded: 0,
    cleanSheets: 0,
    goalkeeperMatches: 0,
    goalkeeperBonus: 0,
    totalPoints: 0,
    winRate: 0,
    performanceScore: 0
  }
  
  const breakdown = calculateMarketValue(jogadorStats as JogadorStats)
  return formatCurrency(breakdown.currentValue)
}

export function ProfileCard({
  player,
  profileProgress,
  selectedFrame,
  onFrameChange,
  onPhotoChange,
  editable = false,
  unlockedFrames,
}: ProfileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showFrameSelector, setShowFrameSelector] = useState(false)
  const [currentPhoto, setCurrentPhoto] = useState(player.photo)
  const [isSaving, setIsSaving] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const modalCardRef = useRef<HTMLDivElement>(null)

  // Sincronizar foto quando a prop muda
  useEffect(() => {
    setCurrentPhoto(player.photo)
  }, [player.photo])

  // Determinar tier atual
  const currentTierPt = getProfileTier(profileProgress)
  const currentTierEn = tierPtToEn[currentTierPt.tier]
  const activeTier = selectedFrame || currentTierEn
  
  // Tiers disponíveis: usa unlockedFrames (admin) ou calcula pelo progresso
  const currentTierIndex = tierOrder.indexOf(currentTierEn)
  const progressBasedTiers = tierOrder.slice(0, currentTierIndex + 1)
  
  // Se admin tem molduras desbloqueadas, usa elas; senao usa as do progresso
  const availableTiers = unlockedFrames && unlockedFrames.length > 0 
    ? tierOrder.filter(tier => unlockedFrames.includes(tier) || progressBasedTiers.includes(tier))
    : progressBasedTiers

  // Valor de mercado
  const marketValue = player.marketValue || getPlayerMarketValue(player)

  // Gerar imagem do card usando html-to-image
  const generateCardBlob = useCallback(async (): Promise<Blob | null> => {
    const targetRef = modalCardRef.current || cardRef.current
    if (!targetRef) return null
    
    const { toPng } = await import("html-to-image")
    
    // Configurar CORS nas imagens
    targetRef.querySelectorAll("img").forEach((img) => {
      if (img.src && !img.src.startsWith("data:")) {
        img.crossOrigin = "anonymous"
      }
    })
    await new Promise((r) => setTimeout(r, 300))
    
    const dataUrl = await toPng(targetRef, {
      quality: 1.0,
      pixelRatio: 2,
      backgroundColor: "#0d1b2a",
      cacheBust: true,
      fetchRequestInit: { mode: "cors", credentials: "omit" },
      filter: (node) => {
        if (node.tagName === "NOSCRIPT") return false
        if ((node as HTMLElement).classList?.contains("hidden")) return false
        return true
      },
      style: {
        "--background": "#F9F9F9",
        "--foreground": "#2B2B2B",
        "--card": "#1a1a1a",
        "--primary": "#C5A059",
        "--secondary": "#0088CC",
      } as React.CSSProperties,
    })
    
    const response = await fetch(dataUrl)
    return await response.blob()
  }, [])

  // Compartilhar via Web Share API com imagem real
  const handleShare = useCallback(async () => {
    setIsSaving(true)
    
    try {
      const blob = await generateCardBlob()
      if (!blob) throw new Error("Falha ao gerar imagem")
      
      const file = new File([blob], `${player.name.replace(/\s+/g, "_")}_AmaralinaFC.png`, { type: "image/png" })
      
      // Tentar Web Share API com arquivo
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${player.name} - Amaralina FC`,
          text: `Confira o perfil de ${player.name} no Amaralina FC!`,
        })
      } else {
        // Fallback: WhatsApp com link
        const shareText = `Confira o perfil de ${player.name} no Amaralina FC! ${player.goals} gols, ${player.assists} assists em ${player.matches} partidas. Valor: ${formatMarketValueLegacy(marketValue)}`
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + " " + window.location.href)}`
        window.open(whatsappUrl, "_blank")
      }
    } catch (error) {
      // Se cancelou o share, nao mostrar erro
      if ((error as Error).name !== "AbortError") {
        console.error("[v0] Erro ao compartilhar:", error)
        // Fallback para WhatsApp com link
        const shareText = `Confira o perfil de ${player.name} no Amaralina FC!`
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + " " + window.location.href)}`
        window.open(whatsappUrl, "_blank")
      }
    } finally {
      setIsSaving(false)
    }
  }, [player, marketValue, generateCardBlob])

  // Salvar imagem usando html-to-image
  const handleSaveImage = useCallback(async () => {
    setIsSaving(true)
    
    try {
      const blob = await generateCardBlob()
      if (!blob) throw new Error("Falha ao gerar imagem")
      
      // Criar link de download
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.download = `${player.name.replace(/\s+/g, "_")}_AmaralinaFC.png`
      link.href = url
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("[v0] Erro ao salvar imagem:", error)
      alert("Erro ao gerar imagem. Tente novamente.")
    } finally {
      setIsSaving(false)
    }
  }, [player.name, generateCardBlob])

  // Usar rating real do banco se disponível, senão calcular
  const calculateOverall = (stats: PlayerStats): number => {
    // Se tem rating do banco, usa ele
    if (stats.rating !== undefined && stats.rating > 0) {
      return stats.rating
    }
    // Fallback para cálculo simples
    const base = 60
    const goals = stats.goals ?? 0
    const assists = stats.assists ?? 0
    const matches = stats.matches ?? 0
    const goalBonus = Math.min(goals * 0.8, 15)
    const assistBonus = Math.min(assists * 0.5, 10)
    const matchBonus = Math.min(matches * 0.1, 10)
    return Math.round(base + goalBonus + assistBonus + matchBonus)
  }
  
  const overall = calculateOverall(player)

  // Componente do Card (reutilizado)
  const CardContent = ({ size = "normal", refProp }: { size?: "normal" | "small", refProp?: React.RefObject<HTMLDivElement> }) => {
    const isSmall = size === "small"
    
    return (
      <div 
        ref={refProp}
        className="relative"
        style={{ 
          width: isSmall ? 280 : 340,
          height: isSmall ? 373 : 453,
        }}
      >
        {/* ===== CAMADA 1 (z-1): FOTO DO JOGADOR - FUNDO ===== */}
        {/* Container centralizado atras do buraco da moldura */}
        <div 
          className="absolute z-[1] inset-0 flex items-center justify-center"
          style={{ paddingTop: "8%", paddingBottom: "22%" }}
        >
          {/* photo-container: 70% width, corte circular agressivo */}
          <div 
            className="photo-container relative overflow-hidden"
            style={{
              width: "70%",
              maxWidth: isSmall ? 170 : 220,
              aspectRatio: "1 / 1",
              margin: "0 auto",
              // Border-radius circular agressivo para evitar vazamento
              borderRadius: "50%",
              // Mask adicional para seguranca
              WebkitMaskImage: "radial-gradient(circle, black 70%, transparent 100%)",
              maskImage: "radial-gradient(circle, black 70%, transparent 100%)",
            }}
          >
            {currentPhoto ? (
              <Image
                src={currentPhoto}
                alt={player.name}
                fill
                sizes={isSmall ? "195px" : "260px"}
                style={{ 
                  width: "100%", 
                  height: "100%", 
                  objectFit: "cover",
                  objectPosition: "center 15%",
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#1a365d] to-[#0d1b2a] flex items-center justify-center">
                <span 
                  className={cn(
                    "font-bold text-white",
                    isSmall ? "text-4xl" : "text-5xl"
                  )}
                >
                  {player.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ===== CAMADA 2 (z-2): MOLDURA UNICA ===== */}
        {/* Se tem nivel definido, mostra APENAS a moldura do nivel */}
        {/* Card Base so aparece se nao tiver nivel (fallback) */}
        <div 
          className="absolute z-[2] pointer-events-none"
          style={{
            top: "-12%",
            left: "-22%",
            right: "-22%",
            bottom: "-4%",
          }}
        >
          <Image
            src={activeTier ? frameImages[activeTier] : baseCardImage}
            alt={activeTier ? `Moldura ${frameNames[activeTier]}` : "Card Base"}
            fill
            className="object-contain"
            sizes={isSmall ? "430px" : "520px"}
            priority
          />
        </div>

        {/* ===== CAMADA 4 (z-4): TEXTOS DINAMICOS - SUPER TOPO ===== */}
        
        {/* OVERALL + OVR - Circulo preto superior esquerdo */}
        <div 
          className="absolute z-[4] flex flex-col items-center justify-center"
          style={{
            top: "12%",
            left: "15%",
            width: isSmall ? "40px" : "50px",
            height: isSmall ? "50px" : "60px",
          }}
        >
          <span 
            className={cn(
              "font-black leading-none",
              isSmall ? "text-xl" : "text-2xl"
            )}
            style={{ 
              color: "#D4B300",
              fontFamily: "Inter, sans-serif",
              textShadow: "0 2px 4px rgba(0,0,0,0.7)",
            }}
          >
            {overall}
          </span>
          <span 
            className="font-bold leading-none mt-0.5"
            style={{ 
              color: "#D4B300",
              fontSize: isSmall ? "0.6rem" : "0.7rem",
              fontFamily: "Inter, sans-serif",
              textShadow: "0 1px 2px rgba(0,0,0,0.7)",
            }}
          >
            OVR
          </span>
        </div>

        {/* NOME DO JOGADOR - Painel azul/dourado na base (descido 15px) */}
        <div 
          className="absolute z-[4] left-0 right-0 text-center px-8"
          style={{ bottom: isSmall ? "18%" : "20%" }}
        >
          <div className="flex items-center justify-center gap-1">
            <h3 
              className={cn(
                "font-bold truncate",
                isSmall ? "text-xs" : "text-sm"
              )}
              style={{ 
                fontFamily: "Inter, sans-serif",
                color: "#D4B300",
                textShadow: "0 1px 3px rgba(0,0,0,0.8)",
              }}
            >
              {player.name}
            </h3>
            {/* Estrela do Hall da Fama */}
            {player.id && <HallOfFameIcon jogadorId={player.id} size="sm" />}
          </div>
          
          {/* ESTATISTICAS - GOL | AST | PJG | GT (goleiro) */}
          <div 
            className="flex justify-center gap-3 mt-1 flex-wrap"
          >
            <span className={cn("text-white/90", isSmall ? "text-[9px]" : "text-[10px]")}>
              <span className="font-bold text-white">{player.goals}</span> GOL
            </span>
            <span className={cn("text-white/90", isSmall ? "text-[9px]" : "text-[10px]")}>
              <span className="font-bold text-white">{player.assists}</span> AST
            </span>
            <span className={cn("text-white/90", isSmall ? "text-[9px]" : "text-[10px]")}>
              <span className="font-bold text-white">{player.matches}</span> PJG
            </span>
            {/* Gols Tomados - apenas para goleiros */}
            {(player.goalkeeperMatches || 0) > 0 && (
              <span className={cn("text-white/90", isSmall ? "text-[9px]" : "text-[10px]")}>
                <span className="font-bold" style={{ color: "#FF6B6B" }}>{player.goalsConceded || 0}</span> GT
              </span>
            )}
          </div>
        </div>

        {/* MARKET VALUE - Area inferior (subido 5px) */}
        <div 
          className="absolute z-[4] left-1/2 -translate-x-1/2 text-center"
          style={{ bottom: isSmall ? "5.5%" : "6%" }}
        >
          <span 
            className={cn(
              "font-bold tracking-wide",
              isSmall ? "text-xs" : "text-sm"
            )}
            style={{ 
              fontFamily: "Inter, sans-serif",
              color: "#C5A059",
              textShadow: "0 1px 2px rgba(0,0,0,0.5)",
            }}
          >
                {formatMarketValueLegacy(marketValue)}
          </span>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Container Principal - overflow visible para cristais */}
      <div className="relative overflow-visible py-8 px-16">
        {/* Card Clicavel */}
        <div
          onClick={() => setIsExpanded(true)}
          className="cursor-pointer transition-transform duration-300 hover:scale-[1.02] flex justify-center"
        >
          <CardContent size="normal" refProp={cardRef} />
        </div>

        {/* Botoes de Edicao */}
        {editable && (
          <div className="mt-8 flex flex-col items-center gap-4">
            {/* Upload de Foto */}
            <AvatarUpload
              jogadorId={player.id}
              currentPhoto={currentPhoto}
              onPhotoChange={(newUrl) => {
                setCurrentPhoto(newUrl || undefined)
                onPhotoChange?.(newUrl)
              }}
            />
            
            {/* Botao Trocar Moldura */}
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                setShowFrameSelector(true)
              }}
              className="border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059] hover:text-white"
            >
              Trocar Moldura
            </Button>
          </div>
        )}
      </div>

      {/* Modal Expandido */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-md bg-[#0d1117] border-[#333] text-white p-0 overflow-visible">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-[#C5A059]">Card de {player.name}</DialogTitle>
          </DialogHeader>
          
          <div className="p-4 overflow-visible">
            <div className="flex justify-center overflow-visible py-4 px-8">
              <CardContent size="small" refProp={modalCardRef} />
            </div>

            {/* Seção Hall da Fama */}
            {player.id && (
              <div className="mt-4 p-3 rounded-lg bg-[#1a1a1a]/50 border border-[#333]">
                <HallOfFameSection 
                  jogadorId={player.id} 
                  maxItems={5} 
                  showTitle={true}
                  size="md"
                />
              </div>
            )}

            {/* Botoes de Acao */}
            <div className="flex gap-3 mt-6 justify-center">
              <Button
                onClick={handleShare}
                className="bg-[#25D366] hover:bg-[#128C7E] text-white"
              >
                <Share2 className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                onClick={handleSaveImage}
                disabled={isSaving}
                className="border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059] hover:text-white disabled:opacity-50"
              >
                <Download className="w-4 h-4 mr-2" />
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Seletor de Moldura */}
      <Dialog open={showFrameSelector} onOpenChange={setShowFrameSelector}>
        <DialogContent className="max-w-lg bg-[#0d1117] border-[#333] text-white">
          <DialogHeader>
            <DialogTitle className="text-[#C5A059] flex items-center gap-2">
              Escolher Moldura
              <span className="text-xs text-gray-400 font-normal">
                (Nivel atual: {frameNames[currentTierEn]})
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-4 gap-4 mt-4">
            {tierOrder.map((tier) => {
              const isUnlocked = availableTiers.includes(tier)
              const isSelected = activeTier === tier
              
              return (
                <button
                  key={tier}
                  onClick={() => {
                    if (isUnlocked && onFrameChange) {
                      onFrameChange(tier)
                      setShowFrameSelector(false)
                    }
                  }}
                  disabled={!isUnlocked}
                  className={cn(
                    "relative aspect-[3/4] rounded-lg transition-all p-1",
                    isUnlocked ? "cursor-pointer hover:scale-105" : "cursor-not-allowed opacity-40",
                    isSelected && "ring-2 ring-[#C5A059] ring-offset-2 ring-offset-[#0d1117]"
                  )}
                >
                  <div className="relative w-full h-full overflow-visible">
                    <Image
                      src={frameImages[tier]}
                      alt={frameNames[tier]}
                      fill
                      className="object-contain"
                      sizes="80px"
                    />
                    
                    {!isUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg">
                        <Lock className="w-5 h-5 text-gray-500" />
                      </div>
                    )}
                    
                    {isSelected && isUnlocked && (
                      <div className="absolute top-0 right-0 w-5 h-5 rounded-full bg-[#C5A059] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <span className={cn(
                    "absolute -bottom-5 left-0 right-0 text-[10px] text-center font-medium",
                    isUnlocked ? "text-gray-300" : "text-gray-600"
                  )}>
                    {frameNames[tier]}
                  </span>
                </button>
              )
            })}
          </div>
          
          <p className="text-xs text-gray-500 mt-8 text-center">
            Desbloqueie mais molduras completando conquistas!
          </p>
        </DialogContent>
      </Dialog>
    </>
  )
}
