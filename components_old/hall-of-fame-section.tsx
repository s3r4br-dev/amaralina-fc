"use client"

/**
 * Hall of Fame Section - Componente para exibir conquistas do Hall da Fama no perfil
 * Exibe estrela dourada brilhante para jogadores que já passaram pelo Hall
 */

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Star, Crown, Trophy, Goal, HandHelping, Shield, Calendar, Medal, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

// Tipos
interface HallRecord {
  id: number
  jogador_id: number
  category: string
  record_value: number
  achieved_at: string
  is_current: boolean
}

interface HallFameAchievement {
  category: string
  title: string
  value: number
  date: string
  isCurrent: boolean
  icon: React.ElementType
  color: string
}

// Mapeamento de categorias
const categoryInfo: Record<string, { title: string; icon: React.ElementType; color: string }> = {
  goals: { title: "Maior Artilheiro", icon: Goal, color: "text-[#FFD700]" },
  assists: { title: "Rei das Assistências", icon: HandHelping, color: "text-[#0088CC]" },
  wins: { title: "Maior Vencedor", icon: Trophy, color: "text-green-500" },
  matches: { title: "Veterano Supremo", icon: Calendar, color: "text-[#C5A059]" },
  clean_sheets: { title: "Muralha Histórica", icon: Shield, color: "text-purple-500" },
  rating: { title: "Maior Overall", icon: Crown, color: "text-amber-500" },
}

// Formatar valor por categoria
const formatValue = (category: string, value: number): string => {
  switch (category) {
    case "goals": return `${value} gols`
    case "assists": return `${value} assists`
    case "wins": return `${value} vitórias`
    case "matches": return `${value} partidas`
    case "clean_sheets": return `${value} clean sheets`
    case "rating": return `${value.toFixed(1)} OVR`
    default: return `${value}`
  }
}

