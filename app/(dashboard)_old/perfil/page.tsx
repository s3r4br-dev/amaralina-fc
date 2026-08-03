"use client"

/**
 * Página de Perfil - Amaralina FC
 * Version: 30.0 - Sistema de Gamificação Completo
 */
import { useState, useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"
import { User, Trophy, Goal, HandHelping, Calendar, Shield, Star, TrendingUp, Award, Pencil, Save, X, Gem, Sparkles, LogOut } from "lucide-react"
import {
  ProfileProgressBar,
  TrophyGallery,
  TemporaryGallery,
  ShowcaseBadges,
} from "@/components/achievements"
import { ProfileCard, FrameTier } from "@/components/profile-card"
import {
  PERMANENT_ACHIEVEMENTS,
  TEMPORARY_ACHIEVEMENTS,
  calculatePermanentAchievements,
  calculateTemporaryAchievements,
  calculateProfileProgress,
} from "@/lib/achievements"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { cn } from "@/lib/utils"

const positions = ["Goleiro", "Zagueiro", "Lateral", "Volante", "Meia", "Atacante"]

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-12 text-sm font-medium text-[#F9F9F9]">{label}</span>
      <div className="flex-1 h-2 bg-[#333333] rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-8 text-sm font-bold text-[#F9F9F9]">{value}</span>
    </div>
  )
}

function calculateFIFAStats(jogador: { 
  goals: number
  assists: number
  matches: number
  wins: number
  losses: number
  position: string
  goalsConceded?: number
  cleanSheets?: number
}) {
  const { goals, assists, matches, wins, losses, position, goalsConceded = 0, cleanSheets = 0 } = jogador
  
  let pace = 50
  let shooting = 50
  let passing = 50
  let dribbling = 50
  let defending = 50
  let physical = 50

  if (matches > 0) {
    const goalsPerMatch = goals / matches
    const assistsPerMatch = assists / matches
    const winRate = wins / matches

    pace = Math.min(100, Math.round(50 + (goalsPerMatch * 15) + (assistsPerMatch * 10) + (winRate * 25)))
    shooting = Math.min(100, Math.round(50 + (goals * 2) + (goalsPerMatch * 25)))
    passing = Math.min(100, Math.round(50 + (assists * 2.5) + (assistsPerMatch * 25)))
    dribbling = Math.min(100, Math.round(50 + (goalsPerMatch * 10) + (assistsPerMatch * 10) + (winRate * 20)))

    if (position === "Goleiro") {
      const avgConceded = matches > 0 ? goalsConceded / matches : 0
      defending = Math.min(100, Math.round(60 + (cleanSheets * 5) - (avgConceded * 3) + (winRate * 20)))
    } else if (position === "Zagueiro" || position === "Volante") {
      defending = Math.min(100, Math.round(55 + (winRate * 35) + (matches * 0.5)))
    } else if (position === "Lateral") {
      defending = Math.min(100, Math.round(50 + (winRate * 30) + (assistsPerMatch * 12)))
    } else {
      defending = Math.min(100, Math.round(40 + (winRate * 20)))
    }

    physical = Math.min(100, Math.round(50 + (matches * 1) + (winRate * 20) - (losses * 0.5)))
  }

  return {
    pace: Math.max(40, Math.min(100, pace)),
    shooting: Math.max(40, Math.min(100, shooting)),
    passing: Math.max(40, Math.min(100, passing)),
    dribbling: Math.max(40, Math.min(100, dribbling)),
    defending: Math.max(40, Math.min(100, defending)),
    physical: Math.max(40, Math.min(100, physical)),
  }
}

interface FIFACardProps {
  player: {
    name: string
    nickname: string
    position: string
    number: number
    rating: number
    goals: number
    assists: number
    matches: number
    wins: number
    losses: number
    goalsConceded?: number
    cleanSheets?: number
  }
}

