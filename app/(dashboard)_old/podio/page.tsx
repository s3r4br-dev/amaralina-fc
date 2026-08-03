"use client"

import Image from "next/image"
import { Trophy, Medal, Goal, Users, TrendingUp, Crown, Footprints } from "lucide-react"
import { useData, type JogadorStats } from "@/contexts/data-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { YearFilter } from "@/components/year-filter"
import { useMemo, useEffect, useState } from "react"
import { motion } from "framer-motion"

// Componente de contador animado
function AnimatedCounter({ value, duration = 1.5 }: { value: number | string; duration?: number }) {
  const [count, setCount] = useState(0)
  const numericValue = typeof value === "string" ? parseFloat(value) : value
  const isDecimal = typeof value === "string" && value.includes(".")
  
  useEffect(() => {
    let startTime: number
    let animationFrame: number
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      
      // Easing function para desacelerar no final
      const easeOut = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(easeOut * numericValue))
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        setCount(numericValue)
      }
    }
    
    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [numericValue, duration])
  
  return <>{isDecimal ? count.toFixed(1) : count}</>
}

// Componente de particulas douradas (confetes)
function GoldenParticles() {
  const particles = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 2,
    size: 4 + Math.random() * 8,
    xOffset: (Math.random() - 0.5) * 100,
  })), [])
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top: "-20px",
            width: p.size,
            height: p.size,
            background: `linear-gradient(135deg, #FFD700, #C5A059, #FFD700)`,
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

