"use client"

import { useMemo } from "react"
import Image from "next/image"
import { Table2, Trophy, TrendingUp, Goal, Shield, HandHelping, Star } from "lucide-react"
import { useData, type JogadorStats } from "@/contexts/data-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { YearFilter } from "@/components/year-filter"
import { cn } from "@/lib/utils"

function FormBadge({ result }: { result: string }) {
  const colors: Record<string, string> = {
    W: "bg-green-500 text-white",
    D: "bg-[#C5A059] text-[#1a1a1a]",
    L: "bg-red-500 text-white",
  }
  
  return (
    <span className={cn(
      "w-6 h-6 rounded text-xs font-bold flex items-center justify-center",
      colors[result]
    )}>
      {result}
    </span>
  )
}

function PositionBadge({ position }: { position: string }) {
  const colors: Record<string, string> = {
    Atacante: "bg-red-500/20 text-red-600",
    Meia: "bg-[#0088CC]/20 text-[#0088CC]",
    Lateral: "bg-green-500/20 text-green-600",
    Zagueiro: "bg-[#967948]/20 text-[#967948]",
    Volante: "bg-orange-500/20 text-orange-600",
    Goleiro: "bg-[#C5A059]/20 text-[#C5A059]",
  }
  
  return (
    <span className={cn(
      "px-2 py-1 rounded text-xs font-medium",
      colors[position] || "bg-[#E5E0D8] text-[#967948]"
    )}>
      {position}
    </span>
  )
}

// Calcular forma (W/D/L) baseado nas últimas partidas
function getPlayerForm(jogador: JogadorStats, partidas: ReturnType<typeof useData>["partidas"]): string[] {
  const playerMatches: { date: string; result: "W" | "D" | "L" }[] = []
  
  partidas
    .filter(p => p.status === "finalizado")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .forEach(partida => {
      const partidaJogadores = partida.partida_jogadores || []
      const playerInMatch = partidaJogadores.find(pj => pj.jogador_id === jogador.id)
      
      if (playerInMatch) {
        let result: "W" | "D" | "L"
        if (playerInMatch.team === "A") {
          result = partida.score_a > partida.score_b ? "W" : partida.score_a === partida.score_b ? "D" : "L"
        } else {
          result = partida.score_b > partida.score_a ? "W" : partida.score_a === partida.score_b ? "D" : "L"
        }
        playerMatches.push({ date: partida.date, result })
      }
    })
  
  return playerMatches.slice(0, 5).map(m => m.result)
}

