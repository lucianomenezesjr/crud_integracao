"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  getIotCurrentValues, getIotHistory, getIotAlarms, acknowledgeAlarm,
  getIotStatus,
  IotReading, IotAlarm, IotStatus,
} from "./lib/api";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from "recharts";

export default function Home() {
  const { user, authLoading } = useAuth();
  const router = useRouter();
  const [current, setCurrent] = useState<Record<string, IotReading>>({});
  const [tempHistory, setTempHistory] = useState<IotReading[]>([]);
  const [pressHistory, setPressHistory] = useState<IotReading[]>([]);
  const [alarms, setAlarms] = useState<IotAlarm[]>([]);
  const [status, setStatus] = useState<IotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [cur, tempHist, pressHist, alm, sts] = await Promise.all([
        getIotCurrentValues(),
        getIotHistory("Temperatura", 60),
        getIotHistory("Press\u00e3o", 60),
        getIotAlarms(),
        getIotStatus(),
      ]);
      setCurrent(cur);
      setTempHistory(tempHist);
      setPressHistory(pressHist);
      setAlarms(alm);
      setStatus(sts);
      setConnected(true);
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    loadData();
    intervalRef.current = setInterval(loadData, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [user, authLoading, router, loadData]);

  if (authLoading) return null;
  if (!user) return null;

  const temp = current["Temperatura"];
  const press = current["Press\u00e3o"];
  const running = current["Status"];
  const activeAlarms = alarms.filter(a => !a.acknowledged);

  const tempChartData = tempHistory.map(d => ({
    hora: new Date(d.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    valor: Number(d.valor),
  }));

  const pressChartData = pressHistory.map(d => ({
    hora: new Date(d.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    valor: Number(d.valor),
  }));

  const handleAck = async (id: number) => {
    try {
      await acknowledgeAlarm(id);
      loadData();
    } catch { /* ignore */ }
  };

  const getValueColor = (tag: string, val: number) => {
    if (tag === "Temperatura") {
      if (val > 80) return "text-red-400";
      if (val > 60) return "text-yellow-400";
      return "text-green-400";
    }
    if (tag === "Press\u00e3o") {
      if (val > 5) return "text-red-400";
      if (val > 3.5) return "text-yellow-400";
      return "text-green-400";
    }
    return "text-white";
  };

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Sistema Supervisorio Industrial</h1>
          <p className="text-slate-400 text-sm">OPC-UA → Node-RED → Backend → Frontend</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
            connected ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
          }`}>
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
            {connected ? "Conectado" : "Desconectado"}
          </div>
          <Link href="/devices" className="text-cyan-400 hover:underline text-sm">Gerenciar Dispositivos</Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-400 text-lg">Conectando ao sistema...</p>
        </div>
      ) : (
        <>
          {/* Active Alarms Banner */}
          {activeAlarms.length > 0 && (
            <div className="mb-6 space-y-2">
              {activeAlarms.map(a => (
                <div key={a.id} className={`flex items-center justify-between p-4 rounded-xl border ${
                  a.priority === "ALTA" ? "bg-red-500/10 border-red-500" : "bg-yellow-500/10 border-yellow-500"
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{a.type === "HIGH" ? "\u26a0\ufe0f" : "\u2744\ufe0f"}</span>
                    <div>
                      <p className={`font-bold ${a.priority === "ALTA" ? "text-red-400" : "text-yellow-400"}`}>
                        ALARME {a.type} - {a.tag}
                      </p>
                      <p className="text-slate-400 text-sm">{a.message}</p>
                    </div>
                  </div>
                  <button onClick={() => handleAck(a.id)}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition">
                    Reconhecer
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Real-time Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Temperature */}
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <div className="flex justify-between items-start mb-2">
                <p className="text-slate-400 text-sm uppercase tracking-wide">Temperatura</p>
                <span className="text-slate-500 text-xs">
                  {temp ? new Date(temp.timestamp).toLocaleTimeString("pt-BR") : "--:--:--"}
                </span>
              </div>
              <p className={`text-5xl font-bold mt-2 ${temp ? getValueColor("Temperatura", Number(temp.valor)) : "text-gray-600"}`}>
                {temp ? Number(temp.valor).toFixed(1) : "---"}
                <span className="text-xl text-slate-500 ml-1">\u00b0C</span>
              </p>
              <div className="flex justify-between text-xs text-slate-500 mt-3">
                <span>Min: 10\u00b0C</span>
                <span>Max: 80\u00b0C</span>
              </div>
              {temp && (
                <div className="mt-3 bg-slate-950 rounded-full h-2 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${
                    Number(temp.valor) > 80 ? "bg-red-500" : Number(temp.valor) > 60 ? "bg-yellow-500" : "bg-green-500"
                  }`} style={{ width: `${Math.min(100, Math.max(0, (Number(temp.valor) / 100) * 100))}%` }} />
                </div>
              )}
            </div>

            {/* Pressure */}
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <div className="flex justify-between items-start mb-2">
                <p className="text-slate-400 text-sm uppercase tracking-wide">Press\u00e3o</p>
                <span className="text-slate-500 text-xs">
                  {press ? new Date(press.timestamp).toLocaleTimeString("pt-BR") : "--:--:--"}
                </span>
              </div>
              <p className={`text-5xl font-bold mt-2 ${press ? getValueColor("Press\u00e3o", Number(press.valor)) : "text-gray-600"}`}>
                {press ? Number(press.valor).toFixed(2) : "---"}
                <span className="text-xl text-slate-500 ml-1">bar</span>
              </p>
              <div className="flex justify-between text-xs text-slate-500 mt-3">
                <span>Min: 0.5 bar</span>
                <span>Max: 5.0 bar</span>
              </div>
              {press && (
                <div className="mt-3 bg-slate-950 rounded-full h-2 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${
                    Number(press.valor) > 5 ? "bg-red-500" : Number(press.valor) > 3.5 ? "bg-yellow-500" : "bg-green-500"
                  }`} style={{ width: `${Math.min(100, Math.max(0, (Number(press.valor) / 6) * 100))}%` }} />
                </div>
              )}
            </div>

            {/* Running Status */}
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <div className="flex justify-between items-start mb-2">
                <p className="text-slate-400 text-sm uppercase tracking-wide">Status do Processo</p>
                <span className="text-slate-500 text-xs">
                  {running ? new Date(running.timestamp).toLocaleTimeString("pt-BR") : "--:--:--"}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  running?.valor ? "bg-green-500/20" : "bg-red-500/20"
                }`}>
                  <div className={`w-10 h-10 rounded-full ${
                    running?.valor ? "bg-green-500 animate-pulse" : "bg-red-500"
                  }`} />
                </div>
                <div>
                  <p className={`text-3xl font-bold ${running?.valor ? "text-green-400" : "text-red-400"}`}>
                    {running ? (running.valor ? "LIGADO" : "DESLIGADO") : "---"}
                  </p>
                  <p className="text-slate-500 text-sm">
                    {running?.valor ? "Processo em execu\u00e7\u00e3o" : "Processo parado"}
                  </p>
                </div>
              </div>
              {status && (
                <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-slate-500">Leituras</p>
                    <p className="text-white font-bold">{status.totalReadings}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Alarmes</p>
                    <p className={`font-bold ${status.activeAlarms > 0 ? "text-red-400" : "text-green-400"}`}>
                      {status.activeAlarms}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Trend Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Temperature Chart */}
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
              <h2 className="text-lg font-bold text-white mb-4">Tendencia - Temperatura (\u00b0C)</h2>
              {tempChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={tempChartData}>
                    <defs>
                      <linearGradient id="gradTemp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="hora" tick={{ fill: "#9ca3af", fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: "#9ca3af" }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }}
                      formatter={(value: number) => [`${value.toFixed(2)} \u00b0C`, "Temperatura"]} />
                    <Area type="monotone" dataKey="valor" stroke="#22c55e" strokeWidth={2}
                      fillOpacity={1} fill="url(#gradTemp)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-sm text-center py-16">Aguardando dados do OPC-UA...</p>
              )}
            </div>

            {/* Pressure Chart */}
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
              <h2 className="text-lg font-bold text-white mb-4">Tendencia - Press\u00e3o (bar)</h2>
              {pressChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={pressChartData}>
                    <defs>
                      <linearGradient id="gradPress" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="hora" tick={{ fill: "#9ca3af", fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: "#9ca3af" }} domain={[0, 6]} />
                    <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }}
                      formatter={(value: number) => [`${value.toFixed(2)} bar`, "Press\u00e3o"]} />
                    <Area type="monotone" dataKey="valor" stroke="#3b82f6" strokeWidth={2}
                      fillOpacity={1} fill="url(#gradPress)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-sm text-center py-16">Aguardando dados do OPC-UA...</p>
              )}
            </div>
          </div>

          {/* Alarm History */}
          {alarms.length > 0 && (
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 mb-8">
              <h2 className="text-lg font-bold text-white mb-4">Alarmes</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="py-2 px-3 text-slate-400">Prioridade</th>
                      <th className="py-2 px-3 text-slate-400">Tag</th>
                      <th className="py-2 px-3 text-slate-400">Tipo</th>
                      <th className="py-2 px-3 text-slate-400">Mensagem</th>
                      <th className="py-2 px-3 text-slate-400">Valor</th>
                      <th className="py-2 px-3 text-slate-400">Data/Hora</th>
                      <th className="py-2 px-3 text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alarms.map(a => (
                      <tr key={a.id} className={`border-b border-gray-800 ${!a.acknowledged ? "bg-red-500/5" : ""}`}>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            a.priority === "ALTA" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"
                          }`}>{a.priority}</span>
                        </td>
                        <td className="py-2 px-3 text-white">{a.tag}</td>
                        <td className="py-2 px-3 text-white">{a.type}</td>
                        <td className="py-2 px-3 text-slate-400">{a.message}</td>
                        <td className="py-2 px-3 text-white font-mono">{a.value}</td>
                        <td className="py-2 px-3 text-slate-400">{new Date(a.timestamp).toLocaleString("pt-BR")}</td>
                        <td className="py-2 px-3">
                          {a.acknowledged ? (
                            <span className="text-green-400 text-xs">Reconhecido</span>
                          ) : (
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
            </div>
          )}

          {/* System Info */}
          {!connected && (
            <div className="bg-slate-900 p-8 rounded-xl border border-rose-500/30 text-center">
              <p className="text-red-400 font-bold text-lg mb-2">Backend IoT Desconectado</p>
              <p className="text-slate-400 text-sm mb-4">
                Certifique-se que o pipeline esta rodando:
              </p>
              <div className="text-left max-w-md mx-auto text-sm text-gray-500 space-y-1">
                <p>1. <code className="text-gray-300">python opcua-server/server.py</code> (OPC-UA Server)</p>
                <p>2. <code className="text-gray-300">node-red</code> + importar node-red/file.json</p>
                <p>3. <code className="text-gray-300">npm start</code> (Backend Express porta 8080)</p>
                <p>4. <code className="text-gray-300">npm run dev</code> (Frontend porta 3000)</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
