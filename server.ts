import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'flota_db.json');

// Credenciales fijadas por el usuario:
// Logística = mf6512026
// Operador = central651
const USUARIOS: Record<string, { clave: string; rol: string; nombre: string }> = {
  logistica: {
    clave: 'mf6512026',
    rol: 'logistica',
    nombre: 'Logística (Administrador)',
  },
  operador: {
    clave: 'central651',
    rol: 'operador',
    nombre: 'Operador (Consulta)',
  },
};

const INITIAL_VEHICULOS = [
  { patente: 'A163WTZ', interno: '3243', codigo: '' },
  { patente: 'A163WUA', interno: '3245', codigo: '' },
  { patente: 'A163WUB', interno: '3244', codigo: '' },
  { patente: 'A163WUP', interno: '3246', codigo: '' },
  { patente: 'A251IHV', interno: '3528', codigo: '' },
  { patente: 'A251PFH', interno: '3530', codigo: '' },
  { patente: 'A251PFI', interno: '3529', codigo: '' },
  { patente: 'A251PFO', interno: '3531', codigo: '' },
  { patente: 'AD340JS', interno: '3014', codigo: '1531614' },
  { patente: 'AF526XG', interno: '3262', codigo: '1531611' },
  { patente: 'AF526XH', interno: '3261', codigo: '1531609' },
  { patente: 'AF526XI', interno: '3264', codigo: '1531607' },
  { patente: 'AF526XN', interno: '3263', codigo: '1531610' },
  { patente: 'AF526XQ', interno: '3260', codigo: '1531608' },
  { patente: 'AG475HF', interno: '3380', codigo: '1531606' },
  { patente: 'AG475HG', interno: '3382', codigo: '1531600' },
  { patente: 'AG475HH', interno: '3381', codigo: '1531603' },
  { patente: 'AG475HI', interno: '3379', codigo: '1531604' },
  { patente: 'AG475HJ', interno: '3378', codigo: '1531601' },
  { patente: 'AG475HK', interno: '3377', codigo: '1531605' },
  { patente: 'AG475HL', interno: '3383', codigo: '1531602' },
  { patente: 'AH761WQ', interno: '3609', codigo: '1533609' },
  { patente: 'AH761WR', interno: '3610', codigo: '1533610' },
  { patente: 'AH761WS', interno: '3611', codigo: '1533611' },
  { patente: 'AH761WU', interno: '3612', codigo: '1533612' },
  { patente: 'NTQ 443', interno: '2567', codigo: '' },
  { patente: 'NTQ 455', interno: '2562', codigo: '' },
  { patente: 'OJV 699', interno: '2692', codigo: '1531613' },
];

export interface Vehiculo {
  id: string;
  patente: string;
  interno: string;
  codigo: string;
  marca: string;
  modelo: string;
  anio: string;
  km: string;
  estado: string; // 'Operativo' | 'En mantenimiento' | 'Fuera de servicio'
  ultFecha: string;
  ultKm: string;
  proxFecha: string;
  proxKm: string;
  obs: string;
}

export interface Mantenimiento {
  id: string;
  vehiculo: string;
  fecha: string;
  km: string;
  categoria: string;
  trabajo: string;
  resultado: string;
  taller: string;
  costo: string;
  proxFecha: string;
  proxKm: string;
  obs: string;
}

export interface Inspeccion {
  id: string;
  vehiculo: string;
  fecha: string;
  km: string;
  inspector: string;
  items: Record<string, string>;
  obs: string;
}

export interface FlotaDatabase {
  vehiculos: Vehiculo[];
  mantenimientos: Mantenimiento[];
  inspecciones: Inspeccion[];
  lastUpdated: number;
}

function initDatabase(): FlotaDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (Array.isArray(data.vehiculos)) {
        return data;
      }
    } catch (e) {
      console.error('Error reading existing DB, recreating default:', e);
    }
  }

  const initialData: FlotaDatabase = {
    vehiculos: INITIAL_VEHICULOS.map((v, i) => ({
      id: `v${i + 1}`,
      patente: v.patente,
      interno: v.interno,
      codigo: v.codigo,
      marca: '',
      modelo: '',
      anio: '',
      km: '',
      estado: 'Operativo',
      ultFecha: '',
      ultKm: '',
      proxFecha: '',
      proxKm: '',
      obs: '',
    })),
    mantenimientos: [],
    inspecciones: [],
    lastUpdated: Date.now(),
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  return initialData;
}

let db = initDatabase();

function saveDatabase(broadcastAction?: string) {
  db.lastUpdated = Date.now();
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');

  if (broadcastAction) {
    broadcastSSE({
      type: 'update',
      action: broadcastAction,
      lastUpdated: db.lastUpdated,
      data: db,
    });
  }
}

// SSE Clients Registry
const sseClients = new Set<Response>();