// Card estilo FIFA Ultra Premium
function FifaCard({ player, position }: { player: JogadorStats; position: number }) {
  const isFirst = position === 1
  const isSecond = position === 2
  const isThird = position === 3
  
  const cardStyles: Record<number, { gradient: string; border: string; glow: string; textColor: string }> = {
    1: { 
      gradient: "from-[#FFD700]/20 via-[#C5A059]/30 to-[#FFD700]/20", 
      border: "border-[#FFD700]", 
      glow: "shadow-[0_0_30px_rgba(255,215,0,0.5)]",
      textColor: "text-[#FFD700]"
    },
    2: { 
      gradient: "from-[#C0C0C0]/20 via-[#E8E8E8]/30 to-[#C0C0C0]/20", 
      border: "border-[#C0C0C0]", 
      glow: "shadow-[0_0_20px_rgba(192,192,192,0.4)]",
      textColor: "text-[#C0C0C0]"
    },
    3: { 
      gradient: "from-[#CD7F32]/20 via-[#B87333]/30 to-[#CD7F32]/20", 
      border: "border-[#CD7F32]", 
      glow: "shadow-[0_0_20px_rgba(205,127,50,0.4)]",
      textColor: "text-[#CD7F32]"
    },
    4: { 
      gradient: "from-[#333]/50 via-[#444]/50 to-[#333]/50", 
      border: "border-[#555]", 
      glow: "",
      textColor: "text-white/80"
    },
    5: { 
      gradient: "from-[#333]/50 via-[#444]/50 to-[#333]/50", 
      border: "border-[#555]", 
      glow: "",
      textColor: "text-white/80"
    },
  }
  
  const pillarHeights: Record<number, string> = {
    1: "h-56",
    2: "h-44",
    3: "h-36",
    4: "h-28",
    5: "h-24",
  }

  const style = cardStyles[position]
  const cardSize = isFirst ? "w-36" : isSecond || isThird ? "w-32" : "w-28"

  return (
    <motion.div 
      className="flex flex-col items-center"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ 
        duration: 0.8, 
        delay: position === 1 ? 0.2 : position === 2 ? 0.4 : position === 3 ? 0.6 : position === 4 ? 0.8 : 1,
        type: "spring",
        stiffness: 100
      }}
    >
      {/* Coroa flutuante para o 1o lugar */}
      {isFirst && (
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="mb-2"
        >
          <Crown className="w-10 h-10 text-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]" />
        </motion.div>
      )}

      {/* FIFA Card */}
      <div 
        className={`relative ${cardSize} bg-gradient-to-b ${style.gradient} backdrop-blur-xl border-2 ${style.border} ${style.glow} rounded-xl p-3 transition-all duration-300 hover:scale-105`}
        style={{ marginBottom: "-2px" }}
      >
        {/* Overall no topo */}
        <div className={`absolute -top-3 -right-3 w-12 h-12 rounded-lg bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border ${style.border} flex flex-col items-center justify-center ${style.glow}`}>
          <span className={`text-lg font-black ${style.textColor}`}>{player.rating}</span>
          <span className="text-[8px] text-white/60 -mt-1">OVR</span>
        </div>

        {/* Position Badge */}
        <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border ${style.border} flex items-center justify-center font-bold ${style.textColor} text-sm`}>
          {position}
        </div>
        
        {/* Avatar */}
        <div className={`${isFirst ? "w-20 h-20" : "w-16 h-16"} mx-auto rounded-lg bg-gradient-to-br from-[#0088CC]/30 to-[#006699]/30 flex items-center justify-center border ${style.border} overflow-hidden mt-2`}>
          {player.photo_url ? (
            <Image
              src={player.photo_url}
              alt={player.name}
              width={isFirst ? 80 : 64}
              height={isFirst ? 80 : 64}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          ) : (
            <span className={`${isFirst ? "text-2xl" : "text-xl"} font-bold text-white`}>
              {player.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </span>
          )}
        </div>
        
        {/* Name & Position */}
        <p className={`text-center text-xs font-bold ${style.textColor} truncate mt-2`}>
          {player.nickname || player.name}
        </p>
        <p className="text-center text-[10px] text-white/50">
          {player.position}
        </p>
        
        {/* Stats com emojis */}
        <div className="mt-2 grid grid-cols-2 gap-1 text-[10px]">
          <div className="flex items-center justify-center gap-0.5 bg-black/30 rounded px-1 py-0.5">
            <span>{"⚽"}</span>
            <span className="text-[#FFD700] font-bold">{player.goals ?? 0}</span>
          </div>
          <div className="flex items-center justify-center gap-0.5 bg-black/30 rounded px-1 py-0.5">
            <span>{"👟"}</span>
            <span className="text-[#0088CC] font-bold">{player.assists ?? 0}</span>
          </div>
          <div className="flex items-center justify-center gap-0.5 bg-black/30 rounded px-1 py-0.5">
            <span>{"🥅"}</span>
            <span className="text-white/80 font-bold">{player.matches ?? 0}</span>
          </div>
          {player.position === "Goleiro" && (
            <div className="flex items-center justify-center gap-0.5 bg-black/30 rounded px-1 py-0.5">
              <span>{"🧤"}</span>
              <span className="text-[#967948] font-bold">{player.goalsConceded ?? 0}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Pilar de vidro escuro com bordas neon */}
      <motion.div 
        className={`${cardSize} ${pillarHeights[position]} rounded-b-xl bg-gradient-to-b from-[#1a1a1a]/90 via-[#0d0d0d]/95 to-[#000000] backdrop-blur-xl border-x-2 border-b-2 ${style.border} ${style.glow} flex items-end justify-center pb-3`}
        initial={{ height: 0 }}
        animate={{ height: "auto" }}
        transition={{ duration: 0.6, delay: 0.3 + position * 0.15 }}
      >
        {(isFirst || isSecond || isThird) && (
          <Medal className={`w-6 h-6 ${style.textColor} drop-shadow-lg`} />
        )}
      </motion.div>
    </motion.div>
  )
}

// Card estilo FIFA para Assistências (destaca assists)
function FifaCardAssists({ player, position }: { player: JogadorStats; position: number }) {
  const isFirst = position === 1
  const isSecond = position === 2
  const isThird = position === 3
  
  const cardStyles: Record<number, { gradient: string; border: string; glow: string; textColor: string }> = {
    1: { 
      gradient: "from-[#0088CC]/20 via-[#006699]/30 to-[#0088CC]/20", 
      border: "border-[#0088CC]", 
      glow: "shadow-[0_0_30px_rgba(0,136,204,0.5)]",
      textColor: "text-[#0088CC]"
    },
    2: { 
      gradient: "from-[#C0C0C0]/20 via-[#E8E8E8]/30 to-[#C0C0C0]/20", 
      border: "border-[#C0C0C0]", 
      glow: "shadow-[0_0_20px_rgba(192,192,192,0.4)]",
      textColor: "text-[#C0C0C0]"
    },
    3: { 
      gradient: "from-[#CD7F32]/20 via-[#B87333]/30 to-[#CD7F32]/20", 
      border: "border-[#CD7F32]", 
      glow: "shadow-[0_0_20px_rgba(205,127,50,0.4)]",
      textColor: "text-[#CD7F32]"
    },
    4: { 
      gradient: "from-[#333]/50 via-[#444]/50 to-[#333]/50", 
      border: "border-[#555]", 
      glow: "",
      textColor: "text-white/80"
    },
    5: { 
      gradient: "from-[#333]/50 via-[#444]/50 to-[#333]/50", 
      border: "border-[#555]", 
      glow: "",
      textColor: "text-white/80"
    },
  }
  
  const pillarHeights: Record<number, string> = {
    1: "h-56",
    2: "h-44",
    3: "h-36",
    4: "h-28",
    5: "h-24",
  }

  const style = cardStyles[position]
  const cardSize = isFirst ? "w-36" : isSecond || isThird ? "w-32" : "w-28"

  return (
    <motion.div 
      className="flex flex-col items-center"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ 
        duration: 0.8, 
        delay: position === 1 ? 0.2 : position === 2 ? 0.4 : position === 3 ? 0.6 : position === 4 ? 0.8 : 1,
        type: "spring",
        stiffness: 100
      }}
    >
      {/* Coroa flutuante para o 1o lugar */}
      {isFirst && (
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="mb-2"
        >
          <Crown className="w-10 h-10 text-[#0088CC] drop-shadow-[0_0_10px_rgba(0,136,204,0.8)]" />
        </motion.div>
      )}

      {/* FIFA Card */}
      <div 
        className={`relative ${cardSize} bg-gradient-to-b ${style.gradient} backdrop-blur-xl border-2 ${style.border} ${style.glow} rounded-xl p-3 transition-all duration-300 hover:scale-105`}
        style={{ marginBottom: "-2px" }}
      >
        {/* Overall no topo */}
        <div className={`absolute -top-3 -right-3 w-12 h-12 rounded-lg bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border ${style.border} flex flex-col items-center justify-center ${style.glow}`}>
          <span className={`text-lg font-black ${style.textColor}`}>{player.rating}</span>
          <span className="text-[8px] text-white/60 -mt-1">OVR</span>
        </div>

        {/* Position Badge */}
        <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border ${style.border} flex items-center justify-center font-bold ${style.textColor} text-sm`}>
          {position}
        </div>
        
        {/* Avatar */}
        <div className={`${isFirst ? "w-20 h-20" : "w-16 h-16"} mx-auto rounded-lg bg-gradient-to-br from-[#0088CC]/30 to-[#006699]/30 flex items-center justify-center border ${style.border} overflow-hidden mt-2`}>
          {player.photo_url ? (
            <Image
              src={player.photo_url}
              alt={player.name}
              width={isFirst ? 80 : 64}
              height={isFirst ? 80 : 64}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          ) : (
            <span className={`${isFirst ? "text-2xl" : "text-xl"} font-bold text-white`}>
              {player.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </span>
          )}
        </div>
        
        {/* Name & Position */}
        <p className={`text-center text-xs font-bold ${style.textColor} truncate mt-2`}>
          {player.nickname || player.name}
        </p>
        <p className="text-center text-[10px] text-white/50">
          {player.position}
        </p>
        
        {/* Stats com emojis - Assistências em destaque primeiro */}
        <div className="mt-2 grid grid-cols-2 gap-1 text-[10px]">
          <div className="flex items-center justify-center gap-0.5 bg-black/30 rounded px-1 py-0.5">
            <span>{"👟"}</span>
            <span className="text-[#0088CC] font-bold">{player.assists ?? 0}</span>
          </div>
          <div className="flex items-center justify-center gap-0.5 bg-black/30 rounded px-1 py-0.5">
            <span>{"⚽"}</span>
            <span className="text-[#FFD700] font-bold">{player.goals ?? 0}</span>
          </div>
          <div className="flex items-center justify-center gap-0.5 bg-black/30 rounded px-1 py-0.5">
            <span>{"🥅"}</span>
            <span className="text-white/80 font-bold">{player.matches ?? 0}</span>
          </div>
          {player.position === "Goleiro" && (
            <div className="flex items-center justify-center gap-0.5 bg-black/30 rounded px-1 py-0.5">
              <span>{"🧤"}</span>
              <span className="text-[#967948] font-bold">{player.goalsConceded ?? 0}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Pilar de vidro escuro com bordas neon */}
      <motion.div 
        className={`${cardSize} ${pillarHeights[position]} rounded-b-xl bg-gradient-to-b from-[#1a1a1a]/90 via-[#0d0d0d]/95 to-[#000000] backdrop-blur-xl border-x-2 border-b-2 ${style.border} ${style.glow} flex items-end justify-center pb-3`}
        initial={{ height: 0 }}
        animate={{ height: "auto" }}
        transition={{ duration: 0.6, delay: 0.3 + position * 0.15 }}
      >
        {(isFirst || isSecond || isThird) && (
          <Medal className={`w-6 h-6 ${style.textColor} drop-shadow-lg`} />
        )}
      </motion.div>
    </motion.div>
  )
}

export default function PodioPage() {
  const { jogadores, getFilteredPartidas, getTopArtilheiros, getTopAssistentes, getJogadorStatsByYear, selectedYear, isLoading } = useData()

  // Calcular estatisticas em tempo real baseadas no ano selecionado
  const stats = useMemo(() => {
    const partidasFinalizadas = getFilteredPartidas()
    const jogadorStats = getJogadorStatsByYear()
    const totalGols = jogadorStats.reduce((sum, j) => sum + (j.goals || 0), 0)
    const activeJogadores = (jogadores || []).filter(j => j.status === "active").length
    const avgGoalsRaw = partidasFinalizadas.length > 0 
      ? partidasFinalizadas.reduce((sum, p) => sum + (p.score_a || 0) + (p.score_b || 0), 0) / partidasFinalizadas.length
      : 0
    const avgGoals = isNaN(avgGoalsRaw) ? "0" : avgGoalsRaw.toFixed(1)

    return [
      { label: "Total de Gols", value: totalGols, icon: Goal, color: "#FFD700", emoji: "⚽" },
      { label: "Partidas Jogadas", value: partidasFinalizadas.length, icon: Trophy, color: "#0088CC", emoji: "🏆" },
      { label: "Jogadores Ativos", value: activeJogadores, icon: Users, color: "#C5A059", emoji: "👥" },
      { label: "Media por Jogo", value: avgGoals, icon: TrendingUp, color: "#4CAF50", emoji: "📊" },
    ]
  }, [jogadores, getFilteredPartidas, getJogadorStatsByYear])

  // Top 5 artilheiros
  const topPlayers = useMemo(() => {
    return getTopArtilheiros(5)
  }, [getTopArtilheiros])

  // Top 5 assistentes
  const topAssistentes = useMemo(() => {
    return getTopAssistentes(5)
  }, [getTopAssistentes])

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
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-white">
            Podio <span className="text-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">Amaralina FC</span>
          </h1>
          <p className="text-white/70 mt-1">
            {selectedYear === "all" ? "Historico geral" : `Temporada ${selectedYear}`}
          </p>
        </motion.div>
        <YearFilter />
      </div>

      {/* Stats Cards com contadores animados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="glass-card border-[#D4B300]/30 hover:border-[#D4B300]/60 transition-all duration-300 hover:shadow-lg hover:shadow-[#D4B300]/20 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20" />
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/70 flex items-center gap-2">
                        <span className="text-lg">{stat.emoji}</span>
                        {stat.label}
                      </p>
                      <p className="text-4xl font-black text-white mt-1 drop-shadow-lg">
                        <AnimatedCounter value={stat.value} duration={1.2 + index * 0.2} />
                      </p>
                    </div>
                    <motion.div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center"
                      style={{ 
                        backgroundColor: `${stat.color}20`,
                        boxShadow: `0 0 20px ${stat.color}30`
                      }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <Icon className="w-7 h-7" style={{ color: stat.color }} />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Podium Section Ultra Premium */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card className="glass-card border-[#D4B300]/40 overflow-hidden relative">
          {/* Particulas douradas atras do podio */}
          {topPlayers.length >= 3 && <GoldenParticles />}
          
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2 text-white">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Trophy className="w-7 h-7 text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]" />
              </motion.div>
              <span className="text-xl">Top 5 Artilheiros</span>
              <span className="ml-2 text-sm text-white/50">- Hall da Fama</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            {topPlayers.length >= 5 ? (
              <div className="bg-gradient-to-b from-transparent via-[#0a0a0a]/50 to-[#0a0a0a]/80 rounded-xl overflow-hidden py-8 px-4">
                <div className="flex justify-center items-end gap-2 md:gap-4 flex-wrap">
                  {/* Ordem: 4th, 2nd, 1st, 3rd, 5th */}
                  <FifaCard player={topPlayers[3]} position={4} />
                  <FifaCard player={topPlayers[1]} position={2} />
                  <FifaCard player={topPlayers[0]} position={1} />
                  <FifaCard player={topPlayers[2]} position={3} />
                  <FifaCard player={topPlayers[4]} position={5} />
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <Trophy className="w-16 h-16 mx-auto text-white/30 mb-4" />
                <p className="text-lg font-semibold text-white">Dados insuficientes</p>
                <p className="text-sm text-white/70 mt-1">Cadastre pelo menos 5 jogadores para ver o podio</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Podium Section Top 5 Assistências */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Card className="glass-card border-[#0088CC]/40 overflow-hidden relative">
          {/* Particulas azuis atras do podio */}
          {topAssistentes.length >= 3 && <GoldenParticles />}
          
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2 text-white">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Footprints className="w-7 h-7 text-[#0088CC] drop-shadow-[0_0_8px_rgba(0,136,204,0.6)]" />
              </motion.div>
              <span className="text-xl">Top 5 Assistentes</span>
              <span className="ml-2 text-sm text-white/50">- Mestres do Passe</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            {topAssistentes.length >= 5 ? (
              <div className="bg-gradient-to-b from-transparent via-[#0a0a0a]/50 to-[#0a0a0a]/80 rounded-xl overflow-hidden py-8 px-4">
                <div className="flex justify-center items-end gap-2 md:gap-4 flex-wrap">
                  {/* Ordem: 4th, 2nd, 1st, 3rd, 5th */}
                  <FifaCardAssists player={topAssistentes[3]} position={4} />
                  <FifaCardAssists player={topAssistentes[1]} position={2} />
                  <FifaCardAssists player={topAssistentes[0]} position={1} />
                  <FifaCardAssists player={topAssistentes[2]} position={3} />
                  <FifaCardAssists player={topAssistentes[4]} position={5} />
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <Footprints className="w-16 h-16 mx-auto text-white/30 mb-4" />
                <p className="text-lg font-semibold text-white">Dados insuficientes</p>
                <p className="text-sm text-white/70 mt-1">Cadastre pelo menos 5 jogadores com assistencias para ver o podio</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
