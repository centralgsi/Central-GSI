import React, { useEffect, useState } from 'react';
import { RefreshCw, Moon, Sun, LogOut, Radio, User } from 'lucide-react';
import { UserSession } from '../types';

interface HeaderProps {
  user: UserSession;
  onLogout: () => void;
  lastUpdated: number;
  onManualSync: () => Promise<void>;
  isSyncing: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  lastUpdated,
  onManualSync,
  isSyncing,
  theme,
  onToggleTheme,
}) => {
  const [fechaTexto, setFechaTexto] = useState('');
  const [horaTexto, setHoraTexto] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      try {
        const fechaFormateada = new Intl.DateTimeFormat('es-AR', {
          timeZone: 'America/Argentina/Cordoba',
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }).format(now);
        setFechaTexto(fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1));

        const horaFormateada = new Intl.DateTimeFormat('es-AR', {
          timeZone: 'America/Argentina/Cordoba',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(now);
        setHoraTexto(horaFormateada);
      } catch {
        setFechaTexto(now.toLocaleDateString());
        setHoraTexto(now.toLocaleTimeString());
      }
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatLastSync = (ts: number) => {
    if (!ts) return 'Reciente';
    try {
      const d = new Date(ts);
      return new Intl.DateTimeFormat('es-AR', {
        timeZone: 'America/Argentina/Cordoba',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(d);
    } catch {
      return new Date(ts).toLocaleTimeString();
    }
  };

  return (
    <header className="bg-[#102b59] dark:bg-[#09182d] text-white px-4 md:px-6 py-3.5 shadow-md flex flex-wrap items-center justify-between gap-4 border-b border-white/10 transition-colors">
      <div className="flex items-center gap-3.5">
        <div className="bg-white p-1.5 rounded-lg shadow-sm border border-white/20 shrink-0">
          <img
            src="/gsi-logo.png"
            alt="Logo GSI"
            className="h-10 md:h-12 w-auto object-contain"
          />
        </div>
        <div>
          <h1 className="text-base md:text-lg font-bold leading-tight tracking-tight text-white flex items-center gap-2">
            Gestión de Flota GSI
          </h1>
          <p className="text-xs text-blue-200/90 leading-tight">
            Vehículos · Mantenimiento · Inspecciones · Alertas
          </p>
        </div>
      </div>

      {/* Widget de Fecha y Hora de Argentina */}
      <div className="hidden lg:flex flex-col justify-center px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs">
        <span className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">
          Fecha y Hora Oficial
        </span>
        <div className="flex items-center gap-2 font-semibold text-white">
          <span>{fechaTexto || 'Cargando fecha...'}</span>
          <span className="text-blue-300">·</span>
          <span className="font-mono text-amber-300 font-bold">{horaTexto}</span>
        </div>
      </div>

      {/* Controles de Sincronización y Usuario */}
      <div className="flex items-center flex-wrap gap-2.5">
        {/* Indicador de sincronización en tiempo real */}
        <div
          title="Sincronización en vivo entre todas las computadoras conectadas"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-medium"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="hidden sm:inline">En vivo</span>
          <span className="text-[11px] text-emerald-400/80">({formatLastSync(lastUpdated)})</span>
          <button
            onClick={onManualSync}
            disabled={isSyncing}
            title="Forzar actualización ahora"
            className="ml-1 text-emerald-300 hover:text-white transition-colors focus:outline-none"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Badge de Usuario Actual */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs font-medium text-white">
          <User className="w-3.5 h-3.5 text-blue-300" />
          <span>{user.nombre}</span>
        </div>

        {/* Modo Día / Noche */}
        <button
          onClick={onToggleTheme}
          type="button"
          aria-label="Cambiar tema día/noche"
          className="no-print p-2 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-all text-xs font-medium flex items-center gap-1.5 cursor-pointer border border-white/15"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-300" />
              <span className="hidden md:inline">Día</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-blue-200" />
              <span className="hidden md:inline">Noche</span>
            </>
          )}
        </button>

        {/* Cerrar Sesión */}
        <button
          onClick={onLogout}
          type="button"
          className="no-print px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 active:bg-red-700 text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm border border-red-500/40"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
};
