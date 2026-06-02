const express = require("express")
const cors = require("cors")
const { OPCUAClient, DataType, AttributeIds } = require("node-opcua-client")
const app = express()

const OPCUA_ENDPOINT = "opc.tcp://localhost:4840"

app.use(express.json())
app.use(cors())

// ====== Armazenamento em memória ======
const currentValues = {}    // tag -> último valor
const history = {}          // tag -> array de leituras (max 500)
const alarms = []           // alarmes ativos
const alarmHistory = []     // histórico de alarmes (max 200)

// Limites para alarmes
const alarmThresholds = {
  "Temperatura": { low: 10, high: 80, unit: "°C" },
  "Pressão":     { low: 0.5, high: 5.0, unit: "bar" },
}

// ====== Endpoints ======

// Receber dados do Node-RED
app.post("/iot", (req, res) => {
  const { tag, valor, unidade, nodeId } = req.body
  if (!tag) return res.status(400).json({ erro: "Campo 'tag' obrigatório" })

  const timestamp = new Date().toISOString()
  const numericValue = Number(valor)
  const reading = { tag, valor: isNaN(numericValue) ? valor : numericValue, unidade, nodeId, timestamp }

  // Atualizar valor atual
  currentValues[tag] = reading

  // Guardar histórico (max 500 por tag)
  if (!history[tag]) history[tag] = []
  history[tag].push(reading)
  if (history[tag].length > 500) history[tag].shift()

  // Verificar alarmes
  checkAlarms(tag, reading)

  res.json({ status: "ok", tag, valor: reading.valor })
})

// Valores atuais de todas as tags
app.get("/current", (req, res) => {
  res.json(currentValues)
})

// Histórico de uma tag
app.get("/history/:tag", (req, res) => {
  const tag = decodeURIComponent(req.params.tag)
  const limit = parseInt(req.query.limit) || 100
  const data = history[tag] || []
  res.json(data.slice(-limit))
})

// Histórico de todas as tags
app.get("/history", (req, res) => {
  res.json(history)
})

// Alarmes ativos
app.get("/alarms", (req, res) => {
  res.json(alarms)
})

// Histórico de alarmes
app.get("/alarms/history", (req, res) => {
  res.json(alarmHistory)
})

// Reconhecer alarme
app.post("/alarms/:id/ack", (req, res) => {
  const id = parseInt(req.params.id)
  const alarm = alarms.find(a => a.id === id)
  if (!alarm) return res.status(404).json({ erro: "Alarme não encontrado" })
  alarm.acknowledged = true
  alarm.acknowledgedAt = new Date().toISOString()
  res.json(alarm)
})

// Status geral do sistema
app.get("/status", (req, res) => {
  const tags = Object.keys(currentValues)
  res.json({
    tags,
    totalReadings: Object.values(history).reduce((sum, arr) => sum + arr.length, 0),
    activeAlarms: alarms.filter(a => !a.acknowledged).length,
    uptime: process.uptime(),
  })
})

// Compatibilidade com GET / antigo
app.get("/", (req, res) => {
  res.json(Object.values(currentValues))
})

// Escrever valor diretamente no OPC-UA
app.post("/write", async (req, res) => {
  const { nodeId, value, datatype } = req.body
  if (!nodeId) return res.status(400).json({ erro: "Campo 'nodeId' obrigatório" })

  const dtMap = {
    Boolean: DataType.Boolean,
    Double: DataType.Double,
    Float: DataType.Float,
    Int32: DataType.Int32,
    String: DataType.String,
  }

  try {
    const client = OPCUAClient.create({ endpointMustExist: false })
    await client.connect(OPCUA_ENDPOINT)
    const session = await client.createSession()

    const dt = dtMap[datatype] || DataType.Double
    let writeValue = value
    if (dt === DataType.Boolean) writeValue = Boolean(value)
    else if (dt !== DataType.String) writeValue = Number(value)

    await session.write({
      nodeId: nodeId,
      attributeId: AttributeIds.Value,
      value: {
        value: { dataType: dt, value: writeValue }
      }
    })

    await session.close()
    await client.disconnect()
    res.json({ status: "ok", nodeId, value: writeValue, datatype: datatype || "Double" })
  } catch (err) {
    res.status(502).json({ erro: "Falha ao escrever no OPC-UA", detalhe: err.message })
  }
})

// ====== Funções auxiliares ======
let alarmIdCounter = 1

function checkAlarms(tag, reading) {
  const thresholds = alarmThresholds[tag]
  if (!thresholds || typeof reading.valor !== "number") return

  const val = reading.valor

  // Verificar se já existe alarme ativo para esta tag/tipo
  const existingHigh = alarms.find(a => a.tag === tag && a.type === "HIGH" && !a.resolved)
  const existingLow = alarms.find(a => a.tag === tag && a.type === "LOW" && !a.resolved)

  if (val > thresholds.high && !existingHigh) {
    const alarm = {
      id: alarmIdCounter++,
      tag,
      type: "HIGH",
      message: `${tag} acima do limite: ${val} ${thresholds.unit} (max: ${thresholds.high})`,
      value: val,
      threshold: thresholds.high,
      priority: "ALTA",
      timestamp: reading.timestamp,
      acknowledged: false,
      resolved: false,
    }
    alarms.push(alarm)
    alarmHistory.push({ ...alarm })
    if (alarmHistory.length > 200) alarmHistory.shift()
  } else if (val <= thresholds.high && existingHigh) {
    existingHigh.resolved = true
    existingHigh.resolvedAt = new Date().toISOString()
  }

  if (val < thresholds.low && !existingLow) {
    const alarm = {
      id: alarmIdCounter++,
      tag,
      type: "LOW",
      message: `${tag} abaixo do limite: ${val} ${thresholds.unit} (min: ${thresholds.low})`,
      value: val,
      threshold: thresholds.low,
      priority: "ALTA",
      timestamp: reading.timestamp,
      acknowledged: false,
      resolved: false,
    }
    alarms.push(alarm)
    alarmHistory.push({ ...alarm })
    if (alarmHistory.length > 200) alarmHistory.shift()
  } else if (val >= thresholds.low && existingLow) {
    existingLow.resolved = true
    existingLow.resolvedAt = new Date().toISOString()
  }

  // Limpar alarmes resolvidos e reconhecidos
  const toRemove = alarms.filter(a => a.resolved && a.acknowledged)
  toRemove.forEach(a => {
    const idx = alarms.indexOf(a)
    if (idx >= 0) alarms.splice(idx, 1)
  })
}

app.listen(8080, () => {
  console.log("Backend IoT rodando na porta 8080")
  console.log("Endpoints:")
  console.log("  POST /iot          - Receber dados do Node-RED")
  console.log("  GET  /current      - Valores atuais")
  console.log("  GET  /history/:tag - Histórico por tag")
  console.log("  GET  /alarms       - Alarmes ativos")
  console.log("  GET  /status       - Status do sistema")
})