function FIFACard({ player }: FIFACardProps) {
  const fifaStats = calculateFIFAStats(player)
  
  const getRatingColor = (rating: number) => {
    if (rating >= 90) return "from-[#FFD700] to-[#C5A059]"
    if (rating >= 85) return "from-[#4CAF50] to-[#388E3C]"
    if (rating >= 80) return "from-[#0088CC] to-[#006699]"
    return "from-[#666666] to-[#444444]"
  }

  return (
    <div className="relative w-72 mx-auto">
      <div className="relative bg-gradient-to-br from-[#1a1a1a] via-[#2B2B2B] to-[#1a1a1a] rounded-2xl overflow-hidden border-2 border-[#C5A059] shadow-2xl shadow-[#C5A059]/20">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent" />
        
        <div className="absolute top-4 left-4">
          <div className={cn(
            "w-16 h-20 rounded-lg bg-gradient-to-br flex flex-col items-center justify-center",
            getRatingColor(player.rating)
          )}>
            <span className="text-3xl font-black text-[#1a1a1a]">{player.rating}</span>
            <span className="text-xs font-bold text-[#1a1a1a] uppercase">{player.position.slice(0, 3)}</span>
          </div>
        </div>

        <div className="absolute top-4 right-4 text-6xl font-black text-[#C5A059]/20">
          {player.number}
        </div>

        <div className="pt-6 pb-4 flex justify-center">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#0088CC] to-[#006699] flex items-center justify-center border-4 border-[#C5A059] shadow-lg">
            <span className="text-4xl font-bold text-white">
              {player.name.split(" ").map(n => n[0]).join("")}
            </span>
          </div>
        </div>

        <div className="text-center pb-4 border-b border-[#333333] mx-4">
          <h2 className="text-2xl font-bold text-[#C5A059]">{player.nickname || player.name}</h2>
          <p className="text-sm text-[#F9F9F9]">{player.name}</p>
          <p className="text-xs text-[#967948] mt-1">{player.position}</p>
        </div>

        <div className="p-4 space-y-2">
          <StatBar label="RIT" value={fifaStats.pace} color="#4CAF50" />
          <StatBar label="FIN" value={fifaStats.shooting} color="#C5A059" />
          <StatBar label="PAS" value={fifaStats.passing} color="#0088CC" />
          <StatBar label="DRI" value={fifaStats.dribbling} color="#9C27B0" />
          <StatBar label="DEF" value={fifaStats.defending} color="#F44336" />
          <StatBar label="FIS" value={fifaStats.physical} color="#FF9800" />
        </div>

        <div className="pb-4 flex justify-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#C5A059]/20 rounded-full">
            <Trophy className="w-4 h-4 text-[#C5A059]" />
            <span className="text-sm font-semibold text-[#C5A059]">Amaralina FC</span>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent" />
      </div>
    </div>
  )
}

