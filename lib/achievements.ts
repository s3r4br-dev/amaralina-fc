/**
 * Sistema de Gamificação - Amaralina FC
 * 20 Conquistas Permanentes (3 níveis cada) + 20 Conquistas Temporárias
 */

import type { JogadorStats, Partida, PartidaJogador } from "@/contexts/data-context"

// Níveis do Perfil (Status Global)
export type ProfileTier = "bronze" | "prata" | "ouro" | "esmeralda" | "safira" | "rubi" | "diamante"

// Ordem oficial: Bronze, Prata, Ouro, Esmeralda, Rubi, Safira, Diamante
export const PROFILE_TIERS: { tier: ProfileTier; minPercent: number; label: string; color: string }[] = [
  { tier: "bronze", minPercent: 0, label: "Bronze", color: "#CD7F32" },
  { tier: "prata", minPercent: 14, label: "Prata", color: "#C0C0C0" },
  { tier: "ouro", minPercent: 28, label: "Ouro", color: "#FFD700" },
  { tier: "esmeralda", minPercent: 42, label: "Esmeralda", color: "#50C878" },
  { tier: "rubi", minPercent: 57, label: "Rubi", color: "#E0115F" },
  { tier: "safira", minPercent: 71, label: "Safira", color: "#0F52BA" },
  { tier: "diamante", minPercent: 85, label: "Diamante", color: "#B9F2FF" },
]

export function getProfileTier(progressPercent: number): typeof PROFILE_TIERS[0] {
  const sorted = [...PROFILE_TIERS].reverse()
  return sorted.find(t => progressPercent >= t.minPercent) || PROFILE_TIERS[0]
}

// Conquistas Permanentes - 20 conquistas com 3 níveis cada
export interface PermanentAchievement {
  id: string
  name: string
  description: string
  icon: string // Lucide icon name
  category: "gols" | "assistencias" | "vitorias" | "participacao" | "defesa" | "especial"
  levels: {
    lvl1: { target: number; description: string }
    lvl2: { target: number; description: string }
    lvl3: { target: number; description: string }
  }
}