// Componente de Estrela Dourada Brilhante
function GoldenStar({ 
  achievement, 
  size = "md" 
}: { 
  achievement: HallFameAchievement
  size?: "sm" | "md" | "lg"
}) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10"
  }

  const formattedDate = new Date(achievement.date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <button className="relative group focus:outline-none">
            {/* Brilho de fundo */}
            <div className={cn(
              "absolute inset-0 rounded-full bg-gradient-to-br from-[#FFD700] to-[#C5A059] blur-md opacity-60 group-hover:opacity-100 transition-opacity",
              achievement.isCurrent && "animate-pulse"
            )} />
            
            {/* Estrela principal */}
            <div className={cn(
              "relative rounded-full bg-gradient-to-br from-[#FFD700] via-[#FFC107] to-[#C5A059] flex items-center justify-center shadow-lg shadow-[#FFD700]/40 group-hover:scale-110 transition-transform",
              sizeClasses[size]
            )}>
              <Star className={cn(
                "text-[#1a1a1a] fill-[#1a1a1a]",
                size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5"
              )} />
            </div>
            
            {/* Badge de atual */}
            {achievement.isCurrent && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-[#1a1a1a]" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="bg-[#1a1a1a] border-[#FFD700]/30 p-3 max-w-[250px]"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-[#FFD700]" />
              <span className="font-bold text-[#FFD700]">Hall da Fama</span>
            </div>
            <p className="text-white font-semibold">{achievement.title}</p>
            <p className="text-sm text-[#967948]">{formatValue(achievement.category, achievement.value)}</p>
            <p className="text-xs text-[#967948]">{formattedDate}</p>
            {achievement.isCurrent && (
              <span className="inline-block px-2 py-0.5 text-xs font-bold bg-green-500/20 text-green-400 rounded">
                Recordista Atual
              </span>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Componente Principal - Seção Hall da Fama do Perfil
export function HallOfFameSection({ 
  jogadorId,
  maxItems = 5,
  showTitle = true,
  size = "md"
}: { 
  jogadorId: number
  maxItems?: number
  showTitle?: boolean
  size?: "sm" | "md" | "lg"
}) {
  const [achievements, setAchievements] = useState<HallFameAchievement[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchHallAchievements = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('hall_records')
          .select('*')
          .eq('jogador_id', jogadorId)
          .order('achieved_at', { ascending: false })

        if (error) {
          console.error('Erro ao buscar hall_records:', error)
          return
        }

        const hallAchievements: HallFameAchievement[] = (data || []).map(record => {
          const info = categoryInfo[record.category] || { 
            title: record.category, 
            icon: Star, 
            color: "text-[#FFD700]" 
          }
          
          return {
            category: record.category,
            title: info.title,
            value: record.record_value,
            date: record.achieved_at,
            isCurrent: record.is_current,
            icon: info.icon,
            color: info.color
          }
        })

        setAchievements(hallAchievements.slice(0, maxItems))
      } catch (err) {
        console.error('Erro ao buscar hall achievements:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (jogadorId) {
      fetchHallAchievements()
    }
  }, [jogadorId, maxItems])

  // Não renderizar se não houver conquistas
  if (isLoading || achievements.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {showTitle && (
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#FFD700]" />
          <h4 className="text-sm font-semibold text-[#FFD700]">Hall da Fama</h4>
          <span className="text-xs text-[#967948]">({achievements.length})</span>
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        {achievements.map((achievement, index) => (
          <GoldenStar 
            key={`${achievement.category}-${index}`} 
            achievement={achievement}
            size={size}
          />
        ))}
      </div>
    </div>
  )
}

// Componente de Ícone Simples para uso inline
export function HallOfFameIcon({ 
  jogadorId,
  size = "sm"
}: { 
  jogadorId: number
  size?: "sm" | "md" | "lg"
}) {
  const [hasHallAchievement, setHasHallAchievement] = useState(false)
  const [achievement, setAchievement] = useState<HallFameAchievement | null>(null)

  useEffect(() => {
    const checkHallAchievement = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('hall_records')
          .select('*')
          .eq('jogador_id', jogadorId)
          .limit(1)
          .single()

        if (!error && data) {
          setHasHallAchievement(true)
          const info = categoryInfo[data.category] || { 
            title: data.category, 
            icon: Star, 
            color: "text-[#FFD700]" 
          }
          setAchievement({
            category: data.category,
            title: info.title,
            value: data.record_value,
            date: data.achieved_at,
            isCurrent: data.is_current,
            icon: info.icon,
            color: info.color
          })
        }
      } catch (err) {
        // Silenciar erro se não encontrar
      }
    }

    if (jogadorId) {
      checkHallAchievement()
    }
  }, [jogadorId])

  if (!hasHallAchievement || !achievement) {
    return null
  }

  return <GoldenStar achievement={achievement} size={size} />
}

// Hook para verificar se jogador está no Hall da Fama
export function useHallOfFame(jogadorId: number) {
  const [achievements, setAchievements] = useState<HallFameAchievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInHall, setIsInHall] = useState(false)

  useEffect(() => {
    const fetchHallAchievements = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('hall_records')
          .select('*')
          .eq('jogador_id', jogadorId)
          .order('achieved_at', { ascending: false })

        if (error) {
          console.error('Erro ao buscar hall_records:', error)
          return
        }

        const hallAchievements: HallFameAchievement[] = (data || []).map(record => {
          const info = categoryInfo[record.category] || { 
            title: record.category, 
            icon: Star, 
            color: "text-[#FFD700]" 
          }
          
          return {
            category: record.category,
            title: info.title,
            value: record.record_value,
            date: record.achieved_at,
            isCurrent: record.is_current,
            icon: info.icon,
            color: info.color
          }
        })

        setAchievements(hallAchievements)
        setIsInHall(hallAchievements.length > 0)
      } catch (err) {
        console.error('Erro ao buscar hall achievements:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (jogadorId) {
      fetchHallAchievements()
    }
  }, [jogadorId])

  return { achievements, isLoading, isInHall }
}
