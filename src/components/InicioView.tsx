import React from 'react';
import {
  Truck,
  AlertOctagon,
  Clock,
  ClipboardList,
  ChevronRight,
  Info,
  Wrench,
  CheckCircle2,
} from 'lucide-react';
import { Vehiculo, Mantenimiento, Inspeccion, UserSession, getServiceStatus } from '../types';
import { formatVehicleName } from '../services/api';

interface InicioViewProps {
  vehiculos: Vehiculo[];
  mantenimientos: Mantenimiento[];
  inspecciones: Inspeccion[];
  user: UserSession;
  onSelectVehiculo: (v: Vehiculo) => void;
  onGoToFlota: () => void;
  onGoToAlertas: () => void;
}

export const InicioView: React.FC<InicioViewProps> = ({
  vehiculos,
  mantenimientos,
  inspecciones,
  user,
  onSelectVehiculo,
  onGoToFlota,
  onGoToAlertas,
}) => {
  const isLogistica = user.rol === 'logistica';

  const vencidos = vehiculos.filter((v) => getServiceStatus(v) === 'Vencido');
  const proximos = vehiculos.filter((v) => getServiceStatus(v) === 'Próximo');

  const getPill = (status: string) => {
    switch (status) {
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

  const getServicePill = (status: string) => {
    switch (status) {
      case 'Vencido':
        return 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900';
      case 'Próximo':
        return 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900';
      default:
        return 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900';
    }
  };

  // Móviles que requieren atención (vencidos primero, luego próximos)
  const listaAtencion = [...vencidos, ...proximos];

  return (
    <div className="space-y-6">
      {/* Tarjetas de Estadísticas Principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div
          onClick={onGoToFlota}
          className="p-4 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Vehículos en Flota
            </span>
            <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <strong className="block text-2xl md:text-3xl font-extrabold text-[#102b59] dark:text-white mt-2 font-mono">
            {vehiculos.length}
          </strong>
        </div>

        <div
          onClick={onGoToAlertas}
          className="p-4 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-red-400 dark:hover:border-red-600 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Services Vencidos
            </span>
            <AlertOctagon className="w-4 h-4 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform" />
          </div>
          <strong className="block text-2xl md:text-3xl font-extrabold text-red-600 dark:text-red-400 mt-2 font-mono">
            {vencidos.length}
          </strong>
        </div>

        <div
          onClick={onGoToAlertas}
          className="p-4 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Services Próximos
            </span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <strong className="block text-2xl md:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-2 font-mono">
            {proximos.length}
          </strong>
        </div>

        <div className="p-4 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Inspecciones
            </span>
            <ClipboardList className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <strong className="block text-2xl md:text-3xl font-extrabold text-[#102b59] dark:text-white mt-2 font-mono">
            {inspecciones.length}
          </strong>
        </div>
      </div>

      {/* Panel Informativo de Control */}
      <div className="p-4 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900 rounded-xl text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">
            Sistema central de la Guardia de Seguridad Institucional (GSI)
          </p>
          <p className="text-blue-800/90 dark:text-blue-300">
            Todos los cambios que se realicen en cualquier computadora se sincronizan automáticamente en tiempo real. Seleccioná cualquier móvil para consultar o imprimir su ficha individual.
          </p>
        </div>
      </div>

      {/* Cuadrícula de Móviles para consultar Ficha */}
      <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Móviles de la Flota ({vehiculos.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hacé clic en cualquier tarjeta para ver su ficha individual e imprimirla
            </p>
          </div>
          <button
            onClick={onGoToFlota}
            className="text-xs font-semibold text-[#17469a] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Ver índice en tabla</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 mt-4">
          {vehiculos.map((v) => {
            const servState = getServiceStatus(v);
            return (
              <button
                key={v.id}
                onClick={() => onSelectVehiculo(v)}
                className="text-left p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between gap-3 group cursor-pointer border-t-4 border-t-[#17469a] dark:border-t-blue-500"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    <span>Ficha del móvil</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] border ${getPill(v.estado)}`}>
                      {v.estado}
                    </span>
                  </div>
                  <strong className="block text-lg font-bold text-[#102b59] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {v.interno ? `Móvil ${v.interno}` : v.patente}
                  </strong>
                  <div className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                    {v.patente} {v.codigo ? `· Cód: ${v.codigo}` : ''}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400 font-mono">
                    {v.km !== '' ? `${Number(v.km).toLocaleString('es-AR')} km` : 'Km s/c'}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getServicePill(
                      servState
                    )}`}
                  >
                    {servState}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Próximos Services y Vencimientos */}
      <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Próximos Services y Vencimientos
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Móviles con service vencido o programado dentro de los próximos 30 días o 1.000 km
            </p>
          </div>
          <button
            onClick={onGoToAlertas}
            className="text-xs font-semibold text-[#17469a] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Ver todas las alertas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {listaAtencion.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {listaAtencion.map((v) => {
              const servState = getServiceStatus(v);
              return (
                <div
                  key={v.id}
                  onClick={() => onSelectVehiculo(v)}
                  className="py-3 flex flex-wrap items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold border ${getServicePill(
                        servState
                      )}`}
                    >
                      {servState}
                    </span>
                    <div>
                      <strong className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatVehicleName(v)}
                      </strong>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                        <span>Próx. fecha: {v.proxFecha || 'Sin cargar'}</span>
                        <span>·</span>
                        <span className="font-mono">
                          Próx. km:{' '}
                          {v.proxKm ? `${Number(v.proxKm).toLocaleString('es-AR')} km` : 'Sin cargar'}
                        </span>
                        <span>·</span>
                        <span className="font-mono">
                          Km actual:{' '}
                          {v.km ? `${Number(v.km).toLocaleString('es-AR')} km` : 'Sin cargar'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                    Ver ficha →
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
            No hay services próximos ni vencidos en este momento. Verificá que cada móvil tenga cargada su próxima fecha o kilometraje.
          </div>
        )}
      </div>

      {/* Últimos mantenimientos registrados (Para Logística) */}
      {isLogistica && (
        <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Últimos Mantenimientos Registrados</span>
            </h2>
          </div>

          {mantenimientos.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {mantenimientos.slice(0, 5).map((m) => {
                const veh = vehiculos.find((v) => v.id === m.vehiculo);
                return (
                  <div key={m.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {m.fecha}
                      </span>{' '}
                      <span className="text-slate-500 dark:text-slate-400">·</span>{' '}
                      <span className="font-semibold text-blue-700 dark:text-blue-300">
                        {formatVehicleName(veh)}
                      </span>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                        {m.categoria} — {m.trabajo || 'Sin detalle de trabajo'}
                      </p>
                    </div>
                    <span className="font-mono text-slate-600 dark:text-slate-400">
                      {Number(m.km).toLocaleString('es-AR')} km
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
              Aún no se han registrado mantenimientos en el sistema.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
