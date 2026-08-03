"use client"

/**
 * Resumo da Partida - Amaralina FC
 * Exibe a ultima partida cadastrada com opcoes de compartilhamento
 */

import { useRef, useState, useMemo, useCallback } from "react"
import { useData } from "@/contexts/data-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  Download, 
  Share2, 
  Trophy,
  Calendar,
  Users,
  CircleDot,
  Footprints,
  Goal,
  Loader2,
  ImageIcon,
  Star,
  Shield
} from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

export default function ResumoPartidaPage() {
  const { partidas, jogadores } = useData()
  const cardRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)

  // Obter a partida mais recente
  const ultimaPartida = useMemo(() => {
    if (!partidas || partidas.length === 0) return null
    
    const sorted = [...partidas].sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateB - dateA
    })
    
    return sorted[0]
  }, [partidas])

  // Formatar data
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  // Obter jogadores de cada time — memoizado para evitar re-cálculo
  const timeA = useMemo(() => {
    if (!ultimaPartida?.partida_jogadores) return []
    return ultimaPartida.partida_jogadores.filter(mp => mp.team === "A")
  }, [ultimaPartida])

  const timeB = useMemo(() => {
    if (!ultimaPartida?.partida_jogadores) return []
    return ultimaPartida.partida_jogadores.filter(mp => mp.team === "B")
  }, [ultimaPartida])

  // Map for O(1) jogador lookups
  const jogadoresMap = useMemo(() => new Map((jogadores || []).map(j => [j.id, j])), [jogadores])

  // Encontrar dados do jogador (usa Map para O(1))
  const getJogador = useCallback((jogadorId: number) => jogadoresMap.get(jogadorId), [jogadoresMap])

  // Gerar imagem com html-to-image (mais robusto que html2canvas)
  const generateImage = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null
    
    setIsGenerating(true)
    setShareError(null)
    
    // Aguardar o DOM e os estilos estarem completamente renderizados
    await new Promise((resolve) => setTimeout(resolve, 500))
    
    try {
      // Configurar todas as imagens para usar CORS antes de capturar
      const images = cardRef.current.querySelectorAll("img")
      images.forEach((img) => {
        if (img.src && !img.src.startsWith("data:")) {
          img.crossOrigin = "anonymous"
        }
      })
      
      // Aguardar imagens carregarem
      await new Promise((resolve) => setTimeout(resolve, 300))
      
      // Gerar PNG com html-to-image (dynamic import para reduzir bundle inicial)
      const { toPng } = await import("html-to-image")
      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: "#0f0f0f",
        cacheBust: true,
        fetchRequestInit: {
          mode: "cors",
          credentials: "omit",
        },
        filter: (node) => {
          // Ignorar elementos problematicos
          if (node.tagName === "NOSCRIPT") return false
          return true
        },
        style: {
          // Override de cores para evitar erros com oklch/lab
          "--background": "#F9F9F9",
          "--foreground": "#2B2B2B",
          "--card": "#1a1a1a",
          "--card-foreground": "#F9F9F9",
          "--primary": "#C5A059",
          "--secondary": "#0088CC",
          "--muted": "#333333",
          "--muted-foreground": "#C5A059",
          "--border": "#333333",
        } as React.CSSProperties,
      })
      
      // Converter dataUrl para Blob
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      
      return blob
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error("[v0] Erro ao gerar imagem:", errorMsg)
      console.error("[v0] Detalhes do erro:", error)
      setShareError(`Erro ao gerar imagem: ${errorMsg.slice(0, 100)}`)
      return null
    } finally {
      setIsGenerating(false)
    }
  }

  // Salvar na galeria (download)
  const handleDownload = async () => {
    const blob = await generateImage()
    if (!blob) return
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `amaralina-fc-partida-${ultimaPartida?.date || "resumo"}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Compartilhar via Web Share API (generico)
  const handleShare = async () => {
    const blob = await generateImage()
    if (!blob) return
    
    const file = new File([blob], `amaralina-fc-${ultimaPartida?.date || "resumo"}.png`, {
      type: "image/png"
    })
    
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "Amaralina FC - Resumo da Partida",
          text: "Confira o resultado do ultimo jogo do Amaralina FC!"
        })
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          handleDownload()
        }
      }
    } else {
      setShareError("Compartilhamento nao suportado. Baixando imagem...")
      handleDownload()
    }
  }

  // Compartilhar via WhatsApp
  // Gera a imagem, faz download automatico e abre o WhatsApp com mensagem de texto
  const handleShareWhatsApp = async () => {
    setIsGenerating(true)
    setShareError(null)
    
    try {
      // Gerar e baixar a imagem primeiro
      const blob = await generateImage()
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `amaralina-fc-${ultimaPartida?.date || "resumo"}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }

      // Montar mensagem de texto com o placar
      const golsA = ultimaPartida?.score_a ?? 0
      const golsB = ultimaPartida?.score_b ?? 0
      const nomeA = ultimaPartida?.team_a_name || "Time A"
      const nomeB = ultimaPartida?.team_b_name || "Time B"
      const dataPartida = ultimaPartida?.date ? formatDate(ultimaPartida.date) : ""
      const resultado = golsA > golsB
        ? `${nomeA} venceu ${golsA} x ${golsB}`
        : golsB > golsA
          ? `${nomeB} venceu ${golsB} x ${golsA}`
          : `Empate ${golsA} x ${golsB}`

      const msg = encodeURIComponent(
        `Amaralina FC - Pelada das Lendas\n${dataPartida}\n${resultado}\n\n(Imagem baixada automaticamente - envie junto!)`
      )

      // Abrir WhatsApp com a mensagem
      window.open(`https://api.whatsapp.com/send?text=${msg}`, "_blank")
    } finally {
      setIsGenerating(false)
    }
  }

  // Usar score_a/score_b do banco de dados (fonte de verdade)
  const golsTimeA = ultimaPartida?.score_a ?? 0
  const golsTimeB = ultimaPartida?.score_b ?? 0

  // Nomes dos times do banco de dados
  const nomeTimeA = ultimaPartida?.team_a_name || "Time A"
  const nomeTimeB = ultimaPartida?.team_b_name || "Time B"

  // Determinar vencedor
  const getResultBadge = () => {
    if (golsTimeA > golsTimeB) return { text: `${nomeTimeA} Venceu!`, color: "text-green-400" }
    if (golsTimeB > golsTimeA) return { text: `${nomeTimeB} Venceu!`, color: "text-green-400" }
    return { text: "Empate", color: "text-yellow-400" }
  }

  if (!ultimaPartida) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="glass-card border-[#D4B300]/30 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 mx-auto text-[#D4B300]/50 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Nenhuma Partida Registrada</h2>
            <p className="text-[#967948]">
              Cadastre uma partida para ver o resumo aqui.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const result = getResultBadge()

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-[#D4B300]" />
            Resumo da Partida
          </h1>
          <p className="text-[#967948] mt-1">
            Resumo da partida mais recente
          </p>
        </div>

        {/* Botoes de Compartilhamento */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleDownload}
            disabled={isGenerating}
            className="bg-[#2B2B2B] hover:bg-[#333] text-white border border-[#D4B300]/30"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Salvar Imagem
          </Button>
          <Button
            onClick={handleShare}
            disabled={isGenerating}
            className="bg-[#0088CC] hover:bg-[#006699] text-white"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Share2 className="w-4 h-4 mr-2" />
            )}
            Compartilhar
          </Button>
          <Button
            onClick={handleShareWhatsApp}
            disabled={isGenerating}
            className="text-white"
            style={{ backgroundColor: "#25D366" }}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Share2 className="w-4 h-4 mr-2" />
            )}
            WhatsApp
          </Button>
        </div>
      </div>

      {shareError && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-yellow-400 text-sm">
          {shareError}
        </div>
      )}

      {/* Card para Captura */}
      <div 
        ref={cardRef}
        className="max-w-2xl mx-auto"
      >
        <Card className="bg-gradient-to-br from-[#0000008a] to-[#0000008a] border-2 border-[#0000008a]/50 overflow-hidden">
          {/* Header do Card */}
          <div className="bg-gradient-to-r from-[#0000006a] to-[#0000006a] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-transparent rounded-lg flex items-center justify-center p-1">
                  <Image
                    src="/logo-header.png"
                    alt="Amaralina FC"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#ffffff]">AMARALINA FC</h2>
                  <p className="text-sm text-[#ffffff]/70">Pelada das Lendas</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-[#ffffff]">
                  <img
                  src="/calendario-resumo.png"
                  alt="Calendário"
                  width={50}
                  height={50}
                  className="w-4 h-4 object-contain invert"
                  />
                  <span className="font-medium">{formatDate(ultimaPartida.date)}</span>
                </div>
              </div>
            </div>
          </div>

          <CardContent className="p-6">
            {/* Placar */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-4 md:gap-8">
                {/* Time A */}
                <div className="text-center flex-1">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#0088CC] to-[#006699] flex items-center justify-center mb-2 mx-auto">
                    <span className="text-2xl md:text-3xl font-bold text-white">
                      {nomeTimeA.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm font-semibold text-white leading-tight">
                    {nomeTimeA}
                  </p>
                </div>

                {/* Placar */}
                <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                  <span className="text-4xl md:text-6xl font-black text-white tabular-nums">{golsTimeA}</span>
                  <span className="text-2xl md:text-4xl font-bold text-[#D4B300]">x</span>
                  <span className="text-4xl md:text-6xl font-black text-white tabular-nums">{golsTimeB}</span>
                </div>

                {/* Time B */}
                <div className="text-center flex-1">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#D4500F] flex items-center justify-center mb-2 mx-auto">
                    <span className="text-2xl md:text-3xl font-bold text-white">
                      {nomeTimeB.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm font-semibold text-white leading-tight">
                    {nomeTimeB}
                  </p>
                </div>
              </div>

              <div className={cn("inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-white/5", result.color)}>
                <Trophy className="w-4 h-4" />
                <span className="font-bold">{result.text}</span>
              </div>
            </div>

            {/* Formacoes */}
            <div className="grid grid-cols-2 gap-4">
              {/* Time A */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-[#0088CC] flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4" />
                  {nomeTimeA}
                </h3>
                <div className="space-y-2">
                  {timeA.map((mp) => {
                    const jogador = getJogador(mp.jogador_id)
                    if (!jogador) return null
                    
                    return (
                      <div 
                        key={mp.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-[#0088CC]/10 border border-[#0088CC]/20"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-[#0088CC]/30 flex items-center justify-center flex-shrink-0">
                          {jogador.photo_url ? (
                            <Image
                              src={jogador.photo_url}
                              alt={jogador.nickname || jogador.name}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                            />
                          ) : (
                            <span className="text-xs font-bold text-white">
                              {(jogador.nickname || jogador.name).charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate flex items-center gap-1 flex-wrap">
                            {jogador.nickname || jogador.name}
                            {/* Selo MVP */}
                            {mp.is_mvp && (
                              <span className="inline-flex items-center gap-0.5 px-1 rounded-full text-[9px] font-bold" style={{ backgroundColor: "#DEB01D", color: "#FFFFFF" }}>
                                <Star className="w-2.5 h-2.5" /> MVP
                              </span>
                            )}
                            {/* Selo Melhor Defensor */}
                            {mp.is_best_defender && (
                              <span className="inline-flex items-center gap-0.5 px-1 rounded-full text-[9px] font-bold text-[#FFFFFF]" style={{ backgroundColor: mp.best_position_type === "zagueiro" ? "#FF3333" : "#0088FF" }}>
                                <Shield className="w-2.5 h-2.5" />
                                {mp.best_position_type === "zagueiro" ? "ZAG" : "LAT"}
                              </span>
                            )}
                            {/* Selo Melhor Goleiro (Paredao) */}
                            {(mp as any).is_best_goalkeeper && (
                              <span className="inline-flex items-center gap-0.5 px-1 rounded-full text-[9px] font-bold" style={{ backgroundColor: "#F97316", color: "#FFFFFF" }}>
                                <Goal className="w-2.5 h-2.5" /> GOL
                              </span>
                            )}
                            {mp.terminou_no_time && (
                              <span className="text-green-400" title="Terminou neste time">{"✅"}</span>
                            )}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-[#967948]">
                            {(mp.goals || 0) > 0 && (
                              <span className="flex items-center gap-0.5 text-[#D4B300]" title="Gols">
                                <span className="text-xs">{"⚽"}</span>
                                {mp.goals}
                              </span>
                            )}
                            {(mp.assists || 0) > 0 && (
                              <span className="flex items-center gap-0.5 text-[#0088CC]" title="Assistencias">
                                <span className="text-xs">{"👟"}</span>
                                {mp.assists}
                              </span>
                            )}
                            {mp.is_goalkeeper && (
                              <span className="flex items-center gap-0.5 text-[#967948]" title="Gols Sofridos">
                                <span className="text-xs">{"🧤"}</span>
                                {mp.goals_conceded || 0}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Time B */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-[#FF6B35] flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4" />
                  {nomeTimeB}
                </h3>
                <div className="space-y-2">
                  {timeB.map((mp) => {
                    const jogador = getJogador(mp.jogador_id)
                    if (!jogador) return null
                    
                    return (
                      <div 
                        key={mp.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-[#FF6B35]/10 border border-[#FF6B35]/20"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-[#FF6B35]/30 flex items-center justify-center flex-shrink-0">
                          {jogador.photo_url ? (
                            <Image
                              src={jogador.photo_url}
                              alt={jogador.nickname || jogador.name}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                            />
                          ) : (
                            <span className="text-xs font-bold text-white">
                              {(jogador.nickname || jogador.name).charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate flex items-center gap-1 flex-wrap">
                            {jogador.nickname || jogador.name}
                            {/* Selo MVP */}
                            {mp.is_mvp && (
                              <span className="inline-flex items-center gap-0.5 px-1 rounded-full text-[9px] font-bold" style={{ backgroundColor: "#DEB01D", color: "#FFFFFF" }}>
                                <Star className="w-2.5 h-2.5" /> MVP
                              </span>
                            )}
                            {/* Selo Melhor Defensor */}
                            {mp.is_best_defender && (
                              <span className="inline-flex items-center gap-0.5 px-1 rounded-full text-[9px] font-bold text-[#FFFFFF]" style={{ backgroundColor: mp.best_position_type === "zagueiro" ? "#FF3333" : "#0088FF"}}>
                                <Shield className="w-2.5 h-2.5" />
                                {mp.best_position_type === "zagueiro" ? "ZAG" : "LAT"}
                              </span>
                            )}
                            {/* Selo Melhor Goleiro (Paredao) */}
                            {(mp as any).is_best_goalkeeper && (
                              <span className="inline-flex items-center gap-0.5 px-1 rounded-full text-[9px] font-bold" style={{ backgroundColor: "#F97316", color: "#FFFFFF" }}>
                                <Goal className="w-2.5 h-2.5" /> GOL
                              </span>
                            )}
                            {mp.terminou_no_time && (
                              <span className="text-green-400" title="Terminou neste time">{"✅"}</span>
                            )}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-[#967948]">
                            {(mp.goals || 0) > 0 && (
                              <span className="flex items-center gap-0.5 text-[#D4B300]" title="Gols">
                                <span className="text-xs">{"⚽"}</span>
                                {mp.goals}
                              </span>
                            )}
                            {(mp.assists || 0) > 0 && (
                              <span className="flex items-center gap-0.5 text-[#0088CC]" title="Assistencias">
                                <span className="text-xs">{"👟"}</span>
                                {mp.assists}
                              </span>
                            )}
                            {mp.is_goalkeeper && (
                              <span className="flex items-center gap-0.5 text-[#967948]" title="Gols Sofridos">
                                <span className="text-xs">{"🧤"}</span>
                                {mp.goals_conceded || 0}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Legenda */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex flex-wrap justify-center gap-3 text-xs text-[#FFFFFF]">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] front-bold" style={{backgroundColor: "#02236B", color: "#FFFFFF"}}>
                  <span>{"⚽"}</span>
                  Gols
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{backgroundColor: "#02236B", color: "#FFFFFF"}}>
                  <span>{"👟"}</span>
                  Assist.
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{backgroundColor: "#02236B", color: "#FFFFFF"}}>
                  <Goal className="w-2.5 h-2.5" /> Melhor Goleiro
                </span>         
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{backgroundColor: "#02236B", color: "#FFFFFF"}}>
                  <span>{"🧤"}</span>
                  GT
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: "#DEB01D", color: "#FFFFFF"}}>
                  <Star className="w-2.5 h-2.5" /> MVP
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-[#FFFFFF]" style={{ background: "linear-gradient(to right, #FF3333 50%, #0088FF 50%)"}}>
                 ZAG  LAT
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px]font-bold" style={{backgroundColor: "#02236B", color: "#FFFFFF"}}>
                  <span className="text-green-400">{"✅"}</span>
                  Terminou aqui
                </span>
              </div>
              <p className="text-[12px] text-center text-[#FFFFFF]/70 mt-2">
                O icone {"✅"} indica em qual time o jogador finalizou a partida para fins de ranking.
              </p>
            </div>

            {/* Watermark */}
            <div className="mt-4 text-center">
              <p className="text-[12px] text-[#FFFFFF]/50">
                amaralina-fc.vercel.app
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
