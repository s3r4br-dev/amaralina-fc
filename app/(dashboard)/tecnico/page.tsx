"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useData, type Jogador } from "@/contexts/data-context"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose,
} from "@/components/ui/popover"
import { 
  Save, 
  Download, 
  Users, 
  Star,
  X,
  Loader2,
  Lock,
  Trophy,
  Eye,
  HelpCircle,
  Trash2,
  Edit3,
  Shield,
  Goal,
  HandHelping,
  Crown,
  Medal,
  Coins,
  UserPlus,
  ChevronDown,
  ChevronUp,
  Check,
  Pencil,
  XCircle,
  CheckCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toPng } from "html-to-image"
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragStartEvent,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"

// ==================== TIPOS ====================
interface PalpiteJogador {
  jogadorId: number
  x: number // posicao livre no campo (0-100)
  y: number // posicao livre no campo (0-100)
  gols: number
  assistencias: number
  golsSofridos: number // para goleiros
  isGoleiro: boolean // FUNCAO: atua como goleiro (separado do selo)
  isMvp: boolean
  isMelhorZag: boolean
  isMelhorLat: boolean
  isMelhorGol: boolean // SELO: premio de melhor goleiro
  resultadoPrevisto: "vitoria" | "derrota" | null
}

// Cores de nivel baseado em pontos
const NIVEL_CORES = {
  bronze: { bg: "#CD7F32", border: "#8B4513" },
  prata: { bg: "#C0C0C0", border: "#808080" },
  ouro: { bg: "#FFD700", border: "#DAA520" },
}

function calcularNivel(pontos: number): "bronze" | "prata" | "ouro" {
  if (pontos >= 550) return "ouro"
  if (pontos >= 250) return "prata"
  return "bronze"
}

interface EscalacaoLocal {
  jogadores: PalpiteJogador[] // Agora suporta ate 6 jogadores (5 titulares + 1 extra)
  updatedAt: string
}

// Tipo para palpite com flag de jogador extra
interface PalpiteJogadorComExtra extends PalpiteJogador {
  isExtra?: boolean // true = 6o jogador (custo adicional de 15 pts)
}

interface EscalacaoSalva {
  id: number
  user_id: string
  user_name: string
  jogadores: PalpiteJogador[]
  pontos_totais: number
  nivel: "bronze" | "prata" | "ouro"
  created_at: string
  updated_at: string
}

// Verificar se esta no periodo de escalacao (Sexta 00h - Domingo 06h)
function isEscalacaoAberta(): boolean {
  const now = new Date()
  const day = now.getDay() // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab
  const hour = now.getHours()
  // Sexta-feira (dia 5): todo o dia aberto
  if (day === 5) return true
  // Sabado (dia 6): todo o dia aberto
  if (day === 6) return true
  // Domingo (dia 0): aberto ate 06:00
  if (day === 0 && hour < 6) return true
  return false
}

// ==================== COMPONENTE JOGADOR ARRASTAVEL (Lista lateral) ====================
// onTapAdd: callback chamado no toque/clique para escalonar no primeiro slot disponivel
function DraggablePlayer({ jogador, isOnField = false, onTapAdd, canEdit = true }: { 
  jogador: Jogador
  isOnField?: boolean
  onTapAdd?: (jogador: Jogador) => void
  canEdit?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `player-${jogador.id}`,
    data: { jogador, isOnField },
    disabled: !canEdit
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 1000 : 1,
  } : undefined

  // Distinguir clique simples de inicio de drag: so chama onTapAdd se nao houve movimento real
  const pointerMoved = useRef(false)

  const handlePointerDown = () => { pointerMoved.current = false }
  const handlePointerMove = () => { pointerMoved.current = true }
  const handlePointerUp = (e: React.PointerEvent) => {
    // Se nao moveu (clique/tap sem arrastar) e nao esta em drag, chamar onTapAdd
    if (!pointerMoved.current && !isDragging && canEdit && onTapAdd) {
      e.preventDefault()
      e.stopPropagation()
      onTapAdd(jogador)
    }
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={cn(
        // Altura minima aumentada para facilitar toque no mobile (44px padrao HIG)
        "flex items-center gap-2 p-2 min-h-[44px] rounded-lg transition-all select-none",
        canEdit ? "cursor-grab active:cursor-grabbing hover:bg-white/10 active:bg-[#D4B300]/10" : "opacity-60 cursor-not-allowed",
        isDragging ? "opacity-50 scale-105" : "",
        "bg-[#2B2B2B] border border-[#333]"
      )}
    >
      {jogador.photo_url ? (
        <img
          src={jogador.photo_url}
          alt={jogador.nickname || jogador.name}
          className="w-9 h-9 rounded-full object-cover flex-shrink-0 border-2"
          style={{ borderColor: "#D4B300" }}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div 
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ backgroundColor: "#D4B300", color: "#1a1a1a" }}
        >
          {(jogador.nickname || jogador.name).substring(0, 2).toUpperCase()}
        </div>
      )}
      <span className="text-sm text-white truncate flex-1">{jogador.nickname || jogador.name}</span>
      {canEdit && onTapAdd && (
        <span className="text-[10px] text-white/30 hidden sm:block">arraste</span>
      )}
    </div>
  )
}

// ==================== COMPONENTE CAMPO (DROPPABLE) ====================
function DroppableField({ children, fieldRef }: { children: React.ReactNode; fieldRef?: React.RefObject<HTMLDivElement | null> }) {
  const { setNodeRef, isOver } = useDroppable({ id: "soccer-field" })

  return (
    <div 
      ref={(node) => {
        setNodeRef(node)
        if (fieldRef && node) {
          (fieldRef as React.MutableRefObject<HTMLDivElement | null>).current = node
        }
      }}
      className={cn(
        "relative w-full aspect-[3/4] max-w-[500px] mx-auto rounded-xl overflow-hidden shadow-2xl transition-all",
        isOver && "ring-4 ring-[#D4B300]/50"
      )}
      style={{ 
        backgroundColor: "#1a472a",
        boxShadow: "0 0 40px rgba(212, 179, 0, 0.2)"
      }}
    >
      {/* Marcacoes do campo */}
      <svg viewBox="0 0 100 130" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <rect x="5" y="5" width="90" height="120" fill="none" stroke="#2d5a3a" strokeWidth="0.5"/>
        <line x1="5" y1="65" x2="95" y2="65" stroke="#2d5a3a" strokeWidth="0.3"/>
        <circle cx="50" cy="65" r="12" fill="none" stroke="#2d5a3a" strokeWidth="0.3"/>
        <circle cx="50" cy="65" r="0.8" fill="#2d5a3a"/>
        <rect x="20" y="5" width="60" height="20" fill="none" stroke="#2d5a3a" strokeWidth="0.3"/>
        <rect x="30" y="5" width="40" height="8" fill="none" stroke="#2d5a3a" strokeWidth="0.3"/>
        <path d="M 35 25 Q 50 32 65 25" fill="none" stroke="#2d5a3a" strokeWidth="0.3"/>
        <rect x="20" y="105" width="60" height="20" fill="none" stroke="#2d5a3a" strokeWidth="0.3"/>
        <rect x="30" y="117" width="40" height="8" fill="none" stroke="#2d5a3a" strokeWidth="0.3"/>
        <path d="M 35 105 Q 50 98 65 105" fill="none" stroke="#2d5a3a" strokeWidth="0.3"/>
      </svg>
      {children}
    </div>
  )
}

// ==================== JOGADOR NO CAMPO (CLICAVEL) ====================
function PlayerOnField({ 
  palpite, 
  jogador, 
  onClick,
  onRemove,
  canEdit,
  isViewMode = false,
  showFeedback = false,
  acertou = false,
  isExtra = false // Flag para 6o jogador (exibe badge especial)
}: { 
  palpite: PalpiteJogador
  jogador: Jogador | undefined
  onClick: () => void
  onRemove?: () => void
  canEdit: boolean
  isViewMode?: boolean // Se true, mostra popover com detalhes ao clicar
  showFeedback?: boolean // Se true, mostra icone de acerto/erro
  acertou?: boolean // Se acertou o palpite
  isExtra?: boolean // 6o jogador
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `field-player-${palpite.jogadorId}`,
    data: { palpite, jogador, isOnField: true },
    disabled: !canEdit
  })

  const style: React.CSSProperties = {
    position: "absolute",
    left: `${palpite.x}%`,
    top: `${palpite.y}%`,
    transform: transform 
      ? `translate(-50%, -50%) translate3d(${transform.x}px, ${transform.y}px, 0)`
      : "translate(-50%, -50%)",
    zIndex: isDragging ? 1000 : 10,
  }

  const hasSelos = palpite.isMvp || palpite.isMelhorZag || palpite.isMelhorLat || palpite.isMelhorGol

  return (
    <div
      ref={setNodeRef}
      {...(canEdit ? listeners : {})}
      {...(canEdit ? attributes : {})}
      style={style}
      onClick={canEdit ? onClick : undefined}
      className={cn(
        "flex flex-col items-center transition-all group",
        canEdit && "cursor-pointer hover:scale-110",
        isDragging && "opacity-70"
      )}
    >
      {/* Botao X para remover — visivel em mobile ao tocar, em desktop ao hover */}
      {canEdit && onRemove && (
        <button
          onPointerDown={(e) => { e.stopPropagation(); e.preventDefault() }}
          onPointerUp={(e) => { e.stopPropagation(); e.preventDefault(); onRemove() }}
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className={cn(
            "absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center",
            "bg-red-500 border border-white shadow-lg transition-opacity z-20",
            // Mobile: sempre visivel (toque). Desktop: so no hover do pai
            "opacity-100 md:opacity-0 md:group-hover:opacity-100"
          )}
          aria-label="Remover jogador"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      )}
      {/* Selos acima */}
      {hasSelos && (
        <div className="flex gap-0.5 mb-0.5">
          {palpite.isMvp && <Star className="w-3 h-3" style={{ color: "#FFD700" }} />}
          {palpite.isMelhorZag && <Shield className="w-3 h-3" style={{ color: "#0088CC" }} />}
          {palpite.isMelhorLat && <Medal className="w-3 h-3" style={{ color: "#22C55E" }} />}
          {palpite.isMelhorGol && <Goal className="w-3 h-3" style={{ color: "#F59E0B" }} />}
        </div>
      )}
      
      {/* Avatar - borda amber para 6o jogador */}
      {jogador?.photo_url ? (
        <img
          src={jogador.photo_url}
          alt={jogador.nickname || jogador.name}
          className={cn(
            "w-10 h-10 rounded-full object-cover border-2 shadow-lg",
            isExtra && "ring-2 ring-amber-500/50"
          )}
          style={{ 
            borderColor: isExtra ? "#F59E0B"
              : palpite.isMelhorGol ? "#F59E0B" 
              : palpite.resultadoPrevisto === "vitoria" ? "#22C55E" 
              : palpite.resultadoPrevisto === "derrota" ? "#EF4444" : "#D4B300"
          }}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div 
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg border-2",
            isExtra && "ring-2 ring-amber-500/50"
          )}
          style={{ 
            backgroundColor: isExtra ? "#F59E0B"
              : palpite.isMelhorGol ? "#F59E0B" 
              : palpite.resultadoPrevisto === "vitoria" ? "#22C55E" 
              : palpite.resultadoPrevisto === "derrota" ? "#EF4444" : "#D4B300",
            color: "#1a1a1a",
            borderColor: isExtra ? "#D97706"
              : palpite.isMelhorGol ? "#B45309" 
              : palpite.resultadoPrevisto === "vitoria" ? "#15803D" 
              : palpite.resultadoPrevisto === "derrota" ? "#B91C1C" : "#967948"
          }}
        >
          {(jogador?.nickname || jogador?.name || "???").substring(0, 2).toUpperCase()}
        </div>
      )}
      
      {/* Badge 6o jogador */}
      {isExtra && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1 py-0.5 rounded text-[8px] font-bold bg-amber-500 text-[#1a1a1a] z-10">
          6º
        </div>
      )}
      
      {/* Badge Goleiro (G) - quando atua como goleiro */}
      {palpite.isGoleiro && !isExtra && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#F59E0B] text-[#1a1a1a] z-10">
          G
        </div>
      )}
      
      {/* Badge Goleiro + 6o jogador */}
      {palpite.isGoleiro && isExtra && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5 z-10">
          <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-amber-500 text-[#1a1a1a]">6º</span>
          <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-[#F59E0B] text-[#1a1a1a]">G</span>
        </div>
      )}
      
      {/* Nome */}
      <span className="text-[10px] text-white font-medium mt-0.5 max-w-[60px] truncate text-center drop-shadow-lg">
        {jogador?.nickname || jogador?.name || "???"}
      </span>
      
      {/* Stats - usa isGoleiro para determinar se mostra gols sofridos */}
      {(palpite.gols > 0 || palpite.assistencias > 0 || (palpite.isGoleiro && palpite.golsSofridos >= 0)) && (
        <div className="flex gap-1 mt-0.5">
          {palpite.isGoleiro && (
            <span className="text-[9px] px-1 rounded" style={{ backgroundColor: "#F59E0B", color: "#1a1a1a" }}>
              {palpite.golsSofridos}GS
            </span>
          )}
          {!palpite.isGoleiro && palpite.gols > 0 && (
            <span className="text-[9px] px-1 rounded" style={{ backgroundColor: "#D4B300", color: "#1a1a1a" }}>
              {palpite.gols}G
            </span>
          )}
          {!palpite.isGoleiro && palpite.assistencias > 0 && (
            <span className="text-[9px] px-1 rounded" style={{ backgroundColor: "#0088CC", color: "#fff" }}>
              {palpite.assistencias}A
            </span>
          )}
        </div>
      )}
      
      {/* Feedback pos-jogo: check verde ou X vermelho */}
      {showFeedback && (
        <div className={cn(
          "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-lg",
          acertou ? "bg-green-500" : "bg-red-500"
        )}>
          {acertou ? (
            <CheckCircle className="w-3 h-3 text-white" />
          ) : (
            <XCircle className="w-3 h-3 text-white" />
          )}
        </div>
      )}
    </div>
  )
}

