"use client"

/**
 * Usuarios Page - v30 
 * IMPORTANT: user is destructured from useAuth() on line 60
 * handleCreateUser uses user?.email on line 197
 */
import { useState, useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useData, type Profile } from "@/contexts/data-context"
import { createClient } from "@/lib/supabase/client"
import { Shield, Users, Search, MoreVertical, Mail, Calendar, CheckCircle, XCircle, AlertTriangle, Plus, Pencil, Trash2, UserCheck, UserX, Link2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { BrandLogoUpload } from "@/components/club-logo"

function formatDate(dateStr: string | undefined | null) {
  if (!dateStr) return "Nunca"
  const date = new Date(dateStr)
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function UsuariosPage() {
  const { isAdmin, user } = useAuth()
  const { profiles, jogadores, updateProfile, deleteProfile, isLoading } = useData()
  
  const [search, setSearch] = useState("")
  const [filterRole, setFilterRole] = useState<"all" | "admin" | "user">("all")
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null)
  
  // New user form state
  const [newUserForm, setNewUserForm] = useState({
    email: "",
    password: "",
    name: "",
    role: "user" as "admin" | "user",
    linked_player_id: "none" as string,
  })
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    role: "user" as "admin" | "user",
    status: "active" as "active" | "inactive",
    linked_player_id: "none" as string,
  })

  const profilesList = profiles || []

  const filteredUsers = useMemo(() => profilesList.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = filterRole === "all" || user.role === filterRole
    return matchesSearch && matchesRole
  }), [profilesList, search, filterRole])

  const activeCount = useMemo(() => profilesList.filter(u => u.status === "active").length, [profilesList])
  const adminCount = useMemo(() => profilesList.filter(u => u.role === "admin").length, [profilesList])

  // Jogadores disponíveis para vínculo
  const availablePlayers = (jogadores || []).filter(j => {
    if (editingUser && editingUser.linked_player_id === j.id) return true
    return !profilesList.some(u => u.linked_player_id === j.id && u.id !== editingUser?.id)
  })

  const handleOpenEditModal = (user: Profile) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      role: user.role,
      status: user.status,
      linked_player_id: user.linked_player_id ? String(user.linked_player_id) : "none",
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim() || !editingUser) return

    const linked_player_id = formData.linked_player_id === "none" ? null : parseInt(formData.linked_player_id)

    try {
      await updateProfile(editingUser.id, {
        name: formData.name,
        role: formData.role,
        status: formData.status,
        linked_player_id,
      })

      setIsModalOpen(false)
      setEditingUser(null)
    } catch (error) {
      console.error("[v0] Error saving profile:", error)
      alert("Erro ao salvar usuário. Verifique as permissões.")
    }
  }

  const handleDelete = async () => {
    if (userToDelete) {
      await deleteProfile(userToDelete.id)
      setDeleteConfirmOpen(false)
      setUserToDelete(null)
    }
  }

  const handleToggleAdmin = async (user: Profile) => {
    await updateProfile(user.id, {
      role: user.role === "admin" ? "user" : "admin"
    })
  }

  const handleToggleStatus = async (user: Profile) => {
    await updateProfile(user.id, {
      status: user.status === "active" ? "inactive" : "active"
    })
  }

  const handleCreateUser = async () => {
    if (!newUserForm.email || !newUserForm.password || !newUserForm.name) {
      alert("Por favor, preencha todos os campos obrigatórios.")
      return
    }

    if (newUserForm.password.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres.")
      return
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newUserForm.email)) {
      alert("Por favor, insira um email válido.")
      return
    }

    setIsCreatingUser(true)
    
    try {
      // Usar API admin para criar usuário (ignora validação de domínio)
      const linked_player_id = newUserForm.linked_player_id === "none" ? null : parseInt(newUserForm.linked_player_id)
      
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newUserForm.email,
          password: newUserForm.password,
          name: newUserForm.name,
          role: newUserForm.role,
          linked_player_id,
          adminEmail: user?.email, // Envia o email do admin logado para verificação
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || "Erro ao criar usuário")
        return
      }

      alert(data.message || `Usuário ${newUserForm.name} criado com sucesso!\n\nRecarregue a página para ver o novo usuário na lista.`)
      
      setIsNewUserModalOpen(false)
      setNewUserForm({
        email: "",
        password: "",
        name: "",
        role: "user",
        linked_player_id: "none",
      })
    } catch (error: any) {
      console.error("[v0] Error creating user:", error)
      const errorMessage = error?.message || "Erro desconhecido"
      alert(`Erro ao criar usuário: ${errorMessage}`)
    } finally {
      setIsCreatingUser(false)
    }
  }

  const getLinkedPlayerName = (linkedPlayerId?: number | null) => {
    if (!linkedPlayerId) return null
    const player = (jogadores || []).find(j => j.id === linkedPlayerId)
    return player ? player.nickname || player.name : null
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="bg-white border-[#E5E0D8] max-w-md">
          <CardContent className="p-12 text-center">
            <Shield className="w-16 h-16 mx-auto text-red-500/50 mb-4" />
            <h2 className="text-xl font-bold text-[#2B2B2B]">Acesso Restrito</h2>
            <p className="text-[#967948] mt-2">
              Apenas administradores podem gerenciar usuários.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="bg-white border-[#E5E0D8]">
              <CardContent className="p-4">
                <div className="h-16 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 page-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Gerenciar <span className="text-orange-500">Usuários</span>
          </h1>
          <p className="text-white mt-1">
            Painel administrativo de controle de acesso
          </p>
        </div>
        <Button
          onClick={() => setIsNewUserModalOpen(true)}
          className="bg-gradient-to-r from-[#C5A059] to-[#967948] text-white hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Configurações da Marca */}
      <Card className="bg-white border-[#E5E0D8]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#2B2B2B]">
            <Shield className="w-5 h-5 text-[#C5A059]" />
            Identidade Visual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BrandLogoUpload />
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-white border-[#E5E0D8]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#C5A059]/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-[#C5A059]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#2B2B2B]">{profilesList.length}</p>
              <p className="text-sm text-[#967948]">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-[#E5E0D8]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#2B2B2B]">{activeCount}</p>
              <p className="text-sm text-[#967948]">Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-[#E5E0D8]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#0088CC]/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#0088CC]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#2B2B2B]">{adminCount}</p>
              <p className="text-sm text-[#967948]">Admins</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white border-[#E5E0D8]">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#967948]" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-[#F9F9F9] border-[#E5E0D8] focus:border-[#C5A059] focus:ring-[#C5A059]"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterRole === "all" ? "default" : "outline"}
                onClick={() => setFilterRole("all")}
                className={cn(
                  filterRole === "all"
                    ? "bg-[#C5A059] text-[#1a1a1a] hover:bg-[#967948]"
                    : "border-[#E5E0D8] text-[#967948] hover:bg-[#F0EDE8]"
                )}
              >
                Todos
              </Button>
              <Button
                variant={filterRole === "admin" ? "default" : "outline"}
                onClick={() => setFilterRole("admin")}
                className={cn(
                  filterRole === "admin"
                    ? "bg-[#0088CC] text-white hover:bg-[#0077B3]"
                    : "border-[#E5E0D8] text-[#967948] hover:bg-[#F0EDE8]"
                )}
              >
                Admins
              </Button>
              <Button
                variant={filterRole === "user" ? "default" : "outline"}
                onClick={() => setFilterRole("user")}
                className={cn(
                  filterRole === "user"
                    ? "bg-[#2B2B2B] text-white hover:bg-[#1a1a1a]"
                    : "border-[#E5E0D8] text-[#967948] hover:bg-[#F0EDE8]"
                )}
              >
                Usuários
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-white border-[#E5E0D8]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#2B2B2B]">
            <Shield className="w-6 h-6 text-[#C5A059]" />
            Lista de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#C5A059]/30">
                  <th className="py-4 px-4 text-left text-sm font-semibold text-[#967948]">Usuário</th>
                  <th className="py-4 px-4 text-left text-sm font-semibold text-[#967948]">Email</th>
                  <th className="py-4 px-4 text-center text-sm font-semibold text-[#967948]">Jogador</th>
                  <th className="py-4 px-4 text-center text-sm font-semibold text-[#967948]">Função</th>
                  <th className="py-4 px-4 text-center text-sm font-semibold text-[#967948]">Status</th>
                  <th className="py-4 px-4 text-center text-sm font-semibold text-[#967948]">Criado em</th>
                  <th className="py-4 px-4 text-center text-sm font-semibold text-[#967948]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr 
                    key={user.id}
                    className="border-b border-[#E5E0D8] hover:bg-[#F0EDE8] transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          user.role === "admin"
                            ? "bg-gradient-to-br from-[#C5A059] to-[#967948]"
                            : "bg-gradient-to-br from-[#0088CC] to-[#006699]"
                        )}>
                          <span className="text-sm font-bold text-white">
                            {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </span>
                        </div>
                        <span className="font-medium text-[#2B2B2B]">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-[#967948]">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{user.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {user.linked_player_id ? (
                        <div className="flex items-center justify-center gap-1">
                          <Link2 className="w-3 h-3 text-[#C5A059]" />
                          <span className="text-sm text-[#C5A059] font-medium">
                            {getLinkedPlayerName(user.linked_player_id)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-[#967948]/50">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Badge className={cn(
                        user.role === "admin"
                          ? "bg-[#C5A059]/20 text-[#C5A059] hover:bg-[#C5A059]/30"
                          : "bg-[#0088CC]/20 text-[#0088CC] hover:bg-[#0088CC]/30"
                      )}>
                        {user.role === "admin" ? "Admin" : "Usuário"}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Badge className={cn(
                        user.status === "active" && "bg-green-500/20 text-green-600 hover:bg-green-500/30",
                        user.status === "inactive" && "bg-red-500/20 text-red-600 hover:bg-red-500/30"
                      )}>
                        {user.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm text-[#967948]">
                        <Calendar className="w-4 h-4" />
                        {formatDate(user.created_at)}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4 text-[#967948]" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border-[#E5E0D8]">
                          <DropdownMenuItem 
                            className="cursor-pointer gap-2"
                            onClick={() => handleOpenEditModal(user)}
                          >
                            <Pencil className="w-4 h-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="cursor-pointer gap-2 text-[#0088CC]"
                            onClick={() => handleToggleAdmin(user)}
                          >
                            {user.role === "admin" ? (
                              <>
                                <UserX className="w-4 h-4" />
                                Remover Admin
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-4 h-4" />
                                Tornar Admin
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className={cn(
                              "cursor-pointer gap-2",
                              user.status === "active" ? "text-yellow-600" : "text-green-600"
                            )}
                            onClick={() => handleToggleStatus(user)}
                          >
                            {user.status === "active" ? (
                              <>
                                <XCircle className="w-4 h-4" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Ativar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="cursor-pointer gap-2 text-red-600"
                            onClick={() => {
                              setUserToDelete(user)
                              setDeleteConfirmOpen(true)
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#967948]">
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-white border-[#E5E0D8] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#2B2B2B] flex items-center gap-2">
              <Pencil className="w-5 h-5 text-[#C5A059]" />
              Editar Usuário
            </DialogTitle>
            <DialogDescription className="text-[#967948]">
              Altere as informações do usuário
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-[#2B2B2B]">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-[#F9F9F9] border-[#E5E0D8]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role" className="text-[#2B2B2B]">Função</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "admin" | "user") => setFormData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger className="bg-[#F9F9F9] border-[#E5E0D8]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#E5E0D8]">
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status" className="text-[#2B2B2B]">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive") => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="bg-[#F9F9F9] border-[#E5E0D8]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#E5E0D8]">
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="player" className="text-[#2B2B2B]">Vincular a Jogador</Label>
              <Select
                value={formData.linked_player_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, linked_player_id: value }))}
              >
                <SelectTrigger className="bg-[#F9F9F9] border-[#E5E0D8]">
                  <SelectValue placeholder="Selecione um jogador" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#E5E0D8]">
                  <SelectItem value="none">Nenhum</SelectItem>
                  {availablePlayers.length > 0 ? (
                    availablePlayers.map((player) => (
                      <SelectItem key={player.id} value={String(player.id)}>
                        {player.nickname || player.name} (#{player.number})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="empty" disabled>Nenhum jogador cadastrado</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="border-[#E5E0D8] text-[#967948] hover:bg-[#F0EDE8]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="bg-[#C5A059] text-[#1a1a1a] hover:bg-[#967948]"
              disabled={!formData.name.trim()}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-white border-[#E5E0D8]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#2B2B2B]">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-[#967948]">
              Tem certeza que deseja excluir o usuário {userToDelete?.name}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#E5E0D8] text-[#967948] hover:bg-[#F0EDE8]">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New User Modal */}
      <Dialog open={isNewUserModalOpen} onOpenChange={setIsNewUserModalOpen}>
        <DialogContent className="bg-white border-[#E5E0D8] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#2B2B2B] flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#C5A059]" />
              Criar Novo Usuário
            </DialogTitle>
            <DialogDescription className="text-[#967948]">
              Cadastre um novo membro no sistema
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-email" className="text-[#2B2B2B]">Email *</Label>
              <Input
                id="new-email"
                type="email"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
                className="bg-[#F9F9F9] border-[#E5E0D8]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-password" className="text-[#2B2B2B]">Senha *</Label>
              <Input
                id="new-password"
                type="password"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
                className="bg-[#F9F9F9] border-[#E5E0D8]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-name" className="text-[#2B2B2B]">Nome *</Label>
              <Input
                id="new-name"
                value={newUserForm.name}
                onChange={(e) => setNewUserForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome completo"
                className="bg-[#F9F9F9] border-[#E5E0D8]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-role" className="text-[#2B2B2B]">Função</Label>
              <Select
                value={newUserForm.role}
                onValueChange={(value: "admin" | "user") => setNewUserForm(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger className="bg-[#F9F9F9] border-[#E5E0D8]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#E5E0D8]">
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-player" className="text-[#2B2B2B]">Vincular a Jogador</Label>
              <Select
                value={newUserForm.linked_player_id}
                onValueChange={(value) => setNewUserForm(prev => ({ ...prev, linked_player_id: value }))}
              >
                <SelectTrigger className="bg-[#F9F9F9] border-[#E5E0D8]">
                  <SelectValue placeholder="Selecione um jogador" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#E5E0D8]">
                  <SelectItem value="none">Nenhum</SelectItem>
                  {(jogadores || []).filter(j => j.status === "active").length > 0 ? (
                    (jogadores || []).filter(j => j.status === "active").map((player) => (
                      <SelectItem key={player.id} value={String(player.id)}>
                        {player.nickname || player.name} (#{player.number})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="empty" disabled>Nenhum jogador cadastrado</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewUserModalOpen(false)}
              className="border-[#E5E0D8] text-[#967948] hover:bg-[#F0EDE8]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateUser}
              className="bg-[#C5A059] text-[#1a1a1a] hover:bg-[#967948]"
              disabled={!newUserForm.email || !newUserForm.password || !newUserForm.name || isCreatingUser}
            >
              {isCreatingUser ? "Criando..." : "Criar Usuário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
