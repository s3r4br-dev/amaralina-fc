"use client"

// Forgot Password Page - v15 rebuild - uses club-logo
import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BrandLogoDisplay } from "@/components/club-logo"
import { ArrowLeft, Loader2, Mail, CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    const result = await resetPassword(email)
    
    if (result.success) {
      setIsSuccess(true)
    } else {
      setError(result.error || "Erro ao enviar email de recuperação")
    }
    
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C5A059' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C5A059]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#0088CC]/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="relative z-10 w-full max-w-md mx-4 bg-[#2B2B2B] border-[#C5A059]/30 shadow-2xl shadow-[#C5A059]/10">
        <CardHeader className="text-center space-y-4 pb-2">
          {/* Logo */}
          <div className="mx-auto">
            <BrandLogoDisplay size="lg" />
          </div>
          
          <div>
            <CardTitle className="text-2xl font-bold text-[#F9F9F9]">
              Recuperar Senha
            </CardTitle>
            <CardDescription className="text-[#967948] mt-2">
              Digite seu e-mail para receber o link de recuperação
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {isSuccess ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#F9F9F9]">Email enviado!</h3>
                <p className="text-[#967948] mt-2 text-sm">
                  Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                </p>
              </div>
              <Link href="/login">
                <Button
                  variant="outline"
                  className="w-full mt-4 border-[#C5A059]/50 text-[#C5A059] hover:bg-[#C5A059]/10"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#F9F9F9]">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-[#1a1a1a] border-[#333333] text-[#F9F9F9] placeholder:text-[#666666] focus:border-[#C5A059] focus:ring-[#C5A059] pl-10"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500 text-center bg-red-500/10 py-2 rounded-md">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#C5A059] to-[#967948] hover:from-[#D4AF69] hover:to-[#A68958] text-[#1a1a1a] font-semibold h-12 text-lg transition-all duration-300 shadow-lg shadow-[#C5A059]/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar link de recuperação"
                )}
              </Button>

              <Link href="/login" className="block">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-[#967948] hover:text-[#C5A059] hover:bg-transparent"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao login
                </Button>
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
