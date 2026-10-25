import React, { useState } from 'react';
import {
  Search,
  Plus,
  FileDown,
  Printer,
  FileText,
  Edit2,
  Trash2,
  Filter,
} from 'lucide-react';
import { Vehiculo, UserSession, getServiceStatus } from '../types';

interface FlotaViewProps {
  vehiculos: Vehiculo[];
  user: UserSession;
  onSelectVehiculo: (v: Vehiculo) => void;
  onEditVehiculo: (v: Vehiculo) => void;
  onDeleteVehiculo: (id: string) => void;
  onNewVehiculo: () => void;
  onExportCSV: () => void;
}

export const FlotaView: React.FC<FlotaViewProps> = ({
  vehiculos,
  user,
  onSelectVehiculo,
  onEditVehiculo,
  onDeleteVehiculo,
  onNewVehiculo,
  onExportCSV,
}) => {
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const isLogistica = user.rol === 'logistica';

  const filtered = vehiculos.filter((v) => {
    const term = search.toLowerCase();
    const matchTerm =
      v.patente.toLowerCase().includes(term) ||
      v.interno.toLowerCase().includes(term) ||
      v.codigo.toLowerCase().includes(term) ||
      v.marca.toLowerCase().includes(term) ||
      v.modelo.toLowerCase().includes(term);

    const matchEstado = !filtroEstado || v.estado === filtroEstado;
    return matchTerm && matchEstado;
  });

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

  return (
    <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
      {/* Barra de título y acciones principales */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Índice de Vehículos de la Flota ({filtered.length} de {vehiculos.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control de dominios, internos, kilometrajes y estados operativos
          </p>
        </div>

        <div className="no-print flex items-center flex-wrap gap-2">
          {isLogistica && (
            <>
              <button
                onClick={onNewVehiculo}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#17469a] hover:bg-[#102b59] active:bg-[#0c2044] text-white rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo móvil</span>
              </button>

              <button
                onClick={onExportCSV}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg transition-all cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5 text-slate-500" />
                <span>Exportar CSV</span>
              </button>
            </>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="no-print flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por patente, móvil, código o marca..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            <option value="">Todos los estados</option>
            <option value="Operativo">Operativo</option>
            <option value="En mantenimiento">En mantenimiento</option>
            <option value="Fuera de servicio">Fuera de servicio</option>
          </select>
        </div>
      </div>

      {/* Tabla de Flota */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <tr>
              <th className="p-3 font-bold">Patente</th>
              <th className="p-3 font-semibold">Móvil / Interno</th>
              <th className="p-3 font-semibold">Código adicional</th>
              <th className="p-3 font-semibold">Marca / Modelo</th>
              <th className="p-3 font-semibold">Kilometraje actual</th>
              <th className="p-3 font-semibold">Estado</th>
              <th className="p-3 font-semibold">Próximo service</th>
              <th className="no-print p-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
            {filtered.length > 0 ? (
              filtered.map((v) => {
                const servState = getServiceStatus(v);
                return (
                  <tr
                    key={v.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {v.patente}
                    </td>
                    <td className="p-3 font-semibold text-blue-700 dark:text-blue-400 whitespace-nowrap">
                      {v.interno ? `Móvil ${v.interno}` : '—'}
                    </td>
                    <td className="p-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {v.codigo || '—'}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {v.marca || v.modelo ? `${v.marca} ${v.modelo}`.trim() : '—'}
                    </td>
                    <td className="p-3 font-mono font-medium whitespace-nowrap">
                      {v.km !== '' ? `${Number(v.km).toLocaleString('es-AR')} km` : '—'}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getPill(v.estado)}`}>
                        {v.estado}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getServicePill(
                          servState
                        )}`}
                      >
                        {servState}
                      </span>
                    </td>
                    <td className="no-print p-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectVehiculo(v)}
                          title="Abrir ficha individual para ver o imprimir"
                          className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-md transition-colors cursor-pointer"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {isLogistica && (
                          <>
                            <button
                              onClick={() => onEditVehiculo(v)}
                              title="Editar vehículo"
                              className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => onDeleteVehiculo(v.id)}
                              title="Eliminar vehículo"
                              className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-md transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500 dark:text-slate-400 italic">
                  No se encontraron móviles con el filtro aplicado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
