import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { LoginScreen } from './components/LoginScreen';
import { InicioView } from './components/InicioView';
import { FlotaView } from './components/FlotaView';
import { FichaVehiculo } from './components/FichaVehiculo';
import { MantenimientoView } from './components/MantenimientoView';
import { InspeccionView } from './components/InspeccionView';
import { AlertasView } from './components/AlertasView';
import { CargaRapidaView } from './components/CargaRapidaView';
import { GoogleDriveManager } from './components/GoogleDriveManager';
import { VehiculoModal } from './components/VehiculoModal';
import {
  Vehiculo,
  Mantenimiento,
  Inspeccion,
  UserSession,
  FlotaData,
  getServiceStatus,
} from './types';
import {
  fetchFlotaData,
  saveVehiculo,
  deleteVehiculo,
  saveMantenimiento,
  deleteMantenimiento,
  saveInspeccion,
  deleteInspeccion,
  restoreBackup,
  exportToExcel,
  exportBackupJSON,
  exportCSV,
} from './services/api';
import { Wifi, Bell } from 'lucide-react';

const SESSION_KEY = 'gsi_user_session_v2';
const THEME_KEY = 'gsi_app_theme';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      return stored === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const [data, setData] = useState<FlotaData>({
    vehiculos: [],
    mantenimientos: [],
    inspecciones: [],
    lastUpdated: 0,
  });

  const [currentTab, setCurrentTab] = useState<TabType>('inicio');
  const [selectedVehiculo, setSelectedVehiculo] = useState<Vehiculo | null>(null);
  const [modalVehiculoOpen, setModalVehiculoOpen] = useState(false);
  const [vehiculoToEdit, setVehiculoToEdit] = useState<Vehiculo | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [remoteNotification, setRemoteNotification] = useState<string | null>(null);

  // Aplicar tema día / noche al elemento html
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Carga inicial de datos desde el servidor
  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setIsSyncing(true);
    try {
      const serverData = await fetchFlotaData();
      setData(serverData);
    } catch (err) {
      console.error('Error fetching central data:', err);
    } finally {
      if (isManual) setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Suscripción SSE para recibir cambios en tiempo real desde otras terminales (PCs / móviles)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/events');

        eventSource.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'update' && payload.data) {
              setData(payload.data);
              setRemoteNotification(payload.action || 'Datos actualizados desde otra terminal');
              setTimeout(() => setRemoteNotification(null), 5000);
            }
          } catch (e) {
            console.error('SSE parse error:', e);
          }
        };

        eventSource.onerror = () => {
          eventSource?.close();
          // Reconectar en 5 segundos
          reconnectTimeout = setTimeout(connectSSE, 5000);
        };
      } catch (err) {
        console.error('SSE connection failed:', err);
      }
    };

    connectSSE();

    // Fallback polling suave cada 8 segundos por si SSE se bloquea en algún proxy
    const pollInterval = setInterval(() => {
      fetchFlotaData()
        .then((fresh) => {
          setData((prev) => {
            if (fresh.lastUpdated > prev.lastUpdated) {
              return fresh;
            }
            return prev;
          });
        })
        .catch(() => {});
    }, 8000);

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      clearInterval(pollInterval);
      eventSource?.close();
    };
  }, []);

  const handleLoginSuccess = (user: UserSession) => {
    setSession(user);
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } catch {}
    loadData(true);
  };

  const handleLogout = () => {
    setSession(null);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {}
  };

  // Acciones sobre Vehículos
  const handleSaveVehiculo = async (v: Vehiculo) => {
    const res = await saveVehiculo(v);
    if (res.success) {
      setData((prev) => ({ ...prev, vehiculos: res.vehiculos, lastUpdated: Date.now() }));
      if (selectedVehiculo && selectedVehiculo.id === v.id) {
        setSelectedVehiculo(v);
      }
    }
  };

  const handleDeleteVehiculo = async (id: string) => {
    if (!confirm('¿Eliminar este vehículo de la flota? Los registros históricos quedarán conservados.')) {
      return;
    }
    const res = await deleteVehiculo(id);
    if (res.success) {
      setData((prev) => ({ ...prev, vehiculos: res.vehiculos, lastUpdated: Date.now() }));
      if (selectedVehiculo?.id === id) {
        setSelectedVehiculo(null);
        setCurrentTab('flota');
      }
    }
  };

  // Acciones sobre Mantenimientos
  const handleSaveMantenimiento = async (m: Mantenimiento) => {
    const res = await saveMantenimiento(m);
    if (res.success) {
      setData((prev) => ({
        ...prev,
        mantenimientos: res.mantenimientos,
        vehiculos: res.vehiculos,
        lastUpdated: Date.now(),
      }));
    }
  };

  const handleDeleteMantenimiento = async (id: string) => {
    const res = await deleteMantenimiento(id);
    if (res.success) {
      setData((prev) => ({
        ...prev,
        mantenimientos: res.mantenimientos,
        lastUpdated: Date.now(),
      }));
    }
  };

  // Acciones sobre Inspecciones
  const handleSaveInspeccion = async (i: Inspeccion) => {
    const res = await saveInspeccion(i);
    if (res.success) {
      setData((prev) => ({
        ...prev,
        inspecciones: res.inspecciones,
        vehiculos: res.vehiculos,
        lastUpdated: Date.now(),
      }));
    }
  };

  const handleDeleteInspeccion = async (id: string) => {
    const res = await deleteInspeccion(id);
    if (res.success) {
      setData((prev) => ({
        ...prev,
        inspecciones: res.inspecciones,
        lastUpdated: Date.now(),
      }));
    }
  };

  // Restaurar respaldo completo
  const handleRestoreBackup = async (backupData: FlotaData) => {
    const res = await restoreBackup(backupData);
    if (res.success && res.data) {
      setData(res.data);
    }
  };

  // Seleccionar móvil para ver Ficha
  const handleSelectVehiculo = (v: Vehiculo) => {
    setSelectedVehiculo(v);
    setCurrentTab('ficha');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Contar alertas activas (Vencidos + Próximos)
  const alertCount = data.vehiculos.filter((v) => getServiceStatus(v) !== 'Sin alerta').length;

  // Si no hay sesión iniciada, mostrar LoginScreen
  if (!session) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#eef2f7] dark:bg-[#0c1421] text-[#1d2939] dark:text-[#e6edf7] transition-colors">
      {/* Toast flotante cuando otra PC actualiza datos */}
      {remoteNotification && (
        <div className="no-print fixed top-4 right-4 z-50 bg-[#102b59] text-white px-4 py-2.5 rounded-xl shadow-xl border border-blue-400 flex items-center gap-2.5 animate-bounce text-xs font-semibold">
          <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{remoteNotification}</span>
        </div>
      )}

      {/* Cabecera Principal */}
      <Header
        user={session}
        onLogout={handleLogout}
        lastUpdated={data.lastUpdated}
        onManualSync={() => loadData(true)}
        isSyncing={isSyncing}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Contenedor Principal */}
      <main className="max-w-[1450px] w-full mx-auto p-4 md:p-6 flex-1">
        {/* Barra de Navegación de Pestañas */}
        <Navigation
          currentTab={currentTab}
          onTabChange={(tab) => {
            setCurrentTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          user={session}
          onExportExcel={() => exportToExcel(data)}
          onExportBackup={() => exportBackupJSON(data)}
          alertCount={alertCount}
        />

        {/* Vistas según pestaña activa */}
        {currentTab === 'inicio' && (
          <InicioView
            vehiculos={data.vehiculos}
            mantenimientos={data.mantenimientos}
            inspecciones={data.inspecciones}
            user={session}
            onSelectVehiculo={handleSelectVehiculo}
            onGoToFlota={() => setCurrentTab('flota')}
            onGoToAlertas={() => setCurrentTab('alertas')}
          />
        )}

        {currentTab === 'carga' && session.rol === 'logistica' && (
          <CargaRapidaView
            onOpenNuevoVehiculo={() => {
              setVehiculoToEdit(null);
              setModalVehiculoOpen(true);
            }}
            onGoToMantenimiento={() => setCurrentTab('mantenimiento')}
            onGoToInspecciones={() => setCurrentTab('inspecciones')}
            onGoToDrive={() => setCurrentTab('drive')}
            onRestoreBackup={handleRestoreBackup}
          />
        )}

        {currentTab === 'flota' && (
          <FlotaView
            vehiculos={data.vehiculos}
            user={session}
            onSelectVehiculo={handleSelectVehiculo}
            onEditVehiculo={(v) => {
              setVehiculoToEdit(v);
              setModalVehiculoOpen(true);
            }}
            onDeleteVehiculo={handleDeleteVehiculo}
            onNewVehiculo={() => {
              setVehiculoToEdit(null);
              setModalVehiculoOpen(true);
            }}
            onExportCSV={() => exportCSV('vehiculos', data)}
          />
        )}

        {currentTab === 'ficha' && selectedVehiculo && (
          <FichaVehiculo
            vehiculo={selectedVehiculo}
            mantenimientos={data.mantenimientos}
            inspecciones={data.inspecciones}
            user={session}
            onBack={() => setCurrentTab('inicio')}
            onEdit={(v) => {
              setVehiculoToEdit(v);
              setModalVehiculoOpen(true);
            }}
          />
        )}

        {currentTab === 'mantenimiento' && (
          <MantenimientoView
            vehiculos={data.vehiculos}
            mantenimientos={data.mantenimientos}
            user={session}
            onSaveMantenimiento={handleSaveMantenimiento}
            onDeleteMantenimiento={handleDeleteMantenimiento}
            onExportCSV={() => exportCSV('mantenimientos', data)}
          />
        )}

        {currentTab === 'inspecciones' && (
          <InspeccionView
            vehiculos={data.vehiculos}
            inspecciones={data.inspecciones}
            user={session}
            onSaveInspeccion={handleSaveInspeccion}
            onDeleteInspeccion={handleDeleteInspeccion}
            onExportCSV={() => exportCSV('inspecciones', data)}
          />
        )}

        {currentTab === 'alertas' && (
          <AlertasView
            vehiculos={data.vehiculos}
            onSelectVehiculo={handleSelectVehiculo}
          />
        )}

        {currentTab === 'drive' && (
          <GoogleDriveManager
            data={data}
            user={session}
            onRestoreFromBackup={handleRestoreBackup}
          />
        )}
      </main>

      {/* Modal para Agregar o Editar Vehículo */}
      <VehiculoModal
        isOpen={modalVehiculoOpen}
        onClose={() => setModalVehiculoOpen(false)}
        vehiculoToEdit={vehiculoToEdit}
        onSave={handleSaveVehiculo}
      />

      {/* Pie de página */}
      <footer className="text-center text-xs text-slate-500 dark:text-slate-400 py-6 border-t border-slate-200 dark:border-slate-800 transition-colors">
        <span className="block font-semibold text-[#102b59] dark:text-slate-200">
          Desarrollado por: Menvielle Juan Manuel
        </span>
        <span className="block text-[11px] text-slate-400 dark:text-slate-500 mt-1">
          Guardia de Seguridad Institucional (GSI) · Sistema Centralizado de Flota
        </span>
      </footer>
    </div>
  );
}
