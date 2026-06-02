"use client";

import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { login, register } = useAuth();
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await register(name, email, password);
        await login(email, password);
      } else {
        await login(email, password);
      }
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-cyan-950/30 backdrop-blur">
        <h1 className="text-2xl font-bold text-slate-50 mb-6 text-center">
          {isRegister ? "Criar Conta" : "Login"}
        </h1>

        {error && (
          <div className="bg-rose-500/15 border border-rose-500/40 text-rose-200 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isRegister && (
            <input
              type="text"
              placeholder="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-800 text-slate-100 px-4 py-3 rounded-lg outline-none border border-slate-700 focus:ring-2 focus:ring-cyan-500"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-slate-800 text-slate-100 px-4 py-3 rounded-lg outline-none border border-slate-700 focus:ring-2 focus:ring-cyan-500"
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-slate-800 text-slate-100 px-4 py-3 rounded-lg outline-none border border-slate-700 focus:ring-2 focus:ring-cyan-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Carregando..." : isRegister ? "Registrar" : "Entrar"}
          </button>
        </form>

        <p className="text-slate-400 text-sm mt-4 text-center">
          {isRegister ? "Já tem conta?" : "Não tem conta?"}{" "}
          <button
            onClick={() => { setIsRegister(!isRegister); setError(""); }}
            className="text-cyan-400 hover:underline"
          >
            {isRegister ? "Fazer login" : "Criar conta"}
          </button>
        </p>
      </div>
    </div>
  );
}
