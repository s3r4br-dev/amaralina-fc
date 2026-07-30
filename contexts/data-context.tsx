"use client"

/**
 * Data Context - Amaralina FC
 * Version: 20.0 - CRUD with local state updates
 * Cache bust: v20 forced rebuild
 * IMPORTANT: All CRUD functions now update local state after success
 */
import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

// Types - Amaralina FC Data Context (Supabase)
// IDs são integers no banco de dados (não UUID)
export interface Jogador {
  id: number
  name: string
  nickname: string
  position: string
  number: number
  status: "active" | "inactive"
  photo_url?: string
  linked_email?: string
  created_at?: string
  updated_at?: string
}

export interface PartidaJogador {
  id: number
  partida_id: number
  jogador_id: number
  team: "A" | "B"
  goals: number
  assists: number
  is_goalkeeper: boolean
  goals_conceded: number
  terminou_no_time?: boolean // Indica se terminou o jogo neste time (para ranking V/E/D)
  is_mvp?: boolean // MVP da partida
  is_best_defender?: boolean // Melhor defensor da partida
  best_position_type?: 'zagueiro' | 'lateral' | null // Tipo de melhor defensivamente
  created_at?: string
}

// ===== ESCALAÇÕES TÁTICAS =====
export interface Escalacao {
  id: number
  nome: string
  formacao: string // '4-3-3', '4-4-2', '3-5-2', '4-2-3-1', '5-3-2'
  created_by?: string
  created_at?: string
  updated_at?: string
  escalacao_posicoes?: EscalacaoPosicao[]
}

export interface EscalacaoPosicao {
  id: number
  escalacao_id: number
  jogador_id: number | null
  posicao_codigo: string // 'GOL', 'ZAG1', 'ZAG2', 'LE', 'LD', 'VOL1', 'VOL2', 'MEI', 'ATA1', 'ATA2', 'ATA3'
  posicao_x: number // 0-100 (porcentagem do campo)
  posicao_y: number // 0-100 (porcentagem do campo)
  nota_posicao?: number | null // 1-10
  jogos_na_posicao: number
  created_at?: string
}

