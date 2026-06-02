"use client";

import { useState, useEffect, use } from "react";
import {
  getDeviceById, DeviceResponse,
  getSensorsByDevice, createSensor, SensorResponse,
  getActuatorsByDevice, createActuator, updateActuator, ActuatorResponse,
  getSensorDataHistory, addSensorData, SensorDataResponse, PagedResult,
} from "../../lib/api";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from "recharts";

export default function DeviceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [device, setDevice] = useState<DeviceResponse | null>(null);
  const [sensors, setSensors] = useState<SensorResponse[]>([]);
  const [actuators, setActuators] = useState<ActuatorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Sensor form
  const [showSensorForm, setShowSensorForm] = useState(false);
  const [sensorForm, setSensorForm] = useState({ name: "", type: "", unit: "", minValue: "", maxValue: "" });

  // Actuator form
  const [showActuatorForm, setShowActuatorForm] = useState(false);
  const [actuatorForm, setActuatorForm] = useState({ name: "", type: "", signalType: "", minValue: "", maxValue: "" });

  // Actuator update
  const [editingActuator, setEditingActuator] = useState<ActuatorResponse | null>(null);
  const [actuatorEditForm, setActuatorEditForm] = useState({ name: "", type: "", signalType: "", currentValue: "" });

  // Sensor Data
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);
  const [sensorData, setSensorData] = useState<PagedResult<SensorDataResponse> | null>(null);
  const [dataPage, setDataPage] = useState(1);
  const [newDataValue, setNewDataValue] = useState("");

  const loadDevice = async () => {
    try {
      setLoading(true);
      const [dev, sens, acts] = await Promise.all([
        getDeviceById(id),
        getSensorsByDevice(id),
        getActuatorsByDevice(id),
      ]);
      setDevice(dev);
      setSensors(sens);
      setActuators(acts);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dispositivo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDevice(); }, [id]);

  const loadSensorData = async (sensorId: string, page = 1) => {
    try {
      const data = await getSensorDataHistory(sensorId, page);
      setSensorData(data);
      setDataPage(page);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    }
  };

  const handleCreateSensor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSensor(id, {
        name: sensorForm.name,
        type: sensorForm.type || undefined,
        unit: sensorForm.unit || undefined,
        minValue: sensorForm.minValue ? parseFloat(sensorForm.minValue) : undefined,
        maxValue: sensorForm.maxValue ? parseFloat(sensorForm.maxValue) : undefined,
      });
      setSensorForm({ name: "", type: "", unit: "", minValue: "", maxValue: "" });
      setShowSensorForm(false);
      loadDevice();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar sensor");
    }
  };

  const handleCreateActuator = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createActuator(id, {
        name: actuatorForm.name,
        type: actuatorForm.type || undefined,
        signalType: actuatorForm.signalType || undefined,
        minValue: actuatorForm.minValue ? parseFloat(actuatorForm.minValue) : undefined,
        maxValue: actuatorForm.maxValue ? parseFloat(actuatorForm.maxValue) : undefined,
      });
      setActuatorForm({ name: "", type: "", signalType: "", minValue: "", maxValue: "" });
      setShowActuatorForm(false);
      loadDevice();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar atuador");
    }
  };

  const handleUpdateActuator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActuator) return;
    try {
      await updateActuator(editingActuator.id, {
        name: actuatorEditForm.name,
        type: actuatorEditForm.type || undefined,
        signalType: actuatorEditForm.signalType || undefined,
        currentValue: actuatorEditForm.currentValue ? parseFloat(actuatorEditForm.currentValue) : undefined,
      });
      setEditingActuator(null);
      loadDevice();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar atuador");
    }
  };

  const handleAddSensorData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSensor || !newDataValue) return;
    try {
      await addSensorData(selectedSensor, parseFloat(newDataValue));
      setNewDataValue("");
      loadSensorData(selectedSensor, dataPage);
      loadDevice();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar dado");
    }
  };

  if (loading) return <div className="p-6 text-gray-400">Carregando...</div>;
  if (!device) return <div className="p-6 text-red-400">Dispositivo não encontrado</div>;

  const statusColor = device.status?.toLowerCase() === "online" ? "text-green-400" : device.status?.toLowerCase() === "offline" ? "text-red-400" : "text-yellow-400";

  return (
    <div className="p-6">
      <Link href="/devices" className="text-blue-400 hover:underline text-sm mb-4 inline-block">&larr; Voltar</Link>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded mb-4 text-sm">{error}</div>
      )}

      {/* Device Info */}
      <div className="bg-gray-800 p-6 rounded-xl mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white">{device.name}</h1>
            {device.description && <p className="text-gray-400 mt-1">{device.description}</p>}
          </div>
          <span className={`font-bold ${statusColor}`}>{device.status}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
          {device.serialNumber && <div><span className="text-gray-500">S/N:</span> <span className="text-gray-300">{device.serialNumber}</span></div>}
          {device.protocol && <div><span className="text-gray-500">Protocolo:</span> <span className="text-gray-300">{device.protocol}</span></div>}
          {device.ipAddress && <div><span className="text-gray-500">IP:</span> <span className="text-gray-300">{device.ipAddress}{device.port ? `:${device.port}` : ""}</span></div>}
          <div><span className="text-gray-500">Autorização:</span> <span className="text-gray-300">{device.requiresAuthorization ? "Sim" : "Não"}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sensors Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold text-white">Sensores</h2>
            <button onClick={() => setShowSensorForm(!showSensorForm)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm font-bold transition">
              + Sensor
            </button>
          </div>

          {showSensorForm && (
            <form onSubmit={handleCreateSensor} className="bg-gray-800 p-4 rounded-xl mb-4 flex flex-col gap-2">
              <input type="text" placeholder="Nome *" value={sensorForm.name}
                onChange={(e) => setSensorForm({ ...sensorForm, name: e.target.value })}
                className="bg-gray-700 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
              <input type="text" placeholder="Tipo" value={sensorForm.type}
                onChange={(e) => setSensorForm({ ...sensorForm, type: e.target.value })}
                className="bg-gray-700 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="Unidade" value={sensorForm.unit}
                onChange={(e) => setSensorForm({ ...sensorForm, unit: e.target.value })}
                className="bg-gray-700 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex gap-2">
                <input type="number" step="any" placeholder="Min" value={sensorForm.minValue}
                  onChange={(e) => setSensorForm({ ...sensorForm, minValue: e.target.value })}
                  className="bg-gray-700 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 flex-1" />
                <input type="number" step="any" placeholder="Max" value={sensorForm.maxValue}
                  onChange={(e) => setSensorForm({ ...sensorForm, maxValue: e.target.value })}
                  className="bg-gray-700 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 flex-1" />
              </div>
              <button type="submit" className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold transition">
                Criar Sensor
              </button>
            </form>
          )}

          {sensors.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum sensor cadastrado.</p>
          ) : (
            <div className="space-y-3">
              {sensors.map((s) => (
                <div key={s.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-white font-bold">{s.name}</h3>
                      <p className="text-gray-400 text-sm">{s.type} {s.unit ? `(${s.unit})` : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold text-lg">{s.currentValue ?? "—"}</p>
                      <p className="text-gray-500 text-xs">
                        {s.minValue != null && s.maxValue != null ? `${s.minValue} ~ ${s.maxValue}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => { setSelectedSensor(s.id); loadSensorData(s.id); }}
                      className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-sm transition">
                      Histórico
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actuators Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold text-white">Atuadores</h2>
            <button onClick={() => setShowActuatorForm(!showActuatorForm)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm font-bold transition">
              + Atuador
            </button>
          </div>

          {showActuatorForm && (
            <form onSubmit={handleCreateActuator} className="bg-gray-800 p-4 rounded-xl mb-4 flex flex-col gap-2">
              <input type="text" placeholder="Nome *" value={actuatorForm.name}
                onChange={(e) => setActuatorForm({ ...actuatorForm, name: e.target.value })}
                className="bg-gray-700 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
              <input type="text" placeholder="Tipo" value={actuatorForm.type}
                onChange={(e) => setActuatorForm({ ...actuatorForm, type: e.target.value })}
                className="bg-gray-700 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="Tipo de Sinal" value={actuatorForm.signalType}
                onChange={(e) => setActuatorForm({ ...actuatorForm, signalType: e.target.value })}
                className="bg-gray-700 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex gap-2">
                <input type="number" step="any" placeholder="Min" value={actuatorForm.minValue}
                  onChange={(e) => setActuatorForm({ ...actuatorForm, minValue: e.target.value })}
                  className="bg-gray-700 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 flex-1" />
                <input type="number" step="any" placeholder="Max" value={actuatorForm.maxValue}
                  onChange={(e) => setActuatorForm({ ...actuatorForm, maxValue: e.target.value })}
                  className="bg-gray-700 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 flex-1" />
              </div>
              <button type="submit" className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold transition">
                Criar Atuador
              </button>
            </form>
          )}

          {editingActuator && (
            <form onSubmit={handleUpdateActuator} className="bg-gray-800 p-4 rounded-xl mb-4 flex flex-col gap-2 border border-yellow-600">
              <h3 className="text-yellow-400 font-bold">Editar: {editingActuator.name}</h3>
              <input type="text" placeholder="Nome *" value={actuatorEditForm.name}
                onChange={(e) => setActuatorEditForm({ ...actuatorEditForm, name: e.target.value })}
                className="bg-gray-700 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-yellow-500" required />
              <input type="text" placeholder="Tipo" value={actuatorEditForm.type}
                onChange={(e) => setActuatorEditForm({ ...actuatorEditForm, type: e.target.value })}
                className="bg-gray-700 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-yellow-500" />
              <input type="text" placeholder="Tipo de Sinal" value={actuatorEditForm.signalType}
                onChange={(e) => setActuatorEditForm({ ...actuatorEditForm, signalType: e.target.value })}
                className="bg-gray-700 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-yellow-500" />
              <input type="number" step="any" placeholder="Valor Atual" value={actuatorEditForm.currentValue}
                onChange={(e) => setActuatorEditForm({ ...actuatorEditForm, currentValue: e.target.value })}
                className="bg-gray-700 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-yellow-500" />
              <div className="flex gap-2">
                <button type="submit" className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold transition">
                  Atualizar
                </button>
                <button type="button" onClick={() => setEditingActuator(null)}
                  className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition">
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {actuators.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum atuador cadastrado.</p>
          ) : (
            <div className="space-y-3">
              {actuators.map((a) => (
                <div key={a.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-white font-bold">{a.name}</h3>
                      <p className="text-gray-400 text-sm">{a.type} — {a.signalType}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-400 font-bold text-lg">{a.currentValue ?? "—"}</p>
                      <p className="text-gray-500 text-xs">
                        {a.minValue != null && a.maxValue != null ? `${a.minValue} ~ ${a.maxValue}` : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingActuator(a);
                      setActuatorEditForm({
                        name: a.name,
                        type: a.type || "",
                        signalType: a.signalType || "",
                        currentValue: a.currentValue?.toString() || "",
                      });
                    }}
                    className="bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1 rounded text-sm mt-3 transition"
                  >
                    Editar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sensor Data History */}
      {selectedSensor && (
        <div className="mt-6 bg-gray-800 p-6 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">
              Histórico do Sensor: {sensors.find(s => s.id === selectedSensor)?.name}
            </h2>
            <button onClick={() => { setSelectedSensor(null); setSensorData(null); }}
              className="text-gray-400 hover:text-white text-sm">Fechar</button>
          </div>

          {/* Add data form */}
          <form onSubmit={handleAddSensorData} className="flex gap-2 mb-4">
            <input type="number" step="any" placeholder="Valor" value={newDataValue}
              onChange={(e) => setNewDataValue(e.target.value)}
              className="bg-gray-700 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 flex-1" required />
            <button type="submit" className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold transition">
              Adicionar
            </button>
          </form>

          {sensorData && sensorData.items.length > 0 ? (
            <>
              {/* Chart */}
              <div className="mb-6">
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={[...sensorData.items].reverse().map(d => ({
                    hora: new Date(d.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                    valor: d.value,
                  }))}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="hora" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }} />
                    <Area type="monotone" dataKey="valor" stroke="#22c55e" strokeWidth={2}
                      fillOpacity={1} fill="url(#colorVal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="py-2 px-3 text-gray-400">Valor</th>
                    <th className="py-2 px-3 text-gray-400">Data/Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {sensorData.items.map((d) => (
                    <tr key={d.id} className="border-b border-gray-800">
                      <td className="py-2 px-3 text-white font-mono">{d.value}</td>
                      <td className="py-2 px-3 text-gray-400">
                        {new Date(d.timestamp).toLocaleString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-500 text-sm">
                  Página {sensorData.page} — Total: {sensorData.total}
                </span>
                <div className="flex gap-2">
                  <button disabled={dataPage <= 1}
                    onClick={() => loadSensorData(selectedSensor, dataPage - 1)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm disabled:opacity-30">
                    Anterior
                  </button>
                  <button disabled={sensorData.items.length < sensorData.pageSize}
                    onClick={() => loadSensorData(selectedSensor, dataPage + 1)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm disabled:opacity-30">
                    Próximo
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-sm">Nenhum dado registrado.</p>
          )}
        </div>
      )}
    </div>
  );
}
