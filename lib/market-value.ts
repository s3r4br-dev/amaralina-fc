/**
 * Market Value Calculator - Amaralina FC
 * Version: 3.0 - Sistema Meritocrático com Ciclos de Temporada
 * 
 * REGRAS DE CÁLCULO:
 * 
 * 1. BASE POR PARTIDA: R$ 50.000 por jogo disputado
 *    - Volume de jogos importa: mais partidas = valor base maior
 * 
 * 2. MULTIPLICADORES EXPONENCIAIS:
 *    - Gols: Crescimento acelerado (1.2x até 20 gols, depois exponencial)
 *    - Assists: Crescimento moderado (1.1x até 15 assists, depois moderado)
 *    - Garante que 6 jogos/9 gols vale 3x mais que 1 jogo/1 gol (Volume x Eficiência)
 * 
 * 3. BÔNUS DE PÓDIO (Top 3 Artilheiros):
 *    - +50% de valor (1.5x) para jogadores no Top 3 de artilharia
 *    - Reconhece desempenho excepcional
 * 
 * 4. PENALIDADE POR INATIVIDADE:
 *    - Se 0 partidas: Valor = R$ 0
 *    - Se 2+ jogos ausentes consecutivos: -15% por rodada ausente
 *    - Campo usado: lastMatchesInactivity (precisa ser rastreado externamente)
 * 
 * 5. PENALIDADE POR DESEMPENHO NEGATIVO:
 *    - Se participar mas não marcar/assistir (exceto GK/Defensores): -5%
 *    - Simula "má fase" do jogador
 * 
 * 6. RESET DE FIM DE TEMPORADA:
 *    - Flag: applySeasonEndReset = true
 *    - Jogadores fora do Top 10 OU com rating < 7.0: -40% a -50%
 *    - Limpa inflação para nova temporada
 *    - Valor só recupera com nova partida e gol
 * 
 * 7. ESCALA:
 *    - Permite ultrapassar R$ 1.000.000.000 (1B) para craques
 *    - Formatação automática: K (mil), M (milhão), B (bilhão)
 * 
 * 8. INDICADORES VISUAIS:
 *    - trend: "up" (subiu), "down" (caiu), "stable" (estável)
 *    - changePercent: % de variação em relação ao valor anterior
 *    - Use MarketValueDisplay component para exibir com seta colorida
 * 
 * EXEMPLO GABIGOL vs JEFERSON:
 * - Gabigol: 6 jogos, 9 gols → Base 300K * mult. 2.32 * pódio 1.5x = ~1.044M
 * - Jeferson: 1 jogo, 1 gol → Base 50K * mult. 1.28 = ~64K
 * - Gabigol vale 16x mais (eficiência + volume + pódio)
 */

import type { JogadorStats } from "@/contexts/data-context"

export interface MarketValueBreakdown {
  currentValue: number
  previousValue: number
  change: number
  changePercent: number
  trend: "up" | "down" | "stable"
  factors: {
    baseValue: number
    goalMultiplier: number
    assistMultiplier: number
    inactivityPenalty: number
    performancePenalty: number
    seasonResetPenalty: number
  }
}

// Constantes
const BASE_VALUE_PER_MATCH = 50_000
const INACTIVITY_PENALTY_PER_GAME = 0.15 // 15% por jogo
const MIN_INACTIVITY_GAMES = 2
const PERFORMANCE_PENALTY_NO_CONTRIBUTION = 0.05 // 5% se sem gols/assists
const SEASON_RESET_PENALTY_MIN = 0.40 // 40% mínimo
const SEASON_RESET_PENALTY_MAX = 0.50 // 50% máximo
const RATING_TOP_THRESHOLD = 7.0
const TOP_SCORERS_COUNT = 10
const TOP_PODIUM_COUNT = 3 // Top 3 artilheiros recebem bônus
const PODIUM_BONUS_MULTIPLIER = 1.5 // 50% de bônus para o pódio

// Multiplicadores por gols/assists (progressão exponencial)
export const getGoalMultiplier = (goals: number): number => {
  if (goals === 0) return 1.0
  if (goals <= 5) return 1.2 + goals * 0.08 // 1.2x a 1.6x
  if (goals <= 10) return 1.6 + (goals - 5) * 0.12 // 1.6x a 2.2x
  if (goals <= 15) return 2.2 + (goals - 10) * 0.15 // 2.2x a 2.95x
  if (goals <= 20) return 2.95 + (goals - 15) * 0.20 // 2.95x a 3.95x
  // Acima de 20: crescimento exponencial (craques)
  return 3.95 * Math.pow(1.25, goals - 20)
}