// Coordenadas predefinidas para cada formação
export const FORMACOES_TATICAS: Record<string, { nome: string; posicoes: { codigo: string; x: number; y: number; label: string }[] }> = {
  '4-3-3': {
    nome: '4-3-3',
    posicoes: [
      { codigo: 'GOL', x: 50, y: 92, label: 'GOL' },
      { codigo: 'LD', x: 85, y: 75, label: 'LD' },
      { codigo: 'ZAG1', x: 65, y: 78, label: 'ZAG' },
      { codigo: 'ZAG2', x: 35, y: 78, label: 'ZAG' },
      { codigo: 'LE', x: 15, y: 75, label: 'LE' },
      { codigo: 'VOL1', x: 65, y: 55, label: 'VOL' },
      { codigo: 'VOL2', x: 35, y: 55, label: 'VOL' },
      { codigo: 'MEI', x: 50, y: 42, label: 'MEI' },
      { codigo: 'ATA1', x: 80, y: 20, label: 'PD' },
      { codigo: 'ATA2', x: 50, y: 15, label: 'CA' },
      { codigo: 'ATA3', x: 20, y: 20, label: 'PE' },
    ]
  },
  '4-4-2': {
    nome: '4-4-2',
    posicoes: [
      { codigo: 'GOL', x: 50, y: 92, label: 'GOL' },
      { codigo: 'LD', x: 85, y: 75, label: 'LD' },
      { codigo: 'ZAG1', x: 65, y: 78, label: 'ZAG' },
      { codigo: 'ZAG2', x: 35, y: 78, label: 'ZAG' },
      { codigo: 'LE', x: 15, y: 75, label: 'LE' },
      { codigo: 'MD', x: 80, y: 50, label: 'MD' },
      { codigo: 'VOL1', x: 60, y: 55, label: 'VOL' },
      { codigo: 'VOL2', x: 40, y: 55, label: 'VOL' },
      { codigo: 'ME', x: 20, y: 50, label: 'ME' },
      { codigo: 'ATA1', x: 60, y: 20, label: 'ATA' },
      { codigo: 'ATA2', x: 40, y: 20, label: 'ATA' },
    ]
  },
  '3-5-2': {
    nome: '3-5-2',
    posicoes: [
      { codigo: 'GOL', x: 50, y: 92, label: 'GOL' },
      { codigo: 'ZAG1', x: 70, y: 78, label: 'ZAG' },
      { codigo: 'ZAG2', x: 50, y: 80, label: 'ZAG' },
      { codigo: 'ZAG3', x: 30, y: 78, label: 'ZAG' },
      { codigo: 'ALD', x: 88, y: 55, label: 'ALD' },
      { codigo: 'VOL1', x: 60, y: 58, label: 'VOL' },
      { codigo: 'VOL2', x: 40, y: 58, label: 'VOL' },
      { codigo: 'ALE', x: 12, y: 55, label: 'ALE' },
      { codigo: 'MEI', x: 50, y: 40, label: 'MEI' },
      { codigo: 'ATA1', x: 60, y: 18, label: 'ATA' },
      { codigo: 'ATA2', x: 40, y: 18, label: 'ATA' },
    ]
  },
  '4-2-3-1': {
    nome: '4-2-3-1',
    posicoes: [
      { codigo: 'GOL', x: 50, y: 92, label: 'GOL' },
      { codigo: 'LD', x: 85, y: 75, label: 'LD' },
      { codigo: 'ZAG1', x: 65, y: 78, label: 'ZAG' },
      { codigo: 'ZAG2', x: 35, y: 78, label: 'ZAG' },
      { codigo: 'LE', x: 15, y: 75, label: 'LE' },
      { codigo: 'VOL1', x: 60, y: 60, label: 'VOL' },
      { codigo: 'VOL2', x: 40, y: 60, label: 'VOL' },
      { codigo: 'MD', x: 80, y: 40, label: 'MD' },
      { codigo: 'MEI', x: 50, y: 38, label: 'MEI' },
      { codigo: 'ME', x: 20, y: 40, label: 'ME' },
      { codigo: 'ATA', x: 50, y: 15, label: 'CA' },
    ]
  },
  '5-3-2': {
    nome: '5-3-2',
    posicoes: [
      { codigo: 'GOL', x: 50, y: 92, label: 'GOL' },
      { codigo: 'ALD', x: 90, y: 65, label: 'ALD' },
      { codigo: 'ZAG1', x: 70, y: 78, label: 'ZAG' },
      { codigo: 'ZAG2', x: 50, y: 80, label: 'ZAG' },
      { codigo: 'ZAG3', x: 30, y: 78, label: 'ZAG' },
      { codigo: 'ALE', x: 10, y: 65, label: 'ALE' },
      { codigo: 'VOL1', x: 65, y: 50, label: 'VOL' },
      { codigo: 'MEI', x: 50, y: 45, label: 'MEI' },
      { codigo: 'VOL2', x: 35, y: 50, label: 'VOL' },
      { codigo: 'ATA1', x: 60, y: 18, label: 'ATA' },
      { codigo: 'ATA2', x: 40, y: 18, label: 'ATA' },
    ]
  },
}

export interface Partida {
  id: number
  date: string
  time: string
  team_a_name: string
  team_b_name: string
  score_a: number
  score_b: number
  status: "agendado" | "finalizado"
  created_at?: string
  updated_at?: string
  partida_jogadores?: PartidaJogador[]
}

export interface Profile {
  id: string // UUID do auth.users
  email: string
  name: string
  role: "admin" | "user"
  status: "active" | "inactive"
  linked_player_id?: number | null // Integer referenciando jogadores.id
  last_login?: string
  created_at?: string
}

// Estatísticas calculadas por período
export interface JogadorStats extends Jogador {
  goals: number
  assists: number
  matches: number
  rating: number
  wins: number
  draws: number
  losses: number
  goalsConceded: number
  cleanSheets: number
  goalkeeperMatches: number
  goalkeeperBonus: number
  goalkeeperRating: number | null // Nota especifica de goleiro (0-10)
  totalPoints: number
  winRate: number // Aproveitamento em % (0-100)
  performanceScore: number // Média de desempenho (0-10)
  lastMatchDate: string | null // Data da última partida jogada
  consecutiveMissedMatches: number // Partidas consecutivas ausente (para decaimento de Overall)
  overallPenalty: number // Penalidade aplicada ao Overall por faltas (0 a 5)
}

  // Legacy compatibility types para formulários
  export interface PlayerStat {
    playerId: number
    playerName: string
    goals: number
    assists: number
    isGoalkeeper: boolean
    goalsConceded: number
    terminouNoTime?: boolean // Indica se o jogador terminou o jogo neste time (para ranking)
    isMvp?: boolean // MVP da partida
    bestPositionType?: 'zagueiro' | 'lateral' | null // Melhor defensor da posição
  }

interface DataContextType {
  // Jogadores
  jogadores: Jogador[]
  addJogador: (jogador: Omit<Jogador, "id" | "created_at" | "updated_at">) => Promise<void>
  updateJogador: (id: number, data: Partial<Jogador>) => Promise<void>
  deleteJogador: (id: number) => Promise<void>
  
