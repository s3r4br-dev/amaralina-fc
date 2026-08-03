"use client"

import { useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { useData, type PlayerStat } from "@/contexts/data-context"
import { 
  Calendar, Clock, Trophy, Plus, Pencil, Trash2, X, 
  ChevronDown, ChevronUp, Filter, Users, HandHelping, Shield, Goal, 
  Footprints, CircleDot, Flag, CheckCircle2, Star, TrendingUp
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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
import { MatchCardSkeleton, PageHeaderSkeleton } from "@/components/skeletons"

function formatDate(dateStr: string) {
  // Adiciona o horário local para impedir que o fuso puxe para o dia anterior
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function getMonthYear(dateStr: string) {
  // Adiciona o horário local aqui também para garantir o mês correto
  const date = new Date(dateStr + 'T12:00:00');
  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  }
}

const months = [
  { value: "all", label: "Todos os Meses" },
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
]

export default function PartidasPage() {
  const { isAdmin } = useAuth()
  const { partidas, jogadores, addPartida, updatePartida, deletePartida, selectedYear, setSelectedYear, availableYears, isLoading } = useData()
  
  const [showAll, setShowAll] = useState(false)
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState("all")
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingPartida, setEditingPartida] = useState<typeof partidas[0] | null>(null)
  const [deletingPartida, setDeletingPartida] = useState<typeof partidas[0] | null>(null)
  
  // Form states
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    teamAName: "",
    teamBName: "",
  })
  const [playersTeamA, setPlayersTeamA] = useState<PlayerStat[]>([])
  const [playersTeamB, setPlayersTeamB] = useState<PlayerStat[]>([])
  
  // MVP, Melhor Defensor e Melhor Goleiro
  const [mvpPlayerId, setMvpPlayerId] = useState<number | null>(null)
  const [bestZagueiroTeamA, setBestZagueiroTeamA] = useState<number | null>(null)
  const [bestLateralTeamA, setBestLateralTeamA] = useState<number | null>(null)
  const [bestZagueiroTeamB, setBestZagueiroTeamB] = useState<number | null>(null)
  const [bestLateralTeamB, setBestLateralTeamB] = useState<number | null>(null)
  const [bestGoalkeeperId, setBestGoalkeeperId] = useState<number | null>(null) // Melhor Goleiro da partida

  // Filter partidas
  const filteredPartidas = useMemo(() => {
    return partidas
      .filter(p => p.status === "finalizado")
      .filter(p => {
        const { month, year } = getMonthYear(p.date)
        const matchMonth = selectedMonth === "all" || month === parseInt(selectedMonth)
        const matchYear = selectedYear === "all" || year === parseInt(selectedYear)
        return matchMonth && matchYear
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [partidas, selectedMonth, selectedYear])

  const displayedPartidas = showAll ? filteredPartidas : filteredPartidas.slice(0, 5)

  // Handlers
  
  // Calcular MVP automaticamente: Gols x2 + Assists x1 + Bônus de Goleiro
  const calculateMVP = () => {
    const allPlayers = [...playersTeamA, ...playersTeamB]
    let bestPlayer = allPlayers[0]
    let bestScore = 0
    
    allPlayers.forEach(p => {
      const baseScore = (p.goals * 2) + (p.assists * 1)
      // Bônus goleiro: +2 pontos se não tomou gol
      const goalkeeperBonus = p.isGoalkeeper && p.goalsConceded === 0 ? 2 : 0
      const totalScore = baseScore + goalkeeperBonus
      
      if (totalScore > bestScore) {
        bestScore = totalScore
        bestPlayer = p
      }
    })
    
    return bestPlayer?.playerId || null
  }
  
  const handleOpenAddModal = () => {
    setEditingPartida(null)
    setFormData({ date: "", time: "", teamAName: "", teamBName: "" })
    setPlayersTeamA([])
    setPlayersTeamB([])
    setMvpPlayerId(null)
    setBestZagueiroTeamA(null)
    setBestLateralTeamA(null)
    setBestZagueiroTeamB(null)
    setBestLateralTeamB(null)
    setBestGoalkeeperId(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (partida: typeof partidas[0]) => {
    setEditingPartida(partida)
    setFormData({
      date: partida.date,
      time: partida.time,
      teamAName: partida.team_a_name,
      teamBName: partida.team_b_name,
    })
    // Converter partida_jogadores para o formato do form (incluindo terminouNoTime)
    const teamA: PlayerStat[] = []
    const teamB: PlayerStat[] = []
    
    // Variáveis para carregar MVP, melhores defensores e melhor goleiro salvos
    let savedMvpId: number | null = null
    let savedBestZagA: number | null = null
    let savedBestLatA: number | null = null
    let savedBestZagB: number | null = null
    let savedBestLatB: number | null = null
    let savedBestGoalkeeper: number | null = null
    
    ;(partida.partida_jogadores || []).forEach(pj => {
      const jogador = (jogadores || []).find(j => j.id === pj.jogador_id)
      const player: PlayerStat = {
        playerId: pj.jogador_id,
        playerName: jogador?.nickname || jogador?.name || "Desconhecido",
        goals: pj.goals,
        assists: pj.assists,
        isGoalkeeper: pj.is_goalkeeper,
        goalsConceded: pj.goals_conceded,
        terminouNoTime: pj.terminou_no_time ?? true, // Carrega do banco
        isMvp: pj.is_mvp ?? false,
        bestPositionType: pj.best_position_type ?? null,
      }
      
      // Carregar MVP salvo
      if (pj.is_mvp) {
        savedMvpId = pj.jogador_id
      }
      
      // Carregar melhores defensores por time
      if (pj.is_best_defender && pj.team === "A") {
        if (pj.best_position_type === "zagueiro") savedBestZagA = pj.jogador_id
        if (pj.best_position_type === "lateral") savedBestLatA = pj.jogador_id
      }
      if (pj.is_best_defender && pj.team === "B") {
        if (pj.best_position_type === "zagueiro") savedBestZagB = pj.jogador_id
        if (pj.best_position_type === "lateral") savedBestLatB = pj.jogador_id
      }
      
      // Carregar Melhor Goleiro
      if ((pj as any).is_best_goalkeeper) {
        savedBestGoalkeeper = pj.jogador_id
      }
      
      if (pj.team === "A") teamA.push(player)
      else teamB.push(player)
    })
    
    setPlayersTeamA(teamA)
    setPlayersTeamB(teamB)
    
    // Restaurar estados de MVP, melhores defensores e melhor goleiro
    setMvpPlayerId(savedMvpId)
    setBestZagueiroTeamA(savedBestZagA)
    setBestLateralTeamA(savedBestLatA)
    setBestZagueiroTeamB(savedBestZagB)
    setBestLateralTeamB(savedBestLatB)
    setBestGoalkeeperId(savedBestGoalkeeper)
    
    setIsModalOpen(true)
  }

  const handleOpenDeleteDialog = (partida: typeof partidas[0]) => {
    setDeletingPartida(partida)
    setIsDeleteDialogOpen(true)
  }

  const handleAddPlayerToTeam = (team: "A" | "B", playerId: string) => {
    if (playerId === "none") return
    const numericId = parseInt(playerId)
    const player = (jogadores || []).find(p => p.id === numericId)
    if (!player) return

    // Verificar se jogador ja esta no outro time
    const existsInOtherTeam = team === "A" 
      ? playersTeamB.find(p => p.playerId === player.id)
      : playersTeamA.find(p => p.playerId === player.id)

    const newPlayer: PlayerStat = {
      playerId: player.id,
      playerName: player.nickname || player.name,
      goals: 0,
      assists: 0,
      isGoalkeeper: player.position === "Goleiro",
      goalsConceded: 0,
      // Se ja existe no outro time, "terminou" sera false aqui (ja marcado no outro)
      // Se nao existe em nenhum, marca como true (padrao: terminou onde foi adicionado primeiro)
      terminouNoTime: !existsInOtherTeam,
    }

    if (team === "A") {
      if (!playersTeamA.find(p => p.playerId === player.id)) {
        setPlayersTeamA(prev => [...prev, newPlayer])
      }
    } else {
      if (!playersTeamB.find(p => p.playerId === player.id)) {
        setPlayersTeamB(prev => [...prev, newPlayer])
      }
    }
  }

  const handleRemovePlayer = (team: "A" | "B", playerId: number) => {
    if (team === "A") {
      setPlayersTeamA(prev => prev.filter(p => p.playerId !== playerId))
    } else {
      setPlayersTeamB(prev => prev.filter(p => p.playerId !== playerId))
    }
  }

  const handleUpdatePlayerStats = (
    team: "A" | "B",
    playerId: number,
    field: "goals" | "assists" | "isGoalkeeper" | "goalsConceded" | "terminouNoTime",
    value: number | boolean
  ) => {
    // Logica especial para "terminouNoTime" - exclusao mutua entre times
    if (field === "terminouNoTime" && value === true) {
      // Quando marca "terminou aqui" em um time, desmarca no outro
      if (team === "A") {
        // Marca no Time A, desmarca no Time B
        setPlayersTeamA(prev => prev.map(p => 
          p.playerId === playerId ? { ...p, terminouNoTime: true } : p
        ))
        setPlayersTeamB(prev => prev.map(p => 
          p.playerId === playerId ? { ...p, terminouNoTime: false } : p
        ))
      } else {
        // Marca no Time B, desmarca no Time A
        setPlayersTeamB(prev => prev.map(p => 
          p.playerId === playerId ? { ...p, terminouNoTime: true } : p
        ))
        setPlayersTeamA(prev => prev.map(p => 
          p.playerId === playerId ? { ...p, terminouNoTime: false } : p
        ))
      }
      return
    }

    const updateFn = (players: PlayerStat[]) =>
      players.map(p =>
        p.playerId === playerId ? { ...p, [field]: value } : p
      )

    if (team === "A") {
      setPlayersTeamA(updateFn)
    } else {
      setPlayersTeamB(updateFn)
    }
  }

  const [isSaving, setIsSaving] = useState(false)
  
  // Supabase client para atualizar pontuacao dos tecnicos
  const supabase = createClient()

  // ===============================================================
  // FUNCAO DE CALCULO DE PONTUACAO DOS TECNICOS (AUTOMACAO IDEMPOTENTE)
  // ===============================================================
  // Regras de Pontuacao:
  // - Escalou o jogador (Participacao): +2 pontos
  // - Acertou Gol exato: +5 pontos
  // - Acertou Assistencia exata: +4 pontos
  // - Acertou Selo MVP: +10 pontos
  // - Acertou Selo Melhor Zagueiro: +8 pontos
  // - Acertou Selo Melhor Lateral: +8 pontos
  // - Acertou Selo Melhor Goleiro: +8 pontos
  // - Acertou Gols Sofridos (goleiro): +5 pontos
  // 
  // IDEMPOTENTE: Usa tabela pontuacao_partida para rastrear pontos por partida
  // Pode re-salvar a mesma partida sem duplicar pontos
  // ===============================================================
  // ================================================================
  // CALCULO DE PONTUACAO - FLUXO SEQUENCIAL BLINDADO
  // ================================================================
  // PASSO 1: Soma de CREDITOS (participacao + acertos)
  // PASSO 2: Soma de DEBITOS (penalidades por erros)
  // PASSO 3: Saldo = Creditos - Debitos
  // ================================================================
  // TABELA DE PONTUACAO (mesma do PalpitePopover):
  // CREDITOS: Escalado +5, PalpiteResultado +5, Gols +3, Assists +2, MVP +10, MelhorZag +5, MelhorLat +5, MelhorGol +10, GolsSofridos +5
  // DEBITOS: NaoJogou -5, PalpiteResultadoErro -5, Gols erro -5/diff, Assists erro -3/diff, MVP erro -5, Selos erro -3
  // NEUTRO: Borda amarela (sem palpite resultado) = 0 pts
  // ================================================================
  const calcularPontuacaoTecnicos = async (partidaId: number, partidaJogadores: any[], scoreA: number, scoreB: number) => {
    try {
      // 1. Buscar todas as escalacoes dos tecnicos
      const { data: escalacoes, error: escError } = await supabase
        .from("escalacoes_palpites")
        .select("*")
      
      if (escError || !escalacoes) {
        console.error("[v0] Erro ao buscar escalacoes:", escError)
        return
      }
      
      // 2. Para cada tecnico, calcular pontos desta partida especifica
      for (const escalacao of escalacoes) {
        let creditos = 0
        let debitos = 0
        const detalhes: any[] = []
        const palpites = escalacao.jogadores || []
        const jogadorExtra = escalacao.jogador_extra
        
        // Combinar palpites titulares + extra
        const todosPalpites = [...palpites]
        if (jogadorExtra) {
          todosPalpites.push(jogadorExtra)
        }
        
        // 3. Para cada jogador palpitado, calcular creditos e debitos
        for (const palpite of todosPalpites) {
          const dadosReais = partidaJogadores.find(pj => pj.jogador_id === palpite.jogadorId)
          
          // ========== CREDITOS ==========
          if (dadosReais) {
            // Participacao: +5 pts
            creditos += 5
            detalhes.push({ jogadorId: palpite.jogadorId, tipo: 'participacao', pontos: 5, categoria: 'credito' })
            
            // Palpite de Resultado (Vitoria/Derrota)
            // Borda amarela (resultadoPrevisto = null) = 0 pts
            if (palpite.resultadoPrevisto) {
              const teamJogador = dadosReais.team // 'A' ou 'B'
              let resultadoReal: "vitoria" | "derrota" | "empate" = "empate"
              if (teamJogador === 'A') {
                if (scoreA > scoreB) resultadoReal = "vitoria"
                else if (scoreA < scoreB) resultadoReal = "derrota"
              } else {
                if (scoreB > scoreA) resultadoReal = "vitoria"
                else if (scoreB < scoreA) resultadoReal = "derrota"
              }
              
              if (palpite.resultadoPrevisto === resultadoReal) {
                creditos += 5
                detalhes.push({ jogadorId: palpite.jogadorId, tipo: 'palpite_resultado', pontos: 5, categoria: 'credito' })
              } else {
                debitos += 5
                detalhes.push({ jogadorId: palpite.jogadorId, tipo: 'palpite_resultado_erro', pontos: -5, categoria: 'debito' })
              }
            }
            // Se resultadoPrevisto = null (borda amarela), nao soma nem subtrai
            
            if (!palpite.isGoleiro && !dadosReais.is_goalkeeper) {
              const golsPalpite = palpite.gols || 0
              const assistsPalpite = palpite.assistencias || 0
              
              // Gols acerto: +3 pts (apenas se palpite > 0)
              if (golsPalpite > 0 && golsPalpite === dadosReais.goals) {
                creditos += 3
                detalhes.push({ jogadorId: palpite.jogadorId, tipo: 'gols', pontos: 3, categoria: 'credito' })
              }
              
              // Assists acerto: +2 pts (apenas se palpite > 0)
              if (assistsPalpite > 0 && assistsPalpite === dadosReais.assists) {
                creditos += 2
                detalhes.push({ jogadorId: palpite.jogadorId, tipo: 'assists', pontos: 2, categoria: 'credito' })
              }
            }
            
            // Goleiro: gols sofridos acerto +5
            if (palpite.isGoleiro && dadosReais.is_goalkeeper && palpite.golsSofridos === dadosReais.goals_conceded) {
              creditos += 5
              detalhes.push({ jogadorId: palpite.jogadorId, tipo: 'gols_sofridos', pontos: 5, categoria: 'credito' })
            }
            
            // Selos acertos: MVP +10, outros +5
            if (palpite.isMvp && dadosReais.is_mvp) {
              creditos += 10
              detalhes.push({ jogadorId: palpite.jogadorId, tipo: 'mvp', pontos: 10, categoria: 'credito' })
            }
            if (palpite.isMelhorZag && dadosReais.is_best_defender && dadosReais.best_position_type === 'zagueiro') {
              creditos += 5 // Melhor Zagueiro: +5 pts (Joãozinho = 5+5 = 10)
              detalhes.push({ jogadorId: palpite.jogadorId, tipo: 'melhor_zag', pontos: 5, categoria: 'credito' })
            }
            if (palpite.isMelhorLat && dadosReais.is_best_defender && dadosReais.best_position_type === 'lateral') {
              creditos += 5 // Melhor Lateral: +5 pts
              detalhes.push({ jogadorId: palpite.jogadorId, tipo: 'melhor_lat', pontos: 5, categoria: 'credito' })
            }
            if (palpite.isMelhorGol && dadosReais.is_best_goalkeeper) {
              creditos += 10 // Melhor Goleiro: +10 pts (7+3 bonus)
              detalhes.push({ jogadorId: palpite.jogadorId, tipo: 'melhor_gol', pontos: 10, categoria: 'credito' })
            }
          }
          
          // ========== DEBITOS ==========
          if (!dadosReais) {
            // Jogador nao participou: -5 pts
            debitos += 5
            detalhes.push({ jogadorId: palpite.jogadorId, tipo: 'nao_participou', pontos: -5, categoria: 'debito' })
          } else {
            // Erros de gols/assists
            if (!palpite.isGoleiro && !dadosReais.is_goalkeeper) {
              const golsPalpite = palpite.gols || 0
              const assistsPalpite = palpite.assistencias || 0
              
              // Gols erro: -5 por diferenca (apenas se palpite > 0)
              if (golsPalpite > 0 && golsPalpite !== dadosReais.goals) {
                const diff = Math.abs(golsPalpite - (dadosReais.goals || 0))
                debitos += 5 * diff
                detalhes.push({ jogadorId: palpite.jogadorId, tipo: 'gols_erro', pontos: -(5 * diff), categoria: 'debito' })
              }
              
              // Assists erro: -3 por diferenca (apenas se palpite > 0)
              if (assistsPalpite > 0 && assistsPalpite !== dadosReais.assists) {
                const diff = Math.abs(assistsPalpite - (dadosReais.assists || 0))
                debitos += 3 * diff
                detalhes.push({ jogadorId: palpite.jogadorId, tipo: 'assists_erro', pontos: -(3 * diff), categoria: 'debito' })
              }
            }
            
            // Goleiro erro: -3 pts
            if (palpite.isGoleiro && dadosReais.is_goalkeeper && palpite.golsSofridos !== dadosReais.goals_conceded) {
              debitos += 3
              detalhes.push({ jogadorId: palpite.jogadorId, tipo: 'gols_sofridos_erro', pontos: -3, categoria: 'debito' })
            }
            
            // Selos erros: MVP -5, outros -3
            if (palpite.isMvp && !dadosReais.is_mvp) {
              debitos += 5
              detalhes.push({ jogadorId: palpite.jogadorId, tipo: 'mvp_erro', pontos: -5, categoria: 'debito' })
            }
            if (palpite.isMelhorZag && !(dadosReais.is_best_defender && dadosReais.best_position_type === 'zagueiro')) {
              debitos += 3
              detalhes.push({ jogadorId: palpite.jogadorId, tipo: 'melhor_zag_erro', pontos: -3, categoria: 'debito' })
            }
            if (palpite.isMelhorLat && !(dadosReais.is_best_defender && dadosReais.best_position_type === 'lateral')) {
              debitos += 3
              detalhes.push({ jogadorId: palpite.jogadorId, tipo: 'melhor_lat_erro', pontos: -3, categoria: 'debito' })
            }
            if (palpite.isMelhorGol && !dadosReais.is_best_goalkeeper) {
              debitos += 3
              detalhes.push({ jogadorId: palpite.jogadorId, tipo: 'melhor_gol_erro', pontos: -3, categoria: 'debito' })
            }
          }
        }
        
        // PASSO 3: Saldo = Creditos - Debitos
        const pontosPartida = creditos - debitos
        
        // 4. Salvar/Atualizar na tabela pontuacao_partida (UPSERT para idempotencia)
        await supabase
          .from("pontuacao_partida")
          .upsert({
            partida_id: partidaId,
            user_id: escalacao.user_id,
            pontos: pontosPartida,
            detalhes: { creditos, debitos, saldo: pontosPartida, items: detalhes },
            updated_at: new Date().toISOString()
          }, { onConflict: "partida_id,user_id" })
        
        // 5. Recalcular pontos totais (soma de todas as partidas + saldo base)
        const { data: todasPontuacoes } = await supabase
          .from("pontuacao_partida")
          .select("pontos")
          .eq("user_id", escalacao.user_id)
        
        const pontosDePartidas = (todasPontuacoes || []).reduce((sum, p) => sum + (p.pontos || 0), 0)
        
        // Saldo base = taxas pagas
        const taxaPaga = (escalacao as any).taxa_paga ? -10 : 0
        const jogadorExtraPago = (escalacao as any).jogador_extra_pago ? -15 : 0
        const saldoBase = taxaPaga + jogadorExtraPago
        const novosPontosTotais = saldoBase + pontosDePartidas
        
        await supabase
          .from("escalacoes_palpites")
          .update({ pontos_totais: novosPontosTotais })
          .eq("user_id", escalacao.user_id)
      }
    } catch (error) {
      console.error("[v0] Erro ao calcular pontuacao dos tecnicos:", error)
    }
  }

  const handleSavePartida = async () => {
    if (!formData.date || !formData.time || !formData.teamAName || !formData.teamBName) {
      alert("Por favor, preencha todos os campos obrigatorios.")
      return
    }

    if (isSaving) return // Evita duplo clique
    setIsSaving(true)

    const scoreA = playersTeamA.reduce((sum, p) => sum + p.goals, 0)
    const scoreB = playersTeamB.reduce((sum, p) => sum + p.goals, 0)

    // Converter players para formato do banco (incluindo terminou_no_time e MVP/defensor)
    // Cada entrada e unica: mesmo jogador em times diferentes gera 2 linhas distintas
    const partidaJogadores = [
      ...playersTeamA.map(p => ({
        jogador_id: p.playerId,
        team: "A" as const,
        goals: p.goals,
        assists: p.assists,
        is_goalkeeper: p.isGoalkeeper,
        goals_conceded: p.goalsConceded,
        terminou_no_time: p.terminouNoTime ?? true,
        is_mvp: p.playerId === mvpPlayerId,
        is_best_defender: p.playerId === bestZagueiroTeamA || p.playerId === bestLateralTeamA,
        best_position_type: p.playerId === bestZagueiroTeamA ? 'zagueiro' : (p.playerId === bestLateralTeamA ? 'lateral' : null),
        is_best_goalkeeper: p.playerId === bestGoalkeeperId,
      })),
      ...playersTeamB.map(p => ({
        jogador_id: p.playerId,
        team: "B" as const,
        goals: p.goals,
        assists: p.assists,
        is_goalkeeper: p.isGoalkeeper,
        goals_conceded: p.goalsConceded,
        terminou_no_time: p.terminouNoTime ?? true,
        is_mvp: p.playerId === mvpPlayerId,
        is_best_defender: p.playerId === bestZagueiroTeamB || p.playerId === bestLateralTeamB,
        best_position_type: p.playerId === bestZagueiroTeamB ? 'zagueiro' : (p.playerId === bestLateralTeamB ? 'lateral' : null),
        is_best_goalkeeper: p.playerId === bestGoalkeeperId,
      })),
    ]

    try {
      let partidaId: number
      
      if (editingPartida) {
        await updatePartida(editingPartida.id, {
          date: formData.date,
          time: formData.time,
          team_a_name: formData.teamAName,
          team_b_name: formData.teamBName,
          score_a: scoreA,
          score_b: scoreB,
        }, partidaJogadores)
        partidaId = editingPartida.id
      } else {
        // Adicionar partida e buscar o ID criado
        await addPartida({
          date: formData.date,
          time: formData.time,
          team_a_name: formData.teamAName,
          team_b_name: formData.teamBName,
          score_a: scoreA,
          score_b: scoreB,
          status: "finalizado",
        }, partidaJogadores)
        
        // Buscar a partida recem criada pelo date/time (unica combinacao)
        const { data: novaPartida } = await supabase
          .from("partidas")
          .select("id")
          .eq("date", formData.date)
          .eq("time", formData.time)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
        
        partidaId = novaPartida?.id || 0
      }

  // Sucesso - calcular pontuacao dos tecnicos (IDEMPOTENTE)
  if (partidaId > 0) {
    await calcularPontuacaoTecnicos(partidaId, partidaJogadores, scoreA, scoreB)
  }
      
      setIsModalOpen(false)
      setEditingPartida(null)
    } catch (error: any) {
      // IMPORTANTE: NÃO limpa os campos em caso de erro
      // Os dados digitados (gols, assists, etc.) sao mantidos na tela
      console.error("[v0] Erro ao salvar partida:", error)
      console.error("[v0] Dados enviados:", JSON.stringify(partidaJogadores, null, 2))
      
      let errorMessage = "Erro desconhecido"
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.code) {
        errorMessage = `Codigo: ${error.code}`
      }
      
      // Se for erro de duplicate key, dar dica especifica
      if (errorMessage.includes("duplicate") || errorMessage.includes("unique")) {
        alert(`Erro de chave duplicada no banco de dados.\n\nIsso pode ocorrer se a constraint UNIQUE ainda existe na tabela partida_jogadores.\n\nVerifique no Supabase se a constraint (jogador_id, partida_id) foi removida.\n\nErro: ${errorMessage}`)
      } else {
        alert(`Erro ao salvar partida:\n${errorMessage}\n\nOs dados NAO foram perdidos. Corrija o problema e tente novamente.`)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeletePartida = async () => {
    if (deletingPartida) {
      await deletePartida(deletingPartida.id)
      setIsDeleteDialogOpen(false)
      setDeletingPartida(null)
    }
  }

  const toggleExpandMatch = (matchId: number) => {
    setExpandedMatch(expandedMatch === matchId ? null : matchId)
  }

// Available players for selection (permite mesmo jogador em ambos os times - futebol de praia)
  // So filtra jogadores que ja estao no MESMO time
  const availablePlayersTeamA = (jogadores || []).filter(
    p => p.status === "active" && !playersTeamA.find(pa => pa.playerId === p.id)
  )
  const availablePlayersTeamB = (jogadores || []).filter(
    p => p.status === "active" && !playersTeamB.find(pb => pb.playerId === p.id)
  )

  if (isLoading) {
    return (
      <div className="space-y-8 page-container">
        <PageHeaderSkeleton />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <MatchCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 page-container">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#ffffff]">
            Partidas <span className="text-[#C5A059]">Amaralina FC</span>
          </h1>
          <p className="text-[#ffffff] mt-1">Histórico de jogos</p>
        </div>
        {isAdmin && (
          <Button
            onClick={handleOpenAddModal}
            className="bg-[#0000008a] text-[#ffffff] hover:bg-[#0000008a] gap-2"
          >
            <Plus className="w-5 h-5" />
            Criar Partida
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-[#0a0a0a]/60 backdrop-blur-md border-white/5 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2 text-[#ffffff]">
              <Filter className="w-5 h-5" />
              <span className="font-medium">Filtrar por:</span>
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px] bg-black/40 border-white/5 text-white">
                <SelectValue placeholder={<span className="text-white">Mês</span>} />
              </SelectTrigger>
              <SelectContent className="bg-black/40 border-[#ffffff]">
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[180px] bg-black/40 border-white/5 text-white">
                <SelectValue placeholder={<span className="text-white">Ano</span>} />
              </SelectTrigger>
              <SelectContent className="bg-black/40 border-[#ffffff8a]">
                <SelectItem value="all">Histórico Geral</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year}>
                    Temporada {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Matches List */}
      <Card className="bg-[#0a0a0a]/60 backdrop-blur-md border-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Trophy className="w-6 h-6 text-[#ffffff]" />
            Jogos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {displayedPartidas.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-[#E5E0D8] mb-2" />
              <p className="text-[#74cc41]">Nenhuma partida encontrada</p>
            </div>
          ) : (
            displayedPartidas.map(match => (
              <div
                key={match.id}
                className="border-[#ffffff00] rounded-lg overflow-hidden border-[#ffffff00]/50 transition-all"
              >
                {/* Match Header */}
                <div
                  className="flex items-center justify-between p-4 bg-black/40 cursor-pointer"
                  onClick={() => toggleExpandMatch(match.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-[#ffffff]">
                      <Calendar className="w-4 h-4" />
                      {formatDate(match.date)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#ffffff]">
                      <Clock className="w-4 h-4" />
                      {match.time}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Admin Actions */}
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-[#0088CC]/20 text-[#0088CC]"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenEditModal(match)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-red-500/20 text-red-500"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenDeleteDialog(match)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {expandedMatch === match.id ? (
                      <ChevronUp className="w-5 h-5 text-[#fe0d00]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#74cc41]" />
                    )}
                  </div>
                </div>

                {/* Match Score */}
                <div className="p-6 bg-gradient-to-r from-[#0000008a] via-[#0000008a] to-[#0000008a]">
                  <div className="flex items-center justify-center gap-8">
                    <div className="text-center">
                      <p className="text-lg font-bold text-white">{match.team_a_name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-4xl font-bold text-[#0088CC]">{match.score_a}</span>
                      <span className="text-2xl text-[#ffffff]">x</span>
                      <span className="text-4xl font-bold text-[#F97316]">{match.score_b}</span>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-white">{match.team_b_name}</p>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedMatch === match.id && (() => {
                  const teamAPlayers = (match.partida_jogadores || []).filter(pj => pj.team === "A")
                  const teamBPlayers = (match.partida_jogadores || []).filter(pj => pj.team === "B")
                  const getPlayerName = (jogadorId: string) => {
                    const jogador = (jogadores || []).find(j => j.id === jogadorId)
                    return jogador?.nickname || jogador?.name || "Desconhecido"
                  }
                  return (
                  <div className="p-4 bg-transparent border-t border-white/5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Team A */}
                      <div>
                        <h4 className="font-bold text-[#0088CC] mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {match.team_a_name}
                        </h4>
                        <div className="space-y-2">
                          {teamAPlayers.map(player => (
                            <div
                              key={player.id}
                              className="flex items-center justify-between p-2 bg-[#0000008a] rounded"
                            >
                              <div className="flex items-center gap-2">
                                {player.is_goalkeeper && <Shield className="w-4 h-4 text-[#0088CC]" />}
                                <span className="text-sm font-medium text-[#ffffff]">{getPlayerName(player.jogador_id)}</span>
                                {/* Selo MVP */}
                                {player.is_mvp && (
                                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: "#DEB01D", color: "#FFFFFF" }} title="MVP da Partida">
                                    <Star className="w-3 h-3" /> MVP
                                  </span>
                                )}
                                {/* Selo Melhor Defensor */}
                                {player.is_best_defender && (
                                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: player.best_position_type === 'zagueiro' ? '#FF3333' : '#0088FF', color: "#FFFFFF"}} title={`Melhor ${player.best_position_type == 'zagueiro' ? 'Zagueiro' : 'Lateral'}`}>
                                    <Shield className="w-3 h-3" /> {player.best_position_type === 'zagueiro' ? 'ZAG' : 'LAT'}
                                  </span>
                                )}
                                {/* Selo Melhor Goleiro (Paredao) */}
                                {(player as any).is_best_goalkeeper && (
                                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: "#F97316", color: "#FFFFFF" }} title="Melhor Goleiro (Paredao)">
                                    <Goal className="w-3 h-3" /> GOL
                                  </span>
                                )}
                                {player.terminou_no_time && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" title="Terminou neste time" />
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                {player.goals > 0 && (
                                  <span className="flex items-center gap-0.5 text-[#D4B300]" title="Gols">
                                    <span className="text-xs">⚽</span>
                                    <span className="font-bold text-[10px]">{player.goals}</span>
                                  </span>
                                )}
                                {player.assists > 0 && (
                                  <span className="flex items-center gap-0.5 text-[#A855F7]" title="Assistências">
                                    <span className="text-xs">👟</span>
                                    <span className="font-bold text-[10px]">{player.assists}</span>
                                  </span>
                                )}
                                {player.is_goalkeeper && (
                                  <span className="flex items-center gap-0.5 text-[#967948]" title="Gols Sofridos">
                                    <span className="text-xs">🧤</span>
                                    <span className="font-bold text-[10px]">{player.goals_conceded || 0}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Team B */}
                      <div>
                        <h4 className="font-bold text-[#FF6B35] mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {match.team_b_name}
                        </h4>
                        <div className="space-y-2">
                          {teamBPlayers.map(player => (
                            <div
                              key={player.id}
                              className="flex items-center justify-between p-2 bg-[#0000008a] rounded"
                            >
                              <div className="flex items-center gap-2">
                                {player.is_goalkeeper && <Shield className="w-4 h-4 text-[#F97316]" />}
                                <span className="text-sm font-medium text-[#ffffff]">{getPlayerName(player.jogador_id)}</span>
                                {/* Selo MVP */}
                                {player.is_mvp && (
                                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: "#DEB01D", color: "#FFFFFF" }} title="MVP da Partida">
                                    <Star className="w-3 h-3" /> MVP
                                  </span>
                                )}
                                {/* Selo Melhor Defensor */}
                                {player.is_best_defender && (
                                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ 
                                    backgroundColor: player.best_position_type === 'zagueiro' ? '#FF3333' : '#0088FF', color: "#FFFFFF"}}
                                    title={`Melhor ${player.best_position_type == 'zagueiro' ? 'Zagueiro' : 'Lateral'}`}>
                                    <Shield className="w-3 h-3" /> {player.best_position_type === 'zagueiro' ? 'ZAG' : 'LAT'}
                                  </span>
                                )}
                                {/* Selo Melhor Goleiro (Paredao) */}
                                {(player as any).is_best_goalkeeper && (
                                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: "#F97316", color: "#FFFFFF" }} title="Melhor Goleiro (Paredao)">
                                    <Goal className="w-3 h-3" /> GOL
                                  </span>
                                )}
                                {player.terminou_no_time && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" title="Terminou neste time" />
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                {player.goals > 0 && (
                                  <span className="flex items-center gap-0.5 text-[#D4B300]" title="Gols">
                                    <span className="text-xs">⚽</span>
                                    <span className="font-bold text-[10px]">{player.goals}</span>
                                  </span>
                                )}
                                {player.assists > 0 && (
                                  <span className="flex items-center gap-0.5 text-[#A855F7]" title="Assistências">
                                    <span className="text-xs">👟</span>
                                    <span className="font-bold text-[10px]">{player.assists}</span>
                                  </span>
                                )}
{player.is_goalkeeper && (
    <span className="flex items-center gap-0.5 text-[#967948]" title="Gols Sofridos">
      <span className="text-xs">🧤</span>
      <span className="font-bold text-[10px]">{player.goals_conceded || 0}</span>
    </span>
  )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )})()}
              </div>
            ))
          )}

          {/* Show More Button */}
          {filteredPartidas.length > 5 && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAll(!showAll)}
                className="border-[#ffffff] text-[#000000] hover:bg-[#FFFFFF]/10"
              >
                {showAll ? "Ver Menos" : `Ver Todas (${filteredPartidas.length})`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-black/75 border-[#000000] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#ffffff] flex items-center gap-2">
              {editingPartida ? (
                <>
                  <Pencil className="w-5 h-5 text-[#0088CC]" />
                  Editar Partida
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-[#c55959]" />
                  Criar Nova Partida
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-[#74cc41]">
              {editingPartida 
                ? "Atualize as informações da partida e estatísticas dos jogadores." 
                : "Preencha os dados da nova partida e adicione os jogadores."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-[#ffffff]">Data</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="bg-[#F9F9F9] border-[#E5E0D8]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#ffffff]">Horário</Label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="bg-[#F9F9F9] border-[#E5E0D8]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#0088CC]">Time A</Label>
                <Input
                  value={formData.teamAName}
                  onChange={(e) => setFormData(prev => ({ ...prev, teamAName: e.target.value }))}
                  placeholder="Ex: Time Ouro"
                  className="bg-[#F9F9F9] border-[#E5E0D8]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#F97316]">Time B</Label>
                <Input
                  value={formData.teamBName}
                  onChange={(e) => setFormData(prev => ({ ...prev, teamBName: e.target.value }))}
                  placeholder="Ex: Time Azul"
                  className="bg-[#F9F9F9] border-[#E5E0D8]"
                />
              </div>
            </div>

            {/* Score Preview */}
            <div className="p-4 bg-gradient-to-r from-[#0088CC] via-[#1a1a1a] to-[#f97316] rounded-lg">
              <div className="flex items-center justify-center gap-6">
                <span className="text-white font-bold">{formData.teamAName || "Time A"}</span>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-[#0088CC]">
                    {playersTeamA.reduce((sum, p) => sum + p.goals, 0)}
                  </span>
                  <span className="text-xl text-[#ffffff]">x</span>
                  <span className="text-3xl font-bold text-[#f97316]">
                    {playersTeamB.reduce((sum, p) => sum + p.goals, 0)}
                  </span>
                </div>
                <span className="text-white font-bold">{formData.teamBName || "Time B"}</span>
              </div>
            </div>

            {/* Teams */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Team A */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#0088CC]">{formData.teamAName || "Time A"}</h4>
                  <Select onValueChange={(v) => handleAddPlayerToTeam("A", v)}>
                    <SelectTrigger className="w-[180px] bg-[#F9F9F9] border-[#E5E0D8]">
                      <SelectValue placeholder="Adicionar jogador" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#E5E0D8]">
                      <SelectItem value="none">Selecione...</SelectItem>
                      {availablePlayersTeamA.map(p => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.nickname || p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {playersTeamA.map(player => (
                    <div key={player.playerId} className="p-3 bg-[#2d2d2d73] rounded-lg border border-[#646464c9]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-[#ffffff]">{player.playerName}</span>
                          {/* Marcador "Terminou aqui?" */}
                          <label 
                            className={cn(
                              "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs cursor-pointer transition-all",
                              player.terminouNoTime 
                                ? "bg-green-100 text-green-700 border border-green-300" 
                                : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
                            )}
                            title="Marcar se o jogador terminou o jogo neste time (para contabilizar V/E/D)"
                          >
                            <Flag className="w-3 h-3" />
                            <span className="hidden sm:inline">Terminou</span>
                            <Checkbox
                              checked={player.terminouNoTime ?? false}
                              onCheckedChange={() => handleUpdatePlayerStats("A", player.playerId, "terminouNoTime", true)}
                              className="h-3 w-3 ml-0.5"
                            />
                          </label>
                          {/* Selos de premiacao */}
                          <button
                            type="button"
                            onClick={() => setMvpPlayerId(mvpPlayerId === player.playerId ? null : player.playerId)}
                            className={cn(
                              "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all",
                              mvpPlayerId === player.playerId
                                ? "bg-[#DEB01D] text-[#FFFFFF] border border-[#DEB01D]"
                                : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-[#FFD700]/20"
                            )}
                            title="MVP da Partida"
                          >
                            <Star className="w-3 h-3" />
                            <span className="hidden sm:inline">MVP</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setBestZagueiroTeamA(bestZagueiroTeamA === player.playerId ? null : player.playerId)}
                            className={cn(
                              "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all",
                              bestZagueiroTeamA === player.playerId
                                ? "bg-[#FF3333] text-white border border-[#FF3333]"
                                : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-[#0088CC]/20"
                            )}
                            title="Melhor Zagueiro"
                          >
                            <Shield className="w-3 h-3" />
                            <span className="hidden sm:inline">Zag</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setBestLateralTeamA(bestLateralTeamA === player.playerId ? null : player.playerId)}
                            className={cn(
                              "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all",
                              bestLateralTeamA === player.playerId
                                ? "bg-[#0088FF] text-white border border-[#0088FF]"
                                : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-[#22C55E]/20"
                            )}
                            title="Melhor Lateral"
                          >
                            <TrendingUp className="w-3 h-3" />
                            <span className="hidden sm:inline">Lat</span>
                          </button>
                          {/* Melhor Goleiro - apenas um por partida */}
                          <button
                            type="button"
                            onClick={() => setBestGoalkeeperId(bestGoalkeeperId === player.playerId ? null : player.playerId)}
                            className={cn(
                              "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all",
                              bestGoalkeeperId === player.playerId
                                ? "bg-[#F97316] text-white border border-[#F97316]"
                                : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-[#F59E0B]/20"
                            )}
                            title="Melhor Goleiro"
                          >
                            <Goal className="w-3 h-3" />
                            <span className="hidden sm:inline">Gol</span>
                          </button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500"
                          onClick={() => handleRemovePlayer("A", player.playerId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-4 gap-3 items-end">
                        <div>
<Label className="text-xs text-[#ffffff] mb-1 flex items-center gap-1">
    <CircleDot className="w-3 h-3" />
    Gols
  </Label>
  <Input
  type="number"
                            min="0"
                            value={player.goals}
                            onChange={(e) => handleUpdatePlayerStats("A", player.playerId, "goals", parseInt(e.target.value) || 0)}
                            className="h-10 w-full text-base text-center font-medium bg-white border-[#E5E0D8] text-[#2B2B2B] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-[#ffffff] mb-1 flex items-center gap-1">
    <Footprints className="w-3 h-3" />
    Assists
  </Label>
                          <Input
                            type="number"
                            min="0"
                            value={player.assists}
                            onChange={(e) => handleUpdatePlayerStats("A", player.playerId, "assists", parseInt(e.target.value) || 0)}
                            className="h-10 w-full text-base text-center font-medium bg-white border-[#E5E0D8] text-[#2B2B2B] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        <div className="flex flex-col items-center">
                          <Label className="text-xs text-[#ffffff] mb-1">Goleiro?</Label>
                          <div className="h-10 flex items-center justify-center">
                            <Checkbox
                              checked={player.isGoalkeeper}
                              onCheckedChange={(checked) => handleUpdatePlayerStats("A", player.playerId, "isGoalkeeper", !!checked)}
                              className="h-5 w-5"
                            />
                          </div>
                        </div>
                        <div className={player.isGoalkeeper ? "" : "opacity-30 pointer-events-none"}>
                          <Label className="text-xs text-[#ffffff] mb-1 flex items-center gap-1">
    <Goal className="w-3 h-3" />
    GT
  </Label>
                          <Input
                            type="number"
                            min="0"
                            value={player.goalsConceded}
                            onChange={(e) => handleUpdatePlayerStats("A", player.playerId, "goalsConceded", parseInt(e.target.value) || 0)}
                            className="h-10 w-full text-base text-center font-medium bg-white border-[#E5E0D8] text-[#2B2B2B] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            disabled={!player.isGoalkeeper}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team B */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#f97316]">{formData.teamBName || "Time B"}</h4>
                  <Select onValueChange={(v) => handleAddPlayerToTeam("B", v)}>
                    <SelectTrigger className="w-[180px] bg-[#F9F9F9] border-[#E5E0D8]">
                      <SelectValue placeholder="Adicionar jogador" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#E5E0D8]">
                      <SelectItem value="none">Selecione...</SelectItem>
                      {availablePlayersTeamB.map(p => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.nickname || p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {playersTeamB.map(player => (
                    <div key={player.playerId} className="p-3 bg-[#2d2d2d73] rounded-lg border border-[#646464c9]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-[#ffffff]">{player.playerName}</span>
                          {/* Marcador "Terminou aqui?" */}
                          <label 
                            className={cn(
                              "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs cursor-pointer transition-all",
                              player.terminouNoTime 
                                ? "bg-green-100 text-green-700 border border-green-300" 
                                : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
                            )}
                            title="Marcar se o jogador terminou o jogo neste time (para contabilizar V/E/D)"
                          >
                            <Flag className="w-3 h-3" />
                            <span className="hidden sm:inline">Terminou</span>
                            <Checkbox
                              checked={player.terminouNoTime ?? false}
                              onCheckedChange={() => handleUpdatePlayerStats("B", player.playerId, "terminouNoTime", true)}
                              className="h-3 w-3 ml-0.5"
                            />
                          </label>
                          {/* Selos de premiacao */}
                          <button
                            type="button"
                            onClick={() => setMvpPlayerId(mvpPlayerId === player.playerId ? null : player.playerId)}
                            className={cn(
                              "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all",
                              mvpPlayerId === player.playerId
                                ? "bg-[#DEB01D] text-[#ffffff] border border-[#DEB01D]"
                                : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-[#FFD700]/20"
                            )}
                            title="MVP da Partida"
                          >
                            <Star className="w-3 h-3" />
                            <span className="hidden sm:inline">MVP</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setBestZagueiroTeamB(bestZagueiroTeamB === player.playerId ? null : player.playerId)}
                            className={cn(
                              "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all",
                              bestZagueiroTeamB === player.playerId
                                ? "bg-[#FF3333] text-white border border-[#FF3333]"
                                : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-[#0088CC]/20"
                            )}
                            title="Melhor Zagueiro"
                          >
                            <Shield className="w-3 h-3" />
                            <span className="hidden sm:inline">Zag</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setBestLateralTeamB(bestLateralTeamB === player.playerId ? null : player.playerId)}
                            className={cn(
                              "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all",
                              bestLateralTeamB === player.playerId
                                ? "bg-[#0088FF] text-white border border-[#0088FF]"
                                : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-[#22C55E]/20"
                            )}
                            title="Melhor Lateral"
                          >
                            <TrendingUp className="w-3 h-3" />
                            <span className="hidden sm:inline">Lat</span>
                          </button>
                          {/* Melhor Goleiro - apenas um por partida */}
                          <button
                            type="button"
                            onClick={() => setBestGoalkeeperId(bestGoalkeeperId === player.playerId ? null : player.playerId)}
                            className={cn(
                              "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all",
                              bestGoalkeeperId === player.playerId
                                ? "bg-[#F59E0B] text-white border border-[#D97706]"
                                : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-[#F59E0B]/20"
                            )}
                            title="Melhor Goleiro"
                          >
                            <Goal className="w-3 h-3" />
                            <span className="hidden sm:inline">Gol</span>
                          </button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500"
                          onClick={() => handleRemovePlayer("B", player.playerId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-4 gap-3 items-end">
                        <div>
<Label className="text-xs text-[#ffffff] mb-1 flex items-center gap-1">
    <CircleDot className="w-3 h-3" />
    Gols
  </Label>
  <Input
  type="number"
                            min="0"
                            value={player.goals}
                            onChange={(e) => handleUpdatePlayerStats("B", player.playerId, "goals", parseInt(e.target.value) || 0)}
                            className="h-10 w-full text-base text-center font-medium bg-white border-[#E5E0D8] text-[#2B2B2B] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-[#ffffff] mb-1 flex items-center gap-1">
    <Footprints className="w-3 h-3" />
    Assis.
  </Label>
                          <Input
                            type="number"
                            min="0"
                            value={player.assists}
                            onChange={(e) => handleUpdatePlayerStats("B", player.playerId, "assists", parseInt(e.target.value) || 0)}
                            className="h-10 w-full text-base text-center font-medium bg-white border-[#E5E0D8] text-[#2B2B2B] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        <div className="flex flex-col items-center">
                          <Label className="text-xs text-[#ffffff] mb-1">Goleiro?</Label>
                          <div className="h-10 flex items-center justify-center">
                            <Checkbox
                              checked={player.isGoalkeeper}
                              onCheckedChange={(checked) => handleUpdatePlayerStats("B", player.playerId, "isGoalkeeper", !!checked)}
                              className="h-5 w-5"
                            />
                          </div>
                        </div>
                        <div className={player.isGoalkeeper ? "" : "opacity-30 pointer-events-none"}>
                          <Label className="text-xs text-[#ffffff] mb-1 flex items-center gap-1">
    <Goal className="w-3 h-3" />
    GT
  </Label>
                          <Input
                            type="number"
                            min="0"
                            value={player.goalsConceded}
                            onChange={(e) => handleUpdatePlayerStats("B", player.playerId, "goalsConceded", parseInt(e.target.value) || 0)}
                            className="h-10 w-full text-base text-center font-medium bg-white border-[#E5E0D8] text-[#2B2B2B] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            disabled={!player.isGoalkeeper}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="bg-[#ff0000] text-[#ffffff] hover:bg-[#ff0000]"
            >
              Cancelar
            </Button>
<Button
  onClick={handleSavePartida}
  disabled={isSaving || !formData.date || !formData.time || !formData.teamAName || !formData.teamBName}
  className="bg-[#74cc41] text-[#ffffff] hover:bg-[#74cc41]"
  >
  {isSaving ? "Salvando..." : (editingPartida ? "Salvar" : "Criar Partida")}
  </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border-[#E5E0D8]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#2B2B2B]">Excluir Partida</AlertDialogTitle>
            <AlertDialogDescription className="text-[#967948]">
              Tem certeza que deseja excluir esta partida? As estatísticas dos jogadores serão recalculadas automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#E5E0D8] text-[#967948] hover:bg-[#F0EDE8]">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePartida}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
