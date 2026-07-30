"use client"

/**
 * Página de Conquistas do Jogador - Acesso Público
 * Exibe todas as conquistas de um jogador específico
 */

import { useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useData } from "@/contexts/data-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trophy, User } from "lucide-react"
import {
  ProfileProgressBar,
  TrophyGallery,
  TemporaryGallery,
} from "@/components/achievements"
import {
  PERMANENT_ACHIEVEMENTS,
  TEMPORARY_ACHIEVEMENTS,
  calculatePermanentAchievements,
  calculateTemporaryAchievements,
  calculateProfileProgress,
  getProfileTier,
} from "@/lib/achievements"
import { cn } from "@/lib/utils"

export default function JogadorConquistasPage() {
  const params = useParams()
  const router = useRouter()
  const jogadorId = Number(params.id)
  
  const { jogadores, partidas, getJogadorStatsByYear, isLoading } = useData()
  const jogadorStats = getJogadorStatsByYear()
  
  const jogador = useMemo(() => {
    return jogadorStats.find(j => j.id === jogadorId)
  }, [jogadorStats, jogadorId])

  const permanentProgress = useMemo(() => {
    if (!jogador) return []
    return calculatePermanentAchievements(
      jogador.id,
      jogador,
      partidas,
      jogadorStats,
      jogador.created_at
    )
  }, [jogador, partidas, jogadorStats])

  const temporaryStatus = useMemo(() => {
    if (!jogador) return []
    return calculateTemporaryAchievements(
      jogador.id,
      jogador,
      partidas,
      jogadorStats
    )
  }, [jogador, partidas, jogadorStats])

  const profileProgress = useMemo(() => {
    return calculateProfileProgress(permanentProgress)
  }, [permanentProgress])

  const tier = getProfileTier(profileProgress)

  const completedCount = permanentProgress.filter(p => p.isComplete).length
  const activeTemporary = temporaryStatus.filter(s => s.isActive).length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C5A059]" />
      </div>
    )
  }

  if (!jogador) {
    return (
      <div className="space-y-8 page-container">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="text-[#967948]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        
        <Card className="bg-white border-[#E5E0D8]">
          <CardContent className="p-8 text-center">
            <User className="w-16 h-16 mx-auto text-[#967948] opacity-50" />
            <h3 className="text-xl font-semibold text-[#2B2B2B] mt-4">Jogador não encontrado</h3>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 page-container">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="text-[#967948]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>

      {/* Player Card with Progress */}
      <Card className="bg-gradient-to-r from-[#1a1a1a] to-[#2B2B2B] border-[#333333] overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold border-4",
              tier.tier === "diamante" && "border-cyan-400 bg-gradient-to-br from-cyan-300 to-cyan-500 text-cyan-900 drop-shadow-[0_0_20px_rgba(34,211,238,0.6)] animate-shimmer",
              tier.tier === "rubi" && "border-rose-400 bg-gradient-to-br from-rose-500 to-rose-700 text-white animate-breathe",
              tier.tier === "safira" && "border-blue-400 bg-gradient-to-br from-blue-500 to-blue-700 text-white animate-pulse-slow",
              tier.tier === "esmeralda" && "border-emerald-400 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white animate-pulse-slow",
              tier.tier === "ouro" && "border-yellow-400 bg-gradient-to-br from-yellow-400 to-yellow-500 text-yellow-900",
              tier.tier === "prata" && "border-gray-300 bg-gradient-to-br from-gray-200 to-gray-400 text-gray-700",
              tier.tier === "bronze" && "border-amber-500 bg-gradient-to-br from-amber-600 to-amber-800 text-amber-900",
            )}>
              {jogador.number}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-black text-[#F9F9F9]">
                {jogador.nickname || jogador.name}
              </h1>
              <p className="text-[#967948]">{jogador.position}</p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#C5A059]">{completedCount}</p>
                  <p className="text-xs text-[#967948]">Conquistas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">{activeTemporary}</p>
                  <p className="text-xs text-[#967948]">Ativas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#F9F9F9]">{jogador.goals}</p>
                  <p className="text-xs text-[#967948]">Gols</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#F9F9F9]">{jogador.assists}</p>
                  <p className="text-xs text-[#967948]">Assist.</p>
                </div>
              </div>
            </div>

            {/* Tier Badge */}
            <div className="text-center">
              <div className={cn(
                "w-16 h-16 rounded-xl flex items-center justify-center shadow-lg",
                tier.tier === "diamante" && "bg-gradient-to-br from-cyan-300 to-cyan-400 animate-shimmer drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]",
                tier.tier === "rubi" && "bg-gradient-to-br from-rose-500 to-rose-700 animate-breathe",
                tier.tier === "safira" && "bg-gradient-to-br from-blue-500 to-blue-700 animate-pulse-slow",
                tier.tier === "esmeralda" && "bg-gradient-to-br from-emerald-500 to-emerald-600 animate-pulse-slow",
                tier.tier === "ouro" && "bg-gradient-to-br from-yellow-400 to-yellow-500",
                tier.tier === "prata" && "bg-gradient-to-br from-gray-200 to-gray-400",
                tier.tier === "bronze" && "bg-gradient-to-br from-amber-600 to-amber-800",
              )}>
                <Trophy className={cn(
                  "w-8 h-8",
                  tier.tier === "diamante" && "text-cyan-900",
                  tier.tier === "rubi" && "text-white",
                  tier.tier === "safira" && "text-white",
                  tier.tier === "esmeralda" && "text-white",
                  tier.tier === "ouro" && "text-yellow-900",
                  tier.tier === "prata" && "text-gray-700",
                  tier.tier === "bronze" && "text-amber-900",
                )} />
              </div>
              <p className={cn(
                "mt-2 font-bold text-sm",
                tier.tier === "diamante" && "text-cyan-400",
                tier.tier === "rubi" && "text-rose-400",
                tier.tier === "safira" && "text-blue-400",
                tier.tier === "esmeralda" && "text-emerald-400",
                tier.tier === "ouro" && "text-yellow-400",
                tier.tier === "prata" && "text-gray-300",
                tier.tier === "bronze" && "text-amber-400",
              )}>
                {tier.label}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 pt-6 border-t border-[#333333]">
            <ProfileProgressBar progress={profileProgress} />
          </div>
        </CardContent>
      </Card>

      {/* Galleries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrophyGallery
          achievements={PERMANENT_ACHIEVEMENTS}
          progress={permanentProgress}
          title="Conquistas Permanentes"
        />

        <TemporaryGallery
          achievements={TEMPORARY_ACHIEVEMENTS}
          status={temporaryStatus}
        />
      </div>
    </div>
  )
}