export const PERMANENT_ACHIEVEMENTS: PermanentAchievement[] = [
  // Gols
  {
    id: "lenda_gol",
    name: "Lenda do Gol",
    description: "Marque gols ao longo da sua carreira",
    icon: "Goal",
    category: "gols",
    levels: {
      lvl1: { target: 10, description: "10 gols" },
      lvl2: { target: 50, description: "50 gols" },
      lvl3: { target: 100, description: "100 gols" },
    },
  },
  {
    id: "hat_trick_king",
    name: "Hat-Trick King",
    description: "Marque 3+ gols em uma partida",
    icon: "Crown",
    category: "gols",
    levels: {
      lvl1: { target: 1, description: "1 hat-trick" },
      lvl2: { target: 3, description: "3 hat-tricks" },
      lvl3: { target: 10, description: "10 hat-tricks" },
    },
  },
  {
    id: "goleador_elite",
    name: "Goleador Elite",
    description: "Mantenha uma média de gols por partida alta",
    icon: "TrendingUp",
    category: "gols",
    levels: {
      lvl1: { target: 1.2, description: "Média > 1.2 gols/jogo" },
      lvl2: { target: 1.6, description: "Média > 1.6 gols/jogo" },
      lvl3: { target: 2.0, description: "Média > 2.0 gols/jogo" },
    },
  },
  {
    id: "decisivo",
    name: "Decisivo",
    description: "Marque gols que definem vitórias",
    icon: "Zap",
    category: "gols",
    levels: {
      lvl1: { target: 1, description: "1 gol decisivo" },
      lvl2: { target: 3, description: "3 gols decisivos" },
      lvl3: { target: 10, description: "10 gols decisivos" },
    },
  },
  {
    id: "carrasco",
    name: "Carrasco",
    description: "Marque contra diferentes adversários",
    icon: "Skull",
    category: "gols",
    levels: {
      lvl1: { target: 2, description: "Gol contra 2 times" },
      lvl2: { target: 5, description: "Gol contra 5 times" },
      lvl3: { target: 10, description: "Gol contra todos os times" },
    },
  },
  // Assistências
  {
    id: "mestre_passe",
    name: "Mestre do Passe",
    description: "Distribua assistências ao longo da carreira",
    icon: "HandHelping",
    category: "assistencias",
    levels: {
      lvl1: { target: 5, description: "5 assistências" },
      lvl2: { target: 25, description: "25 assistências" },
      lvl3: { target: 50, description: "50 assistências" },
    },
  },
  {
    id: "pai_assist",
    name: "Pai das Assistências",
    description: "Dê 3+ assistências em uma partida",
    icon: "Users",
    category: "assistencias",
    levels: {
      lvl1: { target: 1, description: "1 vez (3 assist/jogo)" },
      lvl2: { target: 3, description: "3 vezes" },
      lvl3: { target: 10, description: "10 vezes" },
    },
  },
  {
    id: "assist_elite",
    name: "Assistente de Elite",
    description: "Alta média de assistências em sequências",
    icon: "Star",
    category: "assistencias",
    levels: {
      lvl1: { target: 1, description: "3 assist em 5 jogos (1x)" },
      lvl2: { target: 3, description: "3 vezes" },
      lvl3: { target: 5, description: "5 vezes" },
    },
  },
  // Vitórias
  {
    id: "vencedor_serial",
    name: "Vencedor Serial",
    description: "Acumule vitórias na sua carreira",
    icon: "Trophy",
    category: "vitorias",
    levels: {
      lvl1: { target: 5, description: "5 vitórias" },
      lvl2: { target: 20, description: "20 vitórias" },
      lvl3: { target: 50, description: "50 vitórias" },
    },
  },
  {
    id: "matador_classico",
    name: "Matador de Clássico",
    description: "Vença partidas apertadas (por 1 gol)",
    icon: "Swords",
    category: "vitorias",
    levels: {
      lvl1: { target: 1, description: "1 vitória apertada" },
      lvl2: { target: 5, description: "5 vitórias apertadas" },
      lvl3: { target: 15, description: "15 vitórias apertadas" },
    },
  },
  {
    id: "dupla_dinamica",
    name: "Dupla Dinâmica",
    description: "Vença partidas com o mesmo parceiro",
    icon: "Users2",
    category: "vitorias",
    levels: {
      lvl1: { target: 3, description: "3 vit. com parceiro" },
      lvl2: { target: 7, description: "7 vitórias" },
      lvl3: { target: 15, description: "15 vitórias" },
    },
  },
  {
    id: "rei_podio",
    name: "Rei do Pódio",
    description: "Termine em 1º lugar no ranking",
    icon: "Medal",
    category: "vitorias",
    levels: {
      lvl1: { target: 1, description: "1 vez em 1º" },
      lvl2: { target: 3, description: "3 vezes" },
      lvl3: { target: 5, description: "5 vezes" },
    },
  },
  // Participação
  {
    id: "fidelidade",
    name: "Fidelidade",
    description: "Participe de partidas",
    icon: "Heart",
    category: "participacao",
    levels: {
      lvl1: { target: 10, description: "10 partidas" },
      lvl2: { target: 50, description: "50 partidas" },
      lvl3: { target: 100, description: "100 partidas" },
    },
  },
  {
    id: "carimbador_trave",
    name: "Carimbador da Trave",
    description: "Presença constante nos jogos",
    icon: "Calendar",
    category: "participacao",
    levels: {
      lvl1: { target: 20, description: "20 jogos" },
      lvl2: { target: 40, description: "40 jogos" },
      lvl3: { target: 60, description: "60 jogos" },
    },
  },
  {
    id: "veterano",
    name: "Veterano",
    description: "Tempo de uso do aplicativo",
    icon: "Clock",
    category: "participacao",
    levels: {
      lvl1: { target: 3, description: "3 meses de app" },
      lvl2: { target: 6, description: "6 meses" },
      lvl3: { target: 12, description: "1 ano" },
    },
  },
  {
    id: "inaugurador",
    name: "Inaugurador",
    description: "Participação no início",
    icon: "Rocket",
    category: "participacao",
    levels: {
      lvl1: { target: 1, description: "1ª partida registrada" },
      lvl2: { target: 3, description: "3 jogos no 1º mês" },
      lvl3: { target: 10, description: "10 jogos no 1º mês" },
    },
  },
  // Defesa
  {
    id: "paredao",
    name: "Paredão Histórico",
    description: "Clean sheets como goleiro",
    icon: "Shield",
    category: "defesa",
    levels: {
      lvl1: { target: 2, description: "2 clean sheets" },
      lvl2: { target: 10, description: "10 clean sheets" },
      lvl3: { target: 25, description: "25 clean sheets" },
    },
  },
  {
    id: "zagueiro_ferro",
    name: "Zagueiro de Ferro",
    description: "Jogos com média de gols sofridos baixa",
    icon: "ShieldCheck",
    category: "defesa",
    levels: {
      lvl1: { target: 5, description: "5 jogos (méd < 1.0)" },
      lvl2: { target: 15, description: "15 jogos" },
      lvl3: { target: 30, description: "30 jogos" },
    },
  },
  // Especial
  {
    id: "polivalente",
    name: "Polivalente",
    description: "Contribua em gol, assistência e defesa no mesmo mês",
    icon: "Sparkles",
    category: "especial",
    levels: {
      lvl1: { target: 1, description: "1 mês completo" },
      lvl2: { target: 3, description: "3 meses" },
      lvl3: { target: 6, description: "6 meses" },
    },
  },
  {
    id: "diamante_bruto",
    name: "Diamante Bruto",
    description: "Conquiste selos de Diamante no perfil",
    icon: "Gem",
    category: "especial",
    levels: {
      lvl1: { target: 1, description: "1 selo Diamante" },
      lvl2: { target: 3, description: "3 selos" },
      lvl3: { target: 5, description: "5 selos" },
    },
  },
]

// Conquistas Temporárias (Reset Mensal) - 20 conquistas
export interface TemporaryAchievement {
  id: string
  name: string
  description: string
  icon: string
  category: "mensal" | "semanal" | "streak"
}

