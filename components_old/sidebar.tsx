"use client"

/**
 * Sidebar Navigation - Amaralina FC Dashboard
 * Version: 31.0 - Glassmorphism + Menu Hamburguer Mobile
 */

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"
import { cn } from "@/lib/utils"
import { 
  Trophy, 
  Medal,
  Table2,
  Calendar,
  Users,
  Shield,
  User,
  LogOut,
  Menu,
  X,
  BarChart3,
  Sparkles,
  FileText,
  Database,
  LayoutGrid
} from "lucide-react"

const menuItems = [
  { name: "Podio", href: "/podio", icon: Trophy },
  { name: "Ranking", href: "/ranking", icon: Medal },
  { name: "Ultimo Jogo", href: "/resumo", icon: FileText },
  { name: "Hall da Fama", href: "/hall-da-fama", icon: Sparkles },
  { name: "Tabela Geral", href: "/tabela", icon: Table2 },
  { name: "Partidas", href: "/partidas", icon: Calendar },
  { name: "Jogadores", href: "/jogadores", icon: Users },
  { name: "Tecnico", href: "/tecnico", icon: LayoutGrid },
  { name: "Usuarios", href: "/usuarios", icon: Shield, adminOnly: true },
  { name: "Perfil", href: "/perfil", icon: User },
]

export function Sidebar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout, isAdmin } = useAuth()
  const { jogadores, getFilteredPartidas } = useData()
  
  const partidasCount = useMemo(() => getFilteredPartidas().length, [getFilteredPartidas])
  const jogadoresCount = useMemo(() => (jogadores || []).filter(j => j.status === "active").length, [jogadores])

  const filteredItems = useMemo(() => menuItems.filter(
    (item) => !item.adminOnly || isAdmin
  ), [isAdmin])

  // Estimativa de consumo de banco de dados
  // Calculo aproximado: cada partida ~2KB + cada partida_jogador ~0.5KB + cada jogador ~1KB
  const totalPartidas = partidasCount || 0
  const totalJogadores = (jogadores || []).length
  const estimatedKB = (totalPartidas * 2) + (totalPartidas * 11 * 0.5) + (totalJogadores * 1)
  const estimatedMB = estimatedKB / 1024
  const limiteMB = 500
  const usagePct = Math.min(100, Math.round((estimatedMB / limiteMB) * 100))
  const usageColor = usagePct < 50 ? "#22C55E" : usagePct < 80 ? "#F59E0B" : "#EF4444"

  return (
    <>
 {/* Mobile Header with Hamburger Menu - z-[9999] para ficar SEMPRE acima de tudo */}
 <header className="md:hidden fixed top-0 left-0 right-0 z-[9999] glass-nav safe-area-top">
        <div className="flex items-center justify-between px-4 py-2 h-14">
          <Link href="/podio" className="flex items-center gap-2 flex-shrink-0">
            <Image
              src="/logo-header.png"
              alt="Amaralina FC"
              width={36}
              height={36}
              className="rounded-lg object-contain"
              style={{ width: '36px', height: '36px', maxWidth: '36px', maxHeight: '36px' }}
            />
            <span className="text-base font-bold text-white">
              Amaralina <span className="text-[#D4B300]">FC</span>
            </span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg glass-card text-white flex-shrink-0"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay - z-[9999] para ficar SEMPRE acima de tudo */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[9999] pt-16">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <nav className="relative hamburger-menu mx-4 mt-2 rounded-xl p-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-2">
              {menuItems
                .filter((item) => !item.adminOnly || isAdmin)
                .map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                        isActive
                          ? "bg-[#D4B300]/20 text-[#D4B300]"
                          : "text-white hover:bg-white/10"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  )
                })}
              <hr className="border-white/20 my-3" />
              <button
                onClick={() => {
                  logout()
                  setMobileMenuOpen(false)
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sair</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Desktop Sidebar - z-[9999] para ficar SEMPRE acima de tudo */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 glass-sidebar border-r border-[#D4B300]/30 flex-col z-[9999]">
      {/* Logo */}
      <div className="p-4 border-b border-[#333333]">
        <Link href="/podio" className="flex items-center gap-3">
          <Image
            src="/logo-header.png"
            alt="Amaralina FC"
            width={44}
            height={44}
            className="rounded-lg object-contain flex-shrink-0"
            style={{ width: '44px', height: '44px', maxWidth: '44px' }}
            priority
          />
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-[#F9F9F9] truncate">
              Amaralina <span className="text-[#C5A059]">FC</span>
            </h1>
            <p className="text-xs text-[#967948]">Estatisticas</p>
          </div>
        </Link>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-[#333333]">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[#2B2B2B]">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0088CC] to-[#006699] flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#F9F9F9] truncate">
              {user?.name || "Carregando..."}
            </p>
            <p className="text-xs text-[#C5A059] flex items-center gap-1">
              {isAdmin && <Shield className="w-3 h-3" />}
              {isAdmin ? "Administrador" : "Usuário"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-[#C5A059] to-[#967948] text-[#1a1a1a] shadow-lg shadow-[#C5A059]/20"
                  : "text-[#888888] hover:bg-[#2B2B2B] hover:text-[#F9F9F9]"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Stats Summary */}
      <div className="p-4 border-t border-[#333333]">
        <div className="p-3 rounded-lg bg-[#2B2B2B] space-y-2">
          <div className="flex items-center gap-2 text-[#C5A059]">
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs font-medium">Resumo da Temporada</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2 rounded bg-[#1a1a1a]">
              <p className="text-lg font-bold text-[#C5A059]">{partidasCount}</p>
              <p className="text-xs text-[#666666]">Jogos</p>
            </div>
            <div className="p-2 rounded bg-[#1a1a1a]">
              <p className="text-lg font-bold text-[#0088CC]">{jogadoresCount}</p>
              <p className="text-xs text-[#666666]">Jogadores</p>
            </div>
          </div>
        </div>
      </div>

      {/* Painel de Armazenamento DB - apenas admin */}
      {isAdmin && (
        <div className="px-4 pb-2">
          <div className="p-2.5 rounded-lg bg-[#1a1a1a] border border-[#333333]">
            <div className="flex items-center gap-2 mb-1.5">
              <Database className="w-3.5 h-3.5" style={{ color: usageColor }} />
              <span className="text-[11px] font-medium" style={{ color: usageColor }}>
                DB: {estimatedMB < 1 ? `${Math.round(estimatedKB)}KB` : `${estimatedMB.toFixed(1)}MB`} / {limiteMB}MB
              </span>
              <span className="text-[10px] ml-auto" style={{ color: usageColor }}>{usagePct}%</span>
            </div>
            {/* Barra de progresso */}
            <div className="h-1.5 rounded-full bg-[#2B2B2B] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${usagePct}%`, backgroundColor: usageColor }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Logout Button */}
      <div className="p-4 border-t border-[#333333]">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-[#666666] hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
    </>
  )
}
