"use client"

/**
 * Jogadores Page - Amaralina FC
 * Version: 11.0 - Ultra Premium Glassmorphism
 */
import { useState, useMemo, useRef } from "react"
import { toPng } from "html-to-image"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { useData, type Jogador, type JogadorStats } from "@/contexts/data-context"
import { 
  Users, Search, Filter, Goal, HandHelping, Calendar, Trophy, Star, Plus, Pencil, 
  Trash2, Mail, Award, Crown, TrendingUp, TrendingDown, Shield, ChevronDown, X,
  Sparkles, Medal, Download, Share2, Loader2, Camera
} from "lucide-react"
import { calculateMarketValue, formatCurrency } from "@/lib/market-value"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PlayerPhoto, PlayerPhotoDisplay } from "@/components/player-photo"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

const positions = ["Todos", "Atacante", "Meia", "Volante", "Lateral", "Zagueiro", "Goleiro"]
const positionsForm = ["Atacante", "Meia", "Volante", "Lateral", "Zagueiro", "Goleiro"]

// Tipos de ordenacao
type SortOption = "nome" | "gols" | "assists" | "jogos" | "valor-maior" | "valor-menor" | "desempenho"

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "desempenho", label: "Desempenho" },
  { value: "valor-maior", label: "Valor (Maior)" },
  { value: "valor-menor", label: "Valor (Menor)" },
  { value: "gols", label: "Artilheiros" },
  { value: "assists", label: "Assistencias" },
  { value: "jogos", label: "Mais Jogos" },
  { value: "nome", label: "Nome (A-Z)" },
]

// Conquistas mockadas para demonstracao (em producao, viria do banco)
const mockAchievements: Record<number, { icon: string; label: string; color: string }[]> = {}

interface PlayerCardProps {
  player: JogadorStats
  isAdmin: boolean
  onEdit: (player: Jogador) => void
  onDelete: (player: Jogador) => void
  onViewDetails: (player: JogadorStats) => void
  rank: number
  allPlayers: JogadorStats[]
}

