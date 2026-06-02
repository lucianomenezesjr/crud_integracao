"use client";

import { useState, useEffect } from "react";
import { getUsers, createUser, updateUser, deleteUser, UserResponse } from "../lib/api";

export default function UsersPage() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const resetForm = () => {
    setForm({ name: "", email: "", password: "" });
    setEditingUser(null);
    setShowForm(false);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (editingUser) {
        await updateUser(editingUser.id, form);
      } else {
        await createUser(form);
      }
      resetForm();
      loadUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    }
  };

  const handleEdit = (user: UserResponse) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, password: "" });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deseja excluir este usuário?")) return;
    try {
      await deleteUser(id);
      loadUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao excluir");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Usuários</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold transition"
        >
          + Novo Usuário
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-gray-800 p-6 rounded-xl mb-6">
          <h2 className="text-lg font-bold text-white mb-4">
            {editingUser ? "Editar Usuário" : "Novo Usuário"}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Nome"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="password"
              placeholder={editingUser ? "Nova senha (opcional)" : "Senha"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              {...(!editingUser && { required: true })}
            />
            <div className="flex gap-2">
              <button type="submit" className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold transition">
                {editingUser ? "Atualizar" : "Criar"}
              </button>
              <button type="button" onClick={resetForm} className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">Carregando...</p>
      ) : users.length === 0 ? (
        <p className="text-gray-400">Nenhum usuário encontrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="py-3 px-4 text-gray-400 font-semibold">ID</th>
                <th className="py-3 px-4 text-gray-400 font-semibold">Nome</th>
                <th className="py-3 px-4 text-gray-400 font-semibold">Email</th>
                <th className="py-3 px-4 text-gray-400 font-semibold">Criado em</th>
                <th className="py-3 px-4 text-gray-400 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4 text-white">{u.id}</td>
                  <td className="py-3 px-4 text-white">{u.name}</td>
                  <td className="py-3 px-4 text-white">{u.email}</td>
                  <td className="py-3 px-4 text-gray-400">{new Date(u.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td className="py-3 px-4 flex gap-2">
                    <button onClick={() => handleEdit(u)} className="bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1 rounded text-sm transition">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(u.id)} className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm transition">
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
