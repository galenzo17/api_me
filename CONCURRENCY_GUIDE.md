# Concurrency Simulation Guide

Esta guía te ayudará a simular y visualizar cómo funciona el sistema de locking pesimista en condiciones de concurrencia real.

## 🚀 Inicio Rápido

### Opción 1: Demo Automático (Recomendado)
```bash
npm run demo
```
Este script interactivo te guiará por todas las opciones de simulación.

### Opción 2: Comandos Individuales
```bash
# 1. Preparar datos de prueba
npm run seed

# 2. Iniciar API (en terminal separado)
npm run start:dev

# 3. Ejecutar simulación
npm run simulate

# 4. Monitorear en tiempo real (en otro terminal)
npm run monitor
```

## 📊 Componentes del Sistema

### 1. Data Seeder (`scripts/seed-data.js`)
- ✅ Crea 10 jobs con diferentes prioridades
- ✅ Crea 8 transacciones con diferentes montos
- ✅ Limpia datos existentes antes de poblar

### 2. Worker Simulator (`scripts/simulate-workers.js`)
- ✅ Simula 5 workers concurrentes por defecto
- ✅ Cada worker tiene color distintivo en los logs
- ✅ Procesa jobs y transacciones simultáneamente
- ✅ Maneja timeouts y errores de concurrencia

### 3. Monitor Dashboard (`scripts/monitor.js`)
- 📊 Dashboard en tiempo real con estadísticas
- 🔒 Visualización de locks activos
- 👥 Tracking de workers activos
- 📈 Contadores por estado (pending, running, completed, failed)

### 4. Monitoring API (`/monitor`)
- `GET /monitor/status` - Estado general del sistema
- `GET /monitor/jobs/locked` - Jobs actualmente bloqueados
- `GET /monitor/transactions/locked` - Transacciones bloqueadas
- `GET /monitor/workers` - Workers activos y sus estadísticas

## 🔒 Cómo Funciona el Locking Pesimista

### Mecanismo de Locks
```typescript
// Adquirir lock
const acquired = await lockService.acquireJobLock(jobId, workerId);
if (acquired) {
  // Procesar trabajo
  await processJob(job);
  // Liberar lock
  await lockService.releaseJobLock(jobId, workerId);
}
```

### Condiciones de Lock
- ✅ Solo workers pueden adquirir locks en recursos `pending`
- ✅ Un recurso solo puede tener un lock activo
- ✅ Locks expiran automáticamente después de 30 segundos
- ✅ Workers deben liberar locks al completar/fallar

### Logging Detallado
```
🔒 [WORKER-01] Attempting to acquire lock for job 1
🔐 [WORKER-01] ✅ ACQUIRED lock for job 1
🔓 [WORKER-01] ✅ RELEASED lock for job 1
💰 [WORKER-02] ❌ FAILED to acquire lock for transaction 3 (already locked)
```

## 🎯 Escenarios de Prueba

### Escenario 1: Competencia por Jobs
```bash
# Terminal 1: API
npm run start:dev

# Terminal 2: Monitor
npm run monitor

# Terminal 3: Simulación
npm run simulate
```

**Observa:**
- Workers compitiendo por jobs de alta prioridad
- Solo un worker procesa cada job
- Logs detallados de lock acquisition/release

### Escenario 2: Transacciones Concurrentes
```bash
# Crear más transacciones para simular alta concurrencia
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"type": "credit", "amount": 500, "description": "High value transaction"}'
```

**Observa:**
- Multiple workers intentando procesar la misma transacción
- Solo uno obtiene el lock exitosamente
- Estados de transacción cambiando en tiempo real

### Escenario 3: Lock Timeout
```bash
# Simular worker lento (modifica SIMULATION_DURATION)
# Workers que toman más de 30 segundos pierden sus locks
```

## 📈 Métricas y Visualización

