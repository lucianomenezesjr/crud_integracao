"use client";

import { useState, useEffect } from "react";
import { getDevices, createDevice, updateDevice, deleteDevice, DeviceResponse } from "../lib/api";
import Link from "next/link";

export default function DevicesPage() {
  const [devices, setDevices] = useState<DeviceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState<DeviceResponse | null>(null);
  const [form, setForm] = useState({
    name: "", description: "", serialNumber: "", protocol: "",
    ipAddress: "", port: "", requiresAuthorization: false, status: "",
  });
  const [error, setError] = useState("");

  const loadDevices = async () => {
    try {
      setLoading(true);
      const data = await getDevices();
      setDevices(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dispositivos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDevices(); }, []);

  const resetForm = () => {
    setForm({ name: "", description: "", serialNumber: "", protocol: "", ipAddress: "", port: "", requiresAuthorization: false, status: "" });
    setEditingDevice(null);
    setShowForm(false);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        serialNumber: form.serialNumber || undefined,
        protocol: form.protocol || undefined,
        ipAddress: form.ipAddress || undefined,
        port: form.port ? parseInt(form.port) : undefined,
        requiresAuthorization: form.requiresAuthorization,
        ...(editingDevice ? { status: form.status || undefined } : {}),
      };
      if (editingDevice) {
        await updateDevice(editingDevice.id, payload as Parameters<typeof updateDevice>[1]);
      } else {
        await createDevice(payload);
      }
      resetForm();
      loadDevices();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    }
  };

  const handleEdit = (d: DeviceResponse) => {
    setEditingDevice(d);
    setForm({
      name: d.name,
      description: d.description || "",
      serialNumber: d.serialNumber || "",
      protocol: d.protocol || "",
      ipAddress: d.ipAddress || "",
      port: d.port?.toString() || "",
      requiresAuthorization: d.requiresAuthorization,
      status: d.status || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja excluir este dispositivo?")) return;
    try {
      await deleteDevice(id);
      loadDevices();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao excluir");
    }
  };

  const statusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "online": return "text-green-400";
      case "offline": return "text-red-400";
      default: return "text-yellow-400";
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Dispositivos</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold transition"
        >
          + Novo Dispositivo
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded mb-4 text-sm">{error}</div>
      )}

      {showForm && (
        <div className="bg-gray-800 p-6 rounded-xl mb-6">
          <h2 className="text-lg font-bold text-white mb-4">
            {editingDevice ? "Editar Dispositivo" : "Novo Dispositivo"}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="text" placeholder="Nome *" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
            <input type="text" placeholder="Descrição" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="text" placeholder="Número de Série" value={form.serialNumber}
              onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="text" placeholder="Protocolo (ex: MQTT, OPC-UA)" value={form.protocol}
              onChange={(e) => setForm({ ...form, protocol: e.target.value })}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="text" placeholder="Endereço IP" value={form.ipAddress}
              onChange={(e) => setForm({ ...form, ipAddress: e.target.value })}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="number" placeholder="Porta" value={form.port}
              onChange={(e) => setForm({ ...form, port: e.target.value })}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            {editingDevice && (
              <input type="text" placeholder="Status" value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            )}
            <label className="flex items-center gap-2 text-white">
              <input type="checkbox" checked={form.requiresAuthorization}
                onChange={(e) => setForm({ ...form, requiresAuthorization: e.target.checked })}
                className="w-4 h-4" />
              Requer Autorização
            </label>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold transition">
                {editingDevice ? "Atualizar" : "Criar"}
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
      ) : devices.length === 0 ? (
        <p className="text-gray-400">Nenhum dispositivo encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((d) => (
            <div key={d.id} className="bg-gray-800 p-5 rounded-xl border border-gray-700 hover:border-gray-600 transition">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-white font-bold text-lg">{d.name}</h3>
                  {d.description && <p className="text-gray-400 text-sm">{d.description}</p>}
                </div>
                <span className={`font-bold text-sm ${statusColor(d.status)}`}>{d.status}</span>
              </div>
              <div className="text-sm text-gray-400 space-y-1 mb-4">
                {d.serialNumber && <p>S/N: <span className="text-gray-300">{d.serialNumber}</span></p>}
                {d.protocol && <p>Protocolo: <span className="text-gray-300">{d.protocol}</span></p>}
                {d.ipAddress && <p>IP: <span className="text-gray-300">{d.ipAddress}{d.port ? `:${d.port}` : ""}</span></p>}
              </div>
              <div className="flex gap-2">
                <Link href={`/devices/${d.id}`}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm transition flex-1 text-center">
                  Detalhes
                </Link>
                <button onClick={() => handleEdit(d)}
                  className="bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1 rounded text-sm transition">
                  Editar
                </button>
                <button onClick={() => handleDelete(d.id)}
                  className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm transition">
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