export const TEMPORARY_ACHIEVEMENTS: TemporaryAchievement[] = [
  { id: "fominha", name: "O Fominha", description: "Maior artilheiro da semana", icon: "Flame", category: "semanal" },
  { id: "ta_on", name: "Tá On", description: "Jogou todas as partidas do mês", icon: "Check", category: "mensal" },
  { id: "invicto", name: "Invicto", description: "Sem derrotas no mês", icon: "ShieldOff", category: "mensal" },
  { id: "garcom_rodada", name: "Garçom da Rodada", description: "Mais assistências na semana", icon: "Utensils", category: "semanal" },
  { id: "garcom_mes", name: "Garçom do Mês", description: "Mais assistências no mês", icon: "Award", category: "mensal" },
  { id: "artilheiro_mes", name: "Artilheiro do Mês", description: "Mais gols no mês", icon: "Target", category: "mensal" },
  { id: "muralha_mes", name: "Muralha do Mês", description: "Menos gols sofridos (goleiro)", icon: "Brick", category: "mensal" },
  { id: "em_alta", name: "Em Alta", description: "Subiu no ranking esta semana", icon: "ArrowUp", category: "semanal" },
  { id: "dobradinha", name: "Dobradinha", description: "Gol + Assistência na mesma partida", icon: "Layers", category: "streak" },
  { id: "rei_praia", name: "Rei da Praia", description: "MVP da última partida", icon: "Sun", category: "semanal" },
  { id: "subindo", name: "Subindo", description: "3 vitórias consecutivas", icon: "TrendingUp", category: "streak" },
  { id: "presenca", name: "Presença Confirmada", description: "Presente em todos os jogos da semana", icon: "CalendarCheck", category: "semanal" },
  { id: "assombracao", name: "Assombração", description: "Marcou em 3 jogos seguidos", icon: "Ghost", category: "streak" },
  { id: "dono_meio", name: "Dono do Meio", description: "Mais passes decisivos da semana", icon: "Crosshair", category: "semanal" },
  { id: "fase_iluminada", name: "Fase Iluminada", description: "Melhor desempenho do mês", icon: "Lightbulb", category: "mensal" },
  { id: "sequencia_gols", name: "Sequência de Gols", description: "Gol em 5+ partidas seguidas", icon: "Repeat", category: "streak" },
  { id: "coringa", name: "Coringa do Campo", description: "Jogou em 3+ posições no mês", icon: "Shuffle", category: "mensal" },
  { id: "mestre_estrategia", name: "Mestre da Estratégia", description: "Participou de 80% dos gols do time", icon: "Brain", category: "mensal" },
  { id: "fregues_podio", name: "Freguês do Pódio", description: "Top 3 do ranking por 2+ semanas", icon: "Podium", category: "streak" },
  { id: "dono_rede", name: "Dono da Rede", description: "5+ gols em uma única partida", icon: "Maximize", category: "streak" },
]

// Interface para progresso de conquista
export interface AchievementProgress {
  achievementId: string
  currentLevel: 0 | 1 | 2 | 3 // 0 = não iniciado, 3 = concluído
  currentValue: number
  nextTarget: number
  isComplete: boolean
}

export interface TemporaryAchievementStatus {
  achievementId: string
  isActive: boolean
  earnedAt?: string
}