### Dashboard de Monitor
```
🔍 CONCURRENCY MONITOR DASHBOARD - 14:25:32
════════════════════════════════════════════════════════════════════════════════

📋 JOBS STATUS
────────────────────────────────────────────
  pending    |   3 ███
  running    |   2 ██
  completed  |   5 █████
  TOTAL      |  10

💰 TRANSACTIONS STATUS  
────────────────────────────────────────────
  pending    |   2 ██
  completed  |   6 ██████
  TOTAL      |   8

🔒 ACTIVE LOCKS
────────────────────────────────────────────────────────────────
  👤 WORKER-01
    🔒 Job 3: Generate Report... (15s)
  👤 WORKER-03  
    💎 Transaction 4: $75.80 debit (8s)

👥 ACTIVE WORKERS
──────────────────────────────────────────────────
  Active workers: 2
  
  WORKER-01    | Jobs:  1 | Tx:  0 | Total:  1 █
  WORKER-03    | Jobs:  0 | Tx:  1 | Total:  1 █
```

### API Endpoints para Análisis
```bash
# Estado general
curl -s http://localhost:3000/monitor/status | jq

# Workers activos
curl -s http://localhost:3000/monitor/workers | jq

# Jobs bloqueados
curl -s http://localhost:3000/monitor/jobs/locked | jq
```

## 🧪 Casos de Test Determinísticos

### Test 1: Race Condition
```bash
# Crear un job de alta prioridad
curl -X POST http://localhost:3000/jobs \
  -d '{"title": "High Priority Job", "priority": 100}'

# Observar en monitor: todos los workers compiten, solo uno gana
```

### Test 2: Lock Cleanup
```bash
# Detener simulación abruptamente (Ctrl+C)
# Reiniciar: locks expirados se limpian automáticamente
```

### Test 3: Performance Under Load
```bash
# Crear muchos jobs
for i in {1..50}; do
  curl -X POST http://localhost:3000/jobs \
    -d "{\"title\": \"Batch Job $i\", \"priority\": $((RANDOM % 10))}"
done

# Ejecutar simulación y medir throughput
```

## 🔧 Configuración Personalizada

### Modificar Parámetros
```javascript
// En scripts/simulate-workers.js
const WORKER_COUNT = 10;        // Más workers
const SIMULATION_DURATION = 60000; // 1 minuto
const POLL_INTERVAL = 500;     // Polling más agresivo
```

### Timeout de Locks
```typescript
// En src/services/lock.service.ts
private readonly lockTimeout = 10000; // 10 segundos
```

## 🐛 Troubleshooting

### API No Responde
```bash
# Verificar puerto
lsof -i :3000

# Logs de API
tail -f api.log
```

### Workers No Procesan
```bash
# Verificar datos
curl http://localhost:3000/jobs?status=pending
curl http://localhost:3000/transactions?status=pending
```

### Monitor No Actualiza
```bash
# Verificar conectividad
curl http://localhost:3000/monitor/status
```

## 📝 Logs Importantes

### Successful Lock Acquisition
```
[INFO] LockService 🔐 [WORKER-01] ✅ ACQUIRED lock for job 5
[INFO] JobService [WORKER-01] Processing job: Process Payment
[INFO] LockService 🔓 [WORKER-01] ✅ RELEASED lock for job 5
```

### Failed Lock Acquisition
```
[DEBUG] LockService 🔒 [WORKER-02] ❌ FAILED to acquire lock for job 5 (already locked)
[INFO] WORKER-02 ℹ️  No jobs available, waiting...
```

### Transaction Processing
```
[INFO] LockService 💎 [WORKER-03] ✅ ACQUIRED lock for transaction 2
[INFO] TransactionService [WORKER-03] Processing $50.25 debit transaction
[INFO] LockService 💸 [WORKER-03] ✅ RELEASED lock for transaction 2
```

¡Con esta configuración puedes simular y visualizar concurrencia real de manera determinística y controlada!