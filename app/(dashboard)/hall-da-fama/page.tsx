"use client"

/**
 * Hall da Fama - Amaralina FC
 * Version: 5.4 - Efeito de Partículas Douradas Framer Motion Integrado
 */

import { useState, useMemo, useEffect } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { useData } from "@/contexts/data-context"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Trophy, 
  Target, 
  HandHelping,
  Shield,
  Sparkles,
  Award,
  Calendar,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"

// Interface para awards salvos
interface SeasonAward {
  id: number
  year: number
  award_type: string
  jogador_id: number
  value: number
  achieved_at: string
  jogadores?: {
    id: number
    name: string
    nickname: string
    photo_url: string | null
    position: string
  }
}

// Tipos de prêmios automáticos
const seasonAwardTypes = [
  { 
    id: "bola_de_ouro", 
    name: "Bola de Ouro", 
    description: "Jogador com maior nota de desempenho",
    icon: Trophy,
    color: "from-[#FFD700] to-[#FFA500]",
    textColor: "text-[#FFD700]",
    bgColor: "bg-[#FFD700]/20",
    calc: (player: any) => {
      if (!player.matches || player.matches === 0) return 0
      const aproveitamento = (player.wins / player.matches) * 100
      const impacto = ((player.goals * 2) + player.assists) / player.matches
      let nota = (aproveitamento * 0.05) + (impacto * 2.5)
      if (player.matches < 3) nota *= 0.8
      return Math.min(10, Math.max(0, nota))
    },
    formatValue: (val: number) => `Nota ${val.toFixed(1)}`,
  },
  { 
    id: "chuteira_de_ouro", 
    name: "Chuteira de Ouro", 
    description: "Artilheiro da temporada",
    icon: Target,
    color: "from-[#FFD700] to-[#C5A059]",
    textColor: "text-[#FFD700]",
    bgColor: "bg-[#FFD700]/20",
    calc: (player: any) => player.goals || 0,
    formatValue: (val: number) => `${val} gols`,
  },
  { 
    id: "rei_das_assists", 
    name: "Rei das Assistências", 
    description: "Líder de assistências",
    icon: HandHelping,
    color: "from-[#00CED1] to-[#0088CC]",
    textColor: "text-[#00CED1]",
    bgColor: "bg-[#00CED1]/20",
    calc: (player: any) => player.assists || 0,
    formatValue: (val: number) => `${val} assists`,
  },
  { 
    id: "luva_de_ouro", 
    name: "Luva de Ouro", 
    description: "Melhor goleiro da temporada",
    icon: Shield,
    color: "from-[#9370DB] to-[#8A2BE2]",
    textColor: "text-[#9370DB]",
    bgColor: "bg-[#9370DB]/20",
    calc: (player: any) => {
      if (!player.goalkeeperMatches || player.goalkeeperMatches === 0) return 0
      const cleanSheetRate = player.cleanSheets / player.goalkeeperMatches
      const aproveitamento = player.wins / player.goalkeeperMatches
      let nota = (cleanSheetRate * 7) + (aproveitamento * 30)
      if (player.goalkeeperMatches < 3) nota *= 0.8
      return Math.min(10, Math.max(0, nota))
    },
    formatValue: (val: number) => `Nota ${val.toFixed(1)}`,
  },
  { 
    id: "revelacao", 
    name: "Revelação", 
    description: "Melhor entre novatos (primeira temporada)",
    icon: Sparkles,
    color: "from-[#FF6B6B] to-[#FF4757]",
    textColor: "text-[#FF6B6B]",
    bgColor: "bg-[#FF6B6B]/20",
    calc: (player: any) => {
      if (!player.matches || player.matches === 0) return 0
      const impacto = ((player.goals * 2) + player.assists) / player.matches
      return impacto
    },
    formatValue: (val: number) => `${val.toFixed(1)} pts/jogo`,
    filter: (player: any) => (player.matches || 0) < 10
  },
  { 
    id: "fair_play", 
    name: "Fair Play", 
    description: "Maior taxa de vitórias (min. 5 jogos)",
    icon: Award,
    color: "from-[#4CAF50] to-[#2E7D32]",
    textColor: "text-[#4CAF50]",
    bgColor: "bg-[#4CAF50]/20",
    calc: (player: any) => {
      if (!player.matches || player.matches < 5) return 0
      return (player.wins / player.matches) * 100
    },
    formatValue: (val: number) => `${val.toFixed(0)}% vitórias`,
  },
]

