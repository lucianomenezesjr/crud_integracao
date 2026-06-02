# Instruções para Rodar o Projeto

Sistema supervisório industrial Web com pipeline:
**OPC-UA Server (Python)** → **Node-RED (Middleware)** → **Backend Express (8080)** → **Frontend Next.js (3000)**

Backend .NET (5071) para CRUD de usuários e dispositivos.

---

## Pré-requisitos

- Python 3.x com `opcua` (`pip install opcua`)
- Node.js 18+
- Node-RED (`npm install -g node-red` + `node-red-contrib-opcua`)
- Docker Desktop (para PostgreSQL do backend .NET)

---

## Como Rodar (4 terminais)

### Terminal 1 - OPC-UA Server
```bash
cd ifaci/opcua-server
python server.py
```
Simula sensores industriais na porta `opc.tcp://localhost:4840`

### Terminal 2 - Node-RED
```bash
node-red
```
Abrir `http://localhost:1880`, importar `node-red/file.json` e fazer Deploy.
Lê dados OPC-UA (Temperatura, Pressão, Status) e envia ao backend via HTTP POST.

### Terminal 3 - Backend Express (IoT)
```bash
cd ifaci
npm install
npm start
```
URL: `http://localhost:8080`
Recebe dados do Node-RED, armazena histórico e gerencia alarmes.

### Terminal 4 - Frontend Next.js
```bash
cd ifaci/frontend/my-app
npm install
npm run dev
```
URL: `http://localhost:3000`
Dashboard supervisório com dados em tempo real, gráficos de tendência e alarmes.

### (Opcional) Backend .NET - CRUD
```bash
docker start postgres_users
cd interfaceIndustrialCrud/InterfaceIndustrialApi
dotnet run
```
URL: `http://localhost:5071` - Gerenciamento de usuários, dispositivos, sensores e atuadores.

---

## Estrutura do Projeto

```
ifaci/
├── server.js               # Backend Express (dados IoT em tempo real)
├── package.json
├── opcua-server/
│   └── server.py            # Servidor OPC-UA simulado
├── node-red/
│   └── file.json            # Fluxos Node-RED (OPC-UA → Backend)
└── frontend/
    └── my-app/              # Frontend Next.js
        └── app/
            ├── page.tsx         # Dashboard supervisório
            ├── login/           # Autenticação
            ├── users/           # CRUD Usuários
            ├── devices/         # CRUD Dispositivos
            ├── lib/api.ts       # Serviço de API
            ├── contexts/        # Auth Context
            └── components/      # Navbar, etc.
```

## Endpoints do Backend IoT (8080)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /iot | Receber dados do Node-RED |
| GET | /current | Valores atuais de todas as tags |
| GET | /history/:tag | Histórico de uma tag |
| GET | /alarms | Alarmes ativos |
| POST | /alarms/:id/ack | Reconhecer alarme |
| GET | /status | Status geral do sistema |