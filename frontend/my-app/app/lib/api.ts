const API_BASE = "http://localhost:5071/api";
const IOT_BASE = "http://localhost:8080";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Erro ${res.status}`);
  }
  return res.json();
}

// ---- Auth ----
export interface LoginResponse {
  id: number;
  name: string;
  email: string;
  token: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(name: string, email: string, password: string) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

// ---- Users ----
export interface UserResponse {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

export async function getUsers(): Promise<UserResponse[]> {
  return request<UserResponse[]>("/users");
}

export async function getUserById(id: number): Promise<UserResponse> {
  return request<UserResponse>(`/users/${id}`);
}

export async function createUser(data: { name: string; email: string; password: string }): Promise<UserResponse> {
  return request<UserResponse>("/users", { method: "POST", body: JSON.stringify(data) });
}

export async function updateUser(id: number, data: { name?: string; email?: string; password?: string }): Promise<UserResponse> {
  return request<UserResponse>(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteUser(id: number): Promise<void> {
  return request<void>(`/users/${id}`, { method: "DELETE" });
}

// ---- Devices ----
export interface DeviceResponse {
  id: string;
  name: string;
  description: string | null;
  serialNumber: string | null;
  protocol: string;
  ipAddress: string | null;
  port: number | null;
  status: string;
  requiresAuthorization: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getDevices(): Promise<DeviceResponse[]> {
  return request<DeviceResponse[]>("/devices");
}

export async function getDeviceById(id: string): Promise<DeviceResponse> {
  return request<DeviceResponse>(`/devices/${id}`);
}

export async function createDevice(data: {
  name: string;
  description?: string;
  serialNumber?: string;
  protocol?: string;
  ipAddress?: string;
  port?: number;
  requiresAuthorization?: boolean;
}): Promise<DeviceResponse> {
  return request<DeviceResponse>("/devices", { method: "POST", body: JSON.stringify(data) });
}

export async function updateDevice(id: string, data: {
  name: string;
  description?: string;
  serialNumber?: string;
  protocol?: string;
  ipAddress?: string;
  port?: number;
  requiresAuthorization?: boolean;
  status?: string;
}): Promise<DeviceResponse> {
  return request<DeviceResponse>(`/devices/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteDevice(id: string): Promise<void> {
  return request<void>(`/devices/${id}`, { method: "DELETE" });
}

// ---- Sensors ----
export interface SensorResponse {
  id: string;
  deviceId: string;
  name: string;
  type: string;
  unit: string | null;
  currentValue: number | null;
  minValue: number | null;
  maxValue: number | null;
  lastUpdate: string | null;
}

export async function getSensorsByDevice(deviceId: string): Promise<SensorResponse[]> {
  return request<SensorResponse[]>(`/devices/${deviceId}/sensors`);
}

export async function createSensor(deviceId: string, data: {
  name: string;
  type?: string;
  unit?: string;
  minValue?: number;
  maxValue?: number;
}): Promise<SensorResponse> {
  return request<SensorResponse>(`/devices/${deviceId}/sensors`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ---- Actuators ----
export interface ActuatorResponse {
  id: string;
  deviceId: string;
  name: string;
  type: string | null;
  signalType: string;
  currentValue: number | null;
  minValue: number | null;
  maxValue: number | null;
}

export async function getActuatorsByDevice(deviceId: string): Promise<ActuatorResponse[]> {
  return request<ActuatorResponse[]>(`/devices/${deviceId}/actuators`);
}

export async function createActuator(deviceId: string, data: {
  name: string;
  type?: string;
  signalType?: string;
  minValue?: number;
  maxValue?: number;
}): Promise<ActuatorResponse> {
  return request<ActuatorResponse>(`/devices/${deviceId}/actuators`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateActuator(id: string, data: {
  name: string;
  type?: string;
  signalType?: string;
  currentValue?: number;
}): Promise<ActuatorResponse> {
  return request<ActuatorResponse>(`/actuator/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ---- Sensor Data ----
export interface SensorDataResponse {
  id: string;
  deviceId: string;
  sensorId: string;
  value: number;
  timestamp: string;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export async function getSensorDataHistory(
  sensorId: string,
  page = 1,
  pageSize = 50
): Promise<PagedResult<SensorDataResponse>> {
  return request<PagedResult<SensorDataResponse>>(
    `/sensors/${sensorId}/sensordata/history?page=${page}&pageSize=${pageSize}`
  );
}

export async function addSensorData(sensorId: string, value: number): Promise<SensorDataResponse> {
  return request<SensorDataResponse>(`/sensors/${sensorId}/sensordata/data`, {
    method: "POST",
    body: JSON.stringify({ value }),
  });
}

// ======== IoT Real-Time (Express backend - porta 8080) ========

export interface IotReading {
  tag: string;
  valor: number | boolean;
  unidade: string;
  nodeId: string;
  timestamp: string;
}

export interface IotAlarm {
  id: number;
  tag: string;
  type: "HIGH" | "LOW";
  message: string;
  value: number;
  threshold: number;
  priority: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface IotStatus {
  tags: string[];
  totalReadings: number;
  activeAlarms: number;
  uptime: number;
}

async function fetchIot(path: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${IOT_BASE}${path}`, { ...options, signal: controller.signal });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getIotCurrentValues(): Promise<Record<string, IotReading>> {
  const res = await fetchIot("/current");
  return res.json();
}

export async function getIotHistory(tag: string, limit = 100): Promise<IotReading[]> {
  const res = await fetchIot(`/history/${encodeURIComponent(tag)}?limit=${limit}`);
  return res.json();
}

export async function getIotAllHistory(): Promise<Record<string, IotReading[]>> {
  const res = await fetchIot("/history");
  return res.json();
}

export async function getIotAlarms(): Promise<IotAlarm[]> {
  const res = await fetchIot("/alarms");
  return res.json();
}

export async function getIotAlarmHistory(): Promise<IotAlarm[]> {
  const res = await fetchIot("/alarms/history");
  return res.json();
}

export async function acknowledgeAlarm(id: number): Promise<IotAlarm> {
  const res = await fetchIot(`/alarms/${id}/ack`, { method: "POST" });
  return res.json();
}

export async function getIotStatus(): Promise<IotStatus> {
  const res = await fetchIot("/status");
  return res.json();
}

export async function writeOpcUa(nodeId: string, value: number | boolean, datatype: string): Promise<{ status: string }> {
  const res = await fetchIot("/write", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nodeId, value, datatype }),
  });
  return res.json();
}