export const getAssistMultiplier = (assists: number): number => {
  if (assists === 0) return 1.0
  if (assists <= 5) return 1.1 + assists * 0.05 // 1.1x a 1.35x
  if (assists <= 10) return 1.35 + (assists - 5) * 0.08 // 1.35x a 1.75x
  if (assists <= 15) return 1.75 + (assists - 10) * 0.10 // 1.75x a 2.25x
  // Acima de 15: crescimento moderado (playmakers)
  return 2.25 * Math.pow(1.12, assists - 15)
}

// Calcular penalidade por inatividade
export const calculateInactivityPenalty = (lastMatchesInactivity: number = 0): number => {
  if (lastMatchesInactivity < MIN_INACTIVITY_GAMES) return 0
  return INACTIVITY_PENALTY_PER_GAME * (lastMatchesInactivity - (MIN_INACTIVITY_GAMES - 1))
}

// Verificar se deve aplicar penalidade de desempenho (sem gols/assists)
export const hasPerformancePenalty = (
  goals: number,
  assists: number,
  position: string
): boolean => {
  // Goleiros e defensores (SG na posição) não sofrem penalidade
  if (position.toUpperCase().includes("GK") || position.toUpperCase().includes("SG")) {
    return false
  }
  return goals === 0 && assists === 0
}

// Função principal de cálculo de valor de mercado
export const calculateMarketValue = (
  player: JogadorStats,
  allPlayersStats: JogadorStats[] = [],
  applySeasonEndReset: boolean = false,
  lastMarketValue: number = 0
): MarketValueBreakdown => {
  // Se não tem partidas, valor é zero
  if (player.matches === 0) {
    return {
      currentValue: 0,
      previousValue: lastMarketValue,
      change: lastMarketValue * -1,
      changePercent: lastMarketValue > 0 ? -100 : 0,
      trend: "down",
      factors: {
        baseValue: 0,
        goalMultiplier: 1.0,
        assistMultiplier: 1.0,
        inactivityPenalty: 0,
        performancePenalty: 0,
        seasonResetPenalty: 0,
      }
    }
  }

  // 1. Valor base por partida
  const baseValue = BASE_VALUE_PER_MATCH * player.matches

  // 2. Multiplicadores de gols e assists
  const goalMultiplier = getGoalMultiplier(player.goals)
  const assistMultiplier = getAssistMultiplier(player.assists)
  const contributionMultiplier = (goalMultiplier + assistMultiplier) / 2

  // Valor com multiplicadores
  let valueWithMultipliers = baseValue * contributionMultiplier

  // 3. Penalidade por inatividade
  const inactivityField = (player as any).lastMatchesInactivity || 0
  const inactivityPenalty = calculateInactivityPenalty(inactivityField)
  valueWithMultipliers *= (1 - inactivityPenalty)

  // 4. Penalidade por desempenho negativo (sem gols/assists)
  let performancePenalty = 0
  if (hasPerformancePenalty(player.goals, player.assists, player.position)) {
    performancePenalty = PERFORMANCE_PENALTY_NO_CONTRIBUTION
    valueWithMultipliers *= (1 - performancePenalty)
  }

  // 5. Bônus de Pódio (Top 3 artilheiros recebem 1.5x)
  const isPodiumPlayer = checkIfTopScorer(player, allPlayersStats, TOP_PODIUM_COUNT)
  if (isPodiumPlayer && player.goals > 0) {
    valueWithMultipliers *= PODIUM_BONUS_MULTIPLIER
  }

  // 6. Penalidade de fim de temporada (opcional)
  let seasonResetPenalty = 0
  if (applySeasonEndReset) {
    const isTopScorer = checkIfTopScorer(player, allPlayersStats, TOP_SCORERS_COUNT)
    const hasGoodRating = player.rating >= RATING_TOP_THRESHOLD

    // Se não está no top 10 e não tem rating >= 7.0, aplica penalidade
    if (!isTopScorer && !hasGoodRating) {
      // Variação entre 40-50% baseada no rating
      const ratingFactor = Math.max(0, player.rating / RATING_TOP_THRESHOLD)
      seasonResetPenalty = SEASON_RESET_PENALTY_MIN + 
        (SEASON_RESET_PENALTY_MAX - SEASON_RESET_PENALTY_MIN) * (1 - ratingFactor)
      valueWithMultipliers *= (1 - seasonResetPenalty)
    }
  }

  // Valor final
  const currentValue = Math.max(0, Math.round(valueWithMultipliers))

  // Calcular mudança em relação ao valor anterior
  const change = currentValue - lastMarketValue
  const changePercent = lastMarketValue > 0 ? (change / lastMarketValue) * 100 : 0
  const trend = change > 0 ? "up" : change < 0 ? "down" : "stable"

  return {
    currentValue,
    previousValue: lastMarketValue,
    change,
    changePercent,
    trend,
    factors: {
      baseValue,
      goalMultiplier,
      assistMultiplier,
      inactivityPenalty,
      performancePenalty,
      seasonResetPenalty,
    }
  }
}

