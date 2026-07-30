import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log("[v0] Auth check:", { userId: user?.id, authError: authError?.message })
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: "Não autorizado", 
        details: authError?.message || "Usuário não autenticado",
        code: "AUTH_REQUIRED"
      }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const jogadorId = formData.get("jogadorId") as string

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    if (!jogadorId) {
      return NextResponse.json({ error: "ID do jogador não fornecido" }, { status: 400 })
    }

    // Verificar se o jogador existe
    const { data: jogador, error: jogadorError } = await supabase
      .from("jogadores")
      .select("id, photo_url, user_id")
      .eq("id", jogadorId)
      .single()

    console.log("[v0] Jogador lookup:", { jogadorId, found: !!jogador, error: jogadorError?.message })

    if (jogadorError || !jogador) {
      return NextResponse.json({ 
        error: "Jogador não encontrado",
        details: jogadorError?.message 
      }, { status: 404 })
    }

    // Verificar permissão: o jogador deve estar vinculado ao usuário logado
    // OU o jogador não tem user_id ainda (permitir upload para jogadores não vinculados)
    const isOwner = jogador.user_id === user.id
    const isUnlinked = !jogador.user_id
    
    console.log("[v0] Permission check:", { isOwner, isUnlinked, jogadorUserId: jogador.user_id, authUserId: user.id })
    
    if (!isOwner && !isUnlinked) {
      return NextResponse.json({ 
        error: "Sem permissão para alterar este perfil",
        details: "Este jogador está vinculado a outro usuário"
      }, { status: 403 })
    }

    // Se já existe uma foto antiga, deletar do storage
    if (jogador.photo_url && jogador.photo_url.includes("avatars/")) {
      const oldPath = jogador.photo_url.split("avatars/")[1]?.split("?")[0]
      if (oldPath) {
        await supabase.storage.from("avatars").remove([oldPath])
      }
    }

    // Gerar nome único para o arquivo
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const fileName = `${jogadorId}_${Date.now()}.${fileExt}`

    // Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload para o Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error("[v0] Upload error:", uploadError)
      return NextResponse.json({ 
        error: "Erro ao fazer upload", 
        details: uploadError.message,
        code: uploadError.name || "STORAGE_ERROR"
      }, { status: 500 })
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName)

    const publicUrl = urlData.publicUrl

    // Atualizar o jogador com a nova URL
    const { error: updateError } = await supabase
      .from("jogadores")
      .update({ photo_url: publicUrl })
      .eq("id", jogadorId)

    if (updateError) {
      console.error("Update error:", updateError)
      return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      message: "Foto atualizada com sucesso!" 
    })

  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ 
        error: "Não autorizado",
        details: authError?.message || "Usuário não autenticado"
      }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const jogadorId = searchParams.get("jogadorId")
    
    if (!jogadorId) {
      return NextResponse.json({ error: "ID do jogador não fornecido" }, { status: 400 })
    }
    
    // Verificar se o jogador existe
    const { data: jogador, error: jogadorError } = await supabase
      .from("jogadores")
      .select("id, photo_url, user_id")
      .eq("id", jogadorId)
      .single()
    
    if (jogadorError || !jogador) {
      return NextResponse.json({ 
        error: "Jogador não encontrado",
        details: jogadorError?.message 
      }, { status: 404 })
    }
    
    // Verificar permissão
    const isOwner = jogador.user_id === user.id
    const isUnlinked = !jogador.user_id
    
    if (!isOwner && !isUnlinked) {
      return NextResponse.json({ 
        error: "Sem permissão para alterar este perfil",
        details: "Este jogador está vinculado a outro usuário"
      }, { status: 403 })
    }

    // Deletar foto do storage
    if (jogador.photo_url && jogador.photo_url.includes("avatars/")) {
      const oldPath = jogador.photo_url.split("avatars/")[1]?.split("?")[0]
      if (oldPath) {
        await supabase.storage.from("avatars").remove([oldPath])
      }
    }

    // Limpar campo no banco
    const { error: updateError } = await supabase
      .from("jogadores")
      .update({ photo_url: null })
      .eq("id", jogadorId)

    if (updateError) {
      return NextResponse.json({ error: "Erro ao remover foto" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Foto removida com sucesso!" 
    })

  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