function broadcastSSE(payload: any) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(data);
    } catch {
      sseClients.delete(client);
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));

  // API: Server Time Synchronization (Exact Argentina / UTC timestamps)
  app.get('/api/time', (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.json({
      timestamp: Date.now(),
      serverIso: new Date().toISOString(),
    });
  });

  // API: Server-Sent Events (SSE) for Real-Time PC-to-PC Instant Updates
  app.get('/api/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Send immediate initial sync state
    res.write(`data: ${JSON.stringify({ type: 'init', lastUpdated: db.lastUpdated, clientsCount: sseClients.size + 1 })}\n\n`);

    sseClients.add(res);

    // Keepalive heartbeat
    const interval = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 25000);

    req.on('close', () => {
      clearInterval(interval);
      sseClients.delete(res);
    });
  });

  // API: Authentication
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { usuario, clave } = req.body;
    const userKey = (usuario || '').toLowerCase().trim();
    const config = USUARIOS[userKey];

    if (config && config.clave === clave) {
      return res.json({
        success: true,
        user: {
          usuario: userKey,
          rol: config.rol,
          nombre: config.nombre,
        },
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Usuario o clave de acceso incorrectos.',
    });
  });

  // API: Get Full Data
  app.get('/api/data', (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.json(db);
  });

  // API: Save / Update Vehicle
  app.post('/api/vehiculo', (req: Request, res: Response) => {
    const vehicleData = req.body as Vehiculo;
    if (!vehicleData.patente) {
      return res.status(400).json({ error: 'La patente es obligatoria' });
    }

    const index = db.vehiculos.findIndex((v) => v.id === vehicleData.id);
    if (index >= 0) {
      db.vehiculos[index] = { ...db.vehiculos[index], ...vehicleData };
    } else {
      const newId = vehicleData.id || `v${Date.now()}`;
      db.vehiculos.push({ ...vehicleData, id: newId });
    }

    saveDatabase(`Vehículo ${vehicleData.patente} guardado`);
    res.json({ success: true, vehiculos: db.vehiculos });
  });

  // API: Delete Vehicle
  app.delete('/api/vehiculo/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    const prevCount = db.vehiculos.length;
    const target = db.vehiculos.find((v) => v.id === id);
    db.vehiculos = db.vehiculos.filter((v) => v.id !== id);

    if (db.vehiculos.length < prevCount) {
      saveDatabase(`Vehículo ${target?.patente || id} eliminado`);
      return res.json({ success: true, vehiculos: db.vehiculos });
    }

    res.status(404).json({ error: 'Vehículo no encontrado' });
  });

  // API: Save Maintenance Record
  app.post('/api/mantenimiento', (req: Request, res: Response) => {
    const m = req.body as Mantenimiento;
    if (!m.vehiculo || !m.fecha || m.km === undefined) {
      return res.status(400).json({ error: 'Datos de mantenimiento incompletos' });
    }

    const record: Mantenimiento = {
      ...m,
      id: m.id || `m${Date.now()}`,
    };

    db.mantenimientos.unshift(record);

    // Actualizar datos de service en el vehículo correspondiente
    const v = db.vehiculos.find((veh) => veh.id === m.vehiculo);
    if (v) {
      v.ultFecha = m.fecha;
      v.ultKm = m.km;
      if (m.proxFecha) v.proxFecha = m.proxFecha;
      if (m.proxKm) v.proxKm = m.proxKm;
      if (m.km && (!v.km || Number(m.km) > Number(v.km))) {
        v.km = m.km;
      }
    }

    saveDatabase(`Mantenimiento registrado para ${v ? v.patente : 'móvil'}`);
    res.json({ success: true, mantenimientos: db.mantenimientos, vehiculos: db.vehiculos });
  });

  // API: Delete Maintenance Record
  app.delete('/api/mantenimiento/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    db.mantenimientos = db.mantenimientos.filter((m) => m.id !== id);
    saveDatabase('Mantenimiento eliminado');
    res.json({ success: true, mantenimientos: db.mantenimientos });
  });

  // API: Save Inspection Record
  app.post('/api/inspeccion', (req: Request, res: Response) => {
    const r = req.body as Inspeccion;
    if (!r.vehiculo || !r.fecha) {
      return res.status(400).json({ error: 'Datos de inspección incompletos' });
    }

    const record: Inspeccion = {
      ...r,
      id: r.id || `i${Date.now()}`,
    };

    db.inspecciones.unshift(record);

    const v = db.vehiculos.find((veh) => veh.id === r.vehiculo);
    if (v && r.km && (!v.km || Number(r.km) > Number(v.km))) {
      v.km = r.km;
    }

    saveDatabase(`Inspección registrada para ${v ? v.patente : 'móvil'}`);
    res.json({ success: true, inspecciones: db.inspecciones, vehiculos: db.vehiculos });
  });

  // API: Delete Inspection Record
  app.delete('/api/inspeccion/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    db.inspecciones = db.inspecciones.filter((r) => r.id !== id);
    saveDatabase('Inspección eliminada');
    res.json({ success: true, inspecciones: db.inspecciones });
  });

  // API: Restore Backup JSON
  app.post('/api/backup/restore', (req: Request, res: Response) => {
    const backup = req.body;
    if (!backup || !Array.isArray(backup.vehiculos)) {
      return res.status(400).json({ error: 'Formato de respaldo inválido' });
    }

    db = {
      vehiculos: backup.vehiculos || [],
      mantenimientos: backup.mantenimientos || [],
      inspecciones: backup.inspecciones || [],
      lastUpdated: Date.now(),
    };

    saveDatabase('Base de datos restaurada desde respaldo');
    res.json({ success: true, data: db });
  });

  // Development vs Production serving
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Servidor GSI Flota] Conectado y listo en http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
