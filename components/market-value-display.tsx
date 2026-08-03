"use client"

/**
 * Market Value Display Component - Amaralina FC
 * Exibe o valor de mercado de um jogador com seta indicadora de tendência
 */

import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MarketValueBreakdown } from "@/lib/market-value"
import { formatMarketValueWithTrend } from "@/lib/market-value"

interface MarketValueDisplayProps {
  breakdown: MarketValueBreakdown
  size?: "sm" | "md" | "lg"
  showChange?: boolean
  className?: string
}

export function MarketValueDisplay({
  breakdown,
  size = "md",
  showChange = true,
  className
}: MarketValueDisplayProps) {
  const { value, trend, changePercent } = formatMarketValueWithTrend(breakdown)
  
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  }
  
  const iconSizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  }
  
  const TrendIcon = trend === "up" 
    ? TrendingUp 
    : trend === "down" 
    ? TrendingDown 
    : Minus
  
  const trendColor = trend === "up"
    ? "text-green-500"
    : trend === "down"
    ? "text-red-500"
    : "text-gray-400"
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <TrendIcon className={cn(iconSizeClasses[size], trendColor)} />
      <span className={cn("font-bold", sizeClasses[size])}>
        {value}
      </span>
      {showChange && Math.abs(changePercent) > 0 && (
        <span className={cn("text-xs", trendColor)}>
          ({changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%)
        </span>
      )}
    </div>
  )
}

// Versão simples para uso inline (sem breakdown completo)
interface SimpleMarketValueProps {
  value: number
  trend?: "up" | "down" | "stable"
  changePercent?: number
  size?: "sm" | "md" | "lg"
  showChange?: boolean
  className?: string
}

export function SimpleMarketValue({
  value,
  trend = "stable",
  changePercent = 0,
  size = "md",
  showChange = true,
  className
}: SimpleMarketValueProps) {
  const breakdown: MarketValueBreakdown = {
    currentValue: value,
    previousValue: 0,
    change: 0,
    changePercent,
    trend,
    factors: {
      baseValue: 0,
      goalMultiplier: 1,
      assistMultiplier: 1,
      inactivityPenalty: 0,
      performancePenalty: 0,
      seasonResetPenalty: 0
    }
  }
  
  return (
    <MarketValueDisplay
      breakdown={breakdown}
      size={size}
      showChange={showChange}
      className={className}
    />
  )
}