  // Partidas
  partidas: Partida[]
  addPartida: (partida: Omit<Partida, "id" | "created_at" | "updated_at" | "partida_jogadores">, jogadores: Omit<PartidaJogador, "id" | "partida_id" | "created_at">[]) => Promise<void>
  updatePartida: (id: number, data: Partial<Omit<Partida, "partida_jogadores">>, jogadores?: Omit<PartidaJogador, "id" | "partida_id" | "created_at">[]) => Promise<void>
  deletePartida: (id: number) => Promise<void>
  
  // Profiles (Users)
  profiles: Profile[]
  addProfile: (profile: Omit<Profile, "id" | "created_at">) => Promise<void>
  updateProfile: (id: string, data: Partial<Profile>) => Promise<void>
  deleteProfile: (id: string) => Promise<void>
  
  // Filtro de ano global
  selectedYear: string
  setSelectedYear: (year: string) => void
  availableYears: string[]
  
  // Computed stats (filtrados por ano)
  getTopArtilheiros: (limit?: number) => JogadorStats[]
  getTopAssistentes: (limit?: number) => JogadorStats[]
  getTopGoleiros: (limit?: number) => JogadorStats[]
  getRanking: () => JogadorStats[]
  getFilteredPartidas: () => Partida[]
  getJogadorStatsByYear: () => JogadorStats[]
  
  // Brand logo
  brandLogo: string | null
  setBrandLogo: (logo: string | null) => Promise<void>
  
  // Data loading state
  isLoading: boolean
  error: string | null
  
  // Refresh data manually
  refreshData: () => Promise<void>
}

// Exportar DataContext para uso em componentes que precisam verificar se existe
export const DataContext = createContext<DataContextType | undefined>(undefined)

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}

  // Calcular bônus de goleiro baseado em gols sofridos na partida
  // Fórmula: 0 gols = +3pts, 1 gol = +2pts, 2 gols = +1pt, 3+ gols = 0pts
  function calculateGoalkeeperBonus(goalsConceded: number): number {
    if (goalsConceded === 0) return 3
    if (goalsConceded === 1) return 2
    if (goalsConceded === 2) return 1
    return 0 // 3 ou mais gols sofridos
  }

  // Calcular nota de goleiro (0-10)
  // Formula: base em media de gols sofridos/partida, penalidade por ausencia, bonus de volume
  function calculateGoalkeeperRating(
    goalkeeperMatches: number,
    goalsConceded: number,
    consecutiveMissedMatches: number,
    totalPartidas: number
  ): number {
    if (goalkeeperMatches === 0) return 5.0 // Sem dados suficientes

    // Base: media de gols sofridos por partida (quanto menor, melhor)
    const avgConceded = goalsConceded / goalkeeperMatches
    // Nota base: 10 se media 0, cai 1.5 por gol/partida, min 1
    const baseNote = Math.max(1, 10 - avgConceded * 1.5)

    // Penalidade por ausencia consecutiva: -15% por partida faltada
    const absencePenaltyPct = Math.min(consecutiveMissedMatches * 15, 60) / 100
    const noteAfterPenalty = baseNote * (1 - absencePenaltyPct)

    // Bonus de volume de jogo: quem joga mais ganha bonus progressivo
    // Minimo 0, maximo +1.0 (para goleiro que jogou 100% das partidas)
    const volumeBonus = totalPartidas > 0
      ? Math.min(1.0, (goalkeeperMatches / totalPartidas) * 1.0)
      : 0

    return Math.max(1, Math.min(10, Math.round((noteAfterPenalty + volumeBonus) * 10) / 10))
  }

