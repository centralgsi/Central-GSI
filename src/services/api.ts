import * as XLSX from 'xlsx';
import { FlotaData, Vehiculo, Mantenimiento, Inspeccion, getTodayDateString } from '../types';

export async function fetchFlotaData(): Promise<FlotaData> {
  const res = await fetch('/api/data', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Error al obtener datos del servidor central');
  }
  return res.json();
}

export async function loginUser(usuario: string, clave: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, clave }),
  });
  return res.json();
}

export async function saveVehiculo(vehiculo: Vehiculo): Promise<{ success: boolean; vehiculos: Vehiculo[] }> {
  const res = await fetch('/api/vehiculo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vehiculo),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al guardar el vehículo');
  }
  return res.json();
}

export async function deleteVehiculo(id: string): Promise<{ success: boolean; vehiculos: Vehiculo[] }> {
  const res = await fetch(`/api/vehiculo/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Error al eliminar el vehículo');
  }
  return res.json();
}

export async function saveMantenimiento(m: Mantenimiento): Promise<{ success: boolean; mantenimientos: Mantenimiento[]; vehiculos: Vehiculo[] }> {
  const res = await fetch('/api/mantenimiento', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(m),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al guardar el mantenimiento');
  }
  return res.json();
}

export async function deleteMantenimiento(id: string): Promise<{ success: boolean; mantenimientos: Mantenimiento[] }> {
  const res = await fetch(`/api/mantenimiento/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Error al eliminar el mantenimiento');
  }
  return res.json();
}

export async function saveInspeccion(insp: Inspeccion): Promise<{ success: boolean; inspecciones: Inspeccion[]; vehiculos: Vehiculo[] }> {
  const res = await fetch('/api/inspeccion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(insp),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al guardar la inspección');
  }
  return res.json();
}

export async function deleteInspeccion(id: string): Promise<{ success: boolean; inspecciones: Inspeccion[] }> {
  const res = await fetch(`/api/inspeccion/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Error al eliminar la inspección');
  }
  return res.json();
}

export async function restoreBackup(data: FlotaData): Promise<{ success: boolean; data: FlotaData }> {
  const res = await fetch('/api/backup/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error('Error al restaurar respaldo en el servidor');
  }
  return res.json();
}

export function formatVehicleName(v?: Vehiculo): string {
  if (!v) return 'Vehículo no registrado';
  const parts: string[] = [v.patente];
  if (v.interno) parts.push(`Móvil ${v.interno}`);
  if (v.codigo) parts.push(`(Cód: ${v.codigo})`);
  return parts.join(' · ');
}

export function exportToExcel(data: FlotaData) {
  const { vehiculos, mantenimientos, inspecciones } = data;
  const hoy = getTodayDateString();

  const getVName = (id: string) => {
    const v = vehiculos.find((veh) => veh.id === id);
    return formatVehicleName(v);
  };

  const flotaRows = vehiculos.map((v) => ({
    'Patente / Dominio': v.patente,
    'Móvil / Interno': v.interno,
    'Código adicional': v.codigo,
    Marca: v.marca,
    Modelo: v.modelo,
    Año: v.anio,
    'Kilometraje actual': v.km !== '' ? Number(v.km) : '',
    Estado: v.estado,
    'Último service - fecha': v.ultFecha,
    'Último service - km': v.ultKm !== '' ? Number(v.ultKm) : '',
    'Próximo service - fecha': v.proxFecha,
    'Próximo service - km': v.proxKm !== '' ? Number(v.proxKm) : '',
    Observaciones: v.obs,
  }));

  const mantRows = mantenimientos.map((m) => ({
    Fecha: m.fecha,
    Vehículo: getVName(m.vehiculo),
    Kilometraje: m.km !== '' ? Number(m.km) : '',
    Categoría: m.categoria,
    'Trabajo realizado': m.trabajo,
    Resultado: m.resultado,
    'Taller / Responsable': m.taller,
    Costo: m.costo !== '' ? Number(m.costo) : '',
    'Próxima fecha': m.proxFecha,
    'Próximo service - km': m.proxKm !== '' ? Number(m.proxKm) : '',
    Observaciones: m.obs,
  }));

  const inspRows = inspecciones.map((r) => ({
    Fecha: r.fecha,
    Vehículo: getVName(r.vehiculo),
    Kilometraje: r.km !== '' ? Number(r.km) : '',
    Inspector: r.inspector,
    'Resultado de controles': Object.entries(r.items || {})
      .map(([k, val]) => `${k}: ${val}`)
      .join(' | '),
    'Observaciones / novedades': r.obs,
  }));

  const wb = XLSX.utils.book_new();

  const wsFlota = XLSX.utils.json_to_sheet(flotaRows);
  XLSX.utils.book_append_sheet(wb, wsFlota, 'Flota');

  const wsMant = XLSX.utils.json_to_sheet(mantRows);
  XLSX.utils.book_append_sheet(wb, wsMant, 'Mantenimientos');

  const wsInsp = XLSX.utils.json_to_sheet(inspRows);
  XLSX.utils.book_append_sheet(wb, wsInsp, 'Inspecciones');

  XLSX.writeFile(wb, `GSI_Flota_Completa_${hoy}.xlsx`);
}

export function exportBackupJSON(data: FlotaData) {
  const hoy = getTodayDateString();
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `GSI_Respaldo_Flota_${hoy}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportCSV(type: 'vehiculos' | 'mantenimientos' | 'inspecciones', data: FlotaData) {
  const hoy = getTodayDateString();
  const getVName = (id: string) => {
    const v = data.vehiculos.find((veh) => veh.id === id);
    return formatVehicleName(v);
  };

  let rows: any[] = [];
  if (type === 'vehiculos') {
    rows = data.vehiculos;
  } else if (type === 'mantenimientos') {
    rows = data.mantenimientos.map((m) => ({
      ...m,
      vehiculo: getVName(m.vehiculo),
    }));
  } else {
    rows = data.inspecciones.map((r) => ({
      ...r,
      vehiculo: getVName(r.vehiculo),
      items: Object.entries(r.items || {})
        .map(([k, val]) => `${k}:${val}`)
        .join(' - '),
    }));
  }

  if (rows.length === 0) return;
  const keys = Object.keys(rows[0]);
  const csvLines = [
    keys.join(';'),
    ...rows.map((r) =>
      keys
        .map((k) => {
          let val = r[k];
          if (val && typeof val === 'object') val = JSON.stringify(val);
          return `"${String(val ?? '').replace(/"/g, '""')}"`;
        })
        .join(';')
    ),
  ];

  const blob = new Blob(['\ufeff' + csvLines.join('\r\n')], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `GSI_${type}_${hoy}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