// Componente de Partículas Douradas (Estilo Pódio)
function GoldenParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 2,
      size: 4 + Math.random() * 8,
      xOffset: (Math.random() - 0.5) * 100,
    }))
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top: "-20px",
            width: p.size,
            height: p.size,
            background: "linear-gradient(135deg, #FFD700, #C5A059, #FFD700)",
            boxShadow: "0 0 6px #FFD700",
          }}
          animate={{
            y: ["0vh", "100vh"],
            x: [0, p.xOffset],
            rotate: [0, 360],
            opacity: [1, 0.8, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  )
}

// Componente de Card de Troféu
function TrophyCard({ 
  award, 
  player, 
  year,
  value,
  isCurrentSeason
}: { 
  award: any
  player?: { id: number; name: string; nickname: string; photo_url: string | null; position: string } | null
  year: number
  value?: number
  isCurrentSeason: boolean
}) {
  const Icon = award.icon
  const awardId = String(award?.id || "").toLowerCase().trim()

  return (
    <Card className={cn(
      "relative overflow-hidden border-2 transition-all duration-300 hover:scale-[1.02]",
      player ? "border-[#D4B300]/50 bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a]" : "border-white/20 bg-[#1a1a1a]/50"
    )}>
      {/* Efeito de partículas em estilo Pódio */}
      <GoldenParticles />

      {/* Glow de fundo */}
      {player && (
        <div className={cn(
          "absolute inset-0 opacity-20 blur-xl pointer-events-none z-0",
          `bg-gradient-to-br ${award.color}`
        )} />
      )}
      
      <CardContent className="relative z-10 p-6">
        {/* Imagem do Troféu */}
        <div className="flex justify-center mb-1">
          <div className="w-50 h-50 rounded-full flex items-center justify-center overflow-hidden relative">
            {awardId.includes("bola") ? (
              <Image 
                src="https://i.postimg.cc/5yBGKWgp/bola-de-ouro.png"
                alt="Bola de Ouro" 
                width={96} 
                height={96} 
                className="w-full h-full object-contain absolute inset-0"
                priority
                unoptimized
              />
            ) : awardId.includes("chuteira") ? (
              <Image 
                src="https://i.postimg.cc/hvLwZRsy/chuteira-de-ouro.png" 
                alt="Chuteira de Ouro" 
                width={96} 
                height={96} 
                className="w-full h-full object-contain absolute inset-0"
                priority
                unoptimized
              />
            ) : awardId.includes("assist") ? (
              <Image 
                src="https://i.postimg.cc/zv4B7Wd6/rei-das-assistencias.png" 
                alt="Rei das Assistências" 
                width={96} 
                height={96} 
                className="w-full h-full object-contain absolute inset-0"
                priority
                unoptimized
              />
            ) : awardId.includes("luva") ? (
              <Image 
                src="https://i.postimg.cc/BbR6pDhy/luva-de-ouro.png" 
                alt="Luva de Ouro" 
                width={96} 
                height={96} 
                className="w-full h-full object-contain absolute inset-0"
                priority
                unoptimized
              />
            ) : awardId.includes("revelacao") ? (
              <Image 
                src="https://i.postimg.cc/6Qy4w9Db/revelacao-do-ano.png" 
                alt="Revelação" 
                width={96} 
                height={96} 
                className="w-full h-full object-contain absolute inset-0"
                priority
                unoptimized
              />
            ) : awardId.includes("fair") ? (
              <Image 
                src="https://i.postimg.cc/wMM2LKP3/o-incansavel.png"
                alt="O Invencível" 
                width={96} 
                height={96} 
                className="w-full h-full object-contain absolute inset-0"
                priority
                unoptimized
              />
            ) : (
              <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br shadow-lg shadow-black/30",
                award.color
              )}>
                <Icon className="w-10 h-10 text-white drop-shadow-lg" />
              </div>
            )}
          </div>
        </div>

        {/* Título */}
        <h3 className={cn("text-xl font-bold text-center mb-1", award.textColor)}>
          {award.name}
        </h3>
        <p className="text-xs text-white/60 text-center mb-4">{award.description}</p>

        {/* Badge do Ano */}
        <div className="flex justify-center mb-4">
          <Badge className={cn("px-4 py-1 font-bold inline-flex", award.bgColor, award.textColor)}>
            {year}
          </Badge>
        </div>

        {/* Info do Jogador */}
        {player ? (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-current mb-2 shadow-lg"
                 style={{ borderColor: award.textColor.replace('text-', '') }}>
              {player.photo_url ? (
                <Image
                  src={player.photo_url}
                  alt={player.name || 'Jogador'}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div className={cn(
                  "w-full h-full flex items-center justify-center",
                  `bg-gradient-to-br ${award.color}`
                )}>
                  <span className="text-2xl font-bold text-white">
                    {player.nickname?.charAt(0) || player.name?.charAt(0) || '?'}
                  </span>
                </div>
              )}
            </div>
            <p className="font-bold text-white text-center">
              {player.nickname || player.name || 'Jogador'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center mt-2">
            <p className="text-white/40 text-xs text-center">
              {isCurrentSeason ? "Temporada em Andamento" : "Sem dados"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Componente de Melhor Dupla
function BestDuoCard({ year, duo, isCurrentSeason }: { year: number; duo: any; isCurrentSeason: boolean }) {
  if (!duo) {
    return (
      <Card className="border-white/20 bg-[#1a1a1a]/50 relative overflow-hidden">
        <GoldenParticles />
        <CardContent className="p-6 relative z-10">
          <div className="flex justify-center mb-1">
            <div className="w-50 h-50 rounded-full flex items-center justify-center overflow-hidden relative">
              <Image 
                src="https://i.postimg.cc/MGRpZvpm/melhor-dupla-ouro.png" 
                alt="Melhor Dupla" 
                width={96} 
                height={96} 
                className="w-full h-full object-contain absolute inset-0"
                priority
                unoptimized
              />
            </div>
          </div>
          <h3 className="text-xl font-bold text-center mb-1 text-[#FF6B35]">Melhor Dupla</h3>
          <p className="text-xs text-white/60 text-center mb-4">Parceria com mais vitórias juntas</p>
          <div className="flex justify-center mb-4">
            <Badge className="px-4 py-1 font-bold bg-[#FF6B35]/20 text-[#FF6B35]">
              <Calendar className="w-3 h-3 mr-1" />
              {year}
            </Badge>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-white/40 text-sm">{isCurrentSeason ? "Aguardando jogos" : "Sem dados"}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-[#FF6B35]/50 bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] relative overflow-hidden">
      <GoldenParticles />
      <div className="absolute inset-0 opacity-20 blur-xl bg-gradient-to-br from-[#FF6B35] to-[#F7931E] pointer-events-none z-0" />
      
      <CardContent className="relative z-10 p-6">
        <div className="flex justify-center mb-1">
          <div className="w-50 h-50 rounded-full flex items-center justify-center overflow-hidden relative">
            <Image 
              src="https://i.postimg.cc/MGRpZvpm/melhor-dupla-ouro.png" 
              alt="Melhor Dupla" 
              width={96} 
              height={96} 
              className="w-full h-full object-contain absolute inset-0"
              priority
              unoptimized
            />
          </div>
        </div>
        <h3 className="text-xl font-bold text-center mb-1 text-[#FF6B35]">Melhor Dupla</h3>
        <p className="text-xs text-white/60 text-center mb-4">Parceria com mais vitórias juntas</p>
        <div className="flex justify-center mb-4">
          <Badge className="px-4 py-1 font-bold bg-[#FF6B35]/20 text-[#FF6B35]">
            <Calendar className="w-3 h-3 mr-1" />
            {year}
          </Badge>
        </div>
        {isCurrentSeason && (
          <div className="flex justify-center mb-2">
            <Badge variant="outline" className="border-[#FFA500] text-[#FFA500] text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Líder Atual
            </Badge>
          </div>
        )}
        <div className="flex flex-col items-center">
          <div className="flex -space-x-4 mb-3">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#FF6B35]">
              {duo.player1Photo ? (
                <Image src={duo.player1Photo} alt={duo.player1Name} width={56} height={56} className="w-full h-full object-cover" unoptimized />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#FF6B35] to-[#F7931E] flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{duo.player1Name?.charAt(0) || '?'}</span>
                </div>
              )}
            </div>
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#FF6B35]">
              {duo.player2Photo ? (
                <Image src={duo.player2Photo} alt={duo.player2Name} width={56} height={56} className="w-full h-full object-cover" unoptimized />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#F7931E] to-[#FF6B35] flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{duo.player2Name?.charAt(0) || '?'}</span>
                </div>
              )}
            </div>
          </div>
          <p className="font-bold text-white text-center">{duo.player1Name} & {duo.player2Name}</p>
          <Badge className="mt-2 bg-white/10 text-white">
            {duo.wins} vitórias juntos
          </Badge>
          {isCurrentSeason && (
            <p className="text-[10px] text-white/40 mt-2 text-center">
              Será oficializado em 31/12/{year}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function HallDaFamaPage() {
  const { partidas, jogadores } = useData()
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [savedAwards, setSavedAwards] = useState<SeasonAward[]>([])

  // Anos disponíveis baseados nos dados
  const availableYears = useMemo(() => {
    if (!partidas || partidas.length === 0) return [new Date().getFullYear()]
    
    const yearsSet = new Set<number>()
    partidas.forEach(p => {
      if (p?.date) {
        const year = new Date(p.date).getFullYear()
        if (year >= 2020 && year <= new Date().getFullYear()) {
          yearsSet.add(year)
        }
      }
    })
    
    const years = Array.from(yearsSet).sort((a, b) => b - a)
    return years.length > 0 ? years : [new Date().getFullYear()]
  }, [partidas])

  const isCurrentSeason = selectedYear === new Date().getFullYear()

  // Carregar awards salvos
  useEffect(() => {
    const loadSavedAwards = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('season_awards')
        .select(`
          *,
          jogadores:jogador_id (
            id,
            name,
            nickname,
            photo_url,
            position
          )
        `)
        .eq('year', selectedYear)
      
      if (data) setSavedAwards(data as SeasonAward[])
    }

    if (!isCurrentSeason) {
      loadSavedAwards()
    } else {
      setSavedAwards([])
    }
  }, [selectedYear, isCurrentSeason])

  // Estatísticas do ano
  const yearStats = useMemo(() => {
    const partidasDoAno = partidas.filter(p => {
      if (!p?.date) return false
      return new Date(p.date).getFullYear() === selectedYear
    })

    if (partidasDoAno.length === 0) return []

    const statsMap = new Map<number, any>()

    partidasDoAno.forEach(partida => {
      if (!partida.jogadores_partida) return

      partida.jogadores_partida.forEach((jp: any) => {
        const jogador = jogadores.find(j => j.id === jp.jogador_id)
        if (!jogador) return

        if (!statsMap.has(jogador.id)) {
          statsMap.set(jogador.id, {
            ...jogador,
            goals: 0,
            assists: 0,
            matches: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            cleanSheets: 0,
            goalkeeperMatches: 0,
            goalsConceded: 0
          })
        }

        const stats = statsMap.get(jogador.id)!
        stats.goals += jp.goals || 0
        stats.assists += jp.assists || 0
        stats.matches++

        if (partida.result === 'W') stats.wins++
        else if (partida.result === 'D') stats.draws++
        else if (partida.result === 'L') stats.losses++

        if (jp.is_goalkeeper) {
          stats.goalkeeperMatches++
          stats.goalsConceded += jp.goals_conceded || 0
          if ((jp.goals_conceded || 0) === 0) stats.cleanSheets++
        }
      })
    })

    return Array.from(statsMap.values())
  }, [partidas, jogadores, selectedYear])

  // Vencedores
  const awardWinners = useMemo(() => {
    const winners: Record<string, { player: any; value: number } | null> = {}

    if (!isCurrentSeason && savedAwards.length > 0) {
      savedAwards.forEach(award => {
        if (award.jogadores) {
          winners[award.award_type] = {
            player: award.jogadores,
            value: award.value
          }
        }
      })
      return winners
    }

    seasonAwardTypes.forEach(award => {
      let candidates = yearStats.filter(p => p.status === 'active')
      if (award.filter) candidates = candidates.filter(award.filter)

      const sorted = candidates
        .map(p => ({ player: p, value: award.calc(p) }))
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value)

      winners[award.id] = sorted.length > 0 ? sorted[0] : null
    })

    return winners
  }, [yearStats, isCurrentSeason, savedAwards])

  // Melhor dupla
  const bestDuo = useMemo(() => {
    const partidasDoAno = partidas.filter(p => {
      if (!p?.date) return false
      return new Date(p.date).getFullYear() === selectedYear
    })

    if (partidasDoAno.length === 0) return null

    const duoStats: Record<string, { 
      player1Id: number; 
      player2Id: number; 
      player1Name: string; 
      player2Name: string;
      player1Photo: string | null;
      player2Photo: string | null;
      wins: number; 
      total: number 
    }> = {}

    partidasDoAno.forEach(partida => {
      if (!partida.jogadores_partida || partida.jogadores_partida.length < 2) return

      const jogadoresIds = partida.jogadores_partida.map((jp: any) => jp.jogador_id).filter(Boolean)
      
      for (let i = 0; i < jogadoresIds.length; i++) {
        for (let j = i + 1; j < jogadoresIds.length; j++) {
          const id1 = Math.min(jogadoresIds[i], jogadoresIds[j])
          const id2 = Math.max(jogadoresIds[i], jogadoresIds[j])
          const key = `${id1}-${id2}`

          if (!duoStats[key]) {
            const p1 = jogadores.find((j: any) => j.id === id1)
            const p2 = jogadores.find((j: any) => j.id === id2)
            duoStats[key] = {
              player1Id: id1,
              player2Id: id2,
              player1Name: p1?.nickname || p1?.name || 'Jogador 1',
              player2Name: p2?.nickname || p2?.name || 'Jogador 2',
              player1Photo: p1?.photo_url || null,
              player2Photo: p2?.photo_url || null,
              wins: 0,
              total: 0
            }
          }

          duoStats[key].total++
          if (partida.result === 'W') duoStats[key].wins++
        }
      }
    })

    const sortedDuos = Object.values(duoStats)
      .filter(d => d.total >= 2)
      .sort((a, b) => b.wins - a.wins)

    return sortedDuos.length > 0 ? sortedDuos[0] : null
  }, [partidas, jogadores, selectedYear])

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
            <Trophy className="w-10 h-10 text-[#FFD700]" />
            Hall da Fama
          </h1>
          <p className="text-white/60 mt-1">
            {isCurrentSeason ? "Líderes da temporada atual" : `Vencedores oficiais de ${selectedYear}`}
          </p>
        </div>

        {/* Seletor de Ano */}
        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
          <SelectTrigger className="w-[200px] bg-[#1a1a1a] border-[#D4B300]/50 text-white">
            <Calendar className="w-4 h-4 mr-2 text-[#D4B300]" />
            <SelectValue placeholder="Selecionar ano" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-[#333]">
            {availableYears.map(year => (
              <SelectItem key={year} value={year.toString()} className="text-white hover:bg-white/10">
                Temporada {year} {year === new Date().getFullYear() && "(Atual)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Aviso de Temporada em Andamento */}
      {isCurrentSeason && (
        <div className="p-4 rounded-lg bg-gradient-to-r from-[#FFA500]/20 to-transparent border border-[#FFA500]/30">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#FFA500]" />
            <div>
              <p className="text-sm font-bold text-white">Temporada em Andamento</p>
              <p className="text-xs text-white/70">
                Os prêmios serão oficializados automaticamente em 31/12/{selectedYear}. 
                Os dados abaixo mostram os líderes atuais.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid de Prêmios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {seasonAwardTypes.map(award => {
          const winner = awardWinners[award.id]
          return (
            <TrophyCard
              key={award.id}
              award={award}
              player={winner?.player}
              year={selectedYear}
              value={winner?.value}
              isCurrentSeason={isCurrentSeason}
            />
          )
        })}

        {/* Melhor Dupla */}
        <BestDuoCard year={selectedYear} duo={bestDuo} isCurrentSeason={isCurrentSeason} />
      </div>
    </div>
  )
}