"use client"

// Login Page - v16 rebuild - uses StaticLogo (no DataProvider dependency)
import { useState, useEffect, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StaticLogo } from "@/components/club-logo"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import Image from "next/image"

declare global {
  interface Window {
    confetti?: any
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  // --------------------------------------------------------------------------
  // CDN EFEITO: Explosão ÚNICA de BOLAS DE FUTEBOL ao carregar a página
  // --------------------------------------------------------------------------
  useEffect(() => {
    const triggerEffect = () => {
      if (typeof window.confetti === "function") {
        // Define a forma de bola de futebol personalizada
        const soccerShape = window.confetti.shapeFromPath({
          path: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 3a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 12 5zm-4 3a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 8 8zm8 0a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 16 8zm-4 3a2 2 0 1 1-2 2 2 2 0 0 1 2-2zm-5 4a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 7 15zm10 0a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 17 15zm-5 3a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 12 18z',
        })

        // --- Explosão ESQUERDA ---
        window.confetti({
          particleCount: 25,
          angle: 65,
          spread: 75,
          origin: { x: 0.08, y: 0.7 },
          colors: ["#ffffff", "#10B981", "#34D399"],
          startVelocity: 55,
          gravity: 1.2,
          ticks: 160,
          scalar: 1.2,
          shapes: [soccerShape, 'circle'],
        })

        // --- Explosão DIREITA (com um leve atraso) ---
        setTimeout(() => {
          if (typeof window.confetti === "function") {
            window.confetti({
              particleCount: 25,
              angle: 115,
              spread: 75,
              origin: { x: 0.92, y: 0.7 },
              colors: ["#ffffff", "#10B981", "#34D399"],
              startVelocity: 55,
              gravity: 1.2,
              ticks: 160,
              scalar: 1.2,
              shapes: [soccerShape, 'circle'],
            })
          }
        }, 250)
      }
    }

    // Se a lib ainda não estiver carregada, injeta o script e dispara ao terminar de carregar
    if (!window.confetti) {
      const script = document.createElement("script")
      script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"
      script.async = true
      script.onload = () => triggerEffect()
      document.body.appendChild(script)
    } else {
      triggerEffect()
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    const result = await login(email, password)
    
    if (result.success) {
      router.push("/podio")
    } else {
      setError(result.error || "E-mail ou senha incorretos")
      setIsSubmitting(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{
        backgroundImage: `url("https://i.postimg.cc/Hn6nHgj0/Fundo-Aplicativo-Amaralinfa-FC-OPACIDADE.png")`,
      }}
    >
      {/* Dark Overlay for optimal card contrast */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310B981' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Glow Effects das Laterais */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-700/10 rounded-full blur-3xl pointer-events-none" />

      {/* Card Container - Dark Glassmorphism Effect */}
      <Card className="relative z-10 w-full max-w-md mx-4 bg-black/60 backdrop-blur-md border border-emerald-500/30 shadow-2xl shadow-emerald-950/40">
        <CardHeader className="text-center space-y-4 pb-2">
          {/* Logo */}
          <div className="mx-auto flex justify-center items-center mb-1 relative">
            <div className="w-32 h-32 relative">
              <Image 
                src="https://i.postimg.cc/Y2sd2mgg/brasao-amaralinafc.png"
                alt="Logo Amaralina FC"
                fill
                className="object-contain drop-shadow-xl"
                priority
                unoptimized
              />
            </div>
          </div>

          <div className="space-y-0">
            <CardTitle className="text-3xl font-bold text-[#F9F9F9]">
              Amaralina <span className="text-[#C5A059]">FC</span>
            </CardTitle>
            <CardDescription className="text-[#C5A059]">
              Sistema de Estatísticas de Futebol
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#F9F9F9]">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-black/50 border-white/10 text-[#F9F9F9] placeholder:text-[#888888] focus:border-emerald-400 focus:ring-emerald-400 transition-all"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[#F9F9F9]">
                  Senha
                </Label>
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-[#C5A059] hover:text-emerald-300 transition-colors"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-black/50 border-white/10 text-[#F9F9F9] placeholder:text-[#888888] focus:border-emerald-400 focus:ring-emerald-400 pr-10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-emerald-400 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center bg-red-500/10 py-2 rounded-md border border-red-500/20">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold h-12 text-lg transition-all duration-300 shadow-lg shadow-emerald-500/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-center text-sm text-[#888888]">
              Desenvolvido por{" "}
              <span className="text-emerald-400 font-semibold">Gustavo Meireles</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}