// Função para calcular progresso das conquistas permanentes
export function calculatePermanentAchievements(
  jogadorId: number,
  stats: JogadorStats,
  partidas: Partida[],
  allStats: JogadorStats[],
  accountCreatedAt?: string
): AchievementProgress[] {
  const results: AchievementProgress[] = []
  
  // Filtrar partidas do jogador
  const jogadorPartidas = partidas.filter(p => 
    p.partida_jogadores?.some(pj => pj.jogador_id === jogadorId)
  )
  
  // Helper para determinar nível
  const getLevel = (value: number, targets: { lvl1: number; lvl2: number; lvl3: number }): 0 | 1 | 2 | 3 => {
    if (value >= targets.lvl3) return 3
    if (value >= targets.lvl2) return 2
    if (value >= targets.lvl1) return 1
    return 0
  }
  
  const getNextTarget = (level: 0 | 1 | 2 | 3, targets: { lvl1: number; lvl2: number; lvl3: number }): number => {
    if (level === 0) return targets.lvl1
    if (level === 1) return targets.lvl2
    if (level === 2) return targets.lvl3
    return targets.lvl3
  }

  // 1. Lenda do Gol
  const lendaGol = PERMANENT_ACHIEVEMENTS.find(a => a.id === "lenda_gol")!
  const goalsLevel = getLevel(stats.goals, { lvl1: 10, lvl2: 50, lvl3: 100 })
  results.push({
    achievementId: "lenda_gol",
    currentLevel: goalsLevel,
    currentValue: stats.goals,
    nextTarget: getNextTarget(goalsLevel, { lvl1: 10, lvl2: 50, lvl3: 100 }),
    isComplete: goalsLevel === 3,
  })

  // 2. Mestre do Passe
  const assistsLevel = getLevel(stats.assists, { lvl1: 5, lvl2: 25, lvl3: 50 })
  results.push({
    achievementId: "mestre_passe",
    currentLevel: assistsLevel,
    currentValue: stats.assists,
    nextTarget: getNextTarget(assistsLevel, { lvl1: 5, lvl2: 25, lvl3: 50 }),
    isComplete: assistsLevel === 3,
  })

  // 3. Vencedor Serial
  const winsLevel = getLevel(stats.wins, { lvl1: 5, lvl2: 20, lvl3: 50 })
  results.push({
    achievementId: "vencedor_serial",
    currentLevel: winsLevel,
    currentValue: stats.wins,
    nextTarget: getNextTarget(winsLevel, { lvl1: 5, lvl2: 20, lvl3: 50 }),
    isComplete: winsLevel === 3,
  })

  // 4. Fidelidade
  const matchesLevel = getLevel(stats.matches, { lvl1: 10, lvl2: 50, lvl3: 100 })
  results.push({
    achievementId: "fidelidade",
    currentLevel: matchesLevel,
    currentValue: stats.matches,
    nextTarget: getNextTarget(matchesLevel, { lvl1: 10, lvl2: 50, lvl3: 100 }),
    isComplete: matchesLevel === 3,
  })

  // 5. Paredão Histórico (Clean Sheets)
  const cleanSheetsLevel = getLevel(stats.cleanSheets, { lvl1: 2, lvl2: 10, lvl3: 25 })
  results.push({
    achievementId: "paredao",
    currentLevel: cleanSheetsLevel,
    currentValue: stats.cleanSheets,
    nextTarget: getNextTarget(cleanSheetsLevel, { lvl1: 2, lvl2: 10, lvl3: 25 }),
    isComplete: cleanSheetsLevel === 3,
  })

  // 6. Carrasco - Gols contra diferentes times
  const teamsScored = new Set<string>()
  jogadorPartidas.forEach(p => {
    const pj = p.partida_jogadores?.find(pj => pj.jogador_id === jogadorId)
    if (pj && pj.goals > 0) {
      const opponentTeam = pj.team === "A" ? p.team_b_name : p.team_a_name
      teamsScored.add(opponentTeam)
    }
  })
  const carrascoCount = teamsScored.size
  const carrascoLevel = getLevel(carrascoCount, { lvl1: 2, lvl2: 5, lvl3: 10 })
  results.push({
    achievementId: "carrasco",
    currentLevel: carrascoLevel,
    currentValue: carrascoCount,
    nextTarget: getNextTarget(carrascoLevel, { lvl1: 2, lvl2: 5, lvl3: 10 }),
    isComplete: carrascoLevel === 3,
  })

  // 7. Decisivo - Gols que definem vitórias (time ganhou por diferença = gols do jogador)
  let decisiveGoals = 0
  jogadorPartidas.forEach(p => {
    const pj = p.partida_jogadores?.find(pj => pj.jogador_id === jogadorId)
    if (pj && pj.goals > 0) {
      const playerTeamScore = pj.team === "A" ? p.score_a : p.score_b
      const opponentScore = pj.team === "A" ? p.score_b : p.score_a
      const diff = playerTeamScore - opponentScore
      if (diff > 0 && diff <= pj.goals) {
        decisiveGoals++
      }
    }
  })
  const decisivoLevel = getLevel(decisiveGoals, { lvl1: 1, lvl2: 3, lvl3: 10 })
  results.push({
    achievementId: "decisivo",
    currentLevel: decisivoLevel,
    currentValue: decisiveGoals,
    nextTarget: getNextTarget(decisivoLevel, { lvl1: 1, lvl2: 3, lvl3: 10 }),
    isComplete: decisivoLevel === 3,
  })

  // 8. Matador de Clássico - Vitórias por 1 gol
  let closeWins = 0
  jogadorPartidas.forEach(p => {
    const pj = p.partida_jogadores?.find(pj => pj.jogador_id === jogadorId)
    if (pj) {
      const playerTeamScore = pj.team === "A" ? p.score_a : p.score_b
      const opponentScore = pj.team === "A" ? p.score_b : p.score_a
      if (playerTeamScore - opponentScore === 1) {
        closeWins++
      }
    }
  })
  const matadorLevel = getLevel(closeWins, { lvl1: 1, lvl2: 5, lvl3: 15 })
  results.push({
    achievementId: "matador_classico",
    currentLevel: matadorLevel,
    currentValue: closeWins,
    nextTarget: getNextTarget(matadorLevel, { lvl1: 1, lvl2: 5, lvl3: 15 }),
    isComplete: matadorLevel === 3,
  })

  // 9. Hat-Trick King - 3+ gols em uma partida
  let hatTricks = 0
  jogadorPartidas.forEach(p => {
    const pj = p.partida_jogadores?.find(pj => pj.jogador_id === jogadorId)
    if (pj && pj.goals >= 3) {
      hatTricks++
    }
  })
  const hatTrickLevel = getLevel(hatTricks, { lvl1: 1, lvl2: 3, lvl3: 10 })
  results.push({
    achievementId: "hat_trick_king",
    currentLevel: hatTrickLevel,
    currentValue: hatTricks,
    nextTarget: getNextTarget(hatTrickLevel, { lvl1: 1, lvl2: 3, lvl3: 10 }),
    isComplete: hatTrickLevel === 3,
  })

  // 10. Pai das Assistências - 3+ assistências em uma partida
  let tripleAssists = 0
  jogadorPartidas.forEach(p => {
    const pj = p.partida_jogadores?.find(pj => pj.jogador_id === jogadorId)
    if (pj && pj.assists >= 3) {
      tripleAssists++
    }
  })
  const paiAssistLevel = getLevel(tripleAssists, { lvl1: 1, lvl2: 3, lvl3: 10 })
  results.push({
    achievementId: "pai_assist",
    currentLevel: paiAssistLevel,
    currentValue: tripleAssists,
    nextTarget: getNextTarget(paiAssistLevel, { lvl1: 1, lvl2: 3, lvl3: 10 }),
    isComplete: paiAssistLevel === 3,
  })

  // 11. Dupla Dinâmica - Vitórias com mesmo parceiro
  const partnerWins: Record<number, number> = {}
  jogadorPartidas.forEach(p => {
    const pj = p.partida_jogadores?.find(pj => pj.jogador_id === jogadorId)
    if (pj) {
      const playerTeamScore = pj.team === "A" ? p.score_a : p.score_b
      const opponentScore = pj.team === "A" ? p.score_b : p.score_a
      if (playerTeamScore > opponentScore) {
        // Encontrar parceiros do mesmo time
        p.partida_jogadores?.forEach(teammate => {
          if (teammate.jogador_id !== jogadorId && teammate.team === pj.team) {
            partnerWins[teammate.jogador_id] = (partnerWins[teammate.jogador_id] || 0) + 1
          }
        })
      }
    }
  })
  const maxPartnerWins = Math.max(0, ...Object.values(partnerWins))
  const duplaLevel = getLevel(maxPartnerWins, { lvl1: 3, lvl2: 7, lvl3: 15 })
  results.push({
    achievementId: "dupla_dinamica",
    currentLevel: duplaLevel,
    currentValue: maxPartnerWins,
    nextTarget: getNextTarget(duplaLevel, { lvl1: 3, lvl2: 7, lvl3: 15 }),
    isComplete: duplaLevel === 3,
  })

  // 12. Zagueiro de Ferro - Jogos com média de gols sofridos < 1.0
  let lowConcededGames = 0
  jogadorPartidas.forEach(p => {
    const pj = p.partida_jogadores?.find(pj => pj.jogador_id === jogadorId)
    if (pj) {
      const opponentScore = pj.team === "A" ? p.score_b : p.score_a
      if (opponentScore < 1) {
        lowConcededGames++
      }
    }
  })
  const zagueiroLevel = getLevel(lowConcededGames, { lvl1: 5, lvl2: 15, lvl3: 30 })
  results.push({
    achievementId: "zagueiro_ferro",
    currentLevel: zagueiroLevel,
    currentValue: lowConcededGames,
    nextTarget: getNextTarget(zagueiroLevel, { lvl1: 5, lvl2: 15, lvl3: 30 }),
    isComplete: zagueiroLevel === 3,
  })

  // 13. Polivalente - Meses com gol, assistência e defesa
  const monthlyContributions: Record<string, { goals: boolean; assists: boolean; defense: boolean }> = {}
  jogadorPartidas.forEach(p => {
    const month = p.date.substring(0, 7) // YYYY-MM
    const pj = p.partida_jogadores?.find(pj => pj.jogador_id === jogadorId)
    if (pj) {
      if (!monthlyContributions[month]) {
        monthlyContributions[month] = { goals: false, assists: false, defense: false }
      }
      if (pj.goals > 0) monthlyContributions[month].goals = true
      if (pj.assists > 0) monthlyContributions[month].assists = true
      const opponentScore = pj.team === "A" ? p.score_b : p.score_a
      if (opponentScore === 0) monthlyContributions[month].defense = true
    }
  })
  const polivalenteMonths = Object.values(monthlyContributions).filter(m => m.goals && m.assists && m.defense).length
  const polivalenteLevel = getLevel(polivalenteMonths, { lvl1: 1, lvl2: 3, lvl3: 6 })
  results.push({
    achievementId: "polivalente",
    currentLevel: polivalenteLevel,
    currentValue: polivalenteMonths,
    nextTarget: getNextTarget(polivalenteLevel, { lvl1: 1, lvl2: 3, lvl3: 6 }),
    isComplete: polivalenteLevel === 3,
  })

  // 14. Veterano - Meses desde criação da conta
  const monthsSinceCreation = accountCreatedAt 
    ? Math.floor((Date.now() - new Date(accountCreatedAt).getTime()) / (1000 * 60 * 60 * 24 * 30))
    : 0
  const veteranoLevel = getLevel(monthsSinceCreation, { lvl1: 3, lvl2: 6, lvl3: 12 })
  results.push({
    achievementId: "veterano",
    currentLevel: veteranoLevel,
    currentValue: monthsSinceCreation,
    nextTarget: getNextTarget(veteranoLevel, { lvl1: 3, lvl2: 6, lvl3: 12 }),
    isComplete: veteranoLevel === 3,
  })

  // 15. Rei do Pódio - Vezes em 1º lugar (simulado pelo rating)
  const currentRank = allStats.findIndex(s => s.id === jogadorId) + 1
  const timesFirst = currentRank === 1 ? 1 : 0 // Simplificado - contaria histórico real
  const reiPodioLevel = getLevel(timesFirst, { lvl1: 1, lvl2: 3, lvl3: 5 })
  results.push({
    achievementId: "rei_podio",
    currentLevel: reiPodioLevel,
    currentValue: timesFirst,
    nextTarget: getNextTarget(reiPodioLevel, { lvl1: 1, lvl2: 3, lvl3: 5 }),
    isComplete: reiPodioLevel === 3,
  })

  // 16. Assistente de Elite - 3 assistências em 5 jogos
  let eliteAssistStreaks = 0
  const sortedPartidas = [...jogadorPartidas].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  for (let i = 0; i <= sortedPartidas.length - 5; i++) {
    const fiveGames = sortedPartidas.slice(i, i + 5)
    const totalAssists = fiveGames.reduce((sum, p) => {
      const pj = p.partida_jogadores?.find(pj => pj.jogador_id === jogadorId)
      return sum + (pj?.assists || 0)
    }, 0)
    if (totalAssists >= 3) eliteAssistStreaks++
  }
  const assistEliteLevel = getLevel(eliteAssistStreaks, { lvl1: 1, lvl2: 3, lvl3: 5 })
  results.push({
    achievementId: "assist_elite",
    currentLevel: assistEliteLevel,
    currentValue: eliteAssistStreaks,
    nextTarget: getNextTarget(assistEliteLevel, { lvl1: 1, lvl2: 3, lvl3: 5 }),
    isComplete: assistEliteLevel === 3,
  })

  // 17. Carimbador da Trave
  const carimbadorLevel = getLevel(stats.matches, { lvl1: 20, lvl2: 40, lvl3: 60 })
  results.push({
    achievementId: "carimbador_trave",
    currentLevel: carimbadorLevel,
    currentValue: stats.matches,
    nextTarget: getNextTarget(carimbadorLevel, { lvl1: 20, lvl2: 40, lvl3: 60 }),
    isComplete: carimbadorLevel === 3,
  })

  // 18. Inaugurador - Participação no início
  const firstMonth = partidas.length > 0 
    ? partidas.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]?.date.substring(0, 7)
    : null
  const gamesInFirstMonth = firstMonth 
    ? jogadorPartidas.filter(p => p.date.substring(0, 7) === firstMonth).length
    : 0
  const inauguradorLevel = getLevel(gamesInFirstMonth, { lvl1: 1, lvl2: 3, lvl3: 10 })
  results.push({
    achievementId: "inaugurador",
    currentLevel: inauguradorLevel,
    currentValue: gamesInFirstMonth,
    nextTarget: getNextTarget(inauguradorLevel, { lvl1: 1, lvl2: 3, lvl3: 10 }),
    isComplete: inauguradorLevel === 3,
  })

  // 19. Goleador Elite - Média de gols
  const goalsPerMatch = stats.matches > 0 ? stats.goals / stats.matches : 0
  const goleadorLevel = goalsPerMatch >= 2.0 ? 3 : goalsPerMatch >= 1.6 ? 2 : goalsPerMatch >= 1.2 ? 1 : 0
  results.push({
    achievementId: "goleador_elite",
    currentLevel: goleadorLevel as 0 | 1 | 2 | 3,
    currentValue: Math.round(goalsPerMatch * 100) / 100,
    nextTarget: goleadorLevel === 0 ? 1.2 : goleadorLevel === 1 ? 1.6 : goleadorLevel === 2 ? 2.0 : 2.0,
    isComplete: goleadorLevel === 3,
  })

  // 20. Diamante Bruto - Selos Diamante (baseado em conquistas completas)
  const completedAchievements = results.filter(r => r.isComplete).length
  const diamanteLevel = getLevel(completedAchievements, { lvl1: 5, lvl2: 10, lvl3: 15 })
  results.push({
    achievementId: "diamante_bruto",
    currentLevel: diamanteLevel,
    currentValue: completedAchievements,
    nextTarget: getNextTarget(diamanteLevel, { lvl1: 5, lvl2: 10, lvl3: 15 }),
    isComplete: diamanteLevel === 3,
  })

  return results
}

