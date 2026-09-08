import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Derive __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

// In-memory buffer for real ESP32 sensor readings
interface Esp32Reading {
  nodeId: string;
  temperature: number;
  humidity: number;
  pressure: number;
  airQuality: number;
  voltage: number;
  current: number;
  power: number;
  energy: number;
  receivedAt: string;
  ip?: string;
}

const esp32Buffer: Esp32Reading[] = [];
const activeEsp32Nodes = new Set<string>();

// 1. POST /api/sensor-data (ESP32 Integration Endpoint as specified in Section 16)
app.post('/api/sensor-data', (req, res) => {
  const { nodeId, temperature, humidity, pressure, airQuality, voltage, current, power, energy } = req.body;

  if (!nodeId) {
    return res.status(400).json({
      error: 'Missing required field: nodeId',
      expectedFormat: {
        nodeId: 'Node1',
        temperature: 29.5,
        humidity: 65.2,
        pressure: 1012.4,
        airQuality: 145,
        voltage: 3.85,
        current: 0.12,
        power: 0.462,
        energy: 78.5,
      },
    });
  }

  const reading: Esp32Reading = {
    nodeId: String(nodeId),
    temperature: Number(temperature) || 25.0,
    humidity: Number(humidity) || 50.0,
    pressure: Number(pressure) || 1013.25,
    airQuality: Number(airQuality) || 100,
    voltage: Number(voltage) || 3.7,
    current: Number(current) || 0.08,
    power: Number(power) || (Number(voltage) || 3.7) * (Number(current) || 0.08),
    energy: Math.min(100, Math.max(0, Number(energy) || 100)),
    receivedAt: new Date().toISOString(),
    ip: req.ip || req.socket.remoteAddress,
  };

  esp32Buffer.unshift(reading);
  if (esp32Buffer.length > 200) {
    esp32Buffer.pop();
  }
  activeEsp32Nodes.add(reading.nodeId);

  return res.status(200).json({
    status: 'success',
    message: `Telemetry packet received and validated for ${reading.nodeId}`,
    reading,
    totalIngested: esp32Buffer.length,
    activeNodes: Array.from(activeEsp32Nodes),
  });
});

// 2. GET /api/sensor-data (Retrieve ingested ESP32 telemetry)
app.get('/api/sensor-data', (_req, res) => {
  res.json({
    status: 'ok',
    totalReadings: esp32Buffer.length,
    activeEsp32Nodes: Array.from(activeEsp32Nodes),
    latestReadings: esp32Buffer.slice(0, 30),
  });
});

// 3. GET /api/health
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    system: 'Enhanced Cognitive Wireless Sensor Network',
    time: new Date().toISOString(),
    esp32EndpointActive: true,
  });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WSN Cognitive Server listening on port ${PORT}`);
  });
}

startServer();