export default function TabelaPage() {
  const { getJogadorStatsByYear, getFilteredPartidas, selectedYear, isLoading } = useData()

  // Preparar dados da tabela com pontos e forma (filtrados por ano)
  const tabelaGeral = useMemo(() => {
    const jogadorStats = getJogadorStatsByYear()
    const filteredPartidas = getFilteredPartidas()
    
    return jogadorStats
      .filter(j => j.status === "active")
      .map(jogador => {
        return {
          ...jogador,
          points: jogador.totalPoints,
          form: getPlayerForm(jogador, filteredPartidas),
        }
      })
      .sort((a, b) => {
        // REGRA 1: Jogadores com 0 partidas vão para o final (lanternas)
        if (a.matches === 0 && b.matches === 0) {
          // Ambos com 0 partidas: ordenar alfabeticamente
          return a.name.localeCompare(b.name)
        }
        if (a.matches === 0) return 1  // a vai para o final
        if (b.matches === 0) return -1 // b vai para o final

        // REGRA 2: Hierarquia de Performance (critérios de desempate)
        // 1º - Pontos (principal)
        if (a.points !== b.points) return b.points - a.points
        
        // 2º - Mais Jogos (Presença)
        if (a.matches !== b.matches) return b.matches - a.matches
        
        // 3º - Mais Gols (Artilharia)
        if (a.goals !== b.goals) return b.goals - a.goals
        
        // 4º - Mais Vitórias
        if (a.wins !== b.wins) return b.wins - a.wins
        
        // 5º - Mais Assistências
        if (a.assists !== b.assists) return b.assists - a.assists
        
        // 6º - Melhor Pontuação de Goleiro (se aplicável)
        if (a.goalkeeperBonus !== b.goalkeeperBonus) return b.goalkeeperBonus - a.goalkeeperBonus
        
        // 7º - Mais Empates
        if (a.draws !== b.draws) return b.draws - a.draws
        
        // 8º - Ordem alfabética (caso todos critérios sejam iguais)
        return a.name.localeCompare(b.name)
      })
  }, [getJogadorStatsByYear, getFilteredPartidas])

  // Calcular estatísticas gerais (filtradas por ano)
  const stats = useMemo(() => {
    const jogadorStats = getJogadorStatsByYear()
    const totalGoals = jogadorStats.reduce((sum, p) => sum + p.goals, 0)
    const totalAssists = jogadorStats.reduce((sum, p) => sum + p.assists, 0)
    const activeStats = jogadorStats.filter(j => j.status === "active")
    const topScorer = activeStats.length > 0 
      ? activeStats.reduce((max, p) => p.goals > max.goals ? p : max, activeStats[0])
      : null
    const topAssister = activeStats.length > 0
      ? activeStats.reduce((max, p) => p.assists > max.assists ? p : max, activeStats[0])
      : null

    return { totalGoals, totalAssists, topScorer, topAssister }
  }, [getJogadorStatsByYear])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C5A059]" />
      </div>
    )
  }

  return (
    <div className="space-y-8 page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Tabela <span className="text-[#D4B300]">Geral</span>
          </h1>
          <p className="text-white/70 mt-1">
            {selectedYear === "all" ? "Histórico geral" : `Temporada ${selectedYear}`}
          </p>
        </div>
        <YearFilter />
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card border-[#D4B300]/30">
          <CardContent className="p-4 text-center">
            <Goal className="w-8 h-8 mx-auto text-[#D4B300]" />
            <p className="text-2xl font-bold text-white mt-2">{stats.totalGoals}</p>
            <p className="text-sm text-white/70">Gols Totais</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-[#0088CC]/30">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 mx-auto text-[#0088CC]" />
            <p className="text-2xl font-bold text-white mt-2">{stats.totalAssists}</p>
            <p className="text-sm text-white/70">Assistências</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-[#FFD700]/30">
          <CardContent className="p-4 text-center">
            <Trophy className="w-8 h-8 mx-auto text-[#FFD700]" />
            <p className="text-lg font-bold text-white mt-2 truncate">
              {stats.topScorer?.nickname || stats.topScorer?.name || "-"}
            </p>
            <p className="text-sm text-white/70">Artilheiro</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-[#6B7280]/30">
          <CardContent className="p-4 text-center">
            <Shield className="w-8 h-8 mx-auto text-[#69bb66]" />
            <p className="text-lg font-bold text-white mt-2 truncate">
              {stats.topAssister?.nickname || stats.topAssister?.name || "-"}
            </p>
            <p className="text-sm text-white/70">Mais Assists</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="glass-card border-[#D4B300]/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Table2 className="w-6 h-6 text-[#D4B300]" />
            Classificação Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Legenda no topo com fórmula de pontuação */}
          <div className="mb-6 pb-4 border-b border-white/20">
            <p className="text-sm font-medium text-white mb-2">Legenda e Pontuacao:</p>
            
            {/* Icones de Indicadores */}
            <div className="flex flex-wrap gap-4 mb-3 p-3 bg-gradient-to-r from-[#D4B300]/10 to-transparent rounded-lg border border-[#D4B300]/20">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#FFD700] flex items-center justify-center">
                  <Goal className="w-3.5 h-3.5 text-black" />
                </div>
                <span className="text-sm text-white/80">Artilheiro da rodada</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#0088CC] flex items-center justify-center">
                  <HandHelping className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm text-white/80">Garcom da rodada</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center">
                  <Star className="w-3.5 h-3.5 text-black" />
                </div>
                <span className="text-sm text-white/80">MVP (Melhor em Campo)</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 text-sm text-white/70 mb-2">
              <span>J = Jogos</span>
              <span className="text-[#D4B300] font-medium">V = Vitoria (+3 pts)</span>
              <span className="text-white/70 font-medium">E = Empate (+1 pt)</span>
              <span className="text-[#D4B300] font-medium">G = Gol (+2 pts)</span>
              <span className="text-[#0088CC] font-medium">A = Assistencia (+1 pt)</span>
            </div>
            <div className="text-sm text-white/70 mb-3 bg-white/10 p-2 rounded space-y-1">
              <div>
                <span className="font-medium text-white">Pts GOL (Pontos de Goleiro):</span> Partida (+1 pt) + Bonus de Defesa (0 gols: +3 | 1 gol: +2 | 2 gols: +1 | 3+: 0)
              </div>
              <div className="text-xs text-white/70">
                Formula: <span className="font-medium text-white">Pts = (G x 2) + (A x 1) + (V x 3) + (E x 1) + Pts GOL</span>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1">
                <FormBadge result="W" />
                <span className="text-sm text-white/70">Vitoria</span>
              </div>
              <div className="flex items-center gap-1">
                <FormBadge result="D" />
                <span className="text-sm text-white/70">Empate</span>
              </div>
              <div className="flex items-center gap-1">
                <FormBadge result="L" />
                <span className="text-sm text-white/70">Derrota</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto glass-table rounded-xl">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#D4B300]/30">
                  <th className="py-4 px-3 text-left text-sm font-semibold text-[#D4B300]">#</th>
                  <th className="py-4 px-3 text-left text-sm font-semibold text-[#D4B300]">Jogador</th>
                  <th className="py-4 px-3 text-center text-sm font-semibold text-[#D4B300]">Posição</th>
                  <th className="py-4 px-3 text-center text-sm font-semibold text-[#D4B300]">J</th>
                  <th className="py-4 px-3 text-center text-sm font-semibold text-[#D4B300]">G</th>
                  <th className="py-4 px-3 text-center text-sm font-semibold text-[#D4B300]">A</th>
                  <th className="py-4 px-3 text-center text-sm font-semibold text-[#D4B300]">V</th>
                  <th className="py-4 px-3 text-center text-sm font-semibold text-[#D4B300]">E</th>
                  <th className="py-4 px-3 text-center text-sm font-semibold text-[#D4B300]" title="Pontos de Goleiro">Pts GOL</th>
                  <th className="py-4 px-3 text-center text-sm font-semibold text-[#D4B300]">Forma</th>
                  <th className="py-4 px-3 text-center text-sm font-semibold text-[#D4B300]">Pts</th>
                </tr>
              </thead>
              <tbody>
                {tabelaGeral.map((player, index) => {
                  const position = index + 1
                  const isTop3 = position <= 3
                  
                  return (
                    <tr 
                      key={player.id}
                      className={cn(
                        "border-b border-white/10 transition-all hover:bg-white/5",
                        isTop3 && "bg-[#D4B300]/10"
                      )}
                    >
                      <td className="py-4 px-3">
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
                  <td className="py-4 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0088CC] to-[#006699] flex items-center justify-center overflow-hidden border-2 border-[#D4B300]/50">
                        {player.photo_url ? (
                          <Image
                            src={player.photo_url}
                            alt={player.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-bold text-white">
                            {player.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </span>
                        )}
                      </div>
                      <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{player.nickname || player.name}</span>
                              <span className="px-1.5 py-0.5 rounded bg-[#D4B300]/20 border border-[#D4B300]/40 text-[#FFD700] text-xs font-bold">
                                {player.rating} OVR
                              </span>
                            </div>
                            <p className="text-xs text-white/70">{player.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <PositionBadge position={player.position} />
                      </td>
                      <td className="py-4 px-3 text-center text-white">{player.matches}</td>
                      <td className="py-4 px-3 text-center">
                        <span className="font-bold text-[#D4B300]">{player.goals}</span>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span className="font-bold text-[#0088CC]">{player.assists}</span>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span className="font-medium text-green-400">{player.wins}</span>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span className="font-medium text-white/70">{player.draws}</span>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span className={cn(
                          "font-medium",
                          (player.goalkeeperMatches + player.goalkeeperBonus) > 0 ? "text-[#D4B300]" : "text-white/50"
                        )}>
                          {player.goalkeeperMatches + player.goalkeeperBonus}
                        </span>
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex justify-center gap-1">
                          {player.form.length > 0 ? (
                            player.form.map((result, i) => (
                              <FormBadge key={i} result={result} />
                            ))
                          ) : (
                            <span className="text-xs text-white/50">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span className="inline-flex items-center justify-center w-12 h-8 rounded-lg bg-[#D4B300]/30 text-[#D4B300] font-bold">
                          {player.points}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
        </CardContent>
      </Card>
    </div>
  )
}
