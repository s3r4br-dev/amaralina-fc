"use client"

/**
 * Componentes de Gamificação - Amaralina FC
 * Inclui: ProgressBar, AchievementBadge, TrophyGallery, Showcase
 */

import { useState, useMemo } from "react"
import { 
  Goal, HandHelping, Trophy, Heart, Shield, Crown, Zap, Skull, Swords, 
  Users, Users2, Medal, Calendar, Clock, Rocket, ShieldCheck, Sparkles, 
  Gem, TrendingUp, Star, Flame, Check, Utensils, Award, Target, ToyBrick, 
  ArrowUp, Layers, Sun, CalendarCheck, Ghost, Crosshair, Lightbulb, 
  Repeat, Shuffle, Brain, Maximize, Lock, ChevronRight, Info, ShieldOff,
  LayoutGrid
} from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  PERMANENT_ACHIEVEMENTS, 
  TEMPORARY_ACHIEVEMENTS, 
  PROFILE_TIERS,
  getProfileTier,
  type AchievementProgress,
  type TemporaryAchievementStatus,
  type ProfileTier
} from "@/lib/achievements"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Mapeamento de ícones
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Goal, HandHelping, Trophy, Heart, Shield, Crown, Zap, Skull, Swords,
  Users, Users2, Medal, Calendar, Clock, Rocket, ShieldCheck, Sparkles,
  Gem, TrendingUp, Star, Flame, Check, Utensils, Award, Target, 
  Brick: ToyBrick, // Alias
  ArrowUp, Layers, Sun, CalendarCheck, Ghost, Crosshair, Lightbulb,
  Repeat, Shuffle, Brain, Maximize, Lock, ChevronRight, Info, ShieldOff,
  Podium: LayoutGrid, // Alias for Podium icon
}

// Estilos por tier
const tierStyles: Record<ProfileTier, string> = {
  bronze: "bg-gradient-to-br from-amber-700 via-amber-600 to-amber-800 shadow-amber-500/30",
  prata: "bg-gradient-to-br from-gray-300 via-gray-200 to-gray-400 shadow-gray-400/30",
  ouro: "bg-gradient-to-br from-yellow-400 via-yellow-300 to-yellow-500 shadow-yellow-400/50",
  esmeralda: "bg-gradient-to-br from-emerald-500 via-emerald-400 to-emerald-600 shadow-emerald-400/50 animate-pulse-slow",
  safira: "bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 shadow-blue-500/50 animate-pulse-slow",
  rubi: "bg-gradient-to-br from-rose-600 via-rose-500 to-rose-700 shadow-rose-500/60 animate-breathe",
  diamante: "bg-gradient-to-br from-cyan-300 via-white to-cyan-400 shadow-cyan-400/80 animate-shimmer",
}

const tierTextColors: Record<ProfileTier, string> = {
  bronze: "text-amber-900",
  prata: "text-gray-700",
  ouro: "text-yellow-900",
  esmeralda: "text-emerald-900",
  safira: "text-blue-100",
  rubi: "text-rose-100",
  diamante: "text-cyan-900",
}

const tierBorderColors: Record<ProfileTier, string> = {
  bronze: "border-amber-500",
  prata: "border-gray-400",
  ouro: "border-yellow-400",
  esmeralda: "border-emerald-400",
  safira: "border-blue-400",
  rubi: "border-rose-400",
  diamante: "border-cyan-300 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]",
}

// Barra de Progresso do Perfil
export function ProfileProgressBar({ 
  progress = 0, 
  showLevelUp = false,
  onLevelUp 
}: { 
  progress: number
  showLevelUp?: boolean
  onLevelUp?: (newTier: string) => void
}) {
  // Garantir que progress é um número válido
  const safeProgress = typeof progress === "number" && !isNaN(progress) ? progress : 0
  const tier = getProfileTier(safeProgress)
  const nextTier = PROFILE_TIERS.find(t => t.minPercent > safeProgress)
  
  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg",
            tierStyles[tier.tier],
            tierTextColors[tier.tier]
          )}>
            {tier.label[0]}
          </div>
          <span className="font-bold text-white">{tier.label}</span>
        </div>
        <span className="text-sm text-white">{safeProgress.toFixed(1)}%</span>
      </div>
      
      <div className="relative h-3 bg-[#E5E0D8] rounded-full overflow-hidden">
        {/* Marcadores de níveis */}
        {PROFILE_TIERS.slice(1).map((t, i) => (
          <div
            key={t.tier}
            className="absolute top-0 bottom-0 w-0.5 bg-black/30"
            style={{ left: `${t.minPercent}%` }}
          />
        ))}
        
        {/* Barra de progresso */}
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-100",
            tierStyles[tier.tier]
          )}
          style={{ width: `${Math.min(safeProgress, 100)}%` }}
        />
      </div>
      
      {nextTier && (
        <p className="text-xs text-white">
          Faltam {(nextTier.minPercent - safeProgress).toFixed(1)}% para {nextTier.label}
        </p>
      )}
    </div>
  )
}

