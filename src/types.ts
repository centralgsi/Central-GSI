export interface Vehiculo {
  id: string;
  patente: string;
  interno: string;
  codigo: string;
  marca: string;
  modelo: string;
  anio: string;
  km: string;
  estado: 'Operativo' | 'En mantenimiento' | 'Fuera de servicio' | string;
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

export interface UserSession {
  usuario: 'logistica' | 'operador';
  rol: 'logistica' | 'operador';
  nombre: string;
}

export interface FlotaData {
  vehiculos: Vehiculo[];
  mantenimientos: Mantenimiento[];
  inspecciones: Inspeccion[];
  lastUpdated: number;
}

export function getTodayDateString(refDate: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Cordoba',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(refDate);
    const v: Record<string, string> = {};
    parts.forEach((x) => {
      if (x.type !== 'literal') v[x.type] = x.value;
    });
    return `${v.year}-${v.month}-${v.day}`;
  } catch {
    const d = new Date(refDate);
    return d.toISOString().slice(0, 10);
  }
}

export function getServiceStatus(v: Vehiculo, currentDateStr: string = getTodayDateString()): 'Vencido' | 'Próximo' | 'Sin alerta' {
  let expired = false;
  let soon = false;

  if (v.proxFecha) {
    if (v.proxFecha < currentDateStr) {
      expired = true;
    } else {
      const days =
        (new Date(v.proxFecha + 'T00:00:00').getTime() -
          new Date(currentDateStr + 'T00:00:00').getTime()) /
        86400000;
      if (days <= 30) {
        soon = true;
      }
    }
  }

  if (v.proxKm !== '' && v.proxKm != null && v.km !== '' && v.km != null) {
    const kmActual = Number(v.km);
    const kmProx = Number(v.proxKm);
    if (!isNaN(kmActual) && !isNaN(kmProx)) {
      if (kmActual >= kmProx) {
        expired = true;
      } else if (kmProx - kmActual <= 1000) {
        soon = true;
      }
    }
  }

  return expired ? 'Vencido' : soon ? 'Próximo' : 'Sin alerta';
}

export const CHECKLIST_ITEMS = [
  'Motor y pérdidas',
  'Nivel de aceite',
  'Refrigerante',
  'Líquido de frenos',
  'Dirección y suspensión',
  'Frenos',
  'Neumáticos',
  'Luces y señalización',
  'Batería',
  'Carrocería',
  'Elementos de seguridad',
];