// Calcular pontos totais
function calculateTotalPoints(
  wins: number,
  draws: number,
  goals: number,
  assists: number,
  goalkeeperMatches: number,
  goalkeeperBonus: number
): number {
  return (wins * 3) + (draws * 1) + (goals * 2) + (assists * 1) + goalkeeperMatches + goalkeeperBonus
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [jogadores, setJogadores] = useState<Jogador[]>([])
  const [partidas, setPartidas] = useState<Partida[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const currentYear = new Date().getFullYear().toString()
  const [selectedYear, setSelectedYear] = useState<string>(currentYear)
  const [brandLogo, setBrandLogoState] = useState<string | null>(null)
  
  const supabase = useMemo(() => createClient(), [])

  // Load data function (reusable for refresh) - com timeout de 10s
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Timeout de 10 segundos para evitar loop infinito no mobile
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      // Load jogadores
      const { data: jogadoresData, error: jogadoresError } = await supabase
        .from("jogadores")
        .select("*")
        .order("name")
        .abortSignal(controller.signal)

      if (jogadoresError) throw jogadoresError
      setJogadores(jogadoresData || [])

      // Load partidas with jogadores
      const { data: partidasData, error: partidasError } = await supabase
        .from("partidas")
        .select(`*, partida_jogadores (*)`)
        .order("date", { ascending: false })
        .abortSignal(controller.signal)

      if (partidasError) throw partidasError
      setPartidas(partidasData || [])

      // Load profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("name")
        .abortSignal(controller.signal)

      if (profilesError) throw profilesError
      setProfiles(profilesData || [])

      // Load brand logo from app_settings
      const { data: settingsData } = await supabase
        .from("app_settings")
        .select("brand_logo")
        .eq("id", 1)
        .single()
        .abortSignal(controller.signal)

      if (settingsData?.brand_logo) {
        setBrandLogoState(settingsData.brand_logo)
      }

      clearTimeout(timeoutId)
    } catch (err) {
      // Em caso de erro, NAO bloquear a interface - apenas logar
      if ((err as Error)?.name === 'AbortError') {
        // Timeout - ignorar silenciosamente, dados carregarao depois
      } else {
        console.error("Erro ao carregar dados:", err)
        // NAO setar erro para nao bloquear a UI
      }
    } finally {
      // SEMPRE liberar o loading, mesmo com erro
      setIsLoading(false)
    }
  }, [supabase])

  // Load initial data
  useEffect(() => {
    loadData()
  }, [loadData])

  // Setup Realtime subscriptions
  useEffect(() => {
    const channels: RealtimeChannel[] = []
    
    // Jogadores channel
    const jogadoresChannel = supabase
      .channel("jogadores-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jogadores" },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            setJogadores(prev => [...prev, payload.new as Jogador])
          } else if (payload.eventType === "UPDATE") {
            setJogadores(prev => prev.map(j => j.id === payload.new.id ? payload.new as Jogador : j))
          } else if (payload.eventType === "DELETE") {
            setJogadores(prev => prev.filter(j => j.id !== payload.old.id))
          }
        }
      )
      .subscribe()
    channels.push(jogadoresChannel)
    
    // Partidas channel
    const partidasChannel = supabase
      .channel("partidas-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "partidas" },
        async () => {
          // Reload partidas with jogadores on any change
          const { data } = await supabase
            .from("partidas")
            .select(`*, partida_jogadores (*)`)
            .order("date", { ascending: false })
          if (data) setPartidas(data)
        }
      )
      .subscribe()
    channels.push(partidasChannel)
    
    // Partida jogadores channel
    const partidaJogadoresChannel = supabase
      .channel("partida-jogadores-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "partida_jogadores" },
        async () => {
          // Reload partidas with jogadores on any change
          const { data } = await supabase
            .from("partidas")
            .select(`*, partida_jogadores (*)`)
            .order("date", { ascending: false })
          if (data) setPartidas(data)
        }
      )
      .subscribe()
    channels.push(partidaJogadoresChannel)
    
    // Profiles channel
    const profilesChannel = supabase
      .channel("profiles-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            setProfiles(prev => [...prev, payload.new as Profile])
          } else if (payload.eventType === "UPDATE") {
            setProfiles(prev => prev.map(p => p.id === payload.new.id ? payload.new as Profile : p))
          } else if (payload.eventType === "DELETE") {
            setProfiles(prev => prev.filter(p => p.id !== payload.old.id))
          }
        }
      )
      .subscribe()
    channels.push(profilesChannel)
    
    // App settings channel (for brand logo)
    const settingsChannel = supabase
      .channel("settings-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings" },
        async (payload) => {
          if (payload.new && (payload.new as { key: string }).key === "brand_logo") {
            setBrandLogoState((payload.new as { value: string }).value || null)
          } else if (payload.eventType === "DELETE" && (payload.old as { key: string }).key === "brand_logo") {
            setBrandLogoState(null)
          }
        }
      )
      .subscribe()
    channels.push(settingsChannel)
    
    return () => {
      channels.forEach(channel => supabase.removeChannel(channel))
    }
  }, [supabase])

  // Anos disponíveis baseados nas partidas existentes
  const availableYears = useMemo(() => {
    const years = new Set<string>()
    partidas.forEach(p => {
      const year = p.date.split("-")[0]
      if (year) years.add(year)
    })
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a))
  }, [partidas])

  // Jogadores CRUD
  const addJogador = useCallback(async (data: Omit<Jogador, "id" | "created_at" | "updated_at">) => {
    const { data: newJogador, error } = await supabase
      .from("jogadores")
      .insert(data)
      .select()
      .single()
    
    if (error) {
      console.error("[v0] Error adding jogador:", error)
      throw error
    }
    
    // Atualizar estado local imediatamente
    setJogadores(prev => [...prev, newJogador])
    return newJogador
  }, [supabase])

  const updateJogador = useCallback(async (id: number, data: Partial<Jogador>) => {
    const { data: updatedJogador, error } = await supabase
      .from("jogadores")
      .update(data)
      .eq("id", id)
      .select()
      .single()
    
    if (error) {
      console.error("[v0] Error updating jogador:", error)
      throw error
    }
    
    // Atualizar estado local imediatamente
    setJogadores(prev => prev.map(j => j.id === id ? updatedJogador : j))
    return updatedJogador
  }, [supabase])

  const deleteJogador = useCallback(async (id: number) => {
    const { error } = await supabase.from("jogadores").delete().eq("id", id)
    if (error) {
      console.error("[v0] Error deleting jogador:", error)
      throw error
    }
    
    // Atualizar estado local imediatamente
    setJogadores(prev => prev.filter(j => j.id !== id))
  }, [supabase])

  // Partidas CRUD
  const addPartida = useCallback(async (
    data: Omit<Partida, "id" | "created_at" | "updated_at" | "partida_jogadores">,
    jogadores: Omit<PartidaJogador, "id" | "partida_id" | "created_at">[]
  ) => {
    const { data: newPartida, error: partidaError } = await supabase
      .from("partidas")
      .insert(data)
      .select()
      .maybeSingle()
    
    if (partidaError) {
      console.error("[v0] Error adding partida:", partidaError)
      throw partidaError
    }
    
    if (!newPartida) {
      throw new Error("Falha ao criar partida - nenhum dado retornado")
    }
    
    let insertedJogadores: PartidaJogador[] = []
    
    if (jogadores.length > 0) {
      const jogadoresWithPartidaId = jogadores.map(j => ({
        ...j,
        partida_id: newPartida.id
      }))
      
      const { data: jogadoresData, error: jogadoresError } = await supabase
        .from("partida_jogadores")
        .insert(jogadoresWithPartidaId)
        .select()
      
      if (jogadoresError) {
        console.error("[v0] Error adding partida_jogadores:", jogadoresError)
        throw jogadoresError
      }
      
      insertedJogadores = jogadoresData || []
    }
    
    // Atualizar estado local imediatamente
    const partidaComJogadores: Partida = {
      ...newPartida,
      partida_jogadores: insertedJogadores
    }
    setPartidas(prev => [...prev, partidaComJogadores])
    
    return newPartida
  }, [supabase])

  const updatePartida = useCallback(async (
    id: number,
    data: Partial<Omit<Partida, "partida_jogadores">>,
    jogadores?: Omit<PartidaJogador, "id" | "partida_id" | "created_at">[]
  ) => {
    const { data: updatedPartida, error: partidaError } = await supabase
      .from("partidas")
      .update(data)
      .eq("id", id)
      .select()
      .maybeSingle()
    
    if (partidaError) {
      console.error("[v0] Error updating partida:", partidaError)
      throw partidaError
    }
    
    // Se nao retornou dados, buscar a partida atualizada
    if (!updatedPartida) {
      console.warn("[v0] Update partida nao retornou dados, buscando...")
    }
    
    let newJogadores: PartidaJogador[] = []
    
    if (jogadores) {
      // Delete existing jogadores
      await supabase.from("partida_jogadores").delete().eq("partida_id", id)
      
      // Insert new jogadores
      if (jogadores.length > 0) {
        const jogadoresWithPartidaId = jogadores.map(j => ({
          ...j,
          partida_id: id
        }))
        
        const { data: jogadoresData, error: jogadoresError } = await supabase
          .from("partida_jogadores")
          .insert(jogadoresWithPartidaId)
          .select()
        
        if (jogadoresError) {
          console.error("[v0] Error updating partida_jogadores:", jogadoresError)
          throw jogadoresError
        }
        
        newJogadores = jogadoresData || []
      }
    }
    
    // Atualizar estado local imediatamente
    setPartidas(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...updatedPartida,
          partida_jogadores: jogadores ? newJogadores : p.partida_jogadores
        }
      }
      return p
    }))
  }, [supabase])

  const deletePartida = useCallback(async (id: number) => {
    const { error } = await supabase.from("partidas").delete().eq("id", id)
    if (error) {
      console.error("[v0] Error deleting partida:", error)
      throw error
    }
    
    // Atualizar estado local imediatamente
    setPartidas(prev => prev.filter(p => p.id !== id))
  }, [supabase])

  // Profiles CRUD
  const addProfile = useCallback(async (data: Omit<Profile, "id" | "created_at">) => {
    const { data: newProfile, error } = await supabase
      .from("profiles")
      .insert(data)
      .select()
      .single()
    
    if (error) {
      console.error("[v0] Error adding profile:", error)
      throw error
    }
    
    setProfiles(prev => [...prev, newProfile])
    return newProfile
  }, [supabase])

  const updateProfile = useCallback(async (id: string, data: Partial<Profile>) => {
    const { data: updatedProfile, error } = await supabase
      .from("profiles")
      .update(data)
      .eq("id", id)
      .select()
      .single()
    
    if (error) {
      console.error("[v0] Error updating profile:", error)
      throw error
    }
    
    setProfiles(prev => prev.map(p => p.id === id ? updatedProfile : p))
    return updatedProfile
  }, [supabase])

  const deleteProfile = useCallback(async (id: string) => {
    const { error } = await supabase.from("profiles").delete().eq("id", id)
    if (error) {
      console.error("[v0] Error deleting profile:", error)
      throw error
    }
    
    setProfiles(prev => prev.filter(p => p.id !== id))
  }, [supabase])

  // Brand Logo
  const setBrandLogo = useCallback(async (logo: string | null) => {
    setBrandLogoState(logo)
    
    if (logo) {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: "brand_logo", value: logo }, { onConflict: "key" })
      if (error) console.error("Error saving brand logo:", error)
    } else {
      await supabase.from("app_settings").delete().eq("key", "brand_logo")
    }
  }, [supabase])

  // Filtrar partidas por ano selecionado
  const getFilteredPartidas = useCallback(() => {
    if (selectedYear === "all") {
      return partidas.filter(p => p.status === "finalizado")
    }
    return partidas.filter(p => p.status === "finalizado" && p.date.startsWith(selectedYear))
  }, [partidas, selectedYear])

  // Calcular estatísticas dos jogadores filtradas por ano
  const getJogadorStatsByYear = useCallback((): JogadorStats[] => {
    const filteredPartidas = getFilteredPartidas()
    
    // Ordenar partidas por data para calcular faltas consecutivas
    const sortedPartidas = [...filteredPartidas].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    
    return jogadores.map(jogador => {
      let goals = 0
      let assists = 0
      let matches = 0
      let wins = 0
      let draws = 0
      let losses = 0
      let goalsConceded = 0
      let cleanSheets = 0
      let goalkeeperMatches = 0
      let goalkeeperBonus = 0
      let lastMatchDate: string | null = null // Data da última partida jogada

      // Calcular partidas consecutivas ausentes (a partir da ultima partida)
      let consecutiveMissedMatches = 0
      
      // Verificar cada partida em ordem cronologica
      sortedPartidas.forEach(partida => {
        const pj = partida.partida_jogadores || []

        // Coletar TODAS as entradas do jogador nesta partida (pode ter uma em cada time)
        const allEntries = pj.filter(p => p.jogador_id === jogador.id)

        if (allEntries.length === 0) return

        // Contar apenas 1 partida mesmo que esteja em dois times
        matches++
        
        // Atualizar a data da última partida (sortedPartidas está em ordem cronológica)
        lastMatchDate = partida.date

        // Somar gols e assistencias de TODAS as entradas (Time A + Time B)
        allEntries.forEach(entry => {
          goals += entry.goals
          assists += entry.assists

          if (entry.is_goalkeeper) {
            goalkeeperMatches++
            goalsConceded += entry.goals_conceded
            goalkeeperBonus += calculateGoalkeeperBonus(entry.goals_conceded)
            if (entry.goals_conceded === 0) cleanSheets++
          }
        })

        // Determinar resultado (V/E/D) com base em onde o jogador TERMINOU a partida
        // Se jogou nos dois times, usar terminou_no_time=true para saber o time final
        // Se jogou em apenas um time, usar esse time
        const inTeamA = allEntries.find(p => p.team === "A")
        const inTeamB = allEntries.find(p => p.team === "B")

        let resultTeam: "A" | "B" | null = null

        if (inTeamA && inTeamB) {
          // Jogou nos dois: o resultado e baseado no time onde terminou (terminou_no_time=true)
          if (inTeamA.terminou_no_time) resultTeam = "A"
          else if (inTeamB.terminou_no_time) resultTeam = "B"
          else resultTeam = "A" // fallback
        } else if (inTeamA) {
          resultTeam = "A"
        } else if (inTeamB) {
          resultTeam = "B"
        }

        if (resultTeam === "A") {
          if (partida.score_a > partida.score_b) wins++
          else if (partida.score_a === partida.score_b) draws++
          else losses++
        } else if (resultTeam === "B") {
          if (partida.score_b > partida.score_a) wins++
          else if (partida.score_a === partida.score_b) draws++
          else losses++
        }
      })
      
      // Calcular faltas consecutivas recentes (a partir da ultima partida para tras)
      // So conta se o jogador ja jogou alguma partida antes
      if (matches > 0 && sortedPartidas.length > 0) {
        // Contar quantas partidas o jogador faltou desde sua ultima participacao
        let lastPlayedIndex = -1
        for (let i = sortedPartidas.length - 1; i >= 0; i--) {
          const pj = sortedPartidas[i].partida_jogadores || []
          const played = pj.some(p => p.jogador_id === jogador.id)
          if (played) {
            lastPlayedIndex = i
            break
          }
        }
        
        // Se encontrou sua ultima partida, contar quantas partidas depois ele faltou
        if (lastPlayedIndex >= 0 && lastPlayedIndex < sortedPartidas.length - 1) {
          consecutiveMissedMatches = sortedPartidas.length - 1 - lastPlayedIndex
        }
      }
      
      // Penalidade de Overall por faltas consecutivas
      // 2+ faltas = -5 pontos, minimo de Overall = 50
      const overallPenalty = consecutiveMissedMatches >= 2 ? 5 : 0

      const totalPoints = calculateTotalPoints(wins, draws, goals, assists, goalkeeperMatches, goalkeeperBonus)
      
      // Calcular aproveitamento base (0-100%)
      const baseWinRate = matches > 0 ? (wins / matches) * 100 : 0
      
      // Penalidade de aproveitamento por faltas consecutivas
      // Se nao jogou recentemente, o aproveitamento cai progressivamente
      // 1 falta = -15%, 2 faltas = -30%, 3 faltas = -45%, 4+ faltas = -60%
      // Minimo de 30% de aproveitamento (nao pode cair abaixo disso)
      const winRatePenalty = Math.min(consecutiveMissedMatches * 15, 60)
      const winRate = matches > 0 ? Math.max(30, baseWinRate - winRatePenalty) : 0
      
      // Calcular participação em gols (gols + assists por partida)
      const goalParticipation = matches > 0 ? (goals + assists) / matches : 0
      
      // Nota especifica de goleiro (considera ausencias e volume de jogo)
      const goalkeeperRating = goalkeeperMatches > 0
        ? calculateGoalkeeperRating(goalkeeperMatches, goalsConceded, consecutiveMissedMatches, sortedPartidas.length)
        : null

      // Nova Média de Desempenho (0-10):
      // Para goleiros: 50% nota de goleiro + 50% aproveitamento do time
      // Para jogadores de linha: 70% aproveitamento + 30% participacao em gols
      let performanceScore: number
      if (matches === 0) {
        performanceScore = 0
      } else if (goalkeeperMatches > 0 && goalkeeperRating !== null) {
        const approvalScore = (winRate / 100) * 5  // 0 a 5 pontos (50%)
        const gkScore = (goalkeeperRating / 10) * 5  // 0 a 5 pontos (50%)
        performanceScore = Math.min(10, approvalScore + gkScore)
      } else {
        const approvalScore = (winRate / 100) * 7  // 0 a 7 pontos
        const participationScore = Math.min(goalParticipation * 1.5, 3)  // 0 a 3 pontos
        performanceScore = Math.min(10, approvalScore + participationScore)
      }
      
      // Overall: Agora pode chegar a 100 se aproveitamento for 100%
      // Base: 50 + (aproveitamento * 0.4) + (participação em gols * 5) + (pontos totais / partidas)
      // APLICA PENALIDADE por faltas consecutivas (minimo 50)
      const overallBase = 50 + (winRate * 0.4) + (goalParticipation * 5)
      const overallCalculated = matches === 0 ? 50 : Math.max(40, Math.min(100, Math.round(overallBase + (totalPoints / matches))))
      const rating = Math.max(50, overallCalculated - overallPenalty)

      return {
        ...jogador,
        goals,
        assists,
        matches,
        wins,
        draws,
        losses,
        goalsConceded,
        cleanSheets,
        goalkeeperMatches,
        goalkeeperBonus,
        goalkeeperRating: goalkeeperRating, // Nota especifica de goleiro (0-10) ou null
        totalPoints,
        rating,
        winRate: Math.round(winRate),
        performanceScore: Math.round(performanceScore * 10) / 10, // 1 casa decimal
        consecutiveMissedMatches,
        overallPenalty,
        lastMatchDate, // Data da última partida jogada
      }
    })
  }, [jogadores, getFilteredPartidas])

  // Computed stats (filtradas por ano)
  const getTopArtilheiros = useCallback((limit = 10) => {
    return getJogadorStatsByYear()
      .filter(j => j.status === "active" && j.goals > 0)
      .sort((a, b) => {
        // 1. Prioridade: Mais gols
        if (b.goals !== a.goals) return b.goals - a.goals
        // 2. Desempate: Mais assistências
        if (b.assists !== a.assists) return b.assists - a.assists
        // 3. Desempate: Menos partidas (eficiência)
        if (a.matches !== b.matches) return a.matches - b.matches
        // 4. Desempate: Última partida mais recente
        const dateA = a.lastMatchDate ? new Date(a.lastMatchDate).getTime() : 0
        const dateB = b.lastMatchDate ? new Date(b.lastMatchDate).getTime() : 0
        return dateB - dateA
      })
      .slice(0, limit)
  }, [getJogadorStatsByYear])

  const getTopAssistentes = useCallback((limit = 10) => {
    return getJogadorStatsByYear()
      .filter(j => j.status === "active" && j.assists > 0)
      .sort((a, b) => {
        // 1. Prioridade: Mais assists (foco no passe para gol)
        if (b.assists !== a.assists) return b.assists - a.assists
        // 2. Desempate: Mais gols
        if (b.goals !== a.goals) return b.goals - a.goals
        // 3. Desempate: Menos jogos (eficiência)
        if (a.matches !== b.matches) return a.matches - b.matches
        // 4. Desempate: Última partida mais recente
        const dateA = a.lastMatchDate ? new Date(a.lastMatchDate).getTime() : 0
        const dateB = b.lastMatchDate ? new Date(b.lastMatchDate).getTime() : 0
        return dateB - dateA
      })
      .slice(0, limit)
  }, [getJogadorStatsByYear])

  const getTopGoleiros = useCallback((limit = 10) => {
    return getJogadorStatsByYear()
      // Filtrar: ativo, atuou como goleiro e MÍNIMO 2 JOGOS para ranking
      .filter(j => j.status === "active" && j.goalkeeperMatches >= 2)
      .sort((a, b) => {
        // 1. Prioridade: MENOR média de gols sofridos (eficiência)
        const avgA = a.goalkeeperMatches > 0 ? a.goalsConceded / a.goalkeeperMatches : 999
        const avgB = b.goalkeeperMatches > 0 ? b.goalsConceded / b.goalkeeperMatches : 999
        if (avgA !== avgB) return avgA - avgB // Menor média primeiro
        
        // 2. Desempate: Mais jogos (valoriza constância)
        if (b.goalkeeperMatches !== a.goalkeeperMatches) return b.goalkeeperMatches - a.goalkeeperMatches
        
        // 3. Desempate: Mais clean sheets
        if (b.cleanSheets !== a.cleanSheets) return b.cleanSheets - a.cleanSheets
        
        // 4. Desempate: Menos gols sofridos total
        return a.goalsConceded - b.goalsConceded
      })
      .slice(0, limit)
  }, [getJogadorStatsByYear])

  const getRanking = useCallback(() => {
    return getJogadorStatsByYear()
      .filter(j => j.status === "active")
      .sort((a, b) => b.totalPoints - a.totalPoints || b.goals - a.goals || b.assists - a.assists)
  }, [getJogadorStatsByYear])

  const value = useMemo(() => ({
    jogadores,
    addJogador,
    updateJogador,
    deleteJogador,
    partidas,
    addPartida,
    updatePartida,
    deletePartida,
    profiles,
    addProfile,
    updateProfile,
    deleteProfile,
    selectedYear,
    setSelectedYear,
    availableYears,
    getTopArtilheiros,
    getTopAssistentes,
    getTopGoleiros,
    getRanking,
    getFilteredPartidas,
    getJogadorStatsByYear,
    brandLogo,
    setBrandLogo,
    isLoading,
    error,
    refreshData: loadData,
  }), [
    jogadores, partidas, profiles, selectedYear, availableYears, brandLogo, isLoading, error,
    addJogador, updateJogador, deleteJogador,
    addPartida, updatePartida, deletePartida,
    addProfile, updateProfile, deleteProfile,
    getTopArtilheiros, getTopAssistentes, getTopGoleiros, getRanking,
    getFilteredPartidas, getJogadorStatsByYear, setBrandLogo, loadData
  ])

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}
