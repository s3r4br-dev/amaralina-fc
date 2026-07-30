"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { Medal, Goal, HandHelping, Shield, TrendingUp, TrendingDown, Minus, Users2, Trophy, Award } from "lucide-react"
import { useData, type JogadorStats, type Partida } from "@/contexts/data-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { YearFilter } from "@/components/year-filter"
import { cn } from "@/lib/utils"
import { RankingSkeleton } from "@/components/skeletons"

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up") return <TrendingUp className="w-4 h-4 text-green-500" />
  if (trend === "down") return <TrendingDown className="w-4 h-4 text-red-500" />
  return <Minus className="w-4 h-4 text-[#967948]" />
}

function RankingTable({ 
  data, 
  columns, 
  valueKey, 
  valueLabel,
  avgKey,
}: { 
  data: Array<JogadorStats & { avg: number; trend: string }>
  columns: { key: string; label: string }[]
  valueKey: keyof JogadorStats
  valueLabel: string
  avgKey: string
}) {
  return (
    <div className="table-scroll-container glass-table rounded-xl overflow-hidden">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="border-b border-[#D4B300]/30">
            <th className="py-3 px-2 md:px-4 text-left text-xs md:text-sm font-semibold text-[#D4B300]">#</th>
            <th className="py-3 px-2 md:px-4 text-left text-xs md:text-sm font-semibold text-[#D4B300]">Jogador</th>
            {columns.map((col) => (
              <th key={col.key} className="py-4 px-4 text-center text-sm font-semibold text-[#D4B300]">
                {col.label}
              </th>
            ))}
            <th className="py-4 px-4 text-center text-sm font-semibold text-[#D4B300]">{valueLabel}</th>
            <th className="py-4 px-4 text-center text-sm font-semibold text-[#D4B300]">Tendência</th>
            <th className="py-4 px-4 text-center text-sm font-semibold text-[#D4B300]">Troféus</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const position = index + 1
            const isTop3 = position <= 3
            
            return (
              <tr 
                key={item.id}
                className={cn(
                  "border-b border-white/10 transition-all hover:bg-white/5",
                  isTop3 && "bg-[#D4B300]/10"
                )}
              >
                <td className="py-4 px-4">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                    position === 1 && "bg-gradient-to-br from-[#FFD700] to-[#D4B300] text-[#1a1a1a]",
                    position === 2 && "bg-gradient-to-br from-[#C0C0C0] to-[#A0A0A0] text-[#1a1a1a]",
                    position === 3 && "bg-gradient-to-br from-[#CD7F32] to-[#8B4513] text-white",
                    position > 3 && "bg-white/20 text-white"
                  )}>
                    {position}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0088CC] to-[#006699] flex items-center justify-center overflow-hidden border-2 border-[#D4B300]/50">
                      {item.photo_url ? (
                        <Image
                          src={item.photo_url}
                          alt={item.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-white">
                          {item.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-white">{item.nickname || item.name}</span>
                      <p className="text-xs text-white/70">{item.position}</p>
                    </div>
                  </div>
                </td>
                {columns.map((col, colIdx) => {
                  const value = item[col.key as keyof JogadorStats]
                  const displayValue = typeof value === "number" && !isNaN(value) ? value : 0
                  // Primeira coluna em destaque (dado principal)
                  const isHighlight = colIdx === 0
                  return (
                    <td key={col.key} className="py-4 px-4 text-center">
                      {isHighlight ? (
                        <span className="inline-flex items-center justify-center w-12 h-8 rounded-lg bg-[#D4B300]/30 text-[#D4B300] font-bold">
                          {displayValue}
                        </span>
                      ) : (
                        <span className="text-white">{displayValue}</span>
                      )}
                    </td>
                  )
                })}
                <td className="py-4 px-4 text-center text-white/70">
                  {(() => {
                    const val = item[avgKey as keyof typeof item]
                    const num = typeof val === "number" ? val : 0
                    return isNaN(num) ? "0.00" : num.toFixed(2)
                  })()}
                </td>
                <td className="py-4 px-4">
                  <div className="flex justify-center">
                    <TrendIcon trend={item.trend} />
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <Link href={`/jogadores/${item.id}/conquistas`}>
                    <button className="p-2 rounded-full bg-[#C5A059]/10 hover:bg-[#C5A059]/20 text-[#C5A059] transition-colors">
                      <Award className="w-4 h-4" />
                    </button>
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// Interface para duplas dinâmicas
interface DuplaStats {
  player1Id: number
  player2Id: number
  player1Name: string
  player2Name: string
  matchesTogether: number
  winsTogether: number
  winRate: number
}

export default function RankingPage() {
  const { getTopArtilheiros, getTopAssistentes, getTopGoleiros, partidas, jogadores, selectedYear, isLoading } = useData()
  const [activeTab, setActiveTab] = useState("artilheiros")

  // Calcular duplas dinâmicas - jogadores que mais vencem juntos
  const duplasStats = useMemo(() => {
    const duplaMap = new Map<string, { wins: number; total: number; p1: number; p2: number }>()
    
    // Filtrar partidas finalizadas
    const partidasFinalizadas = (partidas || []).filter(p => p.status === "finalizado")
    
    partidasFinalizadas.forEach(partida => {
      const jogadoresPartida = partida.partida_jogadores || []
      
      // Separar por time
      const timeA = jogadoresPartida.filter(j => j.team === "A")
      const timeB = jogadoresPartida.filter(j => j.team === "B")
      
      // Determinar time vencedor
      const scoreA = partida.score_a || 0
      const scoreB = partida.score_b || 0
      const winnerTeam = scoreA > scoreB ? "A" : scoreB > scoreA ? "B" : null
      
      // Processar duplas do time vencedor
      const processTeam = (team: typeof timeA, isWinner: boolean) => {
        for (let i = 0; i < team.length; i++) {
          for (let j = i + 1; j < team.length; j++) {
            const p1 = Math.min(team[i].jogador_id, team[j].jogador_id)
            const p2 = Math.max(team[i].jogador_id, team[j].jogador_id)
            const key = `${p1}-${p2}`
            
            const current = duplaMap.get(key) || { wins: 0, total: 0, p1, p2 }
            current.total++
            if (isWinner) current.wins++
            duplaMap.set(key, current)
          }
        }
      }
      
      if (winnerTeam === "A") {
        processTeam(timeA, true)
        processTeam(timeB, false)
      } else if (winnerTeam === "B") {
        processTeam(timeA, false)
        processTeam(timeB, true)
      } else {
        // Empate
        processTeam(timeA, false)
        processTeam(timeB, false)
      }
    })
    
    // Converter para array e calcular taxa de vitória
    const duplas: DuplaStats[] = []
    duplaMap.forEach((stats, _key) => {
      if (stats.total >= 2) { // Mínimo 2 partidas juntos
        const player1 = (jogadores || []).find(j => j.id === stats.p1)
        const player2 = (jogadores || []).find(j => j.id === stats.p2)
        
        if (player1 && player2) {
          duplas.push({
            player1Id: stats.p1,
            player2Id: stats.p2,
            player1Name: player1.nickname || player1.name,
            player2Name: player2.nickname || player2.name,
            matchesTogether: stats.total,
            winsTogether: stats.wins,
            winRate: stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0
          })
        }
      }
    })
    
    // Ordenar por taxa de vitória e depois por número de partidas
    return duplas.sort((a, b) => {
      // DESEMPATE HIERÁRQUICO:
      // 1º - Maior número de vitórias juntas
      if (b.winsTogether !== a.winsTogether) return b.winsTogether - a.winsTogether
      
      // 2º - Média de gols combinados (calcular com base nos jogadores)
      const player1A = jogadores.find(j => j.id === a.player1Id)
      const player2A = jogadores.find(j => j.id === a.player2Id)
      const goalsA = ((player1A?.goals || 0) + (player2A?.goals || 0)) / 2
      
      const player1B = jogadores.find(j => j.id === b.player1Id)
      const player2B = jogadores.find(j => j.id === b.player2Id)
      const goalsB = ((player1B?.goals || 0) + (player2B?.goals || 0)) / 2
      
      if (goalsB !== goalsA) return goalsB - goalsA
      
      // 3º - Taxa de vitória
      if (b.winRate !== a.winRate) return b.winRate - a.winRate
      
      // 4º - Jogos juntos
      return b.matchesTogether - a.matchesTogether
    }).slice(0, 10)
  }, [partidas, jogadores])

  // Preparar dados com notas de desempenho (0-10.0)
  // Notas premiam: Constância (presença), Eficiência (aproveitamento) e Volume de Impacto
  const artilheiros = useMemo(() => {
    return getTopArtilheiros(10).map(j => {
      // Fórmula: (Aproveitamento % * 0.5) + (Média por jogo * 5)
      const aproveitamento = j.matches > 0 ? (j.wins / j.matches) * 100 : 0
      const mediaPorJogo = j.matches > 0 ? j.goals / j.matches : 0
      let nota = (aproveitamento * 0.05) + (mediaPorJogo * 5)
      
      // Penalidade por baixo volume: -20% se menos de 3 partidas
      if (j.matches < 3) nota *= 0.8
      
      // Limitar entre 0 e 10
      nota = Math.min(10, Math.max(0, nota))
      
      return {
        ...j,
        avg: nota,
        trend: j.wins > j.losses ? "up" : j.wins < j.losses ? "down" : "same"
      }
    })
  }, [getTopArtilheiros])

  const assistentes = useMemo(() => {
    return getTopAssistentes(10).map(j => {
      // Fórmula: (Aproveitamento % * 0.5) + (Média por jogo * 5)
      const aproveitamento = j.matches > 0 ? (j.wins / j.matches) * 100 : 0
      const mediaPorJogo = j.matches > 0 ? j.assists / j.matches : 0
      let nota = (aproveitamento * 0.05) + (mediaPorJogo * 5)
      
      // Penalidade por baixo volume: -20% se menos de 3 partidas
      if (j.matches < 3) nota *= 0.8
      
      // Limitar entre 0 e 10
      nota = Math.min(10, Math.max(0, nota))
      
      return {
        ...j,
        avg: nota,
        trend: j.wins > j.losses ? "up" : j.wins < j.losses ? "down" : "same"
      }
    })
  }, [getTopAssistentes])

  const goleiros = useMemo(() => {
    const mapped = getTopGoleiros(20).map(j => {
      // FORMULA DE GOLEIROS (atualizada):
      // Pontuacao = (SG * 20) + (Jogos * 10) + (Vitorias * 5) - (GolsSofridos * 2)
      const sg = j.cleanSheets || 0 // Sem Gol (Clean Sheets)
      const jogos = j.goalkeeperMatches || 0
      const vitorias = j.wins || 0
      const golsSofridos = j.goalsConceded || 0
      
      const pontuacaoTotal = (sg * 20) + (jogos * 10) + (vitorias * 5) - (golsSofridos * 2)
      
      // Nota media para exibicao (0-10)
      // Baseada na eficiencia: clean sheets / jogos * 10
      const eficiencia = jogos > 0 ? (sg / jogos) : 0
      const nota = Math.min(10, Math.max(0, eficiencia * 10))
      
      // Elegibilidade: 6+ partidas para ranking principal
      const isElegivel = jogos >= 5
      const jogosParaElegibilidade = Math.max(0, 5 - jogos)
      
      return {
        ...j,
        pontuacaoTotal,
        avg: Math.round(nota * 100) / 100,
        trend: sg > (jogos / 2) ? "up" : sg < (jogos / 3) ? "down" : "same",
        isAssiduo: jogos >= 5, // Selo de assiduidade = elegivel
        isElegivel,
        jogosParaElegibilidade
      }
    })
    
    // ORDENACAO ESTRITA: Pontuacao Total como criterio PRINCIPAL
    // A nota e apenas informativa, NAO define posicao
    return mapped.sort((a, b) => {
      // 1. Ordenar por pontuacao total (DESC) - CRITERIO PRINCIPAL
      if (b.pontuacaoTotal !== a.pontuacaoTotal) {
        return b.pontuacaoTotal - a.pontuacaoTotal
      }
      
      // Desempate 2: Mais clean sheets
      if ((b.cleanSheets || 0) !== (a.cleanSheets || 0)) {
        return (b.cleanSheets || 0) - (a.cleanSheets || 0)
      }
      
      // Desempate 3: Menos gols sofridos
      if ((a.goalsConceded || 0) !== (b.goalsConceded || 0)) {
        return (a.goalsConceded || 0) - (b.goalsConceded || 0)
      }
      
      // Desempate 4: Mais vitorias
      return (b.wins || 0) - (a.wins || 0)
    })
  }, [getTopGoleiros])
  
  // Separar goleiros elegiveis (5+ partidas) dos nao elegiveis
  const goleirosElegiveis = useMemo(() => goleiros.filter(g => g.isElegivel), [goleiros])
  const goleirosNaoElegiveis = useMemo(() => goleiros.filter(g => !g.isElegivel), [goleiros])

  // Top players para cards (com validação de array vazio)
  const topArtilheiro = artilheiros.length > 0 ? artilheiros[0] : null
  const topAssistente = assistentes.length > 0 ? assistentes[0] : null
  const topGoleiro = goleiros.length > 0 ? goleiros[0] : null
  const melhorDupla = duplasStats.length > 0 ? duplasStats[0] : null // Melhor dupla (mais vitórias juntas)

  if (isLoading) {
    return <RankingSkeleton />
  }

  return (
    <div className="space-y-8 page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Ranking <span className="text-[#D4B300]">Geral</span>
          </h1>
          <p className="text-white/70 mt-1">
            {selectedYear === "all" ? "Histórico geral" : `Temporada ${selectedYear}`}
          </p>
        </div>
        <YearFilter />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-[#D4B300]/50 theme-gold">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#D4B300]">Artilheiro</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {topArtilheiro?.nickname || topArtilheiro?.name || "-"}
                </p>
                <p className="text-sm text-white/70 mt-1">
                  {topArtilheiro?.goals || 0} gols
                </p>
              </div>
              <span className="text-4xl opacity-50 select-none">⚽</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-[#0088CC]/50 theme-blue">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#0088CC]">Mais Assistências</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {topAssistente?.nickname || topAssistente?.name || "-"}
                </p>
                <p className="text-sm text-white/70 mt-1">
                  {topAssistente?.assists || 0} assistências
                </p>
              </div>
              <span className="text-4xl opacity-50 select-none">👟</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-[#6B7280]/50 theme-graphite">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#9CA3AF]">Melhor Goleiro</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {topGoleiro?.nickname || topGoleiro?.name || "-"}
                </p>
                <p className="text-sm text-white/70 mt-1">
                  {topGoleiro?.pontuacaoTotal || 0} pts ({topGoleiro?.cleanSheets || 0} SG)
                </p>
              </div>
              <img
                src=" /goleiro-luva.png"
                alt="Melhor Goleiro"
                calssName="opacity-50 select-none object-contain invert"
                style={{ width: "45px", height: "40px" }}
              />            
            </div>
          </CardContent>
        </Card>

        {/* Card Melhor Dupla */}
        <Card className="glass-card border-[#FF6B35]/50 theme-orange">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-[#FF6B35]">Melhor Dupla</p>
                {melhorDupla && melhorDupla.player1Name && melhorDupla.player2Name ? (
                  <>
                    {/* Fotos sobrepostas */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex -space-x-2">
                        {/* Player 1 */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0088CC] to-[#006699] flex items-center justify-center overflow-hidden border-2 border-[#FF6B35]">
                          {jogadores.find(j => j.id === melhorDupla.player1Id)?.photo_url ? (
                            <Image
                              src={jogadores.find(j => j.id === melhorDupla.player1Id)?.photo_url || ''}
                              alt={melhorDupla.player1Name || 'Jogador 1'}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-bold text-white">
                              {melhorDupla.player1Name?.charAt(0) || '?'}
                            </span>
                          )}
                        </div>
                        {/* Player 2 */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0088CC] to-[#006699] flex items-center justify-center overflow-hidden border-2 border-[#FF6B35]">
                          {jogadores.find(j => j.id === melhorDupla.player2Id)?.photo_url ? (
                            <Image
                              src={jogadores.find(j => j.id === melhorDupla.player2Id)?.photo_url || ''}
                              alt={melhorDupla.player2Name || 'Jogador 2'}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-bold text-white">
                              {melhorDupla.player2Name?.charAt(0) || '?'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {melhorDupla.player1Name} & {melhorDupla.player2Name}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs text-white/70">{melhorDupla.winsTogether || 0} vitórias</span>
                      <span className="text-xs text-white/70">•</span>
                      <span className="text-xs text-white/70">{melhorDupla.matchesTogether || 0} jogos</span>
                    </div>
                  </>
                ) : (
                  <p className="text-white mt-1">-</p>
                )}
              </div>
              <img
                src=" /melhor-dupla.png"
                alt="Melhor Dupla"
                calssName="opacity-50 select-none object-contain invert"
                style={{ width: "45px", height: "40px" }}
                />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ranking Tables */}
      <Card className="glass-card border-[#D4B300]/30 md:border md:rounded-lg border-x-0 rounded-none md:mx-0 -mx-4 w-[calc(100%+2rem)] md:w-full">
        <CardHeader className="px-4 md:px-6">
          <CardTitle className="flex items-center gap-2 text-white">
            <Medal className="w-6 h-6 text-[#D4B300]" />
            Tabelas de Ranking
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 md:px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 bg-white/10 h-auto rounded-lg">
              <TabsTrigger 
                value="artilheiros"
                className="data-[state=active]:bg-[#D4B300] data-[state=active]:text-[#1a1a1a] text-white ripple-effect flex-col md:flex-row gap-1 md:gap-2 py-2"
              >
                <span className="text-2xl opacity-50 select-none">⚽</span>
                <span className="text-[10px] md:text-sm">Artilheiros</span>
              </TabsTrigger>
              <TabsTrigger 
                value="assistencias"
                className="data-[state=active]:bg-[#0088CC] data-[state=active]:text-white text-white ripple-effect flex-col md:flex-row gap-1 md:gap-2 py-2"
              >
                <span className="text-2xl opacity-50 select-none">👟</span>
                <span className="text-[10px] md:text-sm">Assistências</span>
              </TabsTrigger>
              <TabsTrigger 
                value="goleiros"
                className="data-[state=active]:bg-[#6B7280] data-[state=active]:text-white text-white ripple-effect flex-col md:flex-row gap-1 md:gap-2 py-2"
              >
                <img
                src=" /goleiro-luva.png"
                alt="Goleiros"
                calssName="opacity-50 select-none object-contain invert"
                style={{ width: "35px", height: "30px" }}
                />
                <span className="text-[10px] md:text-sm">Goleiros</span>
              </TabsTrigger>
              <TabsTrigger 
                value="duplas"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D4B300] data-[state=active]:to-[#0088CC] data-[state=active]:text-white text-white ripple-effect flex-col md:flex-row gap-1 md:gap-2 py-2"
              >
                <img
                src=" /melhor-dupla.png"
                alt="Duplas"
                calssName="opacity-50 select-none object-contain invert"
                style={{ width: "35px", height: "30px" }}
                />
                <span className="text-[10px] md:text-sm">Duplas</span>
              </TabsTrigger>
            </TabsList>

            {/* Legenda explicativa da Média */}
            <div className="mt-4 p-4 bg-gradient-to-r from-[#D4B300]/10 to-[#0088CC]/10 rounded-lg border border-[#D4B300]/30 backdrop-blur-sm">
              <div className="flex items-start gap-2">
                <Trophy className="w-5 h-5 text-[#D4B300] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-white/90 mb-2">
                    <strong className="text-[#FFD700]">Sistema de Notas (0 a 10.0)</strong>
                  </p>
                  <p className="text-xs text-white/70 leading-relaxed">
                    A <strong className="text-[#D4B300]">Nota de Desempenho</strong> reflete a{" "}
                    <strong className="text-white">constância</strong>, o{" "}
                    <strong className="text-white">volume de jogos</strong> e a{" "}
                    <strong className="text-white">eficiência técnica</strong> do jogador. 
                    Artilheiros e Assist��ncias são calculados com base em:{" "}
                    <span className="text-[#D4B300]">(Aproveitamento % × 0.5) + (Média por jogo × 5)</span>. 
                    Goleiros focam em Clean Sheets e aproveitamento. 
                    Jogadores com menos de 3 partidas têm redução automática de 20%.
                  </p>
                </div>
              </div>
            </div>

            <TabsContent value="artilheiros" className="mt-6">
              {artilheiros.length > 0 ? (
                <RankingTable
                  data={artilheiros}
                  columns={[
                    { key: "goals", label: "Gols" },
                    { key: "matches", label: "Jogos" },
                    { key: "winRate", label: "Aprov. %" },
                  ]}
                  valueKey="goals"
                  valueLabel="Média"
                  avgKey="avg"
                />
              ) : (
                <div className="py-12 text-center text-[#967948]">Nenhum dado disponível</div>
              )}
            </TabsContent>

            <TabsContent value="assistencias" className="mt-6">
              {assistentes.length > 0 ? (
                <RankingTable
                  data={assistentes}
                  columns={[
                    { key: "assists", label: "Assists" },
                    { key: "matches", label: "Jogos" },
                    { key: "winRate", label: "Aprov. %" },
                  ]}
                  valueKey="assists"
                  valueLabel="Total"
                  avgKey="avg"
                />
              ) : (
                <div className="py-12 text-center text-[#967948]">Nenhum dado disponível</div>
              )}
            </TabsContent>

<TabsContent value="goleiros" className="mt-6">
  {goleiros.length > 0 ? (
  <div className="space-y-4">
    {/* Criterios de Pontuacao */}
    <div className="bg-[#1a1a1a]/50 border border-[#D4B300]/20 rounded-lg p-4">
      <p className="text-sm font-semibold text-[#D4B300] mb-3 flex items-center gap-2">
        <Trophy className="w-4 h-4" />
        Criterios de Pontuacao
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="flex items-center gap-2 bg-green-500/10 rounded-lg px-3 py-2">
          <span className="text-green-400 font-bold">+20</span>
          <span className="text-white/80">Clean Sheet (SG)</span>
        </div>
        <div className="flex items-center gap-2 bg-blue-500/10 rounded-lg px-3 py-2">
          <span className="text-blue-400 font-bold">+10</span>
          <span className="text-white/80">Presenca (Jogo)</span>
        </div>
        <div className="flex items-center gap-2 bg-[#D4B300]/10 rounded-lg px-3 py-2">
          <span className="text-[#D4B300] font-bold">+5</span>
          <span className="text-white/80">Vitoria</span>
        </div>
        <div className="flex items-center gap-2 bg-red-500/10 rounded-lg px-3 py-2">
          <span className="text-red-400 font-bold">-2</span>
          <span className="text-white/80">Gol Sofrido</span>
        </div>
      </div>
      <p className="text-[11px] text-white/50 mt-3">
        Elegibilidade: goleiros com 6+ partidas aparecem no ranking principal. Abaixo, goleiros em desenvolvimento.
      </p>
    </div>
    
    {/* Tabela customizada para goleiros ELEGIVEIS */}
    <div className="table-scroll-container glass-table rounded-xl overflow-hidden">
      <table className="w-full min-w-[750px]">
        <thead>
          <tr className="border-b border-[#D4B300]/30">
            <th className="py-3 px-2 md:px-4 text-left text-xs md:text-sm font-semibold text-[#D4B300]">#</th>
            <th className="py-3 px-2 md:px-4 text-left text-xs md:text-sm font-semibold text-[#D4B300]">Goleiro</th>
            <th className="py-4 px-4 text-center text-sm font-semibold text-[#D4B300] bg-[#D4B300]/10 border-x border-[#D4B300]/20">
              <div className="flex items-center justify-center gap-1">
                <Trophy className="w-3 h-3" />
                Pontos
              </div>
            </th>
            <th className="py-4 px-4 text-center text-sm font-semibold text-[#D4B300]">Partidas</th>
            <th className="py-4 px-4 text-center text-sm font-semibold text-[#D4B300]">SG</th>
            <th className="py-4 px-4 text-center text-sm font-semibold text-[#D4B300]">Vitorias</th>
            <th className="py-4 px-4 text-center text-sm font-semibold text-[#D4B300]">Gols Sofr.</th>
            <th className="py-4 px-4 text-center text-sm font-semibold text-[#D4B300]">Nota</th>
            <th className="py-4 px-4 text-center text-sm font-semibold text-[#D4B300]">Tend.</th>
          </tr>
        </thead>
        <tbody>
          {goleirosElegiveis.length === 0 ? (
            <tr><td colSpan={9} className="py-8 text-center text-white/50">Nenhum goleiro com 6+ partidas ainda</td></tr>
          ) : goleirosElegiveis.map((goleiro, index) => {
            const position = index + 1
            const isTop3 = position <= 3
            
            return (
              <tr
                key={goleiro.id}
                className={cn(
                  "border-b border-white/10 transition-all hover:bg-white/5",
                  isTop3 && "bg-[#D4B300]/10"
                )}
              >
                <td className="py-4 px-4">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                    position === 1 && "bg-gradient-to-br from-[#FFD700] to-[#D4B300] text-[#1a1a1a]",
                    position === 2 && "bg-gradient-to-br from-[#C0C0C0] to-[#A0A0A0] text-[#1a1a1a]",
                    position === 3 && "bg-gradient-to-br from-[#CD7F32] to-[#8B4513] text-white",
                    position > 3 && "bg-white/20 text-white"
                  )}>
                    {position}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0088CC] to-[#006699] flex items-center justify-center overflow-hidden border-2 border-[#D4B300]/50">
                      {goleiro.photo_url ? (
                        <Image
                          src={goleiro.photo_url}
                          alt={goleiro.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-white">
                          {goleiro.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div>
                        <span className="font-medium text-white">{goleiro.nickname || goleiro.name}</span>
                        <p className="text-xs text-white/70">Goleiro</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 text-[10px] font-medium flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        Assiduo
                      </span>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-center bg-[#D4B300]/5 border-x border-[#D4B300]/10">
                  <span className="text-xl font-bold text-[#D4B300]">{goleiro.pontuacaoTotal}</span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="text-lg font-bold text-green-400">{goleiro.goalkeeperMatches}</span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="text-lg font-bold text-[#0088CC]">{goleiro.cleanSheets}</span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="text-white">{goleiro.wins}</span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="text-red-400">{goleiro.goalsConceded}</span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className={cn(
                    "text-sm font-medium px-2 py-1 rounded",
                    goleiro.avg >= 7 ? "bg-green-500/20 text-green-400" : goleiro.avg >= 5 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"
                  )}>
                    {goleiro.avg.toFixed(1)}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="flex justify-center">
                    {goleiro.trend === "up" ? (
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    ) : goleiro.trend === "down" ? (
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    ) : (
                      <Minus className="w-5 h-5 text-[#967948]" />
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>

    {/* Goleiros NAO elegiveis (menos de 6 partidas) */}
    {goleirosNaoElegiveis.length > 0 && (
      <div className="mt-6">
        <p className="text-sm text-white/50 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Em Desenvolvimento ({goleirosNaoElegiveis.length} goleiros)
        </p>
        <div className="table-scroll-container glass-table rounded-xl overflow-hidden opacity-70">
          <table className="w-full min-w-[750px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-2 px-4 text-left text-xs font-semibold text-white/50">-</th>
                <th className="py-2 px-4 text-left text-xs font-semibold text-white/50">Goleiro</th>
                <th className="py-2 px-4 text-center text-xs font-semibold text-white/50">Pontos</th>
                <th className="py-2 px-4 text-center text-xs font-semibold text-white/50">Partidas</th>
                <th className="py-2 px-4 text-center text-xs font-semibold text-white/50">SG</th>
                <th className="py-2 px-4 text-center text-xs font-semibold text-white/50">Vitorias</th>
                <th className="py-2 px-4 text-center text-xs font-semibold text-white/50">GS</th>
                <th className="py-2 px-4 text-center text-xs font-semibold text-white/50">Status</th>
              </tr>
            </thead>
            <tbody>
              {goleirosNaoElegiveis.map((goleiro) => (
                <tr key={goleiro.id} className="border-b border-white/5">
                  <td className="py-3 px-4">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/50">-</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0088CC]/50 to-[#006699]/50 flex items-center justify-center overflow-hidden border border-white/20">
                        {goleiro.photo_url ? (
                          <Image src={goleiro.photo_url} alt={goleiro.name} width={32} height={32} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-bold text-white/70">{goleiro.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}</span>
                        )}
                      </div>
                      <span className="text-sm text-white/70">{goleiro.nickname || goleiro.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-white/50">{goleiro.pontuacaoTotal}</td>
                  <td className="py-3 px-4 text-center text-white/50">{goleiro.goalkeeperMatches}</td>
                  <td className="py-3 px-4 text-center text-white/50">{goleiro.cleanSheets}</td>
                  <td className="py-3 px-4 text-center text-white/50">{goleiro.wins}</td>
                  <td className="py-3 px-4 text-center text-white/50">{goleiro.goalsConceded}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[10px] px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
                      Faltam {goleiro.jogosParaElegibilidade} jogos
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
  ) : (
  <div className="py-12 text-center text-[#967948]">Nenhum goleiro cadastrado</div>
  )}
</TabsContent>

            <TabsContent value="duplas" className="mt-6">
              {duplasStats.length > 0 ? (
                <div className="table-scroll-container glass-table rounded-xl overflow-hidden">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-[#D4B300]/30">
                        <th className="py-4 px-4 text-left text-sm font-semibold text-[#D4B300]">#</th>
                        <th className="py-4 px-4 text-left text-sm font-semibold text-[#D4B300]">Dupla</th>
                        <th className="py-4 px-4 text-center text-sm font-semibold text-[#D4B300]">Partidas Juntos</th>
                        <th className="py-4 px-4 text-center text-sm font-semibold text-[#D4B300]">Vitórias</th>
                        <th className="py-4 px-4 text-center text-sm font-semibold text-[#D4B300]">Aproveitamento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {duplasStats.map((dupla, index) => {
                        const position = index + 1
                        const isTop3 = position <= 3
                        
                        return (
                          <tr 
                            key={`${dupla.player1Id}-${dupla.player2Id}`}
                            className={cn(
                              "border-b border-white/10 transition-all hover:bg-white/5",
                              isTop3 && "bg-[#D4B300]/10"
                            )}
                          >
                            <td className="py-4 px-4">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                                position === 1 && "bg-gradient-to-br from-[#FFD700] to-[#D4B300] text-[#1a1a1a]",
                                position === 2 && "bg-gradient-to-br from-[#C0C0C0] to-[#A0A0A0] text-[#1a1a1a]",
                                position === 3 && "bg-gradient-to-br from-[#CD7F32] to-[#8B4513] text-white",
                                position > 3 && "bg-white/20 text-white"
                              )}>
                                {position}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3 bg-black/30 rounded-lg p-2 backdrop-blur-sm">
                                <div className="flex -space-x-2">
                                  {/* Player 1 */}
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C5A059] to-[#967948] flex items-center justify-center border-2 border-[#D4B300] overflow-hidden">
                                    {jogadores.find(j => j.id === dupla.player1Id)?.photo_url ? (
                                      <Image
                                        src={jogadores.find(j => j.id === dupla.player1Id)?.photo_url || ''}
                                        alt={dupla.player1Name || 'Jogador 1'}
                                        width={40}
                                        height={40}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-sm font-bold text-white">
                                        {dupla.player1Name?.charAt(0) || '?'}
                                      </span>
                                    )}
                                  </div>
                                  {/* Player 2 */}
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0088CC] to-[#006699] flex items-center justify-center border-2 border-[#D4B300] overflow-hidden">
                                    {jogadores.find(j => j.id === dupla.player2Id)?.photo_url ? (
                                      <Image
                                        src={jogadores.find(j => j.id === dupla.player2Id)?.photo_url || ''}
                                        alt={dupla.player2Name || 'Jogador 2'}
                                        width={40}
                                        height={40}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-sm font-bold text-white">
                                        {dupla.player2Name?.charAt(0) || '?'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <span className="font-bold text-[#FFFFFF]">
                                    {dupla.player1Name || 'Jogador 1'} & {dupla.player2Name || 'Jogador 2'}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-[#D4B300]/20 border border-[#D4B300]/40 text-[#FFFFFF] font-bold text-sm">
                                {dupla.matchesTogether}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/40 text-green-400 font-bold text-sm">
                                🏆 {dupla.winsTogether}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-24 h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/10">
                                  <div 
                                    className={cn(
                                      "h-full rounded-full transition-all",
                                      dupla.winRate >= 80 && "bg-gradient-to-r from-[#FFD700] to-[#D4B300]",
                                      dupla.winRate >= 60 && dupla.winRate < 80 && "bg-gradient-to-r from-[#4CAF50] to-[#388E3C]",
                                      dupla.winRate >= 40 && dupla.winRate < 60 && "bg-gradient-to-r from-[#0088CC] to-[#006699]",
                                      dupla.winRate < 40 && "bg-[#967948]"
                                    )}
                                    style={{ width: `${dupla.winRate}%` }}
                                  />
                                </div>
                                <span className={cn(
                                  "font-bold text-base min-w-[50px]",
                                  dupla.winRate >= 80 && "text-[#FFD700]",
                                  dupla.winRate >= 60 && dupla.winRate < 80 && "text-green-400",
                                  dupla.winRate >= 40 && dupla.winRate < 60 && "text-[#0088CC]",
                                  dupla.winRate < 40 && "text-[#967948]"
                                )}>
                                  {dupla.winRate}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Users2 className="w-12 h-12 text-[#967948]/30 mx-auto mb-4" />
                  <p className="text-[#967948]">Nenhuma dupla com partidas suficientes encontrada</p>
                  <p className="text-xs text-[#967948]/70 mt-1">São necessárias pelo menos 2 partidas juntos</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