// Verificar se jogador está no top 10 artilheiros
const checkIfTopScorer = (
  player: JogadorStats,
  allPlayersStats: JogadorStats[],
  topCount: number
): boolean => {
  if (allPlayersStats.length === 0) return false
  
  const sorted = [...allPlayersStats]
    .sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists))
    .slice(0, topCount)
  
  return sorted.some(p => p.id === player.id)
}

// Formatação de moeda com seta indicativa (retorna objeto para componentes React)
export const formatMarketValueWithTrend = (breakdown: MarketValueBreakdown): {
  value: string
  trend: "up" | "down" | "stable"
  changePercent: number
} => {
  const { currentValue, trend, changePercent } = breakdown
  const formattedValue = formatCurrency(currentValue)
  
  return {
    value: formattedValue,
    trend,
    changePercent
  }
}

// Versão legada (string simples com emoji) - mantida para compatibilidade
export const formatMarketValueWithTrendLegacy = (breakdown: MarketValueBreakdown): string => {
  const { currentValue, trend } = breakdown
  const formattedValue = formatCurrency(currentValue)
  
  const trendIcon = trend === "up" 
    ? "📈" 
    : trend === "down" 
    ? "📉" 
    : "➡️"
  
  return `${trendIcon} ${formattedValue}`
}

// Formatar valor em moeda brasileira (com suporte a bilhões)
export const formatCurrency = (value: number): string => {
  if (value === 0) return "R$ 0"
  
  if (value >= 1_000_000_000) {
    // Bilhões
    const billions = value / 1_000_000_000
    return `R$ ${billions.toFixed(2).replace('.', ',')}B`
  }
  
  if (value >= 1_000_000) {
    // Milhões
    const millions = value / 1_000_000
    return `R$ ${millions.toFixed(1).replace('.', ',')}M`
  }
  
  if (value >= 1_000) {
    // Mil
    const thousands = value / 1_000
    return `R$ ${thousands.toFixed(1).replace('.', ',')}K`
  }
  
  return `R$ ${value.toLocaleString('pt-BR')}`
}

// Calcular para múltiplos jogadores (útil para ranking)
export const calculateMarketValuesForPlayers = (
  players: JogadorStats[],
  applySeasonEndReset: boolean = false,
  lastMarketValues: Map<number, number> = new Map()
): Map<number, MarketValueBreakdown> => {
  const results = new Map<number, MarketValueBreakdown>()
  
  for (const player of players) {
    const lastValue = lastMarketValues.get(player.id) || 0
    const breakdown = calculateMarketValue(player, players, applySeasonEndReset, lastValue)
    results.set(player.id, breakdown)
  }
  
  return results
}

// Helper simples para componentes (retorna apenas o valor formatado)
export const getSimpleMarketValue = (player: JogadorStats): string => {
  if (player.matches === 0) return "R$ 0"
  
  const breakdown = calculateMarketValue(player)
  return formatCurrency(breakdown.currentValue)
}

// Helper com seta indicativa
export const getMarketValueWithTrend = (player: JogadorStats, lastValue: number = 0): string => {
  const breakdown = calculateMarketValue(player, [], false, lastValue)
  return formatMarketValueWithTrend(breakdown)
}
