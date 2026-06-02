"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getIotAlarms, getIotAlarmHistory, acknowledgeAlarm, IotAlarm } from "../lib/api";

type FilterPriority = "TODAS" | "ALTA" | "MEDIA";
type FilterStatus = "TODOS" | "ATIVO" | "RECONHECIDO" | "RESOLVIDO";

export default function AlarmesPage() {
  const { user, authLoading } = useAuth();
  const router = useRouter();
  const [alarms, setAlarms] = useState<IotAlarm[]>([]);
  const [history, setHistory] = useState<IotAlarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"ativos" | "historico">("ativos");
  const [filterPriority, setFilterPriority] = useState<FilterPriority>("TODAS");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("TODOS");
  const [filterTag, setFilterTag] = useState("TODAS");

  const loadData = useCallback(async () => {
    try {
      const [alm, hist] = await Promise.all([
        getIotAlarms(),
        getIotAlarmHistory(),
      ]);
      setAlarms(alm);
      setHistory(hist);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [user, authLoading, router, loadData]);

  if (authLoading || !user) return null;

  const handleAck = async (id: number) => {
    try {
      await acknowledgeAlarm(id);
      loadData();
    } catch { /* ignore */ }
  };

  const handleAckAll = async () => {
    const unacked = alarms.filter(a => !a.acknowledged);
    for (const a of unacked) {
      try { await acknowledgeAlarm(a.id); } catch { /* ignore */ }
    }
    loadData();
  };

  const activeAlarms = alarms.filter(a => !a.acknowledged);
  const ackedAlarms = alarms.filter(a => a.acknowledged && !a.resolved);
  const resolvedAlarms = alarms.filter(a => a.resolved);

  const currentList = tab === "ativos" ? alarms : history;
  const allTags = [...new Set(currentList.map(a => a.tag))];

  const filtered = currentList.filter(a => {
    if (filterPriority !== "TODAS" && a.priority !== filterPriority) return false;
    if (filterTag !== "TODAS" && a.tag !== filterTag) return false;
    if (filterStatus === "ATIVO" && a.acknowledged) return false;
    if (filterStatus === "RECONHECIDO" && (!a.acknowledged || a.resolved)) return false;
    if (filterStatus === "RESOLVIDO" && !a.resolved) return false;
    return true;
  });

  return (
    <div className="p-6 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Alarmes e Diagnóstico</h1>
          <p className="text-gray-400 text-sm">Gerenciamento de alarmes do processo industrial</p>
        </div>
        {activeAlarms.length > 0 && (
          <button onClick={handleAckAll}
            className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition">
            Reconhecer Todos ({activeAlarms.length})
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
          <p className="text-gray-400 text-xs uppercase">Total Alarmes</p>
          <p className="text-3xl font-bold text-white">{alarms.length}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-red-500/30 text-center">
          <p className="text-gray-400 text-xs uppercase">Ativos</p>
          <p className={`text-3xl font-bold ${activeAlarms.length > 0 ? "text-red-400" : "text-green-400"}`}>
            {activeAlarms.length}
          </p>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-yellow-500/30 text-center">
          <p className="text-gray-400 text-xs uppercase">Reconhecidos</p>
          <p className="text-3xl font-bold text-yellow-400">{ackedAlarms.length}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-green-500/30 text-center">
          <p className="text-gray-400 text-xs uppercase">Resolvidos</p>
          <p className="text-3xl font-bold text-green-400">{resolvedAlarms.length}</p>
        </div>
      </div>

      {/* Active alarm banner */}
      {activeAlarms.length > 0 && (
        <div className="mb-6 space-y-2">
          {activeAlarms.slice(0, 3).map(a => (
            <div key={a.id} className={`flex items-center justify-between p-3 rounded-xl border ${
              a.priority === "ALTA" ? "bg-red-500/10 border-red-500" : "bg-yellow-500/10 border-yellow-500"
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{a.type === "HIGH" ? "⚠️" : "❄️"}</span>
                <div>
                  <p className={`font-bold text-sm ${a.priority === "ALTA" ? "text-red-400" : "text-yellow-400"}`}>
                    {a.tag} — {a.message}
                  </p>
                  <p className="text-gray-500 text-xs">{new Date(a.timestamp).toLocaleString("pt-BR")}</p>
                </div>
              </div>
              <button onClick={() => handleAck(a.id)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-xs transition">
                Reconhecer
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("ativos")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
            tab === "ativos" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
          }`}>
          Alarmes Atuais ({alarms.length})
        </button>
        <button onClick={() => setTab("historico")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
            tab === "historico" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
          }`}>
          Histórico ({history.length})
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 mb-4 flex flex-wrap gap-4 items-center">
        <div>
          <label className="text-gray-400 text-xs uppercase block mb-1">Prioridade</label>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value as FilterPriority)}
            className="bg-gray-700 text-white text-sm rounded-lg px-3 py-2 border border-gray-600">
            <option value="TODAS">Todas</option>
            <option value="ALTA">Alta</option>
            <option value="MEDIA">Média</option>
          </select>
        </div>
        <div>
          <label className="text-gray-400 text-xs uppercase block mb-1">Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as FilterStatus)}
            className="bg-gray-700 text-white text-sm rounded-lg px-3 py-2 border border-gray-600">
            <option value="TODOS">Todos</option>
            <option value="ATIVO">Ativo</option>
            <option value="RECONHECIDO">Reconhecido</option>
            <option value="RESOLVIDO">Resolvido</option>
          </select>
        </div>
        <div>
          <label className="text-gray-400 text-xs uppercase block mb-1">Tag</label>
          <select value={filterTag} onChange={e => setFilterTag(e.target.value)}
            className="bg-gray-700 text-white text-sm rounded-lg px-3 py-2 border border-gray-600">
            <option value="TODAS">Todas</option>
            {allTags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="ml-auto text-gray-400 text-sm">
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {loading ? (
          <p className="text-gray-500 text-center py-16">Carregando alarmes...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-green-400 text-lg font-bold">Nenhum alarme encontrado</p>
            <p className="text-gray-500 text-sm mt-1">
              {alarms.length === 0 ? "O sistema está operando normalmente" : "Nenhum alarme corresponde aos filtros"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-900/50">
                  <th className="py-3 px-4 text-gray-400">Prioridade</th>
                  <th className="py-3 px-4 text-gray-400">Tag</th>
                  <th className="py-3 px-4 text-gray-400">Tipo</th>
                  <th className="py-3 px-4 text-gray-400">Mensagem</th>
                  <th className="py-3 px-4 text-gray-400">Valor</th>
                  <th className="py-3 px-4 text-gray-400">Data/Hora</th>
                  <th className="py-3 px-4 text-gray-400">Status</th>
                  <th className="py-3 px-4 text-gray-400">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id} className={`border-b border-gray-800 transition ${
                    !a.acknowledged ? "bg-red-500/5 hover:bg-red-500/10" : "hover:bg-gray-700/30"
                  }`}>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        a.priority === "ALTA" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"
                      }`}>{a.priority}</span>
                    </td>
                    <td className="py-3 px-4 text-white font-bold">{a.tag}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs ${a.type === "HIGH" ? "text-red-400" : "text-blue-400"}`}>
                        {a.type === "HIGH" ? "▲ ALTO" : "▼ BAIXO"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400 max-w-xs truncate">{a.message}</td>
                    <td className="py-3 px-4 text-white font-mono">{typeof a.value === "number" ? a.value.toFixed(2) : a.value}</td>
                    <td className="py-3 px-4 text-gray-400 whitespace-nowrap">{new Date(a.timestamp).toLocaleString("pt-BR")}</td>
                    <td className="py-3 px-4">
                      {a.resolved ? (
                        <span className="text-green-400 text-xs font-bold">Resolvido</span>
                      ) : a.acknowledged ? (
                        <span className="text-yellow-400 text-xs font-bold">Reconhecido</span>
                      ) : (
                        <span className="text-red-400 text-xs font-bold animate-pulse">Ativo</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {!a.acknowledged && (
                        <button onClick={() => handleAck(a.id)}
                          className="bg-yellow-600 hover:bg-yellow-500 text-white px-2 py-1 rounded text-xs transition">
                          Reconhecer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
