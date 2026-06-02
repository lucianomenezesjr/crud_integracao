"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getIotHistory, getIotStatus, IotReading, IotStatus } from "../lib/api";
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const TAGS = [
  { key: "Temperatura", color: "#22c55e", unit: "°C" },
  { key: "Pressão", color: "#3b82f6", unit: "bar" },
];

const PERIODS = [
  { label: "1 min", value: 30 },
  { label: "5 min", value: 150 },
  { label: "10 min", value: 300 },
  { label: "Tudo", value: 500 },
];

export default function HistoricoPage() {
  const { user, authLoading } = useAuth();
  const router = useRouter();
  const [selectedTag, setSelectedTag] = useState("Temperatura");
  const [period, setPeriod] = useState(150);
  const [data, setData] = useState<IotReading[]>([]);
  const [allData, setAllData] = useState<Record<string, IotReading[]>>({});
  const [status, setStatus] = useState<IotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<"area" | "line">("area");

  const loadData = useCallback(async () => {
    try {
      const [temp, press, sts] = await Promise.all([
        getIotHistory("Temperatura", period),
        getIotHistory("Pressão", period),
        getIotStatus(),
      ]);
      setAllData({ Temperatura: temp, "Pressão": press });
      setStatus(sts);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [user, authLoading, router, loadData]);

  useEffect(() => {
    setData(allData[selectedTag] || []);
  }, [selectedTag, allData]);

  if (authLoading || !user) return null;

  const tagConfig = TAGS.find(t => t.key === selectedTag)!;

  const chartData = data.map(d => ({
    hora: new Date(d.timestamp).toLocaleTimeString("pt-BR", {
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    }),
    valor: Number(d.valor),
    timestamp: new Date(d.timestamp).getTime(),
  }));

  const values = chartData.map(d => d.valor);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 100;
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

  return (
    <div className="p-6 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Histórico de Processo</h1>
          <p className="text-gray-400 text-sm">Visualização de tendências e dados históricos</p>
        </div>
        {status && (
          <div className="text-right text-sm text-gray-400">
            <p>Total de leituras: <span className="text-white font-bold">{status.totalReadings}</span></p>
            <p>Tags monitoradas: <span className="text-white font-bold">{status.tags.length}</span></p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 mb-6 flex flex-wrap gap-4 items-center">
        <div>
          <label className="text-gray-400 text-xs uppercase tracking-wide block mb-1">Tag</label>
          <div className="flex gap-2">
            {TAGS.map(t => (
              <button key={t.key} onClick={() => setSelectedTag(t.key)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                  selectedTag === t.key
                    ? "text-white" : "bg-gray-700 text-gray-400 hover:text-white"
                }`}
                style={selectedTag === t.key ? { backgroundColor: t.color } : undefined}
              >
                {t.key}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-gray-400 text-xs uppercase tracking-wide block mb-1">Período</label>
          <div className="flex gap-2">
            {PERIODS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={`px-3 py-2 rounded-lg text-sm transition ${
                  period === p.value
                    ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-400 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-gray-400 text-xs uppercase tracking-wide block mb-1">Tipo</label>
          <div className="flex gap-2">
            <button onClick={() => setChartType("area")}
              className={`px-3 py-2 rounded-lg text-sm transition ${
                chartType === "area" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-400 hover:text-white"
              }`}>Área</button>
            <button onClick={() => setChartType("line")}
              className={`px-3 py-2 rounded-lg text-sm transition ${
                chartType === "line" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-400 hover:text-white"
              }`}>Linha</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
          <p className="text-gray-400 text-xs uppercase">Mínimo</p>
          <p className="text-2xl font-bold text-blue-400">{values.length ? min.toFixed(2) : "---"} <span className="text-sm text-gray-500">{tagConfig.unit}</span></p>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
          <p className="text-gray-400 text-xs uppercase">Média</p>
          <p className="text-2xl font-bold text-yellow-400">{values.length ? avg.toFixed(2) : "---"} <span className="text-sm text-gray-500">{tagConfig.unit}</span></p>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
          <p className="text-gray-400 text-xs uppercase">Máximo</p>
          <p className="text-2xl font-bold text-red-400">{values.length ? max.toFixed(2) : "---"} <span className="text-sm text-gray-500">{tagConfig.unit}</span></p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 mb-6">
        <h2 className="text-lg font-bold text-white mb-4">
          {selectedTag} ({tagConfig.unit}) — últimas {chartData.length} leituras
        </h2>
        {loading ? (
          <p className="text-gray-500 text-center py-16">Carregando...</p>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            {chartType === "area" ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gradHist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={tagConfig.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={tagConfig.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="hora" tick={{ fill: "#9ca3af", fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fill: "#9ca3af" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }}
                  formatter={(value: number) => [`${value.toFixed(2)} ${tagConfig.unit}`, selectedTag]}
                />
                <Area type="monotone" dataKey="valor" stroke={tagConfig.color} strokeWidth={2}
                  fillOpacity={1} fill="url(#gradHist)" />
              </AreaChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="hora" tick={{ fill: "#9ca3af", fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fill: "#9ca3af" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }}
                  formatter={(value: number) => [`${value.toFixed(2)} ${tagConfig.unit}`, selectedTag]}
                />
                <Line type="monotone" dataKey="valor" stroke={tagConfig.color} strokeWidth={2} dot={false} />
              </LineChart>
            )}
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-sm text-center py-16">Nenhum dado histórico disponível. Aguardando dados do OPC-UA...</p>
        )}
      </div>

      {/* Data table */}
      {data.length > 0 && (
        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
          <h2 className="text-lg font-bold text-white mb-4">Dados Brutos — últimos 20 registros</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-2 px-3 text-gray-400">#</th>
                  <th className="py-2 px-3 text-gray-400">Data/Hora</th>
                  <th className="py-2 px-3 text-gray-400">Valor</th>
                  <th className="py-2 px-3 text-gray-400">Unidade</th>
                  <th className="py-2 px-3 text-gray-400">Node ID</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(-20).reverse().map((d, i) => (
                  <tr key={i} className="border-b border-gray-800">
                    <td className="py-2 px-3 text-gray-500">{data.length - i}</td>
                    <td className="py-2 px-3 text-white">{new Date(d.timestamp).toLocaleString("pt-BR")}</td>
                    <td className="py-2 px-3 text-white font-mono">{Number(d.valor).toFixed(2)}</td>
                    <td className="py-2 px-3 text-gray-400">{d.unidade}</td>
                    <td className="py-2 px-3 text-gray-500 font-mono">{d.nodeId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