// ==================== POPOVER DETALHES PALPITE (VIEW MODE) ====================
// Busca dados reais da partida ao abrir e calcula pontuacao
function PalpitePopover({ 
  palpite, 
  jogador, 
  children
}: { 
  palpite: PalpiteJogador
  jogador: Jogador | undefined
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [dadosReais, setDadosReais] = useState<{
    goals: number
    assists: number
    goals_conceded: number
    is_mvp: boolean
    is_best_defender: boolean
    best_position_type: string | null
    is_best_goalkeeper: boolean
    participou: boolean
    team: string | null
    score_a: number
    score_b: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [partidaFinalizada, setPartidaFinalizada] = useState(false)
  
  // Buscar dados reais da partida ao abrir o popover
  const fetchDadosReais = async () => {
    if (!palpite.jogadorId) return
    
    setIsLoading(true)
    try {
      const supabase = createClient()
      
      // Buscar a partida mais recente finalizada (incluindo placar)
      const { data: partidas } = await supabase
        .from("partidas")
        .select("id, status, score_a, score_b")
        .eq("status", "finalizado")
        .order("date", { ascending: false })
        .limit(1)
      
      if (!partidas || partidas.length === 0) {
        setPartidaFinalizada(false)
        setDadosReais(null)
        setIsLoading(false)
        return
      }
      
      const partida = partidas[0]
      const partidaId = partida.id
      setPartidaFinalizada(true)
      
      // Buscar dados do jogador nesta partida (incluindo time)
      const { data: dadosJogador } = await supabase
        .from("partida_jogadores")
        .select("goals, assists, goals_conceded, is_mvp, is_best_defender, best_position_type, is_best_goalkeeper, is_goalkeeper, team")
        .eq("partida_id", partidaId)
        .eq("jogador_id", palpite.jogadorId)
        .maybeSingle()
      
      if (dadosJogador) {
        setDadosReais({
          goals: dadosJogador.goals || 0,
          assists: dadosJogador.assists || 0,
          goals_conceded: dadosJogador.goals_conceded || 0,
          is_mvp: dadosJogador.is_mvp || false,
          is_best_defender: dadosJogador.is_best_defender || false,
          best_position_type: dadosJogador.best_position_type || null,
          is_best_goalkeeper: dadosJogador.is_best_goalkeeper || false,
          participou: true,
          team: dadosJogador.team || null,
          score_a: partida.score_a ?? 0,
          score_b: partida.score_b ?? 0
        })
      } else {
        // Jogador nao participou desta partida
        setDadosReais({
          goals: 0,
          assists: 0,
          goals_conceded: 0,
          is_mvp: false,
          is_best_defender: false,
          best_position_type: null,
          is_best_goalkeeper: false,
          participou: false,
          team: null,
          score_a: partida.score_a ?? 0,
          score_b: partida.score_b ?? 0
        })
      }
    } catch (error) {
      console.error("[v0] Erro ao buscar dados reais:", error)
      // Em caso de erro de conexao, assume que nao ha partida finalizada
      setPartidaFinalizada(false)
      setDadosReais(null)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Buscar dados quando abrir o popover
  useEffect(() => {
    if (isOpen) {
      fetchDadosReais()
    }
  }, [isOpen, palpite.jogadorId])
  
  // ================================================================
  // FUNCAO DE CALCULO DE PONTOS - FLUXO SEQUENCIAL BLINDADO
  // ================================================================
  // PASSO 1: Soma de CREDITOS (todos os pontos positivos)
  // PASSO 2: Soma de DEBITOS (todas as penalidades)
  // PASSO 3: Saldo Final = Creditos - Debitos
  // ================================================================
  // TABELA DE PONTUACAO:
  // - Escalado (participou): +5 pts
  // - Gols acerto exato: +3 pts
  // - Assists acerto exato: +2 pts
  // - MVP acerto: +10 pts
  // - Melhor Zag acerto: +5 pts
  // - Melhor Lat acerto: +5 pts
  // - Melhor Gol acerto: +10 pts (7+3 bonus)
  // - Gols Sofridos acerto: +5 pts
  // PENALIDADES:
  // - Nao participou: -5 pts
  // - Gols erro (por diferenca): -5 pts cada
  // - Assists erro (por diferenca): -3 pts cada
  // - MVP erro: -5 pts
  // - Selo posicao erro: -3 pts
  // - Gols Sofridos erro: -3 pts
  // ================================================================
  const calcularPontos = () => {
    if (!dadosReais) return { total: 0, creditos: 0, debitos: 0, detalhes: [] }
    
    const detalhes: { label: string; pontos: number; acertou: boolean; descricao: string; tipo: 'credito' | 'debito' | 'neutro' }[] = []
    let creditos = 0
    let debitos = 0
    
    // ===================== PASSO 1: CREDITOS =====================
    
    // Participacao: +5 pts se escalou e jogador participou
    if (dadosReais.participou) {
      creditos += 5
      detalhes.push({ label: "Escalado", pontos: 5, acertou: true, descricao: "Participou", tipo: 'credito' })
    }
    
    // So calcular gols/assists se participou
    if (dadosReais.participou) {
      if (!palpite.isGoleiro) {
        const golsPedidos = palpite.gols || 0
        const golsFeitos = dadosReais.goals || 0
        const assistPedidas = palpite.assistencias || 0
        const assistFeitas = dadosReais.assists || 0
        
        // Gols - credito se acertou (palpite > 0)
        if (golsPedidos > 0 && golsPedidos === golsFeitos) {
          creditos += 3
          detalhes.push({ label: "Gols", pontos: 3, acertou: true, descricao: `${golsFeitos} / ${golsPedidos}`, tipo: 'credito' })
        } else if (golsPedidos === 0) {
          detalhes.push({ label: "Gols", pontos: 0, acertou: false, descricao: `${golsFeitos} / 0 (nao conta)`, tipo: 'neutro' })
        }
        
        // Assists - credito se acertou (palpite > 0)
        if (assistPedidas > 0 && assistPedidas === assistFeitas) {
          creditos += 2
          detalhes.push({ label: "Assists", pontos: 2, acertou: true, descricao: `${assistFeitas} / ${assistPedidas}`, tipo: 'credito' })
        } else if (assistPedidas === 0) {
          detalhes.push({ label: "Assists", pontos: 0, acertou: false, descricao: `${assistFeitas} / 0 (nao conta)`, tipo: 'neutro' })
        }
      } else {
        // Goleiro: gols sofridos
        const gsPedidos = palpite.golsSofridos || 0
        const gsReais = dadosReais.goals_conceded || 0
        if (gsPedidos === gsReais) {
          creditos += 5
          detalhes.push({ label: "Gols Sofridos", pontos: 5, acertou: true, descricao: `${gsReais} / ${gsPedidos}`, tipo: 'credito' })
        }
      }
      
      // Selos - CREDITOS
      if (palpite.isMvp && dadosReais.is_mvp) {
        creditos += 10
        detalhes.push({ label: "MVP", pontos: 10, acertou: true, descricao: "Acertou!", tipo: 'credito' })
      }
      if (palpite.isMelhorZag && dadosReais.is_best_defender && dadosReais.best_position_type === "zagueiro") {
        creditos += 5 // Melhor Zagueiro: +5 pts (Joãozinho = 5+5 = 10)
        detalhes.push({ label: "Melhor Zag", pontos: 5, acertou: true, descricao: "Acertou!", tipo: 'credito' })
      }
      if (palpite.isMelhorLat && dadosReais.is_best_defender && dadosReais.best_position_type === "lateral") {
        creditos += 5 // Melhor Lateral: +5 pts
        detalhes.push({ label: "Melhor Lat", pontos: 5, acertou: true, descricao: "Acertou!", tipo: 'credito' })
      }
      if (palpite.isMelhorGol && dadosReais.is_best_goalkeeper) {
        creditos += 10 // Melhor Goleiro: +10 pts (7+3 bonus)
        detalhes.push({ label: "Melhor Gol", pontos: 10, acertou: true, descricao: "Acertou!", tipo: 'credito' })
      }
    }
    
    // ===================== PALPITE DE RESULTADO (VITORIA/DERROTA) =====================
    // Verifica se o tecnico acertou o palpite de resultado do jogador
    // Borda AMARELA = resultadoPrevisto null = 0 pontos (nem bonus nem penalidade)
    if (dadosReais.participou) {
      if (palpite.resultadoPrevisto) {
        const teamJogador = dadosReais.team // 'A' ou 'B'
        const scoreA = dadosReais.score_a ?? 0
        const scoreB = dadosReais.score_b ?? 0
        
        // Determina o resultado real do time do jogador
        let resultadoReal: "vitoria" | "derrota" | "empate" = "empate"
        if (teamJogador === 'A') {
          if (scoreA > scoreB) resultadoReal = "vitoria"
          else if (scoreA < scoreB) resultadoReal = "derrota"
        } else {
          if (scoreB > scoreA) resultadoReal = "vitoria"
          else if (scoreB < scoreA) resultadoReal = "derrota"
        }
        
        // Compara com o palpite
        if (palpite.resultadoPrevisto === resultadoReal) {
          creditos += 5
          detalhes.push({ label: "Palpite Resultado", pontos: 5, acertou: true, descricao: `${palpite.resultadoPrevisto} (Acertou!)`, tipo: 'credito' })
        } else {
          debitos += 5
          detalhes.push({ label: "Palpite Resultado", pontos: -5, acertou: false, descricao: `${palpite.resultadoPrevisto} (Errou)`, tipo: 'debito' })
        }
      } else {
        // Borda amarela = sem palpite de resultado = 0 pontos
        detalhes.push({ label: "Palpite Resultado", pontos: 0, acertou: false, descricao: "Sem palpite (borda amarela)", tipo: 'neutro' })
      }
    }
    
    // ===================== PASSO 2: DEBITOS =====================
    
    // Nao participou
    if (!dadosReais.participou) {
      debitos += 5
      detalhes.push({ label: "Escalado", pontos: -5, acertou: false, descricao: "Nao jogou", tipo: 'debito' })
    }
    
    // Erros de gols/assists (apenas se participou e palpite > 0)
    if (dadosReais.participou && !palpite.isGoleiro) {
      const golsPedidos = palpite.gols || 0
      const golsFeitos = dadosReais.goals || 0
      const assistPedidas = palpite.assistencias || 0
      const assistFeitas = dadosReais.assists || 0
      
      // Gols erro (palpite > 0 e diferente)
      if (golsPedidos > 0 && golsPedidos !== golsFeitos) {
        const diff = Math.abs(golsPedidos - golsFeitos)
        const pts = 5 * diff
        debitos += pts
        detalhes.push({ label: "Gols", pontos: -pts, acertou: false, descricao: `${golsFeitos} / ${golsPedidos}`, tipo: 'debito' })
      }
      
      // Assists erro (palpite > 0 e diferente)
      if (assistPedidas > 0 && assistPedidas !== assistFeitas) {
        const diff = Math.abs(assistPedidas - assistFeitas)
        const pts = 3 * diff
        debitos += pts
        detalhes.push({ label: "Assists", pontos: -pts, acertou: false, descricao: `${assistFeitas} / ${assistPedidas}`, tipo: 'debito' })
      }
    }
    
    // Goleiro: gols sofridos erro
    if (dadosReais.participou && palpite.isGoleiro) {
      const gsPedidos = palpite.golsSofridos || 0
      const gsReais = dadosReais.goals_conceded || 0
      if (gsPedidos !== gsReais) {
        debitos += 3
        detalhes.push({ label: "Gols Sofridos", pontos: -3, acertou: false, descricao: `${gsReais} / ${gsPedidos}`, tipo: 'debito' })
      }
    }
    
    // Selos - DEBITOS (erros)
    if (dadosReais.participou) {
      if (palpite.isMvp && !dadosReais.is_mvp) {
        debitos += 5
        detalhes.push({ label: "MVP", pontos: -5, acertou: false, descricao: "Errou", tipo: 'debito' })
      }
      if (palpite.isMelhorZag && !(dadosReais.is_best_defender && dadosReais.best_position_type === "zagueiro")) {
        debitos += 3
        detalhes.push({ label: "Melhor Zag", pontos: -3, acertou: false, descricao: "Errou", tipo: 'debito' })
      }
      if (palpite.isMelhorLat && !(dadosReais.is_best_defender && dadosReais.best_position_type === "lateral")) {
        debitos += 3
        detalhes.push({ label: "Melhor Lat", pontos: -3, acertou: false, descricao: "Errou", tipo: 'debito' })
      }
      if (palpite.isMelhorGol && !dadosReais.is_best_goalkeeper) {
        debitos += 3
        detalhes.push({ label: "Melhor Gol", pontos: -3, acertou: false, descricao: "Errou", tipo: 'debito' })
      }
    }
    
    // ===================== PASSO 3: SALDO FINAL =====================
    const total = creditos - debitos
    
    return { total, creditos, debitos, detalhes }
  }
  
  // Garante que pontuacao sempre tenha creditos, debitos e detalhes definidos
  const pontuacaoRaw = dadosReais ? calcularPontos() : null
  const pontuacao = pontuacaoRaw ? {
    total: pontuacaoRaw.total || 0,
    creditos: pontuacaoRaw.creditos || 0,
    debitos: pontuacaoRaw.debitos || 0,
    detalhes: pontuacaoRaw.detalhes || []
  } : null
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        className="w-72 bg-black/90 backdrop-blur-xl border border-white/20 text-white p-0 rounded-2xl shadow-2xl" 
        side="top"
        sideOffset={8}
      >
        {/* Header com botao fechar */}
        <div className="flex items-center justify-between p-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            {jogador?.photo_url ? (
              <img src={jogador.photo_url} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-[#D4B300]" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4B300] to-[#967948] flex items-center justify-center text-[#1a1a1a] text-sm font-bold">
                {(jogador?.nickname || jogador?.name || "?").substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-sm">{jogador?.nickname || jogador?.name || "?"}</p>
              {(palpite as any).isExtra && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">6o Jogador</span>
              )}
            </div>
          </div>
          <PopoverClose className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <X className="w-3.5 h-3.5" />
          </PopoverClose>
        </div>
        
        {/* Loading state */}
        {isLoading && (
          <div className="px-3 py-4 text-center">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#D4B300]" />
            <p className="text-xs text-white/50 mt-1">Carregando dados...</p>
          </div>
        )}
        
        {/* MEMORIA DE CALCULO - Creditos / Debitos / Saldo */}
        {!isLoading && pontuacao && partidaFinalizada && (
          <div className="border-b border-white/10">
            {/* Linha de Creditos e Debitos */}
            <div className="flex">
              <div className="flex-1 px-3 py-2 text-center bg-green-500/10 border-r border-white/10">
                <p className="text-[10px] text-green-400/80 uppercase tracking-wider">Creditos</p>
                <p className="text-lg font-bold text-green-400">+{pontuacao.creditos}</p>
              </div>
              <div className="flex-1 px-3 py-2 text-center bg-red-500/10">
                <p className="text-[10px] text-red-400/80 uppercase tracking-wider">Debitos</p>
                <p className="text-lg font-bold text-red-400">-{pontuacao.debitos}</p>
              </div>
            </div>
            {/* Saldo Final */}
            <div className={cn(
              "px-3 py-2 text-center",
              pontuacao.total >= 0 ? "bg-green-500/20" : "bg-red-500/20"
            )}>
              <p className="text-[10px] text-white/60 uppercase tracking-wider">Saldo Final</p>
              <p className={cn(
                "text-2xl font-bold",
                pontuacao.total >= 0 ? "text-green-400" : "text-red-400"
              )}>
                {pontuacao.total >= 0 ? "+" : ""}{pontuacao.total} pts
              </p>
              <p className="text-[9px] text-white/40 mt-0.5">
                ({pontuacao.creditos} - {pontuacao.debitos} = {pontuacao.total})
              </p>
            </div>
          </div>
        )}
        
        {/* Detalhes da Pontuacao */}
        <div className="p-3 space-y-1.5 max-h-48 overflow-y-auto">
          {!isLoading && pontuacao && partidaFinalizada ? (
            // Modo com dados reais - mostra calculo detalhado Real / Previsto
            pontuacao.detalhes.map((item, i) => {
              const isNeutro = item.tipo === 'neutro'
              const isCredito = item.tipo === 'credito'
              
              return (
                <div key={i} className={cn(
                  "flex items-center justify-between text-xs rounded-lg px-3 py-1.5",
                  isNeutro 
                    ? "bg-white/5 border border-white/10"
                    : isCredito 
                      ? "bg-green-500/10 border border-green-500/20" 
                      : "bg-red-500/10 border border-red-500/20"
                )}>
                  <div className="flex-1">
                    <span className="font-medium text-white">{item.label}</span>
                    <span className="ml-2 text-white/50 text-[10px]">{item.descricao}</span>
                  </div>
                  <span className={cn(
                    "font-bold ml-2 whitespace-nowrap",
                    isNeutro 
                      ? "text-white/40"
                      : isCredito 
                        ? "text-green-400" 
                        : "text-red-400"
                  )}>
                    {isNeutro 
                      ? "0" 
                      : `${item.pontos >= 0 ? "+" : ""}${item.pontos}`
                    }
                    {!isNeutro && (isCredito ? " ✓" : " ✗")}
                  </span>
                </div>
              )
            })
          ) : !isLoading && !partidaFinalizada ? (
            // Modo sem partida finalizada - mostra palpites apenas
            <>
              <div className="text-center py-2 mb-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <p className="text-xs text-amber-400">Aguardando partida finalizada</p>
              </div>
              {palpite.isGoleiro ? (
                <div className="flex justify-between text-xs bg-white/5 rounded-lg px-3 py-2">
                  <span className="text-[#F59E0B]">Goleiro</span>
                  <span>{palpite.golsSofridos} gols sofridos</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-xs bg-white/5 rounded-lg px-3 py-2">
                    <span className="text-[#D4B300]">Gols</span>
                    <span>{palpite.gols}</span>
                  </div>
                  <div className="flex justify-between text-xs bg-white/5 rounded-lg px-3 py-2">
                    <span className="text-[#0088CC]">Assists</span>
                    <span>{palpite.assistencias}</span>
                  </div>
                </>
              )}
              
              {/* Selos Previstos */}
              {(palpite.isMvp || palpite.isMelhorZag || palpite.isMelhorLat || palpite.isMelhorGol) && (
                <div className="pt-1">
                  <p className="text-[10px] text-white/50 mb-1">Selos:</p>
                  <div className="flex flex-wrap gap-1">
                    {palpite.isMvp && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FFD700]/20 text-[#FFD700]">MVP</span>}
                    {palpite.isMelhorZag && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0088CC]/20 text-[#0088CC]">Zag</span>}
                    {palpite.isMelhorLat && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#22C55E]/20 text-[#22C55E]">Lat</span>}
                    {palpite.isMelhorGol && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B]">Gol</span>}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ==================== MODAL PALPITE DO JOGADOR ====================
function PalpiteModal({
  open,
  onClose,
  palpite,
  jogador,
  onSave,
  onRemove
}: {
  open: boolean
  onClose: () => void
  palpite: PalpiteJogador | null
  jogador: Jogador | undefined
  onSave: (updated: PalpiteJogador) => void
  onRemove: () => void
}) {
  const [local, setLocal] = useState<PalpiteJogador | null>(null)

  useEffect(() => {
    if (palpite) setLocal({ ...palpite })
  }, [palpite])

  if (!open || !local || !jogador) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: "#D4B300", color: "#1a1a1a" }}
            >
              {(jogador.nickname || jogador.name).substring(0, 2).toUpperCase()}
            </div>
            {jogador.nickname || jogador.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Toggle: Atuar como Goleiro (FUNCAO separada do selo) */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#2B2B2B] border border-[#333]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#F59E0B] flex items-center justify-center text-[10px] font-bold text-[#1a1a1a]">G</div>
              <span className="text-sm font-medium">Atuar como Goleiro</span>
            </div>
            <Switch
              checked={local.isGoleiro || false}
              onCheckedChange={(checked) => setLocal({ 
                ...local, 
                isGoleiro: checked,
                // Se ativar goleiro, zerar gols/assists; se desativar, zerar gols sofridos
                gols: checked ? 0 : local.gols,
                assistencias: checked ? 0 : local.assistencias,
                golsSofridos: checked ? local.golsSofridos : 0
              })}
            />
          </div>

          {/* Se ATUA como goleiro, mostrar gols sofridos */}
          {local.isGoleiro ? (
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-2">
                <Goal className="w-4 h-4" style={{ color: "#F59E0B" }} />
                Gols Sofridos Previstos: {local.golsSofridos}
              </label>
              <Slider
                value={[local.golsSofridos]}
                onValueChange={([v]) => setLocal({ ...local, golsSofridos: v })}
                max={10}
                step={1}
                className="w-full"
              />
            </div>
          ) : (
            <>
              {/* Gols */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Goal className="w-4 h-4" style={{ color: "#D4B300" }} />
                  Gols Previstos: {local.gols}
                </label>
                <Slider
                  value={[local.gols]}
                  onValueChange={([v]) => setLocal({ ...local, gols: v })}
                  max={5}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Assistencias */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <HandHelping className="w-4 h-4" style={{ color: "#0088CC" }} />
                  Assistencias Previstas: {local.assistencias}
                </label>
                <Slider
                  value={[local.assistencias]}
                  onValueChange={([v]) => setLocal({ ...local, assistencias: v })}
                  max={5}
                  step={1}
                  className="w-full"
                />
              </div>
            </>
          )}

          {/* Selos */}
          <div>
            <label className="text-sm font-medium mb-2 block">Selos (escolha um ou mais)</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setLocal({ ...local, isMvp: !local.isMvp })}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all",
                  local.isMvp ? "bg-[#FFD700] text-[#1a1a1a]" : "bg-[#333] text-white hover:bg-[#444]"
                )}
              >
                <Star className="w-3 h-3" /> MVP
              </button>
              <button
                onClick={() => setLocal({ ...local, isMelhorZag: !local.isMelhorZag })}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all",
                  local.isMelhorZag ? "bg-[#0088CC] text-white" : "bg-[#333] text-white hover:bg-[#444]"
                )}
              >
                <Shield className="w-3 h-3" /> Melhor Zag
              </button>
              <button
                onClick={() => setLocal({ ...local, isMelhorLat: !local.isMelhorLat })}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all",
                  local.isMelhorLat ? "bg-[#22C55E] text-white" : "bg-[#333] text-white hover:bg-[#444]"
                )}
              >
                <Medal className="w-3 h-3" /> Melhor Lat
              </button>
              <button
                onClick={() => setLocal({ ...local, isMelhorGol: !local.isMelhorGol })}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all",
                  local.isMelhorGol ? "bg-[#F59E0B] text-white" : "bg-[#333] text-white hover:bg-[#444]"
                )}
              >
                <Goal className="w-3 h-3" /> Melhor Gol
              </button>
            </div>
          </div>

          {/* Resultado */}
          <div>
            <label className="text-sm font-medium mb-2 block">Resultado Previsto</label>
            <div className="flex gap-2">
              <button
                onClick={() => setLocal({ ...local, resultadoPrevisto: local.resultadoPrevisto === "vitoria" ? null : "vitoria" })}
                className={cn(
                  "flex-1 py-2 rounded text-sm font-medium transition-all",
                  local.resultadoPrevisto === "vitoria" ? "bg-[#22C55E] text-white" : "bg-[#333] text-white hover:bg-[#444]"
                )}
              >
                Vitoria
              </button>
              <button
                onClick={() => setLocal({ ...local, resultadoPrevisto: local.resultadoPrevisto === "derrota" ? null : "derrota" })}
                className={cn(
                  "flex-1 py-2 rounded text-sm font-medium transition-all",
                  local.resultadoPrevisto === "derrota" ? "bg-[#EF4444] text-white" : "bg-[#333] text-white hover:bg-[#444]"
                )}
              >
                Derrota
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="destructive" size="sm" onClick={onRemove} className="flex-1">
            <Trash2 className="w-4 h-4 mr-1" /> Remover
          </Button>
          <Button size="sm" onClick={() => { onSave(local); onClose() }} className="flex-1" style={{ backgroundColor: "#D4B300", color: "#1a1a1a" }}>
            <Save className="w-4 h-4 mr-1" /> Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ==================== MODAL INFORMACOES DE PONTUACAO ====================
function InfoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" style={{ color: "#D4B300" }} />
            Sistema de Pontuacao
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="p-3 rounded-lg bg-[#2B2B2B]">
            <h4 className="font-semibold mb-2" style={{ color: "#D4B300" }}>Acertos</h4>
            <ul className="space-y-1 text-[#967948]">
              <li>+ Acertar jogador escalado: <span className="text-green-400">+5 pts</span></li>
              <li>+ Acertar gols do jogador: <span className="text-green-400">+3 pts</span></li>
              <li>+ Acertar assistencias: <span className="text-green-400">+3 pts</span></li>
              <li>+ Acertar MVP: <span className="text-green-400">+10 pts</span></li>
              <li>+ Acertar Melhor Zagueiro: <span className="text-green-400">+5 pts</span></li>
              <li>+ Acertar Melhor Lateral: <span className="text-green-400">+5 pts</span></li>
              <li>+ Acertar Melhor Goleiro: <span className="text-green-400">+5 pts</span></li>
              <li>+ Acertar resultado (V/D): <span className="text-green-400">+5 pts</span></li>
            </ul>
          </div>

          <div className="p-3 rounded-lg bg-[#2B2B2B]">
            <h4 className="font-semibold mb-2 text-red-400">Erros</h4>
            <ul className="space-y-1 text-[#967948]">
              <li>- Cada palpite errado: <span className="text-red-400">-5 pts</span></li>
            </ul>
          </div>

          <div className="p-3 rounded-lg border border-[#D4B300]/30" style={{ backgroundColor: "rgba(212,179,0,0.05)" }}>
            <h4 className="font-semibold mb-2" style={{ color: "#D4B300" }}>Taxa de Inscricao</h4>
            <p className="text-[#967948]">
              Ao finalizar sua escalacao, voce paga <span className="text-red-400">-10 pts</span> de taxa.
              <br />
              <span className="text-green-400">Reembolso:</span> Se acertar pelo menos 1 palpite, a taxa e devolvida.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} style={{ backgroundColor: "#D4B300", color: "#1a1a1a" }}>Entendi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ==================== MODAL TAXA DE INSCRICAO ====================
function TaxaInscricaoModal({ 
  open, 
  onConfirm, 
  onCancel 
}: { 
  open: boolean
  onConfirm: () => void
  onCancel: () => void 
}) {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="bg-[#1a1a1a] border-[#D4B300]/50 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#D4B300]">
            <Coins className="w-5 h-5" />
            Taxa de Inscricao
          </DialogTitle>
          <DialogDescription className="text-[#967948]">
            Para finalizar sua escalacao, voce pagara uma taxa de inscricao.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <span className="text-white">Taxa de inscricao</span>
            <span className="text-red-400 font-bold text-lg">-10 pts</span>
          </div>
          
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
            <p className="text-sm text-green-400">
              <strong>Reembolso:</strong> Se voce acertar pelo menos 1 palpite, a taxa sera devolvida!
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1 border-[#333] text-white hover:bg-[#333]">
            Cancelar
          </Button>
          <Button onClick={onConfirm} className="flex-1 bg-[#D4B300] text-[#1a1a1a] hover:bg-[#D4B300]/90">
            Pagar e Finalizar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ==================== MODAL JOGADOR EXTRA ====================
function JogadorExtraModal({ 
  open, 
  onCancel,
  jogadoresDisponiveis,
  onConfirm
}: { 
  open: boolean
  onCancel: () => void
  jogadoresDisponiveis: Jogador[]
  onConfirm: (jogadorId: number) => void
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="bg-[#1a1a1a] border-[#D4B300]/50 text-white max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#D4B300]">
            <UserPlus className="w-5 h-5" />
            Adicionar 6º Jogador
          </DialogTitle>
          <DialogDescription className="text-[#967948]">
            Voce pode escalar um jogador extra pagando uma taxa adicional.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-3">
            <span className="text-white">Taxa do jogador extra</span>
            <span className="text-amber-400 font-bold text-lg">-15 pts</span>
          </div>
          
          <p className="text-xs text-[#967948] mb-3">Selecione o jogador:</p>
          
          <div className="max-h-[200px] overflow-y-auto space-y-1 pr-2">
            {jogadoresDisponiveis.map(jogador => (
              <button
                key={jogador.id}
                onClick={() => setSelectedId(jogador.id)}
                className={cn(
                  "w-full flex items-center gap-2 p-2 rounded-lg transition-all text-left",
                  selectedId === jogador.id 
                    ? "bg-[#D4B300]/20 border border-[#D4B300]" 
                    : "bg-[#2B2B2B] border border-[#333] hover:border-[#D4B300]/50"
                )}
              >
                {jogador.photo_url ? (
                  <img src={jogador.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#D4B300] flex items-center justify-center text-[#1a1a1a] text-xs font-bold">
                    {(jogador.nickname || jogador.name).substring(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-white truncate">{jogador.nickname || jogador.name}</span>
              </button>
            ))}
          </div>
        </div>

        <DialogFooter className="flex gap-2 mt-2">
          <Button variant="outline" onClick={onCancel} className="flex-1 border-[#333] text-white hover:bg-[#333]">
            Cancelar
          </Button>
          <Button 
            onClick={() => selectedId && onConfirm(selectedId)} 
            disabled={!selectedId}
            className="flex-1 bg-[#D4B300] text-[#1a1a1a] hover:bg-[#D4B300]/90 disabled:opacity-50"
          >
            Pagar e Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ==================== MODAL "DESEJA SER TECNICO?" ====================
function TecnicoPromptModal({ 
  open, 
  onConfirm, 
  onDecline 
}: { 
  open: boolean
  onConfirm: () => void
  onDecline: () => void 
}) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="bg-[#1a1a1a] border-[#333] text-white max-w-sm" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" style={{ color: "#D4B300" }} />
            Deseja ser Tecnico?
          </DialogTitle>
          <DialogDescription className="text-[#967948]">
            Como tecnico, voce pode montar sua escalacao e fazer palpites para ganhar pontos no ranking.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex gap-2 mt-4">
          <Button variant="outline" onClick={onDecline} className="flex-1 border-[#333] text-white hover:bg-[#333]">
            Nao, apenas visualizar
          </Button>
          <Button onClick={onConfirm} className="flex-1" style={{ backgroundColor: "#D4B300", color: "#1a1a1a" }}>
            Sim, quero participar!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ==================== COMPONENTE PRINCIPAL ====================
export default function TecnicoPage() {
  const { user, isAdmin } = useAuth()
  const { jogadores } = useData()
  const supabase = useMemo(() => createClient(), [])
  const fieldRef = useRef<HTMLDivElement>(null)

  // Estados
  const [isOpen, setIsOpen] = useState(isEscalacaoAberta())
  const [isTecnico, setIsTecnico] = useState<boolean | null>(null) // null = nao decidiu ainda
  const [showTecnicoPrompt, setShowTecnicoPrompt] = useState(false)
  const [escalacaoLocal, setEscalacaoLocal] = useState<EscalacaoLocal>({ jogadores: [], updatedAt: "" })
  const [rodadaAtiva, setRodadaAtiva] = useState<number | null>(null) // ID da partida ativa (nao finalizada)
  const [escalacoesSalvas, setEscalacoesSalvas] = useState<EscalacaoSalva[]>([])
  const [selectedTecnico, setSelectedTecnico] = useState<EscalacaoSalva | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [editingPalpite, setEditingPalpite] = useState<PalpiteJogador | null>(null)
  const [escalacaoLiberadaManual, setEscalacaoLiberadaManual] = useState(false)
  const [loadingConfig, setLoadingConfig] = useState(true)
  
  // Estados para taxa de inscricao e jogador extra
  // NOTA: jogador extra agora integrado no array escalacaoLocal.jogadores com flag isExtra
  const [taxaPaga, setTaxaPaga] = useState(false)
  const [jogadorExtraPago, setJogadorExtraPago] = useState(false) // Se ja pagou os 15 pts pelo 6o jogador
  const [showTaxaModal, setShowTaxaModal] = useState(false)
  const [showJogadorExtraModal, setShowJogadorExtraModal] = useState(false)
  
  // Estados para acordeoes (mobile) e admin override
  // Iniciar fechados no mobile para liberar espaco para o campo
  const [rankingOpen, setRankingOpen] = useState(false)
  const [elencoOpen, setElencoOpen] = useState(false)
  const [editingTecnicoId, setEditingTecnicoId] = useState<string | null>(null) // Admin editando outro tecnico
  const [showPalpitePopover, setShowPalpitePopover] = useState<number | null>(null) // ID do jogador com popover aberto
  
  // Abrir acordeoes automaticamente em desktop
  useEffect(() => {
    const isDesktop = window.innerWidth >= 768
    if (isDesktop) {
      setRankingOpen(true)
      setElencoOpen(true)
    }
  }, [])

  // Carregar configuracao do sistema (liberacao manual pelo admin)
  useEffect(() => {
    async function loadConfig() {
      const { data } = await supabase
        .from("system_config")
        .select("escalacao_liberada_manual")
        .eq("id", 1)
        .single()
      if (data) setEscalacaoLiberadaManual(data.escalacao_liberada_manual)
      setLoadingConfig(false)
    }
    loadConfig()

    // Realtime para mudancas na config
    const channel = supabase
      .channel("system_config_changes")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "system_config" }, (payload) => {
        setEscalacaoLiberadaManual(payload.new.escalacao_liberada_manual)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  // Toggle liberacao manual (apenas admin)
  const handleToggleLiberacao = async () => {
    if (!isAdmin) return
    const newValue = !escalacaoLiberadaManual
    setEscalacaoLiberadaManual(newValue)
    await supabase
      .from("system_config")
      .update({ escalacao_liberada_manual: newValue, updated_at: new Date().toISOString(), updated_by: user?.id })
      .eq("id", 1)
  }

  // Admin sempre pode editar; liberacao manual ou periodo aberto
  const periodoAberto = isOpen || escalacaoLiberadaManual
  const canEdit = isAdmin || (periodoAberto && isTecnico === true)
  const periodoEfetivo = isAdmin || periodoAberto

  // Sensores do dnd-kit
  // TouchSensor desabilitado para nao conflitar com scroll e tap no mobile
  // O tap é tratado via onTapAdd no DraggablePlayer
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } })
  )

  // Posicoes padrao no campo para cada slot (de 0 a 4)
  const DEFAULT_FIELD_POSITIONS: Array<{ x: number; y: number }> = [
    { x: 50, y: 15 },  // goleiro (topo)
    { x: 25, y: 40 },  // zagueiro esquerdo
    { x: 75, y: 40 },  // zagueiro direito
    { x: 25, y: 70 },  // meia/atacante esquerdo
    { x: 75, y: 70 },  // meia/atacante direito
  ]

  // Retorna o proximo slot de posicao disponivel no campo
  const getNextFieldSlot = useCallback((escalados: PalpiteJogador[]) => {
    for (const slot of DEFAULT_FIELD_POSITIONS) {
      // Verificar se ja ha jogador muito proximo desta posicao
      const ocupado = escalados.some(j => Math.abs(j.x - slot.x) < 15 && Math.abs(j.y - slot.y) < 15)
      if (!ocupado) return slot
    }
    // Todos slots ocupados — posicionar no centro com pequeno deslocamento
    const idx = escalados.length % 5
    return { x: 30 + idx * 10, y: 50 }
  }, [])

  // Handler: toque/clique na lista lateral -> escalona no primeiro slot disponivel
  const handleTapAdd = useCallback((jogador: Jogador) => {
    if (!canEdit) return
    const jaExiste = escalacaoLocal.jogadores.some(j => j.jogadorId === jogador.id)
    if (jaExiste) return
    if (escalacaoLocal.jogadores.length >= 5) return

    const pos = getNextFieldSlot(escalacaoLocal.jogadores)
    const novoPalpite: PalpiteJogador = {
      jogadorId: jogador.id,
      x: pos.x,
      y: pos.y,
      gols: 0,
      assistencias: 0,
      golsSofridos: 0,
      isGoleiro: false,
      isMvp: false,
      isMelhorZag: false,
      isMelhorLat: false,
      isMelhorGol: false,
      resultadoPrevisto: null
    }
    setEscalacaoLocal(prev => ({
      jogadores: [...prev.jogadores, novoPalpite],
      updatedAt: new Date().toISOString()
    }))
  }, [canEdit, escalacaoLocal.jogadores, getNextFieldSlot])

  // Handler: remover jogador do campo (botao X)
  const handleRemoveFromField = useCallback((jogadorId: number) => {
    setEscalacaoLocal(prev => ({
      ...prev,
      jogadores: prev.jogadores.filter(j => j.jogadorId !== jogadorId),
      updatedAt: new Date().toISOString()
    }))
  }, [])

  // Carregar preferencia is_coach do BANCO DE DADOS (nao localStorage)
  // Evita mostrar prompt repetidamente
  useEffect(() => {
    if (!user) return
    
    async function loadIsCoach() {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_coach")
        .eq("id", user.id)
        .single()
      
      if (profile) {
        if (profile.is_coach === true) {
          // Usuario JA e tecnico - nao mostrar prompt
          setIsTecnico(true)
          setShowTecnicoPrompt(false)
        } else if (profile.is_coach === false) {
          // Usuario recusou ser tecnico
          setIsTecnico(false)
          setShowTecnicoPrompt(false)
        } else {
          // is_coach e null - primeira vez, mostrar prompt
          setShowTecnicoPrompt(true)
        }
      }
    }
    
    loadIsCoach()
  }, [user, supabase])

  // Carregar escalacao local do localStorage
  useEffect(() => {
    if (!user || !isTecnico) return
    const stored = localStorage.getItem(`escalacao-${user.id}`)
    if (stored) {
      try {
        setEscalacaoLocal(JSON.parse(stored))
      } catch {}
    }
  }, [user, isTecnico])

  // Salvar escalacao local no localStorage
  useEffect(() => {
    if (!user || !isTecnico || escalacaoLocal.jogadores.length === 0) return
    localStorage.setItem(`escalacao-${user.id}`, JSON.stringify(escalacaoLocal))
  }, [escalacaoLocal, user, isTecnico])

  // Carregar escalacoes salvas do banco (ordenado por pontos)
  // SIMPLIFICADO: Manter compatibilidade e persistencia
  const loadEscalacoes = useCallback(async () => {
    // 1. Buscar a partida mais recente para determinar rodada
    const { data: partidas } = await supabase
      .from("partidas")
      .select("id, status")
      .order("date", { ascending: false })
      .limit(1)
    
    // Determinar rodada ativa
    const rodadaAtivaId = partidas && partidas.length > 0 
      ? (partidas[0].status === "finalizado" ? partidas[0].id + 1 : partidas[0].id)
      : 1
    
    setRodadaAtiva(rodadaAtivaId)
    
    // 2. Buscar TODAS as escalacoes (ranking mostra todas)
    const { data } = await supabase
      .from("escalacoes_palpites")
      .select("*")
      .order("pontos_totais", { ascending: false })
    
    if (data) {
      setEscalacoesSalvas(data as EscalacaoSalva[])
      
      // Buscar MINHA escalacao (compativel com ou sem rodada_id)
      const minha = data.find((e: any) => e.user_id === user?.id)
      
      if (minha) {
        setTaxaPaga((minha as any).taxa_paga || false)
        setJogadorExtraPago((minha as any).jogador_extra_pago || false)
        
        // Carregar escalacao com jogador extra integrado
        const jogadoresComExtra = minha.jogadores || []
        if ((minha as any).jogador_extra && !jogadoresComExtra.some((j: any) => j.isExtra)) {
          const extra = (minha as any).jogador_extra as PalpiteJogador
          jogadoresComExtra.push({ ...extra, isExtra: true })
        }
        setEscalacaoLocal({
          jogadores: jogadoresComExtra,
          updatedAt: minha.updated_at
        })
      }
      // NOTA: Se nao tem escalacao, manter o estado atual (NAO resetar)
    }
  }, [supabase, user?.id])

  useEffect(() => {
    loadEscalacoes()
  }, [loadEscalacoes])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("escalacoes-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "escalacoes_palpites" }, () => {
        loadEscalacoes()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, loadEscalacoes])

  // Atualizar periodo a cada minuto
  useEffect(() => {
    const interval = setInterval(() => setIsOpen(isEscalacaoAberta()), 60000)
    return () => clearInterval(interval)
  }, [])

  // Handler confirmar tecnico
  const handleConfirmTecnico = async () => {
    if (!user) return
    setIsTecnico(true)
    setShowTecnicoPrompt(false)
    // Salvar no BANCO - nao no localStorage
    await supabase.from("profiles").update({ is_coach: true }).eq("id", user.id)
  }
  
  // Handler recusar tecnico
  const handleDeclineTecnico = async () => {
    if (!user) return
    setIsTecnico(false)
    setShowTecnicoPrompt(false)
    // Salvar no BANCO - nao no localStorage
    await supabase.from("profiles").update({ is_coach: false }).eq("id", user.id)
  }
  
  // Habilitar modo tecnico depois
  const handleEnableTecnico = async () => {
    if (!user) return
    setIsTecnico(true)
    // Salvar no BANCO - nao no localStorage
    await supabase.from("profiles").update({ is_coach: true }).eq("id", user.id)
  }

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over || over.id !== "soccer-field") return
    if (!canEdit) return

    const data = active.data.current
    if (!data) return

    // Calcular posicao relativa ao campo
    const fieldRect = fieldRef.current?.getBoundingClientRect()
    if (!fieldRect) return

    // Usar coordenadas do pointer
    const pointerX = (event.activatorEvent as PointerEvent)?.clientX
    const pointerY = (event.activatorEvent as PointerEvent)?.clientY
    if (!pointerX || !pointerY) return

    // Ajustar com delta do drag
    const finalX = pointerX + (event.delta?.x || 0)
    const finalY = pointerY + (event.delta?.y || 0)

    const x = Math.max(5, Math.min(95, ((finalX - fieldRect.left) / fieldRect.width) * 100))
    const y = Math.max(5, Math.min(95, ((finalY - fieldRect.top) / fieldRect.height) * 100))

    if (data.isOnField && data.palpite) {
      // Mover jogador existente (inclui 6o jogador com isExtra)
      setEscalacaoLocal(prev => ({
        ...prev,
        jogadores: prev.jogadores.map(j => 
          j.jogadorId === data.palpite.jogadorId ? { ...j, x, y } : j
        ),
        updatedAt: new Date().toISOString()
      }))
    } else if (data.jogador) {
      // Adicionar novo jogador
      const jogadorId = data.jogador.id
      const jaExiste = escalacaoLocal.jogadores.some(j => j.jogadorId === jogadorId)
      if (jaExiste) return
      
      // Contar titulares (sem isExtra)
      const titulares = escalacaoLocal.jogadores.filter(j => !(j as any).isExtra)
      if (titulares.length >= 5) return // Limite de 5 titulares

      const novoPalpite: PalpiteJogador = {
        jogadorId,
        x,
        y,
        gols: 0,
        assistencias: 0,
        golsSofridos: 0,
        isGoleiro: false,
        isMvp: false,
        isMelhorZag: false,
        isMelhorLat: false,
        isMelhorGol: false,
        resultadoPrevisto: null
      }
      setEscalacaoLocal(prev => ({
        jogadores: [...prev.jogadores, novoPalpite],
        updatedAt: new Date().toISOString()
      }))
    }
  }

  // Salvar no banco
  const handleFinalizar = async () => {
    if (!user) return
    
    // Se tem 0 jogadores, limpar escalacao do banco (funcao RESET)
    if (escalacaoLocal.jogadores.length === 0) {
      await limparEscalacao()
      return
    }
    
    // FLEXIBILIDADE: Minimo 1 jogador (nao mais 5 obrigatorios)
    // Qualquer quantidade >= 1 permite finalizar
    
    // Se ainda nao pagou taxa, mostrar modal de confirmacao
    if (!taxaPaga) {
      setShowTaxaModal(true)
      return
    }
    
    await salvarEscalacao()
  }
  
  // Funcao para limpar escalacao (0 jogadores = sair do jogo)
  const limparEscalacao = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      await supabase
        .from("escalacoes_palpites")
        .delete()
        .eq("user_id", user.id)
      
      setEscalacaoLocal({ jogadores: [], updatedAt: "" })
      setTaxaPaga(false)
      setJogadorExtra(null)
      setJogadorExtraPago(false)
      await loadEscalacoes()
    } finally {
      setIsSaving(false)
    }
  }
  
  // Funcao interna para salvar no banco
  // IMPORTANTE: Pontos de tecnicos sao independentes dos pontos de jogadores reais
  const salvarEscalacao = async () => {
    if (!user) return
    
    // NOTA: Gols e assists = 0 sao permitidos
    // Regra: 0 gols palpitados = 0 pontos de scout (nao bloqueia salvamento)
    
    setIsSaving(true)
    try {
      // Separar jogador extra do array para compatibilidade com banco
      const jogadoresTitulares = escalacaoLocal.jogadores.filter(j => !(j as any).isExtra)
      const jogadorExtraObj = escalacaoLocal.jogadores.find(j => (j as any).isExtra) || null
      
      // UPSERT simples por user_id - mantem pontos_totais existentes
      await supabase.from("escalacoes_palpites").upsert({
        user_id: user.id,
        user_name: user.name || user.email || "Anonimo",
        jogadores: jogadoresTitulares,
        updated_at: new Date().toISOString(),
        taxa_paga: taxaPaga,
        jogador_extra: jogadorExtraObj,
        jogador_extra_pago: jogadorExtraPago
      }, { onConflict: "user_id" })
      
      // NOTA: Esta tabela e INDEPENDENTE da tabela de jogadores/stats
      // Pontos de palpites NAO afetam estatisticas reais dos jogadores
      await loadEscalacoes()
    } finally {
      setIsSaving(false)
    }
  }
  
  // Confirmar pagamento da taxa (-10 pts)
  // SALDO NEGATIVO FORCADO - sem travas, sem Math.max
  const handleConfirmarTaxa = async () => {
    if (!user) return
    
    setTaxaPaga(true)
    setShowTaxaModal(false)
    setIsSaving(true)
    try {
      const jogadoresTitulares = escalacaoLocal.jogadores.filter(j => !(j as any).isExtra)
      const jogadorExtraObj = escalacaoLocal.jogadores.find(j => (j as any).isExtra) || null
      
      // Buscar dados atuais (maybeSingle para nao falhar se nao existir)
      const { data: existente } = await supabase
        .from("escalacoes_palpites")
        .select("pontos_totais, taxa_paga")
        .eq("user_id", user.id)
        .maybeSingle()
      
      // SO COBRA SE AINDA NAO FOI COBRADO (evita cobranca multipla)
      const jaFoiCobrado = existente?.taxa_paga === true
      const pontosAtuais = existente?.pontos_totais ?? 0
      const novosPontos = jaFoiCobrado ? pontosAtuais : pontosAtuais - 10
      
      await supabase.from("escalacoes_palpites").upsert({
        user_id: user.id,
        user_name: user.name || user.email || "Anonimo",
        jogadores: jogadoresTitulares,
        updated_at: new Date().toISOString(),
        taxa_paga: true,
        jogador_extra: jogadorExtraObj,
        jogador_extra_pago: jogadorExtraPago,
        pontos_totais: novosPontos
      }, { onConflict: "user_id" })
      await loadEscalacoes()
    } finally {
      setIsSaving(false)
    }
  }
  
  // Adicionar jogador extra (6o jogador) - integrado ao array principal
  const handleAdicionarJogadorExtra = (jogador: Jogador) => {
    // Verificar se ja tem jogador extra no array
    const jaTemExtra = escalacaoLocal.jogadores.some(j => (j as any).isExtra)
    if (jaTemExtra) return
    
    if (!jogadorExtraPago) {
      // Mostrar modal de confirmacao de pagamento
      setShowJogadorExtraModal(true)
      return
    }
    // Se ja pagou, adicionar direto ao array com flag isExtra
    const novoPalpite: PalpiteJogadorComExtra = {
      jogadorId: jogador.id,
      x: 50,
      y: 85,
      gols: 0,
      assistencias: 0,
      golsSofridos: 0,
      isGoleiro: false,
      isMvp: false,
      isMelhorZag: false,
      isMelhorLat: false,
      isMelhorGol: false,
      resultadoPrevisto: null,
      isExtra: true
    }
    setEscalacaoLocal(prev => ({
      ...prev,
      jogadores: [...prev.jogadores, novoPalpite]
    }))
  }
  
  // Confirmar pagamento do jogador extra (-15 pts)
  // 6o jogador integrado ao array principal com flag isExtra
  const handleConfirmarJogadorExtra = async (jogadorId: number) => {
    const jogador = jogadores?.find(j => j.id === jogadorId)
    if (!jogador) return
    
    // Criar palpite com flag isExtra para identificacao
    const novoPalpite: PalpiteJogadorComExtra = {
      jogadorId: jogador.id,
      x: 50,
      y: 85,
      gols: 0,
      assistencias: 0,
      golsSofridos: 0,
      isGoleiro: false,
      isMvp: false,
      isMelhorZag: false,
      isMelhorLat: false,
      isMelhorGol: false,
      resultadoPrevisto: null,
      isExtra: true // Flag que identifica o 6o jogador
    }
    
    // Integrar ao array principal
    setEscalacaoLocal(prev => ({
      ...prev,
      jogadores: [...prev.jogadores.filter(j => !(j as any).isExtra), novoPalpite]
    }))
    setJogadorExtraPago(true)
    setShowJogadorExtraModal(false)
    
    // DESCONTO DE -15 PTS APENAS SE AINDA NAO FOI COBRADO
    if (!user) return
    
    const jogadoresTitulares = escalacaoLocal.jogadores.filter(j => !(j as any).isExtra)
    
    // Buscar dados atuais (maybeSingle para nao falhar)
    const { data: existente } = await supabase
      .from("escalacoes_palpites")
      .select("pontos_totais, jogador_extra_pago")
      .eq("user_id", user.id)
      .maybeSingle()
    
    // SO COBRA SE AINDA NAO FOI COBRADO (evita cobranca multipla)
    const jaFoiCobrado = existente?.jogador_extra_pago === true
    const pontosAtuais = existente?.pontos_totais ?? 0
    const novosPontos = jaFoiCobrado ? pontosAtuais : pontosAtuais - 15
    
    await supabase.from("escalacoes_palpites").upsert({
      user_id: user.id,
      user_name: user.name || user.email || "Tecnico",
      jogadores: jogadoresTitulares,
      updated_at: new Date().toISOString(),
      taxa_paga: taxaPaga,
      jogador_extra: novoPalpite,
      jogador_extra_pago: true,
      pontos_totais: novosPontos
    }, { onConflict: "user_id" })
    await loadEscalacoes()
  }
  
  // Remover jogador extra do array
  const handleRemoverJogadorExtra = () => {
    setEscalacaoLocal(prev => ({
      ...prev,
      jogadores: prev.jogadores.filter(j => !(j as any).isExtra)
    }))
    // Nao reseta jogador_extra_pago - o credito fica para trocar
  }
  
  // Admin: carregar escalacao de outro tecnico para edicao
  const handleAdminEdit = (esc: EscalacaoSalva) => {
    if (!isAdmin) return
    setEditingTecnicoId(esc.user_id)
    
    // Combinar jogadores titulares + jogador extra (se existir)
    const jogadoresTitulares = esc.jogadores || []
    const jogadorExtra = (esc as any).jogador_extra
    const todosJogadores = jogadorExtra 
      ? [...jogadoresTitulares, { ...jogadorExtra, isExtra: true }]
      : jogadoresTitulares
    
    setEscalacaoLocal({
      jogadores: todosJogadores,
      updatedAt: esc.updated_at
    })
    setTaxaPaga((esc as any).taxa_paga || false)
    setJogadorExtraPago((esc as any).jogador_extra_pago || false)
    setSelectedTecnico(null) // Fechar visualizacao
  }
  
  // Admin: salvar escalacao editada de outro tecnico
  const handleAdminSaveEdit = async () => {
    if (!isAdmin || !editingTecnicoId) return
    setIsSaving(true)
    try {
      // Buscar escalacao original do tecnico
      const tecnico = escalacoesSalvas.find(e => e.user_id === editingTecnicoId)
      
      // Separar titulares e jogador extra
      const jogadoresTitulares = escalacaoLocal.jogadores.filter(j => !(j as any).isExtra)
      const jogadorExtraObj = escalacaoLocal.jogadores.find(j => (j as any).isExtra) || null
      
      // Upsert simples por user_id
      await supabase.from("escalacoes_palpites").upsert({
        user_id: editingTecnicoId,
        user_name: tecnico?.user_name || "Tecnico",
        jogadores: jogadoresTitulares,
        updated_at: new Date().toISOString(),
        taxa_paga: taxaPaga,
        jogador_extra: jogadorExtraObj,
        jogador_extra_pago: jogadorExtraPago
      }, { onConflict: "user_id" })
      
      await loadEscalacoes()
      
      // Voltar para minha escalacao
      const minhaEscalacao = escalacoesSalvas.find(e => e.user_id === user?.id)
      if (minhaEscalacao) {
        setEscalacaoLocal({
          jogadores: minhaEscalacao.jogadores || [],
          updatedAt: minhaEscalacao.updated_at
        })
      } else {
        setEscalacaoLocal({ jogadores: [], updatedAt: "" })
      }
      setEditingTecnicoId(null)
    } finally {
      setIsSaving(false)
    }
  }
  
  // Admin: cancelar edicao
  const handleAdminCancelEdit = () => {
    const minhaEscalacao = escalacoesSalvas.find(e => e.user_id === user?.id)
    if (minhaEscalacao) {
      setEscalacaoLocal({
        jogadores: minhaEscalacao.jogadores || [],
        updatedAt: minhaEscalacao.updated_at
      })
    } else {
      setEscalacaoLocal({ jogadores: [], updatedAt: "" })
    }
    setEditingTecnicoId(null)
  }

  // Admin: excluir escalacao de outro usuario
  const handleAdminDelete = async (escId: number) => {
    if (!isAdmin) return
    if (!confirm("Tem certeza que deseja excluir esta escalacao?")) return
    await supabase.from("escalacoes_palpites").delete().eq("id", escId)
    await loadEscalacoes()
    if (selectedTecnico?.id === escId) setSelectedTecnico(null)
  }

  // Exportar imagem
  const handleExport = async () => {
    if (!fieldRef.current) return
    try {
      const dataUrl = await toPng(fieldRef.current, { quality: 0.95, pixelRatio: 2 })
      const link = document.createElement("a")
      link.download = `palpite-${user?.name || "tecnico"}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error("Erro ao exportar:", err)
    }
  }

  // Jogadores disponiveis (nao escalados)
  const jogadoresDisponiveis = useMemo(() => {
    const escaladosIds = new Set(escalacaoLocal.jogadores.map(j => j.jogadorId))
    return (jogadores || [])
      .filter(j => j.status === "active" && !escaladosIds.has(j.id))
      .sort((a, b) => (a.nickname || a.name).localeCompare(b.nickname || b.name, "pt-BR"))
  }, [jogadores, escalacaoLocal.jogadores])

  // Escalacao sendo visualizada (propria ou de outro tecnico)
  // Incluir jogador extra do banco quando visualizando outro tecnico
  const escalacaoVisualizada = useMemo(() => {
    if (selectedTecnico) {
      const jogadoresSelecionados = [...(selectedTecnico.jogadores || [])]
      // Integrar jogador_extra do banco
      if ((selectedTecnico as any).jogador_extra) {
        const extra = (selectedTecnico as any).jogador_extra as PalpiteJogador
        if (!jogadoresSelecionados.some(j => j.jogadorId === extra.jogadorId)) {
          jogadoresSelecionados.push({ ...extra, isExtra: true } as any)
        }
      }
      return jogadoresSelecionados
    }
    return escalacaoLocal.jogadores
  }, [selectedTecnico, escalacaoLocal.jogadores])
  const isVisualizandoOutro = !!selectedTecnico

  // Jogador ativo no drag
  const activeJogador = activeId 
    ? jogadores?.find(j => activeId === `player-${j.id}` || activeId === `field-player-${j.id}`)
    : null

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: "#1a1a1a" }}>
        
        {/* Modal "Deseja ser tecnico?" */}
        <TecnicoPromptModal
          open={showTecnicoPrompt}
          onConfirm={handleConfirmTecnico}
          onDecline={handleDeclineTecnico}
        />

  {/* Modal de informacoes */}
  <InfoModal open={showInfoModal} onClose={() => setShowInfoModal(false)} />
  
  {/* Modal de taxa de inscricao */}
  <TaxaInscricaoModal
    open={showTaxaModal}
    onConfirm={handleConfirmarTaxa}
    onCancel={() => setShowTaxaModal(false)}
  />
  
  {/* Modal de jogador extra */}
  <JogadorExtraModal
    open={showJogadorExtraModal}
    onCancel={() => setShowJogadorExtraModal(false)}
    jogadoresDisponiveis={jogadoresDisponiveis}
    onConfirm={handleConfirmarJogadorExtra}
  />

        {/* Modal de palpite */}
        <PalpiteModal
          open={!!editingPalpite}
          onClose={() => setEditingPalpite(null)}
          palpite={editingPalpite}
          jogador={editingPalpite ? jogadores?.find(j => j.id === editingPalpite.jogadorId) : undefined}
          onSave={(updated) => {
            setEscalacaoLocal(prev => ({
              ...prev,
              jogadores: prev.jogadores.map(j => j.jogadorId === updated.jogadorId ? updated : j),
              updatedAt: new Date().toISOString()
            }))
          }}
          onRemove={() => {
            if (!editingPalpite) return
            setEscalacaoLocal(prev => ({
              ...prev,
              jogadores: prev.jogadores.filter(j => j.jogadorId !== editingPalpite.jogadorId),
              updatedAt: new Date().toISOString()
            }))
            setEditingPalpite(null)
          }}
        />

        {/* Painel Admin com controles */}
        {isAdmin && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-4 py-3 rounded-lg border mb-4"
            style={{ backgroundColor: "rgba(212, 179, 0, 0.08)", borderColor: "rgba(212, 179, 0, 0.4)" }}
          >
            <div className="flex items-center gap-3 flex-1">
              <Shield className="w-5 h-5 flex-shrink-0" style={{ color: "#D4B300" }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "#D4B300" }}>Painel Admin</p>
                <p className="text-xs" style={{ color: "#967948" }}>
                  {isOpen ? "Periodo automatico aberto" : "Periodo automatico fechado"} • Voce tem acesso total
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-[#1a1a1a] px-3 py-2 rounded-lg border border-[#333]">
              <Label htmlFor="liberar-manual" className="text-xs text-white cursor-pointer">
                Liberar Escalacao Manual
              </Label>
              <Switch
                id="liberar-manual"
                checked={escalacaoLiberadaManual}
                onCheckedChange={handleToggleLiberacao}
                className="data-[state=checked]:bg-green-500"
              />
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-6 h-6" style={{ color: "#D4B300" }} />
              Palpite do Tecnico
            </h1>
            <p className="text-sm" style={{ color: "#967948" }}>
              {isTecnico ? "Arraste 5 jogadores para o campo e faca seus palpites" : "Visualize os palpites dos tecnicos"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowInfoModal(true)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <HelpCircle className="w-5 h-5" style={{ color: "#967948" }} />
            </button>
            {periodoAberto ? (
              <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 flex items-center gap-1">
                {escalacaoLiberadaManual && !isOpen && <Shield className="w-3 h-3" />}
                {escalacaoLiberadaManual && !isOpen ? "Liberado pelo Admin" : "Aberto ate Dom 06h"}
              </span>
            ) : (
              <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">
                Fechado • Sexta 00h - Dom 06h
              </span>
            )}
            {!isTecnico && (
              <Button size="sm" onClick={handleEnableTecnico} style={{ backgroundColor: "#D4B300", color: "#1a1a1a" }}>
                Quero ser Tecnico
              </Button>
            )}
          </div>
        </div>

        {/* Layout principal: Ranking | Campo | Elenco */}
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_240px] gap-4">
          
          {/* COLUNA ESQUERDA: Ranking dos Tecnicos (Acordeao no mobile) */}
          <Card className="bg-[#2B2B2B] border-[#333] order-2 lg:order-1">
            <Collapsible open={rankingOpen} onOpenChange={setRankingOpen}>
              <CardHeader className="pb-2">
                <CollapsibleTrigger className="w-full">
                  <CardTitle className="text-sm font-semibold text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Crown className="w-4 h-4" style={{ color: "#D4B300" }} />
                      Ranking Tecnicos ({escalacoesSalvas.length})
                    </span>
                    <span className="md:hidden">
                      {rankingOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </CardTitle>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                  {escalacoesSalvas.length === 0 ? (
                    <p className="text-xs text-[#967948] text-center py-4">Nenhuma escalacao ainda</p>
                  ) : (
                    escalacoesSalvas.map((esc, idx) => {
                      const isMe = esc.user_id === user?.id
                      const isSelected = selectedTecnico?.id === esc.id
                      const isBeingEdited = editingTecnicoId === esc.user_id
                      const nivel = calcularNivel(esc.pontos_totais || 0)
                      const nivelCores = NIVEL_CORES[nivel]
                      return (
                        <div
                          key={esc.id}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-lg transition-all cursor-pointer border-2",
                            isSelected && "ring-2 ring-[#D4B300]/50",
                            isBeingEdited && "ring-2 ring-amber-500/50"
                          )}
                          style={{ 
                            backgroundColor: isSelected ? "rgba(212,179,0,0.1)" : isBeingEdited ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.02)",
                            borderColor: isBeingEdited ? "#F59E0B" : nivelCores.border
                          }}
                          onClick={() => setSelectedTecnico(isSelected ? null : esc)}
                        >
                          {/* Posicao com cor de nivel */}
                          <span 
                            className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: nivelCores.bg, color: "#1a1a1a" }}
                          >
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate flex items-center gap-1">
                              {esc.user_name}
                              {isMe && <span className="text-[9px] px-1 rounded bg-green-500/20 text-green-400">voce</span>}
                              {isBeingEdited && <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-400">editando</span>}
                            </p>
                            <p className="text-[10px] flex items-center gap-1" style={{ color: "#967948" }}>
                              {/* SALDO NEGATIVO FORCADO - VERMELHO OBRIGATORIO */}
                              {(esc.pontos_totais ?? 0) < 0 ? (
                                <span className="font-semibold text-red-500">
                                  -{Math.abs(esc.pontos_totais ?? 0)} pts
                                </span>
                              ) : (
                                <span className="font-semibold" style={{ color: nivelCores.bg }}>
                                  {esc.pontos_totais ?? 0} pts
                                </span>
                              )}
                              <span>•</span>
                              <span>{nivel.charAt(0).toUpperCase() + nivel.slice(1)}</span>
                              {(esc as any).taxa_paga && <Coins className="w-3 h-3 text-green-400 ml-1" />}
                              {(esc as any).jogador_extra_pago && <UserPlus className="w-3 h-3 text-amber-400 ml-0.5" />}
                            </p>
                          </div>
                          {isSelected && !isBeingEdited && (
                            <Eye className="w-4 h-4" style={{ color: "#D4B300" }} />
                          )}
                          
                          {/* Admin: botao EDITAR (lapis) */}
                          {isAdmin && !isMe && !isBeingEdited && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleAdminEdit(esc) }}
                              className="p-1 rounded hover:bg-amber-500/20 transition-colors"
                              title="Editar escalacao"
                            >
                              <Pencil className="w-3.5 h-3.5 text-amber-400" />
                            </button>
                          )}
                          
                          {/* Admin: botao excluir */}
                          {isAdmin && !isMe && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleAdminDelete(esc.id) }}
                              className="p-1 rounded hover:bg-red-500/20 transition-colors"
                              title="Excluir escalacao"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          )}
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* COLUNA CENTRAL: Campo de Futebol */}
          <div className="order-1 lg:order-2 relative">
  {/* Overlay de bloqueio para nao-tecnicos ou periodo fechado - z-30 para nao sobrepor menu */}
  {!canEdit && !isVisualizandoOutro && (
  <div className="absolute inset-0 z-30 rounded-xl flex flex-col items-center justify-center backdrop-blur-sm"
  style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
  >
  <Lock className="w-12 h-12 mb-4" style={{ color: "#D4B300" }} />
  <p className="text-white font-semibold text-center px-4">
  {!isTecnico ? "Voce esta no modo visualizacao" : "Periodo de escalacao fechado"}
  </p>
  <p className="text-sm text-[#967948] text-center px-4 mt-2">
  {!isTecnico ? "Clique em 'Quero ser Tecnico' para participar" : "Abertura: Sexta 00h | Fechamento: Domingo 06h"}
  </p>
  </div>
  )}

            {/* Banner: Admin editando escalacao de outro tecnico */}
            {editingTecnicoId && (
              <div className="mb-2 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center gap-2 justify-between border border-amber-500/50" style={{ backgroundColor: "rgba(245,158,11,0.1)" }}>
                <div className="flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-amber-400 font-medium">
                    Editando: {escalacoesSalvas.find(e => e.user_id === editingTecnicoId)?.user_name || "Tecnico"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleAdminCancelEdit} className="border-[#555] bg-[#333] text-white hover:bg-[#444] hover:border-[#666]">
                    <X className="w-4 h-4 mr-1" /> Cancelar
                  </Button>
                  <Button size="sm" onClick={handleAdminSaveEdit} disabled={isSaving} className="bg-amber-500 hover:bg-amber-600 text-white">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                    Salvar Alteracoes
                  </Button>
                </div>
              </div>
            )}

            {isVisualizandoOutro && !editingTecnicoId && selectedTecnico && (
              <div className="mb-3 rounded-lg overflow-hidden border border-[#D4B300]/30" style={{ backgroundColor: "rgba(212,179,0,0.05)" }}>
                {/* Header com nome e botao fechar */}
                <div className="flex items-center justify-between p-2 border-b border-[#D4B300]/20">
                  <span className="text-sm text-white">Visualizando: <strong>{selectedTecnico.user_name}</strong></span>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedTecnico(null)} className="text-white hover:bg-white/10 h-7 px-2">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* MEMORIA DE CALCULO TRANSPARENTE */}
                {(() => {
                  // Valores do banco
                  const taxaInscricao = (selectedTecnico as any).taxa_paga ? 10 : 0
                  const taxaExtra = (selectedTecnico as any).jogador_extra_pago ? 15 : 0
                  const totalTaxas = taxaInscricao + taxaExtra
                  const pontosRanking = selectedTecnico.pontos_totais ?? 0
                  
                  // Pontos brutos = ranking + taxas (desfazendo os descontos)
                  // Este e o valor REAL que os jogadores somaram antes das taxas
                  const pontosBrutos = pontosRanking + totalTaxas
                  
                  return (
                    <div className="p-3 space-y-3">
                      {/* SECAO 1: SOMA BRUTA DOS JOGADORES */}
                      <div className="bg-green-500/10 rounded-lg p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white/80 text-sm font-medium">Soma dos Jogadores:</span>
                          <span className="font-bold text-xl text-green-400">+{pontosBrutos} pts</span>
                        </div>
                        <p className="text-[10px] text-white/40 mt-1">
                          Clique em cada jogador para ver os detalhes individuais
                        </p>
                      </div>
                      
                      {/* SECAO 2: DETALHAMENTO DE DESCONTOS E AJUSTES */}
                      {totalTaxas > 0 && (
                        <div className="bg-red-500/10 rounded-lg p-2">
                          <p className="text-[10px] uppercase tracking-wider text-red-300/80 mb-2 font-medium">
                            Detalhamento de Descontos e Ajustes
                          </p>
                          <div className="space-y-1">
                            {taxaInscricao > 0 && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-white/60 flex items-center gap-1">
                                  <Coins className="w-3 h-3 text-green-400" /> Taxa de Inscricao
                                </span>
                                <span className="text-red-400 font-medium">-{taxaInscricao} pts</span>
                              </div>
                            )}
                            {taxaExtra > 0 && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-white/60 flex items-center gap-1">
                                  <UserPlus className="w-3 h-3 text-amber-400" /> 6o Jogador Extra
                                </span>
                                <span className="text-red-400 font-medium">-{taxaExtra} pts</span>
                              </div>
                            )}
                            <div className="border-t border-red-500/20 pt-1 mt-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-white/50">Total de Descontos:</span>
                                <span className="text-red-400 font-bold">-{totalTaxas} pts</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* SECAO 3: TOTAL FINAL DO RANKING */}
                      <div className="border-t-2 border-[#D4B300]/50 pt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[#D4B300] font-bold text-sm uppercase tracking-wider">Total Ranking:</span>
                          <span className={cn(
                            "text-3xl font-bold",
                            pontosRanking >= 0 ? "text-green-400" : "text-red-400"
                          )}>
                            {pontosRanking >= 0 ? "+" : ""}{pontosRanking} pts
                          </span>
                        </div>
                        {/* Formula matematica explicita */}
                        <p className="text-[10px] text-white/50 text-center mt-2 bg-white/5 rounded py-1">
                          {pontosBrutos} (jogadores) - {totalTaxas} (taxas) = <strong>{pontosRanking}</strong>
                        </p>
                      </div>
                    </div>
                  )
                })()}
                

              </div>
            )}
            
            {/* INSTRUCAO VISUAL - Ajuda UX */}
            {isTecnico && !isVisualizandoOutro && (canEdit || editingTecnicoId) && escalacaoLocal.jogadores.length > 0 && (
              <p className="text-xs text-yellow-400 font-medium mb-2 text-center">
                Dica: Toque no jogador no campo para definir Gols, Assistencias e Selos. Cada jogador escalado soma +2 pts de participacao.
              </p>
            )}

            <DroppableField fieldRef={fieldRef}>
    {escalacaoVisualizada.map(palpite => {
      const jogador = jogadores?.find(j => j.id === palpite.jogadorId)
      const isExtraJogador = (palpite as any).isExtra === true
      const playerElement = (
        <PlayerOnField
          key={palpite.jogadorId}
          palpite={palpite}
          jogador={jogador}
          onClick={() => !isVisualizandoOutro && (canEdit || editingTecnicoId) && setEditingPalpite(palpite)}
          onRemove={!isVisualizandoOutro && (canEdit || editingTecnicoId) ? () => isExtraJogador ? handleRemoverJogadorExtra() : handleRemoveFromField(palpite.jogadorId) : undefined}
          canEdit={!isVisualizandoOutro && (canEdit || !!editingTecnicoId)}
          isViewMode={isVisualizandoOutro}
          isExtra={isExtraJogador}
        />
      )
      
      // Se estiver visualizando outro tecnico, envolver com Popover
      if (isVisualizandoOutro) {
        return (
          <PalpitePopover key={palpite.jogadorId} palpite={palpite} jogador={jogador}>
            <div>{playerElement}</div>
          </PalpitePopover>
        )
      }
      
      return playerElement
    })}
  
  </DroppableField>

            {/* Hint mobile: toque para editar/remover */}
            {canEdit && !isVisualizandoOutro && escalacaoLocal.jogadores.length > 0 && (
              <p className="text-center text-[10px] text-white/30 mt-1 md:hidden">
                Toque no jogador para editar • X para remover
              </p>
            )}

            {/* Botoes abaixo do campo */}
            {!isVisualizandoOutro && isTecnico && (
              <div className="flex justify-center gap-2 mt-4">
    <Button size="sm" variant="outline" onClick={handleExport} className="border-[#555] bg-[#333] text-white hover:bg-[#444] hover:border-[#666]">
      <Download className="w-4 h-4 mr-1" /> Exportar
    </Button>
  {/* Botao Reset (limpar escalacao) */}
  {escalacaoLocal.jogadores.length === 0 && taxaPaga && (
    <Button
      size="sm"
      variant="destructive"
      onClick={handleFinalizar}
      disabled={isSaving || (!isAdmin && !periodoAberto)}
    >
      {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}
      Sair do Jogo
    </Button>
  )}
  
  {/* Botao Finalizar/Salvar normal - MINIMO 1 JOGADOR */}
  {(escalacaoLocal.jogadores.length > 0 || !taxaPaga) && (
    <Button
      size="sm"
      onClick={handleFinalizar}
      disabled={isSaving || escalacaoLocal.jogadores.length === 0 || (!isAdmin && !periodoAberto)}
      className={cn(
        taxaPaga ? "bg-green-600 hover:bg-green-700" : "bg-[#D4B300] hover:bg-[#D4B300]/90",
        "text-white"
      )}
    >
      {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
      {taxaPaga ? "Salvar Alteracoes" : `${escalacaoLocal.jogadores.length} jogador(es) — Finalizar (-10 pts)`}
    </Button>
  )}
  </div>
  )}
  
  {/* Indicador de taxa paga e opcao de jogador extra */}
  {isTecnico && !isVisualizandoOutro && taxaPaga && (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 flex items-center gap-1">
        <Coins className="w-3 h-3" />
        Taxa paga (-10 pts)
      </span>
      
      {/* Mostrar botao de adicionar 6o jogador se nao tem no array */}
      {!escalacaoLocal.jogadores.some(j => (j as any).isExtra) && (canEdit || editingTecnicoId) && (
        <button
          onClick={() => setShowJogadorExtraModal(true)}
          className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors flex items-center gap-1"
        >
          <UserPlus className="w-3 h-3" />
          Adicionar 6º jogador (-15 pts)
        </button>
      )}
      
      {/* Mostrar badge se ja tem 6o jogador */}
      {escalacaoLocal.jogadores.some(j => (j as any).isExtra) && (
        <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 flex items-center gap-1">
          <UserPlus className="w-3 h-3" />
          6º jogador ativo (-15 pts)
        </span>
      )}
    </div>
  )}
          </div>

          {/* COLUNA DIREITA: Elenco para arrastar (Acordeao no mobile) */}
          {(isTecnico || editingTecnicoId) && !isVisualizandoOutro && (
            <Card className="bg-[#2B2B2B] border-[#333] order-3">
              <Collapsible open={elencoOpen} onOpenChange={setElencoOpen}>
                <CardHeader className="pb-2">
                  <CollapsibleTrigger className="w-full">
                    <CardTitle className="text-sm font-semibold text-white flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4" style={{ color: "#D4B300" }} />
                        Elenco ({jogadoresDisponiveis.length})
                      </span>
                      <span className="md:hidden">
                        {elencoOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </span>
                    </CardTitle>
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="space-y-1 max-h-[400px] overflow-y-auto">
                    {jogadoresDisponiveis.map(jogador => (
                      <DraggablePlayer
                        key={jogador.id}
                        jogador={jogador}
                        canEdit={canEdit || !!editingTecnicoId}
                        onTapAdd={handleTapAdd}
                      />
                    ))}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId && activeJogador && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[#2B2B2B] border border-[#D4B300] shadow-xl">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: "#D4B300", color: "#1a1a1a" }}
              >
                {(activeJogador.nickname || activeJogador.name).substring(0, 2).toUpperCase()}
              </div>
              <span className="text-sm text-white">{activeJogador.nickname || activeJogador.name}</span>
            </div>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  )
}