export default function PerfilPage() {
  const { user, isAdmin, logout } = useAuth()
  const { jogadores, profiles, partidas, updateJogador, getJogadorStatsByYear, isLoading } = useData()
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    nickname: "",
    position: "",
    number: "",
  })

  const jogadorStats = getJogadorStatsByYear()

  const currentProfile = useMemo(() => {
    if (!user) return null
    return (profiles || []).find(p => p.email === user.email) || null
  }, [user, profiles])

  const linkedPlayer = useMemo(() => {
    if (!user) return null
    
    if (currentProfile?.linked_player_id) {
      return jogadorStats.find(j => j.id === currentProfile.linked_player_id) || null
    }
    
    const linkedByEmail = jogadorStats.find(j => j.linked_email === user.email)
    return linkedByEmail || null
  }, [user, currentProfile, jogadorStats])
  
  const userLevel = currentProfile?.level ?? 0
  
  const dbUnlockedFrames = useMemo(() => {
    if (!currentProfile?.unlocked_frames) return []
    const frames = currentProfile.unlocked_frames as FrameTier[]
    return Array.isArray(frames) ? frames : []
  }, [currentProfile])

  const permanentProgress = useMemo(() => {
    if (!linkedPlayer) return []
    return calculatePermanentAchievements(
      linkedPlayer.id,
      linkedPlayer,
      partidas,
      jogadorStats,
      linkedPlayer.created_at
    )
  }, [linkedPlayer, partidas, jogadorStats])

  const temporaryStatus = useMemo(() => {
    if (!linkedPlayer) return []
    return calculateTemporaryAchievements(
      linkedPlayer.id,
      linkedPlayer,
      partidas,
      jogadorStats
    )
  }, [linkedPlayer, partidas, jogadorStats])

  const profileProgress = useMemo(() => {
    return calculateProfileProgress(permanentProgress)
  }, [permanentProgress])

  const [showcaseIds, setShowcaseIds] = useState<string[]>([])
  const [selectedFrame, setSelectedFrame] = useState<FrameTier | undefined>(undefined)
  const [playerPhoto, setPlayerPhoto] = useState<string | undefined>(
    linkedPlayer?.photo_url || linkedPlayer?.photo
  )

  const awards = useMemo(() => {
    if (!linkedPlayer || jogadorStats.length === 0) return []
    
    const awardsList: string[] = []
    const activeStats = jogadorStats.filter(j => j.status === "active")
    const topScorer = activeStats.length > 0 ? activeStats.reduce((max, j) => j.goals > max.goals ? j : max, activeStats[0]) : null
    const topAssister = activeStats.length > 0 ? activeStats.reduce((max, j) => j.assists > max.assists ? j : max, activeStats[0]) : null
    
    if (topScorer && linkedPlayer.id === topScorer.id && linkedPlayer.goals > 0) {
      awardsList.push("Artilheiro da Temporada")
    }
    if (topAssister && linkedPlayer.id === topAssister.id && linkedPlayer.assists > 0) {
      awardsList.push("Rei das Assistências")
    }
    if (linkedPlayer.wins >= 10) {
      awardsList.push("10+ Vitórias")
    }
    if (linkedPlayer.matches >= 15) {
      awardsList.push("Veterano (15+ jogos)")
    }
    if (linkedPlayer.rating >= 85) {
      awardsList.push("Rating Elite")
    }
    
    return awardsList
  }, [linkedPlayer, jogadorStats])

  const handleOpenEditModal = () => {
    if (linkedPlayer) {
      setEditForm({
        name: linkedPlayer.name,
        nickname: linkedPlayer.nickname || "",
        position: linkedPlayer.position,
        number: linkedPlayer.number.toString(),
      })
      setIsEditModalOpen(true)
    }
  }

  const handleSaveEdit = () => {
    if (linkedPlayer && editForm.name && editForm.position && editForm.number) {
      updateJogador(linkedPlayer.id, {
        name: editForm.name,
        nickname: editForm.nickname,
        position: editForm.position,
        number: parseInt(editForm.number),
      })
      setIsEditModalOpen(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C5A059]" />
      </div>
    )
  }

  if (!linkedPlayer) {
    return (
      <div className="space-y-8 page-container">
        <div>
          <h1 className="text-3xl font-bold text-[#ffffff]">
            Meu <span className="text-[#C5A059]">Perfil</span>
          </h1>
          <p className="text-[#ffffff] mt-1">
            Visualize suas estatísticas e conquistas
          </p>
        </div>

        <Card className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center",
                isAdmin 
                  ? "bg-gradient-to-br from-[#C5A059] to-[#967948]"
                  : "bg-gradient-to-br from-[#0088CC] to-[#006699]"
              )}>
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#F9F9F9]">{user?.name}</h3>
                <p className="text-[#967948]">{user?.email}</p>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 mt-2 rounded bg-[#C5A059]/20 text-[#C5A059] text-xs font-semibold">
                    <Shield className="w-3 h-3" />
                    Administrador
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl">
          <CardContent className="p-8 text-center">
            <User className="w-16 h-16 mx-auto text-[#967948] opacity-50" />
            <h3 className="text-xl font-semibold text-white mt-4">Nenhum jogador vinculado</h3>
            <p className="text-white/70 mt-2">
              Seu perfil de usuário ainda não está vinculado a um jogador.
              {isAdmin && " Acesse a aba Usuários para vincular seu perfil a um jogador."}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 page-container">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#ffffff]">
            Meu <span className="text-[#C5A059]">Perfil</span>
          </h1>
          <p className="text-[#ffffff] mt-1">
            Visualize suas estatísticas e conquistas
          </p>
        </div>
        <Button 
          onClick={handleOpenEditModal}
          className="bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-white/10"
        >
          <Pencil className="w-4 h-4 mr-2 text-white" />
          Editar Perfil
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1 flex flex-col items-center">
          <ProfileCard
            player={{
              id: linkedPlayer.id,
              name: linkedPlayer.name,
              position: linkedPlayer.position,
              photo: playerPhoto,
              goals: linkedPlayer.goals,
              assists: linkedPlayer.assists,
              matches: linkedPlayer.matches,
              rating: linkedPlayer.rating,
            }}
            profileProgress={userLevel}
            selectedFrame={selectedFrame}
            onFrameChange={setSelectedFrame}
            onPhotoChange={(newUrl) => {
              setPlayerPhoto(newUrl || undefined)
            }}
            editable={true}
            unlockedFrames={isAdmin ? ["bronze", "silver", "gold", "emerald", "ruby", "sapphire", "diamond"] : dbUnlockedFrames.length > 0 ? dbUnlockedFrames : undefined}
          />
          
          {/* Awards / Destaques */}
          {awards.length > 0 && (
            <Card className="mt-6 w-full max-w-[340px] bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Sparkles className="w-5 h-5 text-[#C5A059]" />
                  Destaques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {awards.map((award, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/30 text-xs font-medium text-[#C5A059]"
                    >
                      <Trophy className="w-3 h-3 text-[#C5A059]" />
                      {award}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Stats & Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Account Info + Progressão */}
          <Card className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-6">
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center",
                  isAdmin 
                    ? "bg-gradient-to-br from-[#C5A059] to-[#967948]"
                    : "bg-gradient-to-br from-[#0088CC] to-[#006699]"
                )}>
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#C5A059]">{user?.name}</h3>
                  <p className="text-white/80">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {isAdmin && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded bg-[#C5A059]/20 text-[#C5A059] text-xs font-semibold">
                        <Shield className="w-3 h-3" />
                        Administrador
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Barra de Progressão do Perfil */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Gem className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm font-semibold text-white">Nível do Perfil</span>
                </div>
                <ProfileProgressBar progress={profileProgress} />
              </div>

              {/* Vitrine de Conquistas */}
              <div className="pt-4 border-t border-white/10">
                <ShowcaseBadges
                  selectedIds={showcaseIds}
                  achievements={PERMANENT_ACHIEVEMENTS}
                  progress={permanentProgress}
                  editable={true}
                  onEdit={setShowcaseIds}
                />
              </div>

              {/* Botão de Logout */}
              <div className="pt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={logout}
                  className="w-full bg-black/40 backdrop-blur-md border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair da Conta
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl">
              <CardContent className="p-4 text-center">
                <Goal className="w-8 h-8 mx-auto text-green-500" />
                <p className="text-3xl font-bold text-green-500 mt-2">{linkedPlayer.goals}</p>
                <p className="text-sm text-white">Gols</p>
              </CardContent>
            </Card>
            <Card className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl">
              <CardContent className="p-4 text-center">
                <HandHelping className="w-8 h-8 mx-auto text-[#0088CC]" />
                <p className="text-3xl font-bold text-[#0088CC] mt-2">{linkedPlayer.assists}</p>
                <p className="text-sm text-white">Assistências</p>
              </CardContent>
            </Card>
            <Card className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl">
              <CardContent className="p-4 text-center">
                <Calendar className="w-8 h-8 mx-auto text-orange-500" />
                <p className="text-3xl font-bold text-orange-500 mt-2">{linkedPlayer.matches}</p>
                <p className="text-sm text-white">Partidas</p>
              </CardContent>
            </Card>
            <Card className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl">
              <CardContent className="p-4 text-center">
                <Star className="w-8 h-8 mx-auto text-[#FFD700]" />
                <p className="text-3xl font-bold text-[#FFD700] mt-2">{linkedPlayer.rating}</p>
                <p className="text-sm text-white">Overall</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Stats */}
          <Card className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="w-6 h-6 text-[#C5A059]" />
                Estatísticas Detalhadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-white">Vitórias</span>
                  </div>
                  <p className="text-2xl font-bold text-green-500">{linkedPlayer.wins}</p>
                </div>
                <div className="p-4 rounded-lg bg-[#C5A059]/10 border border-[#C5A059]/30">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-[#C5A059]" />
                    <span className="text-sm text-white">Empates</span>
                  </div>
                  <p className="text-2xl font-bold text-[#C5A059]">{linkedPlayer.draws}</p>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <X className="w-5 h-5 text-red-500" />
                    <span className="text-sm text-white">Derrotas</span>
                  </div>
                  <p className="text-2xl font-bold text-red-500">{linkedPlayer.losses}</p>
                </div>
                {linkedPlayer.position === "Goleiro" && (
                  <>
                    <div className="p-4 rounded-lg bg-[#0088CC]/10 border border-[#0088CC]/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-5 h-5 text-[#0088CC]" />
                        <span className="text-sm text-white">Clean Sheets</span>
                      </div>
                      <p className="text-2xl font-bold text-[#0088CC]">{linkedPlayer.cleanSheets}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-zinc-500/10 border border-zinc-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Goal className="w-5 h-5 text-red-500" />
                        <span className="text-sm text-white">Gols Sofridos</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{linkedPlayer.goalsConceded}</p>
                    </div>
                  </>
                )}
                <div className="p-4 rounded-lg bg-zinc-500/10 border border-zinc-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-[#967948]" />
                    <span className="text-sm text-white">Taxa de Vitória</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {linkedPlayer.matches > 0 
                      ? Math.round((linkedPlayer.wins / linkedPlayer.matches) * 100) 
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Player Info */}
          <Card className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="w-6 h-6 text-[#C5A059]" />
                Informações do Jogador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-white">
                <div>
                  <span className="text-white/60 text-xs block">Nome Completo</span>
                  <span className="font-semibold">{linkedPlayer.name}</span>
                </div>
                <span className="text-white/30">|</span>
                <div>
                  <span className="text-white/60 text-xs block">Apelido</span>
                  <span className="font-semibold">{linkedPlayer.nickname || "-"}</span>
                </div>
                <span className="text-white/30">|</span>
                <div>
                  <span className="text-white/60 text-xs block">Número</span>
                  <span className="font-semibold">#{linkedPlayer.number}</span>
                </div>
                <span className="text-white/30">|</span>
                <div>
                  <span className="text-white/60 text-xs block">Posição</span>
                  <span className="font-semibold">{linkedPlayer.position}</span>
                </div>
                <span className="text-white/30">|</span>
                <div>
                  <span className="text-white/60 text-xs block">Clube</span>
                  <span className="font-semibold">Amaralina FC</span>
                </div>
                <span className="text-white/30">|</span>
                <div>
                  <span className="text-white/60 text-xs block">Status</span>
                  <span className={cn("font-semibold", linkedPlayer.status === "active" ? "text-green-500" : "text-red-500")}>
                    {linkedPlayer.status === "active" ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Seção de Conquistas - Full Width */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <TrophyGallery
          achievements={PERMANENT_ACHIEVEMENTS}
          progress={permanentProgress}
          title="Conquistas Permanentes (20)"
        />

        <TemporaryGallery
          achievements={TEMPORARY_ACHIEVEMENTS}
          status={temporaryStatus}
        />
      </div>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl text-white">
          <DialogHeader>
            <DialogTitle className="text-[#C5A059] flex items-center gap-2 text-xl">
              <Pencil className="w-5 h-5 text-[#C5A059]" />
              Editar Perfil
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Atualize suas informações de jogador.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Nome Completo</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className="bg-black/50 border-white/20 focus:border-[#C5A059] text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname" className="text-white">Apelido</Label>
              <Input
                id="nickname"
                value={editForm.nickname}
                onChange={(e) => setEditForm(prev => ({ ...prev, nickname: e.target.value }))}
                className="bg-black/50 border-white/20 focus:border-[#C5A059] text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position" className="text-white">Posição</Label>
              <Select
                value={editForm.position}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, position: value }))}
              >
                <SelectTrigger className="bg-black/50 border-white/20 focus:border-[#C5A059] text-white">
                  <SelectValue placeholder="Selecione a posição" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-white/10 text-white">
                  {positions.map((pos) => (
                    <SelectItem 
                      key={pos} 
                      value={pos}
                      className="focus:bg-[#C5A059] focus:text-black cursor-pointer"
                    >
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="number" className="text-white">Número da Camisa</Label>
              <Input
                id="number"
                type="number"
                min="1"
                max="99"
                value={editForm.number}
                onChange={(e) => setEditForm(prev => ({ ...prev, number: e.target.value }))}
                className="bg-black/50 border-white/20 focus:border-[#C5A059] text-white"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              className="bg-black/40 border-white/20 text-white hover:bg-white/10"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              className="bg-[#C5A059] text-black hover:bg-[#967948]"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
