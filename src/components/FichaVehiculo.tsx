import React from 'react';
import { ArrowLeft, Printer, Edit, Truck, Calendar, Gauge, Wrench, ShieldAlert } from 'lucide-react';
import { Vehiculo, Mantenimiento, Inspeccion, UserSession, getTodayDateString, getServiceStatus } from '../types';

interface FichaVehiculoProps {
  vehiculo: Vehiculo;
  mantenimientos: Mantenimiento[];
  inspecciones: Inspeccion[];
  user: UserSession;
  onBack: () => void;
  onEdit: (v: Vehiculo) => void;
}

export const FichaVehiculo: React.FC<FichaVehiculoProps> = ({
  vehiculo,
  mantenimientos,
  inspecciones,
  user,
  onBack,
  onEdit,
}) => {
  const isLogistica = user.rol === 'logistica';
  const serviceState = getServiceStatus(vehiculo);

  // Filtrar mantenimientos e inspecciones de este vehículo
  const misMantenimientos = mantenimientos.filter((m) => m.vehiculo === vehiculo.id);
  const misInspecciones = inspecciones.filter((i) => i.vehiculo === vehiculo.id);

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'Operativo':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'En mantenimiento':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Fuera de servicio':
        return 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getServiceBadge = (state: string) => {
    switch (state) {
      case 'Vencido':
        return 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800';
      case 'Próximo':
        return 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      default:
        return 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de herramientas superior */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a móviles</span>
        </button>

        <div className="flex items-center gap-2">
          {isLogistica && (
            <button
              onClick={() => onEdit(vehiculo)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition-all cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Editar datos</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#17469a] hover:bg-[#102b59] active:bg-[#0c2044] text-white rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir ficha</span>
          </button>
        </div>
      </div>

      {/* Contenedor imprimible de la ficha */}
      <div className="ficha-imprimible bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">
        {/* Cabecera de la ficha */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-[#102b59] dark:border-blue-500 mb-6">
          <div className="flex items-center gap-4">
            <img
              src="/gsi-logo.png"
              alt="Logo GSI"
              className="h-14 w-auto object-contain"
            />
            <div>
              <h1 className="text-xl md:text-2xl font-black text-[#102b59] dark:text-white tracking-tight">
                Ficha Individual del Móvil
              </h1>
              <p className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                Guardia de Seguridad Institucional · Gestión de Flota
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {vehiculo.patente}
            </div>
            {vehiculo.interno && (
              <div className="text-sm font-bold text-[#17469a] dark:text-blue-400">
                Móvil {vehiculo.interno}
              </div>
            )}
          </div>
        </div>

        {/* Resumen de Estados */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="block text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">
              Estado del Vehículo
            </span>
            <span
              className={`inline-block mt-1 px-2.5 py-0.5 text-xs font-bold rounded-md border ${getStatusBadge(
                vehiculo.estado
              )}`}
            >
              {vehiculo.estado}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="block text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">
              Kilometraje Actual
            </span>
            <span className="block mt-1 text-base font-bold font-mono text-slate-900 dark:text-white">
              {vehiculo.km !== '' ? `${Number(vehiculo.km).toLocaleString('es-AR')} km` : 'Sin registrar'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="block text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">
              Estado de Service
            </span>
            <span
              className={`inline-block mt-1 px-2.5 py-0.5 text-xs font-bold rounded-md border ${getServiceBadge(
                serviceState
              )}`}
            >
              {serviceState}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="block text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">
              Código Adicional
            </span>
            <span className="block mt-1 text-base font-bold font-mono text-slate-800 dark:text-slate-200">
              {vehiculo.codigo || '—'}
            </span>
          </div>
        </div>

        {/* Tabla de Ficha Técnica */}
        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-200 dark:border-slate-700 mb-3 flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Datos Técnicos y de Registro</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-sm">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="block text-xs text-slate-500 dark:text-slate-400">Patente / Dominio</span>
              <strong className="text-slate-900 dark:text-white font-mono">{vehiculo.patente}</strong>
            </div>
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="block text-xs text-slate-500 dark:text-slate-400">Número de Interno</span>
              <strong className="text-slate-900 dark:text-white">{vehiculo.interno || 'Sin número asignado'}</strong>
            </div>
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="block text-xs text-slate-500 dark:text-slate-400">Código Adicional</span>
              <strong className="text-slate-900 dark:text-white font-mono">{vehiculo.codigo || '—'}</strong>
            </div>
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="block text-xs text-slate-500 dark:text-slate-400">Marca</span>
              <strong className="text-slate-900 dark:text-white">{vehiculo.marca || 'Sin cargar'}</strong>
            </div>
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="block text-xs text-slate-500 dark:text-slate-400">Modelo</span>
              <strong className="text-slate-900 dark:text-white">{vehiculo.modelo || 'Sin cargar'}</strong>
            </div>
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="block text-xs text-slate-500 dark:text-slate-400">Año de Fabricación</span>
              <strong className="text-slate-900 dark:text-white">{vehiculo.anio || 'Sin cargar'}</strong>
            </div>
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="block text-xs text-slate-500 dark:text-slate-400">Último Service - Fecha</span>
              <strong className="text-slate-900 dark:text-white">{vehiculo.ultFecha || 'Sin cargar'}</strong>
            </div>
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="block text-xs text-slate-500 dark:text-slate-400">Último Service - Kilometraje</span>
              <strong className="text-slate-900 dark:text-white font-mono">
                {vehiculo.ultKm ? `${Number(vehiculo.ultKm).toLocaleString('es-AR')} km` : 'Sin cargar'}
              </strong>
            </div>
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="block text-xs text-slate-500 dark:text-slate-400">Próximo Service - Fecha</span>
              <strong className="text-slate-900 dark:text-white">{vehiculo.proxFecha || 'Sin cargar'}</strong>
            </div>
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="block text-xs text-slate-500 dark:text-slate-400">Próximo Service - Kilometraje</span>
              <strong className="text-slate-900 dark:text-white font-mono">
                {vehiculo.proxKm ? `${Number(vehiculo.proxKm).toLocaleString('es-AR')} km` : 'Sin cargar'}
              </strong>
            </div>
          </div>

          {vehiculo.obs && (
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <span className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Observaciones generales:
              </span>
              <p className="text-slate-800 dark:text-slate-200">{vehiculo.obs}</p>
            </div>
          )}
        </div>

        {/* Historial de Mantenimientos del Móvil */}
        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-200 dark:border-slate-700 mb-3 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Historial de Mantenimientos ({misMantenimientos.length})</span>
          </h2>

          {misMantenimientos.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-2.5 font-semibold">Fecha</th>
                    <th className="p-2.5 font-semibold">Km</th>
                    <th className="p-2.5 font-semibold">Categoría</th>
                    <th className="p-2.5 font-semibold">Trabajo realizado</th>
                    <th className="p-2.5 font-semibold">Resultado</th>
                    <th className="p-2.5 font-semibold">Taller</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {misMantenimientos.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="p-2.5 whitespace-nowrap font-medium">{m.fecha}</td>
                      <td className="p-2.5 whitespace-nowrap font-mono">{Number(m.km).toLocaleString('es-AR')} km</td>
                      <td className="p-2.5">{m.categoria}</td>
                      <td className="p-2.5">{m.trabajo || '—'}</td>
                      <td className="p-2.5">{m.resultado}</td>
                      <td className="p-2.5">{m.taller || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
              No hay mantenimientos registrados aún para este móvil.
            </p>
          )}
        </div>

        {/* Historial de Inspecciones del Móvil */}
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-200 dark:border-slate-700 mb-3 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Historial de Inspecciones ({misInspecciones.length})</span>
          </h2>

          {misInspecciones.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-2.5 font-semibold">Fecha</th>
                    <th className="p-2.5 font-semibold">Km</th>
                    <th className="p-2.5 font-semibold">Inspector</th>
                    <th className="p-2.5 font-semibold">Novedades / Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {misInspecciones.map((i) => (
                    <tr key={i.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="p-2.5 whitespace-nowrap font-medium">{i.fecha}</td>
                      <td className="p-2.5 whitespace-nowrap font-mono">{i.km ? `${Number(i.km).toLocaleString('es-AR')} km` : '—'}</td>
                      <td className="p-2.5">{i.inspector || '—'}</td>
                      <td className="p-2.5">{i.obs || 'Sin novedades'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
              No hay inspecciones registradas aún para este móvil.
            </p>
          )}
        </div>

        {/* Pie de Ficha */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Ficha oficial generada el {getTodayDateString()}</span>
          <span className="font-semibold text-[#102b59] dark:text-slate-300">
            Desarrollado por: Menvielle Juan Manuel
          </span>
        </div>
      </div>
    </div>
  );
};
