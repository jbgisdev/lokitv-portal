import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Smartphone,
  CheckCircle2,
  XCircle,
  Shield,
  ShieldAlert,
  Flame,
  Edit2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  RotateCcw,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  installationsService,
  GetInstallationsResult,
} from '../../services/installations.service';
import { AppInstallation, InstallationFilterState } from '../../types';
import { InstallationCard } from './InstallationCard';
import { AliasModal } from './AliasModal';
import { DeviceDetailModal } from './DeviceDetailModal';
import { ConfirmModal } from '../common/ConfirmModal';

interface InstallationsViewProps {
  onNotify?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  onCountChange?: (count: number) => void;
}

interface PendingConfirmAction {
  type: 'toggle_active' | 'toggle_blocked';
  device: AppInstallation;
}

export const InstallationsView: React.FC<InstallationsViewProps> = ({ onNotify, onCountChange }) => {
  const { user, role, isAdmin } = useAuth();

  const [installations, setInstallations] = useState<AppInstallation[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Filters
  const [filters, setFilters] = useState<InstallationFilterState>({
    search: '',
    status: 'all',
    adultContent: 'all',
    company: 'all',
  });

  // Admin company list
  const [companiesList, setCompaniesList] = useState<{ code: string; name: string }[]>([]);

  // Action loading states tracking: Record<`deviceId-action`, boolean>
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Modals state
  const [editingDevice, setEditingDevice] = useState<AppInstallation | null>(null);
  const [detailDevice, setDetailDevice] = useState<AppInstallation | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmAction | null>(null);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);

  // Copied device ID state for table
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    if (isAdmin) {
      const list = await installationsService.getCompaniesList();
      setCompaniesList(list);
    }
  }, [isAdmin]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result: GetInstallationsResult = await installationsService.getInstallations({
        filter: filters,
        userRole: role,
        userCompanyCode: user?.code || null,
        page,
        pageSize,
      });

      if (result.error) {
        setError(result.error);
        if (onNotify) onNotify('error', result.error);
      } else {
        setInstallations(result.data);
        setTotalCount(result.totalCount);
        if (onCountChange) onCountChange(result.totalCount);
      }
    } catch (err: any) {
      const msg = err.message || 'Error al obtener instalaciones';
      setError(msg);
      if (onNotify) onNotify('error', msg);
    } finally {
      setIsLoading(false);
    }
  }, [filters, role, user?.code, page, pageSize, onNotify, onCountChange]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      adultContent: 'all',
      company: 'all',
    });
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
    setPage(1);
  };

  const isActionInProgress = (id: string, action: string) => {
    return !!actionLoading[`${id}-${action}`];
  };

  const setActionState = (id: string, action: string, loading: boolean) => {
    setActionLoading((prev) => ({
      ...prev,
      [`${id}-${action}`]: loading,
    }));
  };

  // Open confirmation for toggle active
  const requestToggleActive = (device: AppInstallation) => {
    setPendingConfirm({
      type: 'toggle_active',
      device,
    });
  };

  // Open confirmation for toggle blocked
  const requestToggleBlocked = (device: AppInstallation) => {
    setPendingConfirm({
      type: 'toggle_blocked',
      device,
    });
  };

  // Execute confirmed action
  const handleExecuteConfirm = async () => {
    if (!pendingConfirm) return;
    const { type, device } = pendingConfirm;
    setIsConfirming(true);

    if (type === 'toggle_active') {
      const currentState = device.is_active;
      setActionState(device.id, 'active', true);
      const res = await installationsService.toggleActive(device.id, currentState);
      setActionState(device.id, 'active', false);

      if (res.success) {
        setInstallations((prev) =>
          prev.map((item) => (item.id === device.id ? { ...item, is_active: !currentState } : item))
        );
        if (detailDevice?.id === device.id) {
          setDetailDevice((prev) => (prev ? { ...prev, is_active: !currentState } : null));
        }
        if (onNotify) {
          onNotify(
            'success',
            `Dispositivo ${!currentState ? 'activado' : 'desactivado'} con éxito.`
          );
        }
      } else {
        if (onNotify) onNotify('error', res.error || 'No se pudo actualizar el estado.');
      }
    } else if (type === 'toggle_blocked') {
      const currentState = device.is_blocked;
      const willBlock = !currentState;
      setActionState(device.id, 'blocked', true);
      const res = await installationsService.toggleBlocked(device.id, currentState);
      setActionState(device.id, 'blocked', false);

      if (res.success) {
        setInstallations((prev) =>
          prev.map((item) => (item.id === device.id ? { ...item, is_blocked: willBlock } : item))
        );
        if (detailDevice?.id === device.id) {
          setDetailDevice((prev) => (prev ? { ...prev, is_blocked: willBlock } : null));
        }
        if (onNotify) {
          onNotify(
            willBlock ? 'warning' : 'success',
            `Dispositivo ${willBlock ? 'bloqueado' : 'desbloqueado'} con éxito.`
          );
        }
      } else {
        if (onNotify) onNotify('error', res.error || 'Error al cambiar bloqueo.');
      }
    }

    setIsConfirming(false);
    setPendingConfirm(null);
  };

  // Toggle adult_content (direct toggle)
  const handleToggleAdultContent = async (id: string, currentState: boolean | null) => {
    const willEnable = !currentState;
    setActionState(id, 'adult', true);
    const res = await installationsService.toggleAdultContent(id, currentState);
    setActionState(id, 'adult', false);

    if (res.success) {
      setInstallations((prev) =>
        prev.map((item) => (item.id === id ? { ...item, adult_content: willEnable } : item))
      );
      if (detailDevice?.id === id) {
        setDetailDevice((prev) => (prev ? { ...prev, adult_content: willEnable } : null));
      }
      if (onNotify) {
        onNotify(
          'success',
          `Contenido adulto ${willEnable ? 'habilitado (+18)' : 'deshabilitado'} para este dispositivo.`
        );
      }
    } else {
      if (onNotify) onNotify('error', res.error || 'Error al actualizar contenido adulto.');
    }
  };

  // Save alias from modal
  const handleSaveAlias = async (id: string, newAlias: string): Promise<boolean> => {
    const res = await installationsService.updateAlias(id, newAlias);
    if (res.success) {
      setInstallations((prev) =>
        prev.map((item) => (item.id === id ? { ...item, alias: newAlias.trim() || null } : item))
      );
      if (detailDevice?.id === id) {
        setDetailDevice((prev) => (prev ? { ...prev, alias: newAlias.trim() || null } : null));
      }
      if (onNotify) onNotify('success', 'Alias actualizado correctamente.');
      return true;
    } else {
      if (onNotify) onNotify('error', res.error || 'Error al guardar el alias.');
      return false;
    }
  };

  const handleCopyId = (deviceId: string) => {
    navigator.clipboard.writeText(deviceId);
    setCopiedId(deviceId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    if (installations.length === 0) return;
    const headers = [
      'ID',
      'Device ID',
      'Alias',
      'Modelo',
      'Empresa',
      'App Version',
      'OS Version',
      'Activo',
      'Bloqueado',
      'Adult Content',
      'Ultima Conexion',
      'Fecha Registro',
    ];
    const rows = installations.map((d) => [
      d.id,
      d.device_id,
      d.alias || '',
      d.device_model || '',
      d.company || '',
      d.app_version || '',
      d.os_version || '',
      d.is_active ? 'Si' : 'No',
      d.is_blocked ? 'Si' : 'No',
      d.adult_content ? 'Si' : 'No',
      d.last_seen_at || '',
      d.created_at || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lokitv_instalaciones_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onNotify) onNotify('success', 'Archivo CSV exportado con éxito.');
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Control Bar: Filtros Compactos + Contador + Exportar CSV */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-200/90 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* Izquierda: Buscador Compacto + Selects */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
          {/* Buscador de ancho moderado */}
          <div className="relative w-full sm:w-60 md:w-64 shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={filters.search}
              onChange={handleSearchChange}
              placeholder="Buscar ID, modelo, alias..."
              className="w-full pl-9 pr-8 py-2 bg-gray-50/80 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => {
                  setFilters((prev) => ({ ...prev, search: '' }));
                  setPage(1);
                }}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-700 cursor-pointer transition-colors"
                title="Borrar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Selector Estado */}
          <div className="w-full sm:w-36 shrink-0">
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, status: e.target.value as any }));
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-gray-50/80 border border-gray-300 rounded-xl text-gray-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white cursor-pointer"
            >
              <option value="all">Estado: Todos</option>
              <option value="active">Solo Activos</option>
              <option value="inactive">Solo Inactivos</option>
              <option value="blocked">Bloqueados</option>
            </select>
          </div>

          {/* Selector Contenido Adulto */}
          <div className="w-full sm:w-36 shrink-0">
            <select
              value={filters.adultContent}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, adultContent: e.target.value as any }));
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-gray-50/80 border border-gray-300 rounded-xl text-gray-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white cursor-pointer"
            >
              <option value="all">Adulto: Todos</option>
              <option value="enabled">Con Adulto (+18)</option>
              <option value="disabled">Sin Adulto</option>
            </select>
          </div>

          {/* Selector Empresa (Solo Admin) */}
          {isAdmin && (
            <div className="w-full sm:w-44 shrink-0">
              <select
                value={filters.company}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, company: e.target.value }));
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-gray-50/80 border border-gray-300 rounded-xl text-gray-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white truncate cursor-pointer"
              >
                <option value="all">Empresa: Todas</option>
                {companiesList.map((comp) => (
                  <option key={comp.code} value={comp.code}>
                    {comp.name || comp.code}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Botón Explícito Limpiar Filtros */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl transition-all cursor-pointer shrink-0"
            title="Restablecer búsqueda y filtros a su estado inicial"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
            <span>Limpiar filtros</span>
          </button>
        </div>

        {/* Derecha: Contador Reubicado + Botón Exportar CSV */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 xl:pt-0 border-t xl:border-t-0 border-gray-100">
          <div className="text-xs text-gray-500 font-medium whitespace-nowrap">
            Total: <strong className="text-emerald-700 font-bold">{totalCount}</strong>{' '}
            <span className="hidden sm:inline">{totalCount === 1 ? 'dispositivo' : 'dispositivos'}</span>
            {filters.search || filters.status !== 'all' || filters.adultContent !== 'all' || filters.company !== 'all' ? (
              <span className="text-gray-400 text-[11px] ml-1">(filtrado)</span>
            ) : null}
          </div>

          <button
            onClick={handleExportCSV}
            disabled={installations.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl transition-all shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Main Content: Table on Desktop, Cards on Mobile */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-9 h-9 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-xs sm:text-sm font-medium">Consultando instalaciones en Supabase...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-center max-w-lg mx-auto shadow-xs">
          <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto mb-3" />
          <h3 className="text-gray-900 font-bold text-base mb-1">Error al consultar instalaciones</h3>
          <p className="text-gray-600 text-xs mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : installations.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 shadow-xs max-w-md mx-auto">
          <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-gray-900 font-bold text-base mb-1">Sin registros encontrados</h3>
          <p className="text-gray-500 text-xs mb-4 leading-relaxed">
            No se encontraron instalaciones que coincidan con los filtros seleccionados o para tu empresa.
          </p>
          {(filters.search || filters.status !== 'all' || filters.adultContent !== 'all' || filters.company !== 'all') && (
            <button
              onClick={() => {
                setFilters({ search: '', status: 'all', adultContent: 'all', company: 'all' });
                setPage(1);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl border border-gray-300 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer filtros</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* 1. Mobile & Tablet Card View (visible on < lg) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
            {installations.map((device) => (
              <InstallationCard
                key={device.id}
                device={device}
                onToggleActive={requestToggleActive}
                onToggleBlocked={requestToggleBlocked}
                onToggleAdultContent={handleToggleAdultContent}
                onEditAlias={(d) => setEditingDevice(d)}
                onViewDetails={(d) => setDetailDevice(d)}
                isActionLoading={isActionInProgress}
              />
            ))}
          </div>

          {/* 2. Desktop Full Table View with REDESIGNED UNIFIED "Dispositivo" column */}
          <div className="hidden lg:block bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-gray-200 text-gray-600 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="py-3.5 px-5">Dispositivo</th>
                    <th className="py-3.5 px-3">Empresa</th>
                    <th className="py-3.5 px-3">Última Conexión</th>
                    <th className="py-3.5 px-3 text-center">Estado</th>
                    <th className="py-3.5 px-3 text-center">Bloqueo</th>
                    <th className="py-3.5 px-3 text-center">Adulto</th>
                    <th className="py-3.5 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {installations.map((device) => {
                    const isBlocked = !!device.is_blocked;
                    const isActive = device.is_active;
                    const adultEnabled = !!device.adult_content;

                    return (
                      <tr
                        key={device.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* COLUMNA UNIFICADA: "Dispositivo" */}
                        {/* 1. Device ID en la parte superior con botón rápido de copiar */}
                        {/* 2. Debajo, Modelo del dispositivo (y alias amigable) */}
                        {/* 3. Debajo, Versión de la app y del SO */}
                        <td className="py-3.5 px-5">
                          <div className="space-y-1">
                            {/* Nivel 1: Device ID con botón de copiar */}
                            <div className="flex items-center gap-2">
                              <span
                                className="font-mono text-emerald-800 font-bold text-xs max-w-[200px] truncate select-all"
                                title={device.device_id}
                              >
                                {device.device_id}
                              </span>
                              <button
                                onClick={() => handleCopyId(device.device_id)}
                                className="text-gray-400 hover:text-emerald-700 p-1 rounded-md hover:bg-slate-100 transition-colors shrink-0"
                                title="Copiar Device ID"
                              >
                                {copiedId === device.device_id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            {/* Nivel 2: Modelo y Alias */}
                            <div className="flex items-center gap-1.5 text-gray-800 font-semibold text-xs">
                              <Smartphone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span className="truncate max-w-[220px]" title={device.alias || device.device_model || 'Genérico'}>
                                {device.alias ? `${device.alias} (${device.device_model || 'Genérico'})` : device.device_model || 'Modelo Genérico TV'}
                              </span>
                              <button
                                onClick={() => setEditingDevice(device)}
                                className="text-gray-400 hover:text-emerald-600 p-0.5 rounded transition-colors opacity-0 group-hover:opacity-100"
                                title="Editar Alias"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Nivel 3: Versión de la app y del SO */}
                            <div className="text-[11px] text-gray-500 font-medium">
                              App v{device.app_version || '1.0.0'} • SO: {device.os_version || 'Android'}
                            </div>
                          </div>
                        </td>

                        {/* Empresa */}
                        <td className="py-3.5 px-3">
                          <span className="font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-800 text-[11px] border border-gray-200 font-medium">
                            {device.company || '—'}
                          </span>
                        </td>

                        {/* Última Conexión */}
                        <td className="py-3.5 px-3 text-gray-600 text-[11px] font-medium">
                          {formatDate(device.last_seen_at || device.created_at)}
                        </td>

                        {/* Estado: Activo / Inactivo (con Modal de Confirmación) */}
                        <td className="py-3.5 px-3 text-center">
                          <button
                            onClick={() => requestToggleActive(device)}
                            disabled={isActionInProgress(device.id, 'active')}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all border cursor-pointer ${
                              isActive
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-200'
                            }`}
                            title={isActive ? 'Click para desactivar (solicita confirmación)' : 'Click para activar (solicita confirmación)'}
                          >
                            {isActionInProgress(device.id, 'active') ? (
                              <div className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : isActive ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <XCircle className="w-3 h-3 text-gray-400" />
                            )}
                            <span>{isActive ? 'Activo' : 'Inactivo'}</span>
                          </button>
                        </td>

                        {/* Bloqueo: Bloqueado / Normal (con Modal de Confirmación) */}
                        <td className="py-3.5 px-3 text-center">
                          <button
                            onClick={() => requestToggleBlocked(device)}
                            disabled={isActionInProgress(device.id, 'blocked')}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all border cursor-pointer ${
                              isBlocked
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-200'
                            }`}
                            title={isBlocked ? 'Click para desbloquear (solicita confirmación)' : 'Click para bloquear (solicita confirmación)'}
                          >
                            {isActionInProgress(device.id, 'blocked') ? (
                              <div className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : isBlocked ? (
                              <ShieldAlert className="w-3 h-3 text-rose-600" />
                            ) : (
                              <Shield className="w-3 h-3 text-gray-400" />
                            )}
                            <span>{isBlocked ? 'Bloqueado' : 'Normal'}</span>
                          </button>
                        </td>

                        {/* Adult Content */}
                        <td className="py-3.5 px-3 text-center">
                          <button
                            onClick={() => handleToggleAdultContent(device.id, device.adult_content)}
                            disabled={isActionInProgress(device.id, 'adult')}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all border cursor-pointer ${
                              adultEnabled
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-200'
                            }`}
                            title={adultEnabled ? 'Deshabilitar +18' : 'Habilitar +18'}
                          >
                            {isActionInProgress(device.id, 'adult') ? (
                              <div className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Flame className={`w-3 h-3 ${adultEnabled ? 'text-amber-600' : 'text-gray-400'}`} />
                            )}
                            <span>{adultEnabled ? '+18 ON' : '+18 OFF'}</span>
                          </button>
                        </td>

                        {/* Acciones */}
                        <td className="py-3.5 px-5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => setDetailDevice(device)}
                              className="p-1.5 rounded-lg bg-gray-100 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 border border-gray-200 transition-colors cursor-pointer"
                              title="Ver Ficha Completa"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingDevice(device)}
                              className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 border border-gray-200 transition-colors cursor-pointer"
                              title="Editar Alias"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span>Mostrar por página:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-gray-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>• Total: <strong className="text-gray-900">{totalCount}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <span>Página <strong className="text-gray-900">{page}</strong> de <strong className="text-gray-900">{totalPages}</strong></span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed border border-gray-300 cursor-pointer shadow-2xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed border border-gray-300 cursor-pointer shadow-2xs"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Confirmation Modal for Active / Blocked toggles */}
      <ConfirmModal
        isOpen={!!pendingConfirm}
        onClose={() => setPendingConfirm(null)}
        onConfirm={handleExecuteConfirm}
        isLoading={isConfirming}
        title={
          pendingConfirm?.type === 'toggle_active'
            ? pendingConfirm.device.is_active
              ? '¿Desactivar dispositivo?'
              : '¿Activar dispositivo?'
            : pendingConfirm?.device.is_blocked
            ? '¿Desbloquear dispositivo?'
            : '¿Bloquear dispositivo?'
        }
        message={
          pendingConfirm?.type === 'toggle_active'
            ? pendingConfirm.device.is_active
              ? 'Al desactivar este dispositivo, dejará de responder y quedará marcado como inactivo en la plataforma de Loki TV.'
              : 'El dispositivo quedará habilitado nuevamente para operar en la red.'
            : pendingConfirm?.device.is_blocked
            ? 'Al desbloquear este dispositivo, se reanudará de inmediato el acceso a la aplicación móvil o TV y a la reproducción de canales.'
            : '¡Atención! Al bloquear este dispositivo, la aplicación móvil o TV quedará restringida inmediatamente y no podrá reproducir ningún contenido.'
        }
        deviceId={pendingConfirm?.device.device_id}
        deviceModel={pendingConfirm?.device.alias || pendingConfirm?.device.device_model || undefined}
        variant={
          pendingConfirm?.type === 'toggle_active'
            ? pendingConfirm.device.is_active
              ? 'warning'
              : 'primary'
            : pendingConfirm?.device.is_blocked
            ? 'primary'
            : 'danger'
        }
        confirmText={
          pendingConfirm?.type === 'toggle_active'
            ? pendingConfirm.device.is_active
              ? 'Sí, desactivar'
              : 'Sí, activar'
            : pendingConfirm?.device.is_blocked
            ? 'Sí, desbloquear'
            : 'Sí, bloquear dispositivo'
        }
      />

      {/* Alias Modal */}
      <AliasModal
        isOpen={!!editingDevice}
        device={editingDevice}
        onClose={() => setEditingDevice(null)}
        onSave={handleSaveAlias}
      />

      {/* Device Detail Modal */}
      <DeviceDetailModal
        isOpen={!!detailDevice}
        device={detailDevice}
        onClose={() => setDetailDevice(null)}
        onToggleActive={requestToggleActive}
        onToggleBlocked={requestToggleBlocked}
        onToggleAdultContent={handleToggleAdultContent}
      />
    </div>
  );
};