function PlayerCardPremium({ player, isAdmin, onEdit, onDelete, onViewDetails, rank, allPlayers }: PlayerCardProps) {
  // Calcular valor de mercado
  const marketValue = useMemo(() => {
    return calculateMarketValue(player, allPlayers)
  }, [player, allPlayers])

  // Verificar se esta no podio (top 3)
  const isTopThree = rank <= 3 && player.matches > 0

  // Verificar se e goleiro
  const isGoalkeeper = player.position === "Goleiro"

  // Aproveitamento - usar o valor calculado no data-context (com penalidade por faltas)
  const winRate = player.winRate || 0
  
  // Nota de desempenho
  const performanceScore = player.performanceScore || 0
  
  // Indicador de faltas consecutivas
  const hasMissedGames = (player.consecutiveMissedMatches || 0) > 0

  // Cor do ranking
  const getRankColor = () => {
    if (rank === 1) return "from-[#FFD700] to-[#FFA500]"
    if (rank === 2) return "from-[#C0C0C0] to-[#A0A0A0]"
    if (rank === 3) return "from-[#CD7F32] to-[#8B4513]"
    return "from-[#333] to-[#555]"
  }

  return (
    <div 
      className={cn(
        "group relative overflow-hidden rounded-2xl transition-all duration-300 cursor-pointer",
        "bg-gradient-to-br from-black/20 to-black/5",
        "backdrop-blur-xl border border-white/10",
        "hover:border-black/5 hover:shadow-[0_0_30px_rgba(212,179,0,0.15)]",
        "hover:scale-[1.02] hover:-translate-y-1",
        isTopThree && "ring-2 ring-[#bb9c34]"
      )}
      onClick={() => onViewDetails(player)}
    >
      {/* Efeito de brilho de fundo */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#D4B300]/5 via-transparent to-[#0088CC]/5 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Admin Actions - sempre visivel no mobile, hover no desktop */}
      {isAdmin && (
        <div className="absolute top-3 right-3 z-20 flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-black/70 backdrop-blur-sm hover:bg-[#0088CC]/50 text-white border border-white/30"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(player)
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-black/70 backdrop-blur-sm hover:bg-red-500/50 text-white border border-white/30"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(player)
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Badge de Ranking (Top 3) */}
      {isTopThree && (
        <div className="absolute top-3 left-3 z-20">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            "bg-gradient-to-br shadow-lg",
            getRankColor()
          )}>
            {rank === 1 ? (
              <Crown className="w-5 h-5 text-black" />
            ) : (
              <span className="text-sm font-bold text-white">{rank}</span>
            )}
          </div>
        </div>
      )}

      <div className="p-5">
        {/* Header: Foto + Info */}
        <div className="flex items-start gap-4 mb-4">
          {/* Foto com borda gradiente */}
          <div className="relative flex-shrink-0">
            <div className={cn(
              "w-20 h-20 rounded-xl overflow-hidden",
              "ring-2 ring-offset-2 ring-offset-[#1a1a2e]",
              isTopThree ? "ring-[#D4B300]" : "ring-white/20"
            )}>
              {player.photo_url ? (
                <Image
                  src={player.photo_url}
                  alt={player.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#D4B300] to-[#967948] flex items-center justify-center">
                  <span className="text-2xl font-bold text-black">
                    {player.nickname?.charAt(0) || player.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            {/* Numero do jogador */}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-gradient-to-br from-[#D4B300] to-[#967948] flex items-center justify-center shadow-lg">
              <span className="text-xs font-bold text-black">{player.number}</span>
            </div>
          </div>

          {/* Nome e Posicao */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-[#D4B300] truncate group-hover:text-[#FFD700] transition-colors">
                {player.nickname || player.name}
              </h3>
              <span className="flex-shrink-0 px-2 py-0.5 rounded bg-[#D4B300]/20 border border-[#D4B300]/40 text-[#FFD700] text-sm font-bold">
                {player.rating} OVR
              </span>
            </div>
            <p className="text-sm text-white/70 truncate">{player.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-white/50 bg-white/10 px-2 py-0.5 rounded">
                {player.position}
              </span>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded",
                player.status === "active" 
                  ? "bg-green-500/20 text-green-400" 
                  : "bg-red-500/20 text-red-400"
              )}>
                {player.status === "active" ? "Ativo" : "Inativo"}
              </span>
            </div>
          </div>
        </div>

        {/* Valor de Mercado */}
        <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-[#D4B300]/10 to-[#0088CC]/10 border border-[#D4B300]/20">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Valor de Mercado</span>
            <div className="flex items-center gap-1">
              {marketValue.trend === "up" && <TrendingUp className="w-3 h-3 text-green-400" />}
              {marketValue.trend === "down" && <TrendingDown className="w-3 h-3 text-red-400" />}
            </div>
          </div>
          <p className="text-xl font-bold text-[#FFD700]">
            {formatCurrency(marketValue.currentValue)}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="w-7 h-7 mx-auto mb-1 rounded-full bg-[#D4B300]/20 flex items-center justify-center">
              <Goal className="w-3.5 h-3.5 text-[#D4B300]" />
            </div>
            <p className="text-lg font-bold text-white">{player.goals}</p>
            <p className="text-[10px] text-white/50 uppercase tracking-wide">Gols</p>
          </div>
          <div className="text-center p-2.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="w-7 h-7 mx-auto mb-1 rounded-full bg-[#0088CC]/20 flex items-center justify-center">
              <HandHelping className="w-3.5 h-3.5 text-[#0088CC]" />
            </div>
            <p className="text-lg font-bold text-white">{player.assists}</p>
            <p className="text-[10px] text-white/50 uppercase tracking-wide">Assists</p>
          </div>
          <div className="text-center p-2.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="w-7 h-7 mx-auto mb-1 rounded-full bg-white/10 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 text-white/70" />
            </div>
            <p className="text-lg font-bold text-white">{player.matches}</p>
            <p className="text-[10px] text-white/50 uppercase tracking-wide">Jogos</p>
          </div>
        </div>

        {/* Gols Sofridos: Mostrar para QUALQUER jogador que atuou no gol */}
        {player.goalkeeperMatches > 0 && (
          <div className="mb-4 flex items-center justify-between p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-400" />
              <span className="text-xs text-white/70">Gols Sofridos</span>
            </div>
            <span className="text-sm font-bold text-red-400">
              {player.goalsConceded || 0}
              <span className="text-[10px] text-white/50 ml-1">
                em {player.goalkeeperMatches} {player.goalkeeperMatches === 1 ? "partida" : "partidas"} no gol
              </span>
            </span>
          </div>
        )}

        {/* Barra de Aproveitamento */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-white/50">Aproveitamento</span>
            <span className={cn(
              "text-sm font-bold",
              winRate >= 70 ? "text-green-400" :
              winRate >= 50 ? "text-[#D4B300]" :
              winRate >= 30 ? "text-orange-400" :
              "text-red-400"
            )}>
              {winRate}%
            </span>
          </div>
          <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/10">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500",
                winRate >= 70 ? "bg-gradient-to-r from-green-500 to-green-400" :
                winRate >= 50 ? "bg-gradient-to-r from-[#D4B300] to-[#FFD700]" :
                winRate >= 30 ? "bg-gradient-to-r from-orange-500 to-orange-400" :
                "bg-gradient-to-r from-red-500 to-red-400"
              )}
              style={{ width: `${winRate}%` }}
            />
          </div>
        </div>

        {/* Nota de Desempenho */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D4B300]" />
            <span className="text-xs text-white/50">Desempenho</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-lg font-bold",
              performanceScore >= 8 ? "text-[#FFD700]" :
              performanceScore >= 6 ? "text-green-400" :
              performanceScore >= 4 ? "text-[#0088CC]" :
              "text-white/50"
            )}>
              {performanceScore.toFixed(1)}
            </span>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i}
                  className={cn(
                    "w-3 h-3",
                    i < Math.round(performanceScore / 2)
                      ? "text-[#D4B300] fill-[#D4B300]"
                      : "text-white/20"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Conquistas Preview (ate 5 icones) */}
        {isTopThree && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Medal className="w-4 h-4 text-[#D4B300]" />
              <span className="text-xs text-white/50">Elite do Amaralina</span>
              <div className="flex-1" />
              <Award className="w-4 h-4 text-[#FFD700]" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Modal de Detalhes do Jogador
function PlayerDetailsModal({
  player,
  isOpen,
  onClose,
  allPlayers,
  isAdmin,
  onPhotoUpdate,
  }: {
  player: JogadorStats | null
  isOpen: boolean
  onClose: () => void
  allPlayers: JogadorStats[]
  isAdmin?: boolean
  onPhotoUpdate?: (jogadorId: number, newPhotoUrl: string | null) => void
  }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [shareMsg, setShareMsg] = useState<string | null>(null)

  if (!player) return null

  const marketValue = calculateMarketValue(player, allPlayers)
  // Usar winRate calculado no data-context (com penalidade por faltas consecutivas)
  const winRate = player.winRate || 0
  const isGoalkeeper = player.position === "Goleiro"

  // Gerar imagem do card do jogador com html-to-image
  const generateImage = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null
    setIsGenerating(true)
    setShareMsg(null)
    await new Promise((r) => setTimeout(r, 500))
    try {
      // Configurar CORS nas imagens
      cardRef.current.querySelectorAll("img").forEach((img) => {
        if (img.src && !img.src.startsWith("data:")) {
          img.crossOrigin = "anonymous"
        }
      })
      await new Promise((r) => setTimeout(r, 200))
      
      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: "#0f0f1a",
        cacheBust: true,
        fetchRequestInit: { mode: "cors", credentials: "omit" },
        filter: (node) => node.tagName !== "NOSCRIPT",
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
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error("[v0] Erro ao gerar imagem:", errorMsg)
      setShareMsg(`Erro: ${errorMsg.slice(0, 80)}`)
      return null
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    const blob = await generateImage()
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `amaralina-fc-${player.nickname || player.name}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleShare = async () => {
    const blob = await generateImage()
    if (!blob) return
    const file = new File([blob], `amaralina-fc-${player.nickname || player.name}.png`, { type: "image/png" })
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Amaralina FC - ${player.nickname || player.name}`,
          text: `Confira o perfil de ${player.nickname || player.name} no Amaralina FC!`
        })
      } catch (err) {
        if ((err as Error).name !== "AbortError") handleDownload()
      }
    } else {
      setShareMsg("Compartilhamento nao suportado. Baixando...")
      handleDownload()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-[#D4B300]/30 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#D4B300] flex items-center gap-2">
            <Award className="w-5 h-5" />
            Perfil Completo
          </DialogTitle>
        </DialogHeader>

        <div ref={cardRef} className="space-y-6">
          {/* Header com foto e info basica */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-black/30 border border-white/10">
            <div className="relative group">
              <div className="w-24 h-24 rounded-xl overflow-hidden ring-2 ring-[#D4B300]">
                {player.photo_url ? (
                  <Image
                    src={player.photo_url}
                    alt={player.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#D4B300] to-[#967948] flex items-center justify-center">
                    <span className="text-3xl font-bold text-black">
                      {player.nickname?.charAt(0) || player.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              {/* Admin: botoes de editar foto */}
              {isAdmin && onPhotoUpdate && (
                <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <label className="p-2 rounded-full bg-[#D4B300] hover:bg-[#D4B300]/80 cursor-pointer transition-colors">
                    <Camera className="w-4 h-4 text-black" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        // Processar e fazer upload
                        const reader = new FileReader()
                        reader.onload = async () => {
                          // Por enquanto, apenas notificar que precisa implementar o upload
                          // O upload real usa o AvatarUpload component
                        }
                        reader.readAsDataURL(file)
                      }}
                    />
                  </label>
                  {player.photo_url && (
                    <button
                      onClick={() => onPhotoUpdate(player.id, null)}
                      className="p-2 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold text-[#FFD700]">{player.nickname}</h3>
                <span className="px-2 py-1 rounded bg-[#D4B300]/20 border border-[#D4B300]/40 text-[#FFD700] text-sm font-bold">
                  {player.rating} OVR
                </span>
              </div>
              <p className="text-white/70">{player.name}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm bg-[#D4B300]/20 text-[#D4B300] px-2 py-0.5 rounded">
                  #{player.number}
                </span>
                <span className="text-sm bg-white/10 text-white/70 px-2 py-0.5 rounded">
                  {player.position}
                </span>
                <span className="text-sm bg-[#0088CC]/20 text-[#0088CC] px-2 py-0.5 rounded font-medium">
                  {player.performanceScore?.toFixed(1) || "0.0"}
                </span>
              </div>
            </div>
          </div>

          {/* Valor de Mercado destacado */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#D4B300]/20 to-[#0088CC]/20 border border-[#D4B300]/30">
            <p className="text-sm text-white/50 mb-1">Valor de Mercado</p>
            <p className="text-3xl font-bold text-[#FFD700]">
              {formatCurrency(marketValue.currentValue)}
            </p>
          </div>

          {/* Estatisticas detalhadas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
              <Goal className="w-5 h-5 mx-auto mb-1 text-[#D4B300]" />
              <p className="text-2xl font-bold text-white">{player.goals}</p>
              <p className="text-xs text-white/50">Gols</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
              <HandHelping className="w-5 h-5 mx-auto mb-1 text-[#0088CC]" />
              <p className="text-2xl font-bold text-white">{player.assists}</p>
              <p className="text-xs text-white/50">Assistencias</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
              <Calendar className="w-5 h-5 mx-auto mb-1 text-white/70" />
              <p className="text-2xl font-bold text-white">{player.matches}</p>
              <p className="text-xs text-white/50">Jogos</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
              <Trophy className="w-5 h-5 mx-auto mb-1 text-green-400" />
              <p className="text-2xl font-bold text-white">{player.wins}</p>
              <p className="text-xs text-white/50">Vitorias</p>
            </div>
          </div>

          {/* Goleiro stats - Aparece para QUALQUER jogador que atuou no gol */}
          {player.goalkeeperMatches > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                <Shield className="w-5 h-5 mx-auto mb-1 text-red-400" />
                <p className="text-2xl font-bold text-red-400">{player.goalsConceded || 0}</p>
                <p className="text-xs text-white/50">Gols Sofridos</p>
                <p className="text-[10px] text-white/40">em {player.goalkeeperMatches} {player.goalkeeperMatches === 1 ? "partida" : "partidas"} no gol</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                <Shield className="w-5 h-5 mx-auto mb-1 text-green-400" />
                <p className="text-2xl font-bold text-green-400">{player.cleanSheets || 0}</p>
                <p className="text-xs text-white/50">Clean Sheets</p>
              </div>
            </div>
          )}

          {/* Aproveitamento com barra */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/70">Aproveitamento</span>
              <span className={cn(
                "text-lg font-bold",
                winRate >= 70 ? "text-green-400" : winRate >= 50 ? "text-[#D4B300]" : "text-red-400"
              )}>
                {winRate}%
              </span>
            </div>
            <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-white/10">
              <div 
                className={cn(
                  "h-full rounded-full",
                  winRate >= 70 ? "bg-gradient-to-r from-green-500 to-green-400" :
                  winRate >= 50 ? "bg-gradient-to-r from-[#D4B300] to-[#FFD700]" :
                  "bg-gradient-to-r from-red-500 to-red-400"
                )}
                style={{ width: `${winRate}%` }}
              />
            </div>
          </div>

          {/* Botoes Salvar / Compartilhar */}
          <div className="flex gap-2">
            <Button
              onClick={handleDownload}
              disabled={isGenerating}
              variant="outline"
              className="flex-1 border-[#D4B300]/30 text-[#D4B300] hover:bg-[#D4B300]/10"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Salvar
            </Button>
            <Button
              onClick={handleShare}
              disabled={isGenerating}
              className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Share2 className="w-4 h-4 mr-2" />
              )}
              Compartilhar
            </Button>
          </div>

          {shareMsg && (
            <p className="text-xs text-yellow-400 text-center">{shareMsg}</p>
          )}

          {/* Link para conquistas */}
          <Link href={`/jogadores/${player.id}/conquistas`}>
            <Button className="w-full bg-gradient-to-r from-[#D4B300] to-[#967948] text-black hover:from-[#FFD700] hover:to-[#D4B300]">
              <Award className="w-4 h-4 mr-2" />
              Ver Todas as Conquistas
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function JogadoresPage() {
  const { isAdmin } = useAuth()
  const { jogadores, profiles, addJogador, updateJogador, deleteJogador, getJogadorStatsByYear, isLoading, refreshData } = useData()
  
  const [search, setSearch] = useState("")
  const [selectedPosition, setSelectedPosition] = useState("Todos")
  const [sortBy, setSortBy] = useState<SortOption>("desempenho")
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Jogador | null>(null)
  const [deletingPlayer, setDeletingPlayer] = useState<Jogador | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<JogadorStats | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
    position: "",
    number: "",
    linkedEmail: "none",
    status: "active" as "active" | "inactive",
    photoUrl: undefined as string | undefined,
  })

  // Buscar estatisticas reais dos jogadores
  const jogadoresComStats = getJogadorStatsByYear()

  // Filtrar e ordenar jogadores
  const filteredAndSortedPlayers = useMemo(() => {
    let filtered = jogadoresComStats.filter((player) => {
      const matchesSearch = 
        player.name.toLowerCase().includes(search.toLowerCase()) ||
        player.nickname.toLowerCase().includes(search.toLowerCase())
      const matchesPosition = selectedPosition === "Todos" || player.position === selectedPosition
      return matchesSearch && matchesPosition
    })

    // Separar jogadores com partidas e sem partidas
    const withMatches = filtered.filter(p => p.matches > 0)
    const withoutMatches = filtered.filter(p => p.matches === 0)

  // Ordenar jogadores com partidas
  withMatches.sort((a, b) => {
  switch (sortBy) {
  case "nome":
  // A-Z com locale pt-BR para ordenacao correta de acentos
  return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  case "gols":
  // FILTRO DE ARTILHEIROS:
  // 1º Gols > 2º Assistências > 3º Jogos > 4º Valor de Mercado > 5º Ordem Alfabética
  if (b.goals !== a.goals) return b.goals - a.goals
  if (b.assists !== a.assists) return b.assists - a.assists
  if (b.matches !== a.matches) return b.matches - a.matches
  const valueGoalsA = calculateMarketValue(a, jogadoresComStats).currentValue
  const valueGoalsB = calculateMarketValue(b, jogadoresComStats).currentValue
  if (valueGoalsB !== valueGoalsA) return valueGoalsB - valueGoalsA
  return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  case "assists":
  // Mais assists primeiro, empate = mais gols, mais jogos, valor, alfabético
  if (b.assists !== a.assists) return b.assists - a.assists
  if (b.goals !== a.goals) return b.goals - a.goals
  if (b.matches !== a.matches) return b.matches - a.matches
  const valueAssistsA = calculateMarketValue(a, jogadoresComStats).currentValue
  const valueAssistsB = calculateMarketValue(b, jogadoresComStats).currentValue
  if (valueAssistsB !== valueAssistsA) return valueAssistsB - valueAssistsA
  return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  case "jogos":
  // FILTRO DE MAIS JOGOS:
  // 1º Jogos > 2º Gols > 3º Assistências > 4º Valor de Mercado > 5º Ordem Alfabética
  if (b.matches !== a.matches) return b.matches - a.matches
  if (b.goals !== a.goals) return b.goals - a.goals
  if (b.assists !== a.assists) return b.assists - a.assists
  const valueJogosA = calculateMarketValue(a, jogadoresComStats).currentValue
  const valueJogosB = calculateMarketValue(b, jogadoresComStats).currentValue
  if (valueJogosB !== valueJogosA) return valueJogosB - valueJogosA
  return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  case "valor-maior":
  // FILTRO DE VALOR (MAIOR):
  // 1º Valor > 2º Gols > 3º Assistências > 4º Jogos > 5º Ordem Alfabética
  const valueA = calculateMarketValue(a, jogadoresComStats).currentValue
  const valueB = calculateMarketValue(b, jogadoresComStats).currentValue
  if (valueB !== valueA) return valueB - valueA
  if (b.goals !== a.goals) return b.goals - a.goals
  if (b.assists !== a.assists) return b.assists - a.assists
  if (b.matches !== a.matches) return b.matches - a.matches
  return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  case "valor-menor":
  const valueAm = calculateMarketValue(a, jogadoresComStats).currentValue
  const valueBm = calculateMarketValue(b, jogadoresComStats).currentValue
  if (valueAm !== valueBm) return valueAm - valueBm
  if (b.goals !== a.goals) return b.goals - a.goals
  if (b.assists !== a.assists) return b.assists - a.assists
  if (b.matches !== a.matches) return b.matches - a.matches
  return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  case "desempenho":
  default:
  // FILTRO DE DESEMPENHO:
  // 1º Desempenho (performanceScore) > 2º Mais Jogos > 3º Gols > 4º Assistências
  const perfA = a.performanceScore || 0
  const perfB = b.performanceScore || 0
  
  // 1º Critério: Maior nota de Desempenho
  if (Math.abs(perfB - perfA) >= 0.1) {
  return perfB - perfA
  }
  
  // 2º Critério (desempate): Mais partidas (jogos)
  if (b.matches !== a.matches) {
  return b.matches - a.matches
  }
  
  // 3º Critério: Mais gols
  if (b.goals !== a.goals) {
  return b.goals - a.goals
  }
  
  // 4º Critério: Mais assistências
  return b.assists - a.assists
  }
  })

    // Ordenar jogadores sem partidas por nome (A-Z pt-BR)
    withoutMatches.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }))

    // Retornar com jogadores sem partidas no final
    return [...withMatches, ...withoutMatches]
  }, [jogadoresComStats, search, selectedPosition, sortBy])

  const activeCount = jogadoresComStats.filter(p => p.status === "active").length
  const totalGoals = jogadoresComStats.reduce((sum, p) => sum + (p.goals || 0), 0)
  const totalAssists = jogadoresComStats.reduce((sum, p) => sum + (p.assists || 0), 0)
  const avgRating = jogadoresComStats.length > 0 
    ? Math.round(jogadoresComStats.reduce((sum, p) => sum + (p.rating || 0), 0) / jogadoresComStats.length) 
    : 0

  // Handlers
  const handleOpenAddModal = () => {
    setEditingPlayer(null)
    setFormData({
      name: "",
      nickname: "",
      position: "",
      number: "",
      linkedEmail: "none",
      status: "active",
      photoUrl: undefined,
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (player: Jogador) => {
    setEditingPlayer(player)
    setFormData({
      name: player.name,
      nickname: player.nickname,
      position: player.position,
      number: player.number.toString(),
      linkedEmail: "none",
      status: player.status,
      photoUrl: player.photo_url,
    })
    setIsModalOpen(true)
  }

  const handleOpenDeleteDialog = (player: Jogador) => {
    setDeletingPlayer(player)
    setIsDeleteDialogOpen(true)
  }

  const handleViewDetails = (player: JogadorStats) => {
    setSelectedPlayer(player)
    setIsDetailsModalOpen(true)
  }

  const handleSavePlayer = async () => {
    if (!formData.name || !formData.nickname || !formData.position || !formData.number) {
      alert("Por favor, preencha todos os campos obrigatorios.")
      return
    }

    const linkedEmail = formData.linkedEmail === "none" ? undefined : formData.linkedEmail

    try {
      if (editingPlayer) {
        await updateJogador(editingPlayer.id, {
          name: formData.name,
          nickname: formData.nickname,
          position: formData.position,
          number: parseInt(formData.number),
          status: formData.status,
          photo_url: formData.photoUrl,
          linked_email: linkedEmail,
        })
      } else {
        await addJogador({
          name: formData.name,
          nickname: formData.nickname,
          position: formData.position,
          number: parseInt(formData.number),
          status: formData.status,
          photo_url: formData.photoUrl,
          linked_email: linkedEmail,
        })
      }

      setIsModalOpen(false)
      setEditingPlayer(null)
    } catch (error: any) {
      console.error("[v0] Error saving player:", error)
      alert(`Erro ao salvar jogador: ${error?.message || "Erro desconhecido"}`)
    }
  }

  const handleDeletePlayer = async () => {
    if (deletingPlayer) {
      try {
        await deleteJogador(deletingPlayer.id)
        setIsDeleteDialogOpen(false)
        setDeletingPlayer(null)
      } catch (error) {
        console.error("[v0] Error deleting player:", error)
        alert("Erro ao excluir jogador.")
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4B300]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 page-container">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Elenco <span className="text-[#D4B300]">Amaralina FC</span>
          </h1>
          <p className="text-white/50 mt-1 text-sm">
            Plantel completo da temporada
          </p>
        </div>
      </div>

      {/* Stats Summary - Glassmorphism */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4B300]/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#D4B300]" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{jogadores.length}</p>
              <p className="text-xs text-white/50">Total</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{activeCount}</p>
              <p className="text-xs text-white/50">Ativos</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4B300]/20 flex items-center justify-center">
              <Goal className="w-5 h-5 text-[#D4B300]" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{totalGoals}</p>
              <p className="text-xs text-white/50">Gols</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0088CC]/20 flex items-center justify-center">
              <HandHelping className="w-5 h-5 text-[#0088CC]" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{totalAssists}</p>
              <p className="text-xs text-white/50">Assists</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters - Glassmorphism */}
      <div className="glass-card p-4 rounded-xl border border-white/10">
        <div className="flex flex-col gap-4">
          {/* Search + Sort + Add */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="Buscar jogador..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#D4B300] focus:ring-[#D4B300]"
              />
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10">
                {sortOptions.map((opt) => (
                  <SelectItem 
                    key={opt.value} 
                    value={opt.value}
                    className="text-white hover:bg-white/10 focus:bg-white/10"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isAdmin && (
              <Button
                onClick={handleOpenAddModal}
                className="bg-gradient-to-r from-[#D4B300] to-[#967948] text-black hover:from-[#FFD700] hover:to-[#D4B300] gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Adicionar</span>
              </Button>
            )}
          </div>

          {/* Position Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-white/40" />
            {positions.map((position) => (
              <Button
                key={position}
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPosition(position)}
                className={cn(
                  "text-xs",
                  selectedPosition === position
                    ? "bg-[#D4B300] text-black hover:bg-[#FFD700]"
                    : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10"
                )}
              >
                {position}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Players Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAndSortedPlayers.map((player, index) => (
          <PlayerCardPremium
            key={player.id}
            player={player}
            isAdmin={isAdmin}
            onEdit={handleOpenEditModal}
            onDelete={handleOpenDeleteDialog}
            onViewDetails={handleViewDetails}
            rank={index + 1}
            allPlayers={jogadoresComStats}
          />
        ))}
      </div>

      {filteredAndSortedPlayers.length === 0 && (
        <div className="glass-card p-12 rounded-xl border border-white/10 text-center">
          <Users className="w-16 h-16 mx-auto text-white/20 mb-4" />
          <p className="text-lg font-semibold text-white">Nenhum jogador encontrado</p>
          <p className="text-sm text-white/50 mt-1">Tente ajustar os filtros de busca</p>
        </div>
      )}

      {/* Player Details Modal */}
      <PlayerDetailsModal
        player={selectedPlayer}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        allPlayers={jogadoresComStats}
        isAdmin={isAdmin}
        onPhotoUpdate={async (jogadorId, newPhotoUrl) => {
          // Atualizar foto no banco
          const supabase = (await import("@/lib/supabase/client")).createClient()
          await supabase
            .from("jogadores")
            .update({ photo_url: newPhotoUrl })
            .eq("id", jogadorId)
          // Refresh data
          refreshData?.()
        }}
      />

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-[#D4B300]/30 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#D4B300] flex items-center gap-2">
              {editingPlayer ? (
                <>
                  <Pencil className="w-5 h-5" />
                  Editar Jogador
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Adicionar Jogador
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-white/50">
              {editingPlayer ? "Atualize os dados do jogador" : "Preencha os dados do novo jogador"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Foto - Upload habilitado para Admin */}
            <div className="flex flex-col items-center gap-2">
              <PlayerPhoto
                currentPhotoUrl={formData.photoUrl}
                onPhotoChange={(url) => setFormData({ ...formData, photoUrl: url || undefined })}
                playerName={formData.name || "Jogador"}
                nickname={formData.nickname}
                size="lg"
                isAdmin={true}
                editable={true}
              />
              <p className="text-xs text-white/50 text-center">
                Clique na foto para alterar ou remover
              </p>
            </div>

            {/* Nome */}
            <div className="space-y-2">
              <Label className="text-white/70">Nome Completo *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo do jogador"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>

            {/* Apelido */}
            <div className="space-y-2">
              <Label className="text-white/70">Apelido *</Label>
              <Input
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                placeholder="Apelido do jogador"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>

            {/* Posicao e Numero */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/70">Posicao *</Label>
                <Select
                  value={formData.position}
                  onValueChange={(v) => setFormData({ ...formData, position: v })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    {positionsForm.map((pos) => (
                      <SelectItem key={pos} value={pos} className="text-white hover:bg-white/10">
                        {pos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Numero *</Label>
                <Input
                  type="number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="00"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-white/70">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v as "active" | "inactive" })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10">
                  <SelectItem value="active" className="text-white hover:bg-white/10">Ativo</SelectItem>
                  <SelectItem value="inactive" className="text-white hover:bg-white/10">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email vinculado (admin) */}
            {isAdmin && profiles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-white/70">Vincular a Usuario</Label>
                <Select
                  value={formData.linkedEmail}
                  onValueChange={(v) => setFormData({ ...formData, linkedEmail: v })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Selecione um usuario" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    <SelectItem value="none" className="text-white hover:bg-white/10">
                      Nenhum
                    </SelectItem>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.email} className="text-white hover:bg-white/10">
                        {profile.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="border-[#555] bg-[#333] text-white hover:bg-[#444] hover:border-[#666]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSavePlayer}
              className="bg-gradient-to-r from-[#D4B300] to-[#967948] text-black hover:from-[#FFD700] hover:to-[#D4B300]"
            >
              {editingPlayer ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-red-500/30 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">Excluir Jogador</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Tem certeza que deseja excluir <strong className="text-white">{deletingPlayer?.nickname}</strong>?
              Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlayer}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
