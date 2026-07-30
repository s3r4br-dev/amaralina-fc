import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Admin emails que podem criar usuários
const ADMIN_EMAILS = ["admin@amaralinafc.com"]

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name, role, linked_player_id, adminEmail } = body

    // Verificar se quem está criando é admin
    if (!ADMIN_EMAILS.includes(adminEmail?.toLowerCase())) {
      return NextResponse.json(
        { error: "Apenas administradores podem criar usuários" },
        { status: 403 }
      )
    }

    // Validações básicas
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, senha e nome são obrigatórios" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      )
    }

    // Criar cliente Supabase com service role key para usar auth.admin
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Criar usuário usando auth.admin.createUser (ignora validação de email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirma o email automaticamente
      user_metadata: {
        name,
      },
    })

    if (authError) {
      console.error("[API] Auth error:", authError)
      
      if (authError.message.includes("already been registered")) {
        return NextResponse.json(
          { error: "Este email já está cadastrado no sistema" },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Erro ao criar usuário" },
        { status: 500 }
      )
    }

    // Criar perfil na tabela profiles
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: authData.user.id,
      email,
      name,
      role: role || "user",
      status: "active",
      linked_player_id: linked_player_id || null,
    })

    if (profileError) {
      console.error("[API] Profile error:", profileError)
      // Não retorna erro pois o usuário foi criado com sucesso
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name,
      },
      message: `Usuário ${name} criado com sucesso! Pode fazer login imediatamente.`
    })

  } catch (error) {
    console.error("[API] Error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
