import React, { useState, useEffect, useRef } from 'react';
import {
  Cloud,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Upload,
  Download,
  Trash2,
  ExternalLink,
  RefreshCw,
  FolderOpen,
  FileText,
  FileCode,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  signInWithGoogleDrive,
  getDriveAccessToken,
  logoutGoogleDrive,
  initDriveAuth,
  listGsiDriveFiles,
  uploadFileToDrive,
  downloadDriveFile,
  deleteDriveFile,
  DriveFileItem,
} from '../services/googleDrive';
import { FlotaData, UserSession, getTodayDateString } from '../types';
import { formatVehicleName } from '../services/api';

interface GoogleDriveManagerProps {
  data: FlotaData;
  user: UserSession;
  onRestoreFromBackup: (backup: FlotaData) => Promise<void>;
}

export const GoogleDriveManager: React.FC<GoogleDriveManagerProps> = ({
  data,
  user,
  onRestoreFromBackup,
}) => {
  const isLogistica = user.rol === 'logistica';
  const [googleUser, setGoogleUser] = useState<any | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Modal de confirmación para operaciones destructivas
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionType: 'delete' | 'restore';
    targetFile?: DriveFileItem;
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionType: 'delete',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inicializar estado de autenticación con Google
  useEffect(() => {
    const unsubscribe = initDriveAuth(
      (u, token) => {
        setGoogleUser(u);
        setAccessToken(token);
        loadFiles(token);
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
        setFiles([]);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const showStatus = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const loadFiles = async (token?: string) => {
    const activeToken = token || accessToken;
    if (!activeToken) return;

    setLoadingFiles(true);
    try {
      const items = await listGsiDriveFiles(activeToken);
      setFiles(items);
    } catch (err: any) {
      console.error('Error al cargar archivos de Drive:', err);
      showStatus('Error al conectar con Google Drive. Reautentique si es necesario.', 'error');
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleConnectGoogle = async () => {
    setLoading(true);
    try {
      const res = await signInWithGoogleDrive();
      if (res) {
        setGoogleUser(res.user);
        setAccessToken(res.accessToken);
        showStatus('Conexión con Google Drive establecida exitosamente.', 'success');
        loadFiles(res.accessToken);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      showStatus('No se pudo conectar con Google Drive: ' + (err.message || 'Error de autenticación'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    await logoutGoogleDrive();
    setGoogleUser(null);
    setAccessToken(null);
    setFiles([]);
    showStatus('Sesión de Google Drive cerrada.', 'info');
  };

  // 1. Guardar Respaldo JSON en Google Drive
  const handleSaveJsonBackupToDrive = async () => {
    const token = await getDriveAccessToken();
    if (!token) {
      showStatus('Debe conectar su cuenta de Google Drive primero.', 'error');
      return;
    }

    setLoading(true);
    const hoy = getTodayDateString();
    const fileName = `GSI_Respaldo_Flota_${hoy}_${Date.now()}.json`;
    const content = JSON.stringify(data, null, 2);

    try {
      await uploadFileToDrive(
        token,
        fileName,
        content,
        'application/json',
        `Respaldo completo de la base de datos de flota GSI del ${hoy}`
      );
      showStatus(`Respaldo "${fileName}" guardado en Google Drive.`, 'success');
      loadFiles(token);
    } catch (err: any) {
      showStatus('Error al subir respaldo a Google Drive: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 2. Exportar Excel directamente a Google Drive
  const handleExportExcelToDrive = async () => {
    const token = await getDriveAccessToken();
    if (!token) {
      showStatus('Debe conectar su cuenta de Google Drive primero.', 'error');
      return;
    }

    setLoading(true);
    const hoy = getTodayDateString();
    const fileName = `GSI_Flota_Completa_${hoy}.xlsx`;

    try {
      const getVName = (id: string) => {
        const v = data.vehiculos.find((veh) => veh.id === id);
        return formatVehicleName(v);
      };

      const flotaRows = data.vehiculos.map((v) => ({
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

      const mantRows = data.mantenimientos.map((m) => ({
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

      const inspRows = data.inspecciones.map((r) => ({
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

      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const excelBlob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      await uploadFileToDrive(
        token,
        fileName,
        excelBlob,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        `Planilla de control de flota generada el ${hoy}`
      );

      showStatus(`Planilla Excel "${fileName}" subida a Google Drive.`, 'success');
      loadFiles(token);
    } catch (err: any) {
      showStatus('Error al exportar Excel a Google Drive: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 3. Subir archivo seleccionado a Drive
  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const runUpload = async () => {
      const token = await getDriveAccessToken();
      if (!token) {
        showStatus('Debe conectar su cuenta de Google Drive primero.', 'error');
        return;
      }

      setLoading(true);
      try {
        await uploadFileToDrive(
          token,
          file.name,
          file,
          file.type || 'application/octet-stream',
          'Documento adjunto subido desde Gestión de Flota GSI'
        );
        showStatus(`Archivo "${file.name}" subido a Google Drive.`, 'success');
        loadFiles(token);
      } catch (err: any) {
        showStatus('Error al subir archivo a Drive: ' + err.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    runUpload();
    e.target.value = '';
  };

  // Solicitar confirmación para eliminar archivo de Drive (Obligatorio por la política de seguridad)
  const promptDeleteFile = (file: DriveFileItem) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Eliminar archivo de Google Drive?',
      description: `¿Estás seguro de que deseas eliminar permanentemente el archivo "${file.name}" de tu Google Drive? Esta acción no se puede deshacer.`,
      actionType: 'delete',
      targetFile: file,
    });
  };

  // Solicitar confirmación para restaurar base de datos desde Drive
  const promptRestoreFromDrive = (file: DriveFileItem) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Restaurar respaldo desde Google Drive?',
      description: `Se descargarán los datos del respaldo "${file.name}" y se sobreescribirá la base de datos central de la flota. Todas las computadoras conectadas recibirán la actualización inmediatamente.`,
      actionType: 'restore',
      targetFile: file,
    });
  };

  const handleExecuteConfirmedAction = async () => {
    const file = confirmModal.targetFile;
    if (!file) return;

    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    const token = await getDriveAccessToken();
    if (!token) return;

    setLoading(true);
    try {
      if (confirmModal.actionType === 'delete') {
        await deleteDriveFile(token, file.id);
        showStatus(`Archivo "${file.name}" eliminado de Google Drive.`, 'success');
        loadFiles(token);
      } else if (confirmModal.actionType === 'restore') {
        const contentStr = await downloadDriveFile(token, file.id);
        const parsedData = JSON.parse(contentStr);
        await onRestoreFromBackup(parsedData);
        showStatus(`Base de datos restaurada exitosamente desde "${file.name}".`, 'success');
      }
    } catch (err: any) {
      showStatus('Error al realizar la operación: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return '—';
    const num = Number(bytes);
    if (isNaN(num)) return '—';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string, name: string) => {
    if (mimeType.includes('spreadsheet') || name.endsWith('.xlsx')) {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
    }
    if (mimeType.includes('json') || name.endsWith('.json')) {
      return <FileCode className="w-4 h-4 text-blue-600" />;
    }
    return <FileText className="w-4 h-4 text-amber-600" />;
  };

  return (
    <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
      {/* Cabecera del Módulo Google Drive */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-800">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Integración con Google Drive</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-semibold">
                Nube GSI
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Almacená respaldos, exportaciones de Excel y documentación de la flota directamente en tu cuenta de Google Drive
            </p>
          </div>
        </div>

        {/* Estado de conexión */}
        <div>
          {googleUser ? (
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {googleUser.displayName || 'Usuario Google'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    {googleUser.email}
                  </div>
                </div>
              </div>
              <button
                onClick={handleDisconnectGoogle}
                className="ml-2 text-xs text-slate-500 hover:text-red-600 dark:hover:text-red-400 underline cursor-pointer"
              >
                Desconectar
              </button>
            </div>
          ) : (
            /* Botón oficial de Sign In with Google */
            <button
              onClick={handleConnectGoogle}
              disabled={loading}
              className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-semibold text-xs rounded-xl border border-slate-300 dark:border-slate-700 hover:shadow-md transition-all cursor-pointer shadow-xs disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                ></path>
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                ></path>
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                ></path>
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                ></path>
              </svg>
              <span>{loading ? 'Conectando...' : 'Conectar con Google Drive'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mensajes de Estado */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : statusMessage.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Acciones principales de Google Drive */}
      {googleUser && isLogistica && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Guardar Respaldo JSON */}
          <button
            onClick={handleSaveJsonBackupToDrive}
            disabled={loading}
            className="text-left p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all flex flex-col justify-between gap-2.5 cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 text-blue-700 dark:text-blue-300">
              <Upload className="w-4 h-4" />
              <strong className="text-xs font-bold uppercase tracking-wider">
                Guardar Respaldo en Drive
              </strong>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Genera un archivo JSON con toda la base de datos de la flota y lo almacena de forma segura en tu Google Drive.
            </p>
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 group-hover:underline">
              Subir respaldo ahora →
            </span>
          </button>

          {/* Exportar Excel */}
          <button
            onClick={handleExportExcelToDrive}
            disabled={loading}
            className="text-left p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-all flex flex-col justify-between gap-2.5 cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-300">
              <FileSpreadsheet className="w-4 h-4" />
              <strong className="text-xs font-bold uppercase tracking-wider">
                Exportar Excel a Drive
              </strong>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Crea y sube una planilla Excel multi-hoja (Flota, Mantenimientos e Inspecciones) a la carpeta de GSI en tu Drive.
            </p>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 group-hover:underline">
              Subir planilla Excel →
            </span>
          </button>

          {/* Subir archivo adjunto a Drive */}
          <div className="text-left p-4 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/30 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-all flex flex-col justify-between gap-2.5">
            <div className="flex items-center gap-2.5 text-purple-700 dark:text-purple-300">
              <FolderOpen className="w-4 h-4" />
              <strong className="text-xs font-bold uppercase tracking-wider">
                Subir Documentos a Drive
              </strong>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Subí fotos de móviles, facturas mecánicas, VTV, pólizas de seguro u órdenes de servicio a la carpeta de GSI.
            </p>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleCustomFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="text-xs font-semibold text-purple-700 dark:text-purple-400 hover:underline cursor-pointer"
              >
                Elegir archivo para subir →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Explorador de archivos en Google Drive */}
      {googleUser && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Carpeta de Flota en Google Drive ({files.length} archivos)</span>
            </h3>
            <button
              onClick={() => loadFiles()}
              disabled={loadingFiles}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingFiles ? 'animate-spin' : ''}`} />
              <span>Actualizar lista</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="p-3 font-semibold">Nombre del archivo</th>
                  <th className="p-3 font-semibold">Tamaño</th>
                  <th className="p-3 font-semibold">Modificado</th>
                  <th className="p-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {files.length > 0 ? (
                  files.map((file) => {
                    const isJsonBackup = file.name.endsWith('.json');
                    return (
                      <tr
                        key={file.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="p-3 flex items-center gap-2.5 font-medium">
                          {getFileIcon(file.mimeType, file.name)}
                          <span>{file.name}</span>
                        </td>
                        <td className="p-3 font-mono whitespace-nowrap">
                          {formatFileSize(file.size)}
                        </td>
                        <td className="p-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                          {file.modifiedTime
                            ? new Date(file.modifiedTime).toLocaleString('es-AR')
                            : '—'}
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {/* Ver en Drive */}
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
                                title="Abrir archivo en Google Drive"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Ver en Drive</span>
                              </a>
                            )}

                            {/* Restaurar base de datos si es JSON (Solo Logística) */}
                            {isJsonBackup && isLogistica && (
                              <button
                                onClick={() => promptRestoreFromDrive(file)}
                                className="px-2.5 py-1 text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 rounded-md border border-blue-200 dark:border-blue-800 cursor-pointer"
                                title="Restaurar toda la base de datos de flota desde este archivo"
                              >
                                Restaurar base
                              </button>
                            )}

                            {/* Eliminar archivo de Drive (Con Confirmación Obligatoria) */}
                            {isLogistica && (
                              <button
                                onClick={() => promptDeleteFile(file)}
                                className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-md cursor-pointer"
                                title="Eliminar archivo de Google Drive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400 italic">
                      {loadingFiles
                        ? 'Cargando archivos de Google Drive...'
                        : 'No se encontraron archivos en la carpeta de GSI en Google Drive. Subí un respaldo o planilla de Excel para comenzar.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Obligatorio de Confirmación para Operaciones Destructivas */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${
                  confirmModal.actionType === 'delete'
                    ? 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400'
                    : 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {confirmModal.title}
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {confirmModal.description}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirmedAction}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition-all cursor-pointer ${
                  confirmModal.actionType === 'delete'
                    ? 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                }`}
              >
                {confirmModal.actionType === 'delete' ? 'Sí, eliminar archivo' : 'Sí, restaurar datos'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