// Calcular conquistas temporárias
export function calculateTemporaryAchievements(
  jogadorId: number,
  stats: JogadorStats,
  partidas: Partida[],
  allStats: JogadorStats[]
): TemporaryAchievementStatus[] {
  const results: TemporaryAchievementStatus[] = []
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Partidas do jogador
  const jogadorPartidas = partidas.filter(p => 
    p.partida_jogadores?.some(pj => pj.jogador_id === jogadorId)
  )

  // Partidas do mês e da semana
  const monthPartidas = jogadorPartidas.filter(p => p.date.startsWith(currentMonth))
  const weekPartidas = jogadorPartidas.filter(p => new Date(p.date) >= oneWeekAgo)

  // Gols e assistências do mês/semana
  const monthGoals = monthPartidas.reduce((sum, p) => {
    const pj = p.partida_jogadores?.find(pj => pj.jogador_id === jogadorId)
    return sum + (pj?.goals || 0)
  }, 0)
  const monthAssists = monthPartidas.reduce((sum, p) => {
    const pj = p.partida_jogadores?.find(pj => pj.jogador_id === jogadorId)
    return sum + (pj?.assists || 0)
  }, 0)
  const weekGoals = weekPartidas.reduce((sum, p) => {
    const pj = p.partida_jogadores?.find(pj => pj.jogador_id === jogadorId)
    return sum + (pj?.goals || 0)
  }, 0)
  const weekAssists = weekPartidas.reduce((sum, p) => {
    const pj = p.partida_jogadores?.find(pj => pj.jogador_id === jogadorId)
    return sum + (pj?.assists || 0)
  }, 0)

  // Calcular stats de todos os jogadores para comparação
  const allMonthStats = allStats.map(s => {
    const playerMonthPartidas = partidas.filter(p => 
      p.date.startsWith(currentMonth) && 
      p.partida_jogadores?.some(pj => pj.jogador_id === s.id)
    )
    const goals = playerMonthPartidas.reduce((sum, p) => {
      const pj = p.partida_jogadores?.find(pj => pj.jogador_id === s.id)
      return sum + (pj?.goals || 0)
    }, 0)
    const assists = playerMonthPartidas.reduce((sum, p) => {
      const pj = p.partida_jogadores?.find(pj => pj.jogador_id === s.id)
      return sum + (pj?.assists || 0)
    }, 0)
    return { id: s.id, goals, assists, matches: playerMonthPartidas.length }
  })

  const maxMonthGoals = Math.max(...allMonthStats.map(s => s.goals))
  const maxMonthAssists = Math.max(...allMonthStats.map(s => s.assists))
  const maxWeekGoals = Math.max(...allStats.map(s => {
    const playerWeekPartidas = partidas.filter(p => 
      new Date(p.date) >= oneWeekAgo && 
      p.partida_jogadores?.some(pj => pj.jogador_id === s.id)
    )
    return playerWeekPartidas.reduce((sum, p) => {
      const pj = p.partida_jogadores?.find(pj => pj.jogador_id === s.id)
      return sum + (pj?.goals || 0)
    }, 0)
  }))
  const maxWeekAssists = Math.max(...allStats.map(s => {
    const playerWeekPartidas = partidas.filter(p => 
      new Date(p.date) >= oneWeekAgo && 
      p.partida_jogadores?.some(pj => pj.jogador_id === s.id)
    )
    return playerWeekPartidas.reduce((sum, p) => {
      const pj = p.partida_jogadores?.find(pj => pj.jogador_id === s.id)
      return sum + (pj?.assists || 0)
    }, 0)
  }))

  // 1. O Fominha - Maior artilheiro da semana
  results.push({
    achievementId: "fominha",
    isActive: weekGoals > 0 && weekGoals === maxWeekGoals,
  })

  // 2. Tá On - Jogou todas as partidas do mês
  const totalMonthPartidas = partidas.filter(p => p.date.startsWith(currentMonth)).length
  results.push({
    achievementId: "ta_on",
    isActive: monthPartidas.length > 0 && monthPartidas.length === totalMonthPartidas,
  })

  // 3. Invicto - Sem derrotas no mês
  const monthLosses = monthPartidas.filter(p => {
    const pj = p.partida_jogadores?.find(pj => pj.jogador_id === jogadorId)
    if (!pj) return false
    const playerTeamScore = pj.team === "A" ? p.score_a : p.score_b
    const opponentScore = pj.team === "A" ? p.score_b : p.score_a
    return playerTeamScore < opponentScore
  }).length
  results.push({
    achievementId: "invicto",
    isActive: monthPartidas.length > 0 && monthLosses === 0,
  })

  // 4. Garçom da Rodada - Mais assistências na semana
  results.push({
    achievementId: "garcom_rodada",
    isActive: weekAssists > 0 && weekAssists === maxWeekAssists,
  })

  // 5. Garçom do Mês
  results.push({
    achievementId: "garcom_mes",
    isActive: monthAssists > 0 && monthAssists === maxMonthAssists,
  })

  // 6. Artilheiro do Mês
  results.push({
    achievementId: "artilheiro_mes",
    isActive: monthGoals > 0 && monthGoals === maxMonthGoals,
  })

  // 7. Muralha do Mês - Menos gols sofridos como goleiro
  const monthGKGames = monthPartidas.filter(p => {
    const pj = p.partida_jogadores?.find(pj => pj.jogador_id === jogadorId)
    return pj?.is_goalkeeper
  })
  const monthConceded = monthGKGames.reduce((sum, p) => {
    const pj = p.partida_jogadores?.find(pj => pj.jogador_id === jogadorId)
    return sum + (pj?.goals_conceded || 0)
  }, 0)
  results.push({
    achievementId: "muralha_mes",
    isActive: monthGKGames.length >= 3 && monthConceded <= monthGKGames.length,
  })

  // 8. Em Alta - Subiu no ranking esta semana (simplificado)
  const currentRank = allStats.findIndex(s => s.id === jogadorId) + 1
  results.push({
    achievementId: "em_alta",
    isActive: currentRank <= 5,
  })

  // 9. Dobradinha - Gol + Assistência na mesma partida (última semana)
  const hasDobradinha = weekPartidas.some(p => {
    const pj = p.partida_jogadores?.find(pj => pj.jogador_id === jogadorId)
    return pj && pj.goals > 0 && pj.assists > 0
  })
  results.push({
    achievementId: "dobradinha",
    isActive: hasDobradinha,
  })

  // 10. Rei da Praia - MVP da última partida
  const lastPartida = weekPartidas.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
  let isMVP = false
  if (lastPartida) {
    const allPlayerPerf = lastPartida.partida_jogadores?.map(pj => ({
      id: pj.jogador_id,
      score: pj.goals * 3 + pj.assists * 2
    })) || []
    const maxScore = Math.max(...allPlayerPerf.map(p => p.score))
    const playerPerf = allPlayerPerf.find(p => p.id === jogadorId)
    isMVP = playerPerf ? playerPerf.score === maxScore && maxScore > 0 : false
  }
  results.push({
    achievementId: "rei_praia",
    isActive: isMVP,
  })

  // 11. Subindo - 3 vitórias consecutivas
  const sortedPartidas = [...jogadorPartidas].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  let consecutiveWins = 0
  for (const p of sortedPartidas.slice(0, 5)) {
    const pj = p.partida_jogadores?.find(pj => pj.jogador_id === jogadorId)
    if (pj) {
      const playerTeamScore = pj.team === "A" ? p.score_a : p.score_b
      const opponentScore = pj.team === "A" ? p.score_b : p.score_a
      if (playerTeamScore > opponentScore) {
        consecutiveWins++
      } else {
        break
      }
    }
  }
  results.push({
    achievementId: "subindo",
    isActive: consecutiveWins >= 3,
  })

  // 12. Presença Confirmada - Presente em todos os jogos da semana
  const totalWeekPartidas = partidas.filter(p => new Date(p.date) >= oneWeekAgo).length
  results.push({
    achievementId: "presenca",
    isActive: weekPartidas.length > 0 && weekPartidas.length === totalWeekPartidas,
  })

  // 13. Assombração - Marcou em 3 jogos seguidos
  let consecutiveGoalGames = 0
  for (const p of sortedPartidas.slice(0, 5)) {
    const pj = p.partida_jogadores?.find(pj => pj.jogador_id === jogadorId)
    if (pj && pj.goals > 0) {
      consecutiveGoalGames++
    } else {
      break
    }
  }
  results.push({
    achievementId: "assombracao",
    isActive: consecutiveGoalGames >= 3,
  })

  // 14. Dono do Meio - Mais passes decisivos da semana (usando assists)
  results.push({
    achievementId: "dono_meio",
    isActive: weekAssists > 0 && weekAssists === maxWeekAssists,
  })

  // 15. Fase Iluminada - Melhor desempenho do mês
  const monthPerformance = monthGoals * 3 + monthAssists * 2
  const bestMonthPerf = Math.max(...allMonthStats.map(s => s.goals * 3 + s.assists * 2))
  results.push({
    achievementId: "fase_iluminada",
    isActive: monthPerformance > 0 && monthPerformance === bestMonthPerf,
  })

  // 16. Sequência de Gols - Gol em 5+ partidas seguidas
  let goalStreak = 0
  for (const p of sortedPartidas.slice(0, 10)) {
    const pj = p.partida_jogadores?.find(pj => pj.jogador_id === jogadorId)
    if (pj && pj.goals > 0) {
      goalStreak++
    } else {
      break
    }
  }
  results.push({
    achievementId: "sequencia_gols",
    isActive: goalStreak >= 5,
  })

  // 17. Coringa - Jogou em 3+ posições no mês (simplificado - baseado na posição atual)
  results.push({
    achievementId: "coringa",
    isActive: false, // Precisaria de tracking de posição por partida
  })

  // 18. Mestre da Estratégia - Participou de 80% dos gols do time
  const teamGoalParticipation = monthPartidas.reduce((acc, p) => {
    const pj = p.partida_jogadores?.find(pj => pj.jogador_id === jogadorId)
    if (pj) {
      const teamTotal = pj.team === "A" ? p.score_a : p.score_b
      const playerContrib = pj.goals + pj.assists
      return { player: acc.player + playerContrib, team: acc.team + teamTotal }
    }
    return acc
  }, { player: 0, team: 0 })
  results.push({
    achievementId: "mestre_estrategia",
    isActive: teamGoalParticipation.team > 0 && (teamGoalParticipation.player / teamGoalParticipation.team) >= 0.8,
  })

  // 19. Freguês do Pódio - Top 3 do ranking
  results.push({
    achievementId: "fregues_podio",
    isActive: currentRank <= 3,
  })

  // 20. Dono da Rede - 5+ gols em uma única partida
  const has5GoalGame = jogadorPartidas.some(p => {
    const pj = p.partida_jogadores?.find(pj => pj.jogador_id === jogadorId)
    return pj && pj.goals >= 5
  })
  results.push({
    achievementId: "dono_rede",
    isActive: has5GoalGame,
  })

  return results
}

// Calcular progresso geral do perfil (0-100%)
export function calculateProfileProgress(achievements: AchievementProgress[]): number {
  if (!achievements || achievements.length === 0) return 0
  const completedCount = achievements.filter(a => a.isComplete).length
  // 20 conquistas permanentes, cada uma vale ~5% (100/20)
  // Mas como queremos que 7 níveis (14.28% cada), ajustamos
  const denominator = PERMANENT_ACHIEVEMENTS.length || 1 // Evita divisão por zero
  const progress = (completedCount / denominator) * 100
  const result = Math.round(progress * 100) / 100
  return isNaN(result) ? 0 : result
}
