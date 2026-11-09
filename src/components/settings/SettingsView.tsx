import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Settings,
  Key,
  Tag,
  Edit2,
  AlertTriangle,
  RotateCcw,
  X,
  Link as LinkIcon,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AppSetting } from '../../types';
import { settingsService, parseValueArrayItem } from '../../services/settings.service';
import { SettingCard } from './SettingCard';
import { SettingFormModal } from './SettingFormModal';

interface SettingsViewProps {
  onNotify?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onNotify }) => {
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtro de búsqueda
  const [searchTerm, setSearchTerm] = useState('');

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [settingToEdit, setSettingToEdit] = useState<AppSetting | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await settingsService.getSettings(searchTerm);
      if (res.error) {
        setError(res.error);
        if (onNotify) onNotify('error', res.error);
      } else {
        setSettings(res.data);
      }
    } catch (err: any) {
      const msg = err.message || 'Error al cargar configuraciones';
      setError(msg);
      if (onNotify) onNotify('error', msg);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, onNotify]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setSettingToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (st: AppSetting) => {
    setSettingToEdit(st);
    setIsFormOpen(true);
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const renderValuePreview = (val: string) => {
    const isBool = val?.toLowerCase() === 'true' || val?.toLowerCase() === 'false';
    const isTrue = val?.toLowerCase() === 'true';
    const isUrl = val?.startsWith('http://') || val?.startsWith('https://');

    if (isBool) {
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
            isTrue
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-rose-100 text-rose-800 border border-rose-300'
          }`}
        >
          {isTrue ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          <span>{val}</span>
        </span>
      );
    }

    if (isUrl) {
      return (
        <a
          href={val}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 hover:underline font-mono text-xs truncate max-w-xs"
          title={val}
        >
          <LinkIcon className="w-3 h-3 shrink-0" />
          <span className="truncate">{val}</span>
        </a>
      );
    }

    return (
      <span className="font-mono text-xs font-bold text-gray-900 truncate max-w-sm block" title={val}>
        {val || <span className="text-gray-400 italic font-normal">vacío</span>}
      </span>
    );
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Control Bar: Búsqueda Compacta + Contador + Botón Agregar Configuración */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Izquierda: Buscador Compacto */}
        <div className="relative w-full sm:w-80 md:w-96 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por clave (key), valor o descripción..."
            className="w-full pl-9 pr-8 py-2 bg-gray-50/80 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-700 cursor-pointer transition-colors"
              title="Borrar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Derecha: Contador Reubicado + Botón Agregar Configuración */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
          <div className="text-xs text-gray-500 font-medium whitespace-nowrap">
            Total: <strong className="text-emerald-700 font-bold">{settings.length}</strong>{' '}
            <span className="hidden sm:inline">
              {settings.length === 1 ? 'parámetro' : 'parámetros'}
            </span>
            {searchTerm ? <span className="text-gray-400 text-[11px] ml-1">(filtrado)</span> : null}
          </div>

          {isAdmin && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm shadow-emerald-200 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Configuración</span>
            </button>
          )}
        </div>
      </div>

      {/* Contenido Principal */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-9 h-9 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-xs sm:text-sm font-medium">Cargando configuraciones desde Supabase...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-center max-w-lg mx-auto shadow-xs">
          <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
          <h3 className="text-gray-900 font-bold text-base mb-1">Error al consultar app_settings</h3>
          <p className="text-gray-600 text-xs mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : settings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 shadow-xs max-w-md mx-auto">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-gray-900 font-bold text-base mb-1">Sin configuraciones</h3>
          <p className="text-gray-500 text-xs mb-4 leading-relaxed">
            No se encontraron parámetros que coincidan con la búsqueda.
          </p>
          {searchTerm ? (
            <button
              onClick={() => setSearchTerm('')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl border border-gray-300 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer búsqueda</span>
            </button>
          ) : (
            isAdmin && (
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Crear primer parámetro</span>
              </button>
            )
          )}
        </div>
      ) : (
        <>
          {/* Vista Móvil y Tablet: Tarjetas (visible en < lg) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
            {settings.map((setting) => (
              <SettingCard
                key={setting.key}
                setting={setting}
                onEdit={handleOpenEdit}
              />
            ))}
          </div>

          {/* Vista Desktop: Tabla Optimizada Sin Scroll Horizontal (visible en lg+) */}
          <div className="hidden lg:block bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs table-fixed">
              <thead className="bg-slate-50 border-b border-gray-200 text-gray-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-6 w-5/12">Parámetro / Clave (key)</th>
                  <th className="py-3.5 px-4 w-4/12">Valor y Arreglo</th>
                  <th className="py-3.5 px-4 w-2/12 text-center">Actualizado</th>
                  <th className="py-3.5 px-6 w-1/12 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {settings.map((setting) => {
                  const arrayItems = Array.isArray(setting.value_array) ? setting.value_array : [];

                  return (
                    <tr key={setting.key} className="hover:bg-slate-50/80 transition-colors group">
                      {/* CELDA 1: Clave (key) destacada + Descripción */}
                      <td className="py-3.5 px-6">
                        <div className="space-y-1">
                          {/* Línea 1: Clave (key) */}
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1.5 font-mono text-xs font-black text-emerald-900 bg-emerald-50/90 px-2.5 py-1 rounded-lg border border-emerald-200/80 truncate">
                              <Key className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span className="truncate">{setting.key}</span>
                            </span>
                          </div>

                          {/* Línea 2: Descripción con ellipsis */}
                          {setting.description ? (
                            <p
                              className="text-[11px] text-gray-500 font-normal truncate max-w-md pl-0.5"
                              title={setting.description}
                            >
                              {setting.description}
                            </p>
                          ) : (
                            <p className="text-[11px] text-gray-300 italic font-normal pl-0.5">
                              Sin descripción registrada
                            </p>
                          )}
                        </div>
                      </td>

                      {/* CELDA 2: Valor Actual y Previa de value_array */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          {/* Línea 1: Valor principal */}
                          <div>{renderValuePreview(setting.value)}</div>

                          {/* Línea 2: Previa de Arreglo (value_array) */}
                          {arrayItems.length > 0 ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                                <Tag className="w-2.5 h-2.5 text-emerald-600" />
                                <span>Arreglo ({arrayItems.length}):</span>
                              </span>
                              {arrayItems.slice(0, 2).map((item, idx) => {
                                const parsed = parseValueArrayItem(item);
                                return (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-gray-700 font-mono text-[10px] truncate max-w-[140px]"
                                    title={item}
                                  >
                                    {parsed.display}
                                  </span>
                                );
                              })}
                              {arrayItems.length > 2 && (
                                <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold border border-emerald-200">
                                  +{arrayItems.length - 2}
                                </span>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </td>

                      {/* CELDA 3: Fecha de Actualización */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1 text-[11px] text-gray-600 font-medium">
                          <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="truncate">{formatDate(setting.updated_at)}</span>
                        </div>
                      </td>

                      {/* CELDA 4: Acciones (Solo Editar - SIN BOTÓN DE ELIMINAR) */}
                      <td className="py-3.5 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(setting)}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition-colors cursor-pointer"
                          title="Editar Configuración"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal Formulario de Creación y Edición */}
      <SettingFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        settingToEdit={settingToEdit}
        onSaved={loadData}
        onNotify={onNotify || (() => {})}
      />
    </div>
  );
};