// Badge de Conquista Individual
export function AchievementBadge({
  achievement,
  progress,
  size = "md",
  showDetails = false,
  onClick,
}: {
  achievement: typeof PERMANENT_ACHIEVEMENTS[0]
  progress?: AchievementProgress
  size?: "sm" | "md" | "lg"
  showDetails?: boolean
  onClick?: () => void
}) {
  const Icon = iconMap[achievement.icon] || Trophy
  const level = progress?.currentLevel || 0
  const isComplete = progress?.isComplete || false
  const isLocked = level === 0
  
  // Determinar tier baseado no nível
  const badgeTier: ProfileTier = isComplete ? "ouro" : level === 2 ? "prata" : level === 1 ? "bronze" : "bronze"
  
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20",
  }
  
  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-7 h-7",
    lg: "w-9 h-9",
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            onTouchStart={(e) => {
              // Prevenir comportamento padrao para permitir tooltip no mobile
              e.currentTarget.focus()
            }}
            className={cn(
              "relative rounded-full flex items-center justify-center transition-all duration-300",
              sizeClasses[size],
              isLocked 
                ? "bg-gray-200 border-2 border-gray-300 cursor-default"
                : cn(tierStyles[badgeTier], "border-2", tierBorderColors[badgeTier], "hover:scale-110 shadow-lg"),
              !isLocked && "cursor-pointer",
              // Animacao pulse para conquistas desbloqueadas
              !isLocked && "animate-pulse hover:animate-none"
            )}
            style={{
              // Pulse mais sutil usando hex (sem oklch/lab)
              animationDuration: !isLocked ? "2s" : undefined,
            }}
          >
            {isLocked ? (
              <Lock className={cn(iconSizes[size], "text-orange-500")} />
            ) : (
              <Icon className={cn(iconSizes[size], tierTextColors[badgeTier])} />
            )}
            
            {/* Level indicator */}
            {typeof level === "number" && level > 0 && !isComplete && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#1a1a1a] text-white text-xs flex items-center justify-center font-bold">
                {level || 0}
              </div>
            )}
            
            {/* Complete indicator */}
            {isComplete && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#10B981] text-white text-xs flex items-center justify-center">
                <Check className="w-3 h-3" />
              </div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-[200px] z-50" sideOffset={5}>
          <div className="space-y-1">
            <p className="font-bold">{achievement.name}</p>
            <p className="text-xs text-muted-foreground">{achievement.description}</p>
            {progress && !isComplete && typeof progress.currentValue === "number" && typeof progress.nextTarget === "number" && (
              <p className="text-xs" style={{ color: "#D97706" }}>
                {progress.currentValue || 0}/{progress.nextTarget || 0} - Faltam {(progress.nextTarget || 0) - (progress.currentValue || 0)}
              </p>
            )}
            {isComplete && (
              <p className="text-xs font-semibold" style={{ color: "#10B981" }}>Concluido!</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Badge de Conquista Temporária
export function TemporaryBadge({
  achievement,
  status,
  size = "md",
}: {
  achievement: typeof TEMPORARY_ACHIEVEMENTS[0]
  status?: TemporaryAchievementStatus
  size?: "sm" | "md" | "lg"
}) {
  const Icon = iconMap[achievement.icon] || Star
  const isActive = status?.isActive || false
  
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  }
  
  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onTouchStart={(e) => {
              // Suporte a touch no mobile - foca para mostrar tooltip
              e.currentTarget.focus()
            }}
            className={cn(
              "relative rounded-lg flex items-center justify-center transition-all duration-300 border-2 cursor-pointer",
              sizeClasses[size],
              isActive 
                ? "border-[#9333EA] shadow-lg animate-pulse"
                : "bg-[#F3F4F6] border-[#E5E7EB]"
            )}
            style={{
              // Cores hex para gradiente (sem oklch/lab)
              background: isActive 
                ? "linear-gradient(to bottom right, #9333EA, #EC4899)" 
                : undefined,
              boxShadow: isActive ? "0 10px 15px -3px rgba(147, 51, 234, 0.3)" : undefined,
              animationDuration: isActive ? "1.5s" : undefined,
            }}
          >
            <Icon className={cn(
              iconSizes[size],
              isActive ? "text-white" : "text-[#9CA3AF]"
            )} />
            
            {/* Streak indicator - fogo para sequencias ativas */}
            {isActive && achievement.category === "streak" && (
              <Flame className="absolute -top-1 -right-1 w-4 h-4" style={{ color: "#F97316" }} />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent className="z-50" sideOffset={5}>
          <div className="space-y-1">
            <p className="font-bold">{achievement.name}</p>
            <p className="text-xs text-muted-foreground">{achievement.description}</p>
            {isActive ? (
              <p className="text-xs font-semibold" style={{ color: "#9333EA" }}>Ativo!</p>
            ) : (
              <p className="text-xs" style={{ color: "#6B7280" }}>Inativo</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Galeria de Troféus (Conquistas Permanentes)
export function TrophyGallery({
  achievements,
  progress,
  title = "Conquistas Permanentes",
}: {
  achievements: typeof PERMANENT_ACHIEVEMENTS
  progress: AchievementProgress[]
  title?: string
}) {
  const [selectedAchievement, setSelectedAchievement] = useState<typeof PERMANENT_ACHIEVEMENTS[0] | null>(null)
  const selectedProgress = progress.find(p => p.achievementId === selectedAchievement?.id)

  const categorized = useMemo(() => {
    const categories: Record<string, typeof PERMANENT_ACHIEVEMENTS> = {}
    achievements.forEach(a => {
      if (!categories[a.category]) categories[a.category] = []
      categories[a.category].push(a)
    })
    return categories
  }, [achievements])

  const categoryLabels: Record<string, string> = {
    gols: "Gols",
    assistencias: "Assistências",
    vitorias: "Vitórias",
    participacao: "Participação",
    defesa: "Defesa",
    especial: "Especial",
  }

  return (
    <>
      <Card className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Trophy className="w-5 h-5 text-orange-500" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(categorized).map(([category, categoryAchievements]) => (
            <div key={category} className="space-y-3">
              <h4 className="text-sm font-semibold text-white uppercase tracking-wide">
                {categoryLabels[category] || category}
              </h4>
              <div className="flex flex-wrap gap-3">
                {categoryAchievements.map(achievement => (
                  <AchievementBadge
                    key={achievement.id}
                    achievement={achievement}
                    progress={progress.find(p => p.achievementId === achievement.id)}
                    onClick={() => setSelectedAchievement(achievement)}
                  />
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Modal de detalhes */}
<Dialog open={!!selectedAchievement} onOpenChange={() => setSelectedAchievement(null)}>
  <DialogContent className="sm:max-w-md bg-black/90 backdrop-blur-md border border-white/10 text-white rounded-2xl shadow-2xl">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2 text-xl text-white">
        {selectedAchievement && (() => {
          const Icon = iconMap[selectedAchievement.icon] || Trophy
          return <Icon className="w-6 h-6 text-orange-500" />
        })()}
        <span>{selectedAchievement?.name}</span>
      </DialogTitle>
    </DialogHeader>

    {selectedAchievement && (
      <div className="space-y-4">
        <p className="text-white/80 text-sm">{selectedAchievement.description}</p>

        {/* Níveis */}
        <div className="space-y-2">
          {(['lvl1', 'lvl2', 'lvl3'] as const).map((lvl, idx) => {
            const levelNum = idx + 1
            const levelData = selectedAchievement.levels[lvl]
            const isReached = selectedProgress && selectedProgress.currentLevel >= levelNum
            const isCurrent = selectedProgress && selectedProgress.currentLevel === idx

            return (
              <div
                key={lvl}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all",
                  isReached
                    ? "bg-emerald-500/10 border-emerald-500/40 text-white"
                    : isCurrent
                    ? "bg-[#C5A059]/10 border-orange-500 text-white"
                    : "bg-white/5 border-white/10 text-white/50"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    isReached 
                      ? "bg-emerald-500 text-white" 
                      : isCurrent
                      ? "bg-orange-500 text-white"
                      : "bg-white/10 text-white/40"
                  )}
                >
                  {levelNum}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white text-sm">Nível {levelNum}</p>
                  <p className="text-xs text-white">{levelData.description}</p>
                </div>
                {isReached && <Check className="w-5 h-5 text-emerald-400" />}
              </div>
            )
          })}
        </div>

        {/* Progresso atual */}
        {selectedProgress && !selectedProgress.isComplete && (
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white">Progresso atual</span>
              <span className="font-bold text-green-500">
                {selectedProgress.currentValue} / {selectedProgress.nextTarget}
              </span>
            </div>
            
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${Math.min((selectedProgress.currentValue / selectedProgress.nextTarget) * 100, 100)}%` }}
              />
            </div>
            
            <p className="text-xs text-white">
              Faltam <span className="text-green-500 font-medium">{selectedProgress.nextTarget - selectedProgress.currentValue}</span> para o próximo nível
            </p>
          </div>
        )}
      </div>
    )}
  </DialogContent>
</Dialog>
    </>
  )
}

// Galeria de Conquistas Temporárias
export function TemporaryGallery({
  achievements,
  status,
}: {
  achievements: typeof TEMPORARY_ACHIEVEMENTS
  status: TemporaryAchievementStatus[]
}) {
  const categorized = useMemo(() => {
    const categories: Record<string, typeof TEMPORARY_ACHIEVEMENTS> = {}
    achievements.forEach(a => {
      if (!categories[a.category]) categories[a.category] = []
      categories[a.category].push(a)
    })
    return categories
  }, [achievements])

  const categoryLabels: Record<string, string> = {
    mensal: "Mensais",
    semanal: "Semanais",
    streak: "Sequências",
  }

  const activeCount = status.filter(s => s.isActive).length

  return (
    <Card className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Conquistas Temporárias
          </div>
          <span className="text-sm font-normal text-white">
            {activeCount} ativas
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(categorized).map(([category, categoryAchievements]) => (
          <div key={category} className="space-y-2">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wide">
              {categoryLabels[category] || category}
            </h4>
            <div className="flex flex-wrap gap-2">
              {categoryAchievements.map(achievement => (
                <TemporaryBadge
                  key={achievement.id}
                  achievement={achievement}
                  status={status.find(s => s.achievementId === achievement.id)}
                  size="sm"
                />
              ))}
            </div>
          </div>
        ))}
        
        <p className="text-xs text-white italic">
          * Conquistas temporárias são resetadas mensalmente
        </p>
      </CardContent>
    </Card>
  )
}

// Vitrine do Jogador (até 3 conquistas escolhidas)
export function ShowcaseBadges({
  selectedIds,
  achievements,
  progress,
  editable = false,
  onEdit,
}: {
  selectedIds: string[]
  achievements: typeof PERMANENT_ACHIEVEMENTS
  progress: AchievementProgress[]
  editable?: boolean
  onEdit?: (newIds: string[]) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempSelection, setTempSelection] = useState<string[]>(selectedIds)

  const completedAchievements = achievements.filter(a => 
    progress.find(p => p.achievementId === a.id)?.isComplete
  )

  const handleToggle = (id: string) => {
    if (tempSelection.includes(id)) {
      setTempSelection(tempSelection.filter(i => i !== id))
    } else if (tempSelection.length < 3) {
      setTempSelection([...tempSelection, id])
    }
  }

  const handleSave = () => {
    onEdit?.(tempSelection)
    setIsEditing(false)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white">Vitrine</h4>
        {editable && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setTempSelection(selectedIds)
              setIsEditing(true)
            }}
            className="text-xs text-white"
          >
            Editar
          </Button>
        )}
      </div>
      
      <div className="flex gap-3">
        {selectedIds.length > 0 ? (
          selectedIds.map(id => {
            const achievement = achievements.find(a => a.id === id)
            if (!achievement) return null
            return (
              <AchievementBadge
                key={id}
                achievement={achievement}
                progress={progress.find(p => p.achievementId === id)}
                size="lg"
              />
            )
          })
        ) : (
          <p className="text-sm text-white italic">Nenhuma conquista selecionada</p>
        )}
      </div>

      {/* Modal de edição */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Vitrine</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-[#967948]">
              Selecione até 3 conquistas concluídas para exibir no seu perfil.
            </p>
            
            {completedAchievements.length === 0 ? (
              <p className="text-center py-8 text-[#967948]">
                Você ainda não completou nenhuma conquista.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {completedAchievements.map(achievement => {
                  const isSelected = tempSelection.includes(achievement.id)
                  return (
                    <button
                      key={achievement.id}
                      onClick={() => handleToggle(achievement.id)}
                      className={cn(
                        "p-2 rounded-lg border-2 transition-all",
                        isSelected 
                          ? "border-[#C5A059] bg-[#C5A059]/10" 
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <AchievementBadge
                        achievement={achievement}
                        progress={progress.find(p => p.achievementId === achievement.id)}
                        size="md"
                      />
                      <p className="text-xs mt-1 text-center truncate">{achievement.name}</p>
                    </button>
                  )
                })}
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#967948]">
                {tempSelection.length}/3 selecionadas
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSave}
                  className="bg-[#C5A059] hover:bg-[#967948]"
                >
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
