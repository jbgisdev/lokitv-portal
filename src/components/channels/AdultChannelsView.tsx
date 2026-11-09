import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Flame,
  CheckCircle2,
  XCircle,
  Wrench,
  Edit2,
  Trash2,
  Tag,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Tv,
  X,
  Film,
} from 'lucide-react';
import {
  channelsService,
  GetChannelsFilter,
  formatChannelNumber,
  formatCategory,
} from '../../services/channels.service';
import { exportToVLCPlaylist } from '../../utils/xspfExport';
import { Channel } from '../../types';
import { ChannelLogo } from './ChannelLogo';
import { ChannelCard } from './ChannelCard';
import { ChannelFormModal } from './ChannelFormModal';
import { ConfirmModal } from '../common/ConfirmModal';

interface AdultChannelsViewProps {
  onNotify?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  onCountChange?: (count: number) => void;
}

export const AdultChannelsView: React.FC<AdultChannelsViewProps> = ({
  onNotify,
  onCountChange,
}) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Filters
  const [filters, setFilters] = useState<GetChannelsFilter>({
    search: '',
    category: 'all',
    status: 'all',
  });

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [channelToEdit, setChannelToEdit] = useState<Channel | null>(null);

  // Deletion confirmation state
  const [channelToDelete, setChannelToDelete] = useState<Channel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick action loading state
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Copied stream URL tracking
  const [copiedStreamId, setCopiedStreamId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    // Para canales adultos, la única categoría reglamentaria y permitida es 'Adultos'
    setCategories(['Adultos']);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await channelsService.getChannels(filters, 'adult_channels');
      if (res.error) {
        setError(res.error);
        if (onNotify) onNotify('error', res.error);
      } else {
        setChannels(res.data);
        if (onCountChange) onCountChange(res.data.length);
      }
    } catch (err: any) {
      const msg = err.message || 'Error al cargar canales adultos';
      setError(msg);
      if (onNotify) onNotify('error', msg);
    } finally {
      setIsLoading(false);
    }
  }, [filters, onNotify, onCountChange]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleResetFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      status: 'all',
    });
    setPage(1);
  };

  const handleExportVLC = () => {
    exportToVLCPlaylist(
      channels,
      'Loki TV - Canales Adultos',
      `lokitv_canales_adultos_${new Date().toISOString().slice(0, 10)}.xspf`
    );
    if (onNotify) {
      onNotify('success', 'Playlist VLC (.xspf) de Canales Adultos generada y descargada.');
    }
  };

  const handleOpenCreate = () => {
    setChannelToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (channel: Channel) => {
    setChannelToEdit(channel);
    setIsFormOpen(true);
  };

  // Toggle Active
  const handleToggleActive = async (channel: Channel) => {
    setActionLoading((prev) => ({ ...prev, [`${channel.id}-active`]: true }));
    const res = await channelsService.toggleActive(channel.id, channel.is_active, 'adult_channels');
    setActionLoading((prev) => ({ ...prev, [`${channel.id}-active`]: false }));

    if (res.success) {
      setChannels((prev) =>
        prev.map((c) => (c.id === channel.id ? { ...c, is_active: !channel.is_active } : c))
      );
      if (onNotify) {
        onNotify('success', `Canal adulto "${channel.name}" ${!channel.is_active ? 'activado' : 'desactivado'}.`);
      }
    } else {
      if (onNotify) onNotify('error', res.error || 'Error al cambiar estado');
    }
  };

  // Toggle Maintenance
  const handleToggleMaintenance = async (channel: Channel) => {
    setActionLoading((prev) => ({ ...prev, [`${channel.id}-maint`]: true }));
    const res = await channelsService.toggleMaintenance(channel.id, channel.en_mantenimiento, 'adult_channels');
    setActionLoading((prev) => ({ ...prev, [`${channel.id}-maint`]: false }));

    if (res.success) {
      setChannels((prev) =>
        prev.map((c) =>
          c.id === channel.id ? { ...c, en_mantenimiento: !channel.en_mantenimiento } : c
        )
      );
      if (onNotify) {
        onNotify(
          !channel.en_mantenimiento ? 'warning' : 'success',
          `Canal adulto "${channel.name}" ${!channel.en_mantenimiento ? 'puesto en mantenimiento' : 'en transmisión normal'}.`
        );
      }
    } else {
      if (onNotify) onNotify('error', res.error || 'Error al cambiar modo mantenimiento');
    }
  };

  // Delete channel execution
  const handleExecuteDelete = async () => {
    if (!channelToDelete) return;
    setIsDeleting(true);

    const res = await channelsService.deleteChannel(channelToDelete.id, 'adult_channels');
    setIsDeleting(false);

    if (res.success) {
      setChannels((prev) => prev.filter((c) => c.id !== channelToDelete.id));
      if (onNotify) {
        onNotify(
          'success',
          `Canal adulto "${channelToDelete.name}" (${formatChannelNumber(channelToDelete.channel_number)}) eliminado. El número ha sido liberado para su reaprovechamiento.`
        );
      }
      setChannelToDelete(null);
      fetchCategories();
    } else {
      if (onNotify) onNotify('error', res.error || 'Error al eliminar el canal');
    }
  };

  const handleCopyStream = (channelId: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedStreamId(channelId);
    setTimeout(() => setCopiedStreamId(null), 2000);
  };

  // Pagination calculation
  const totalCount = channels.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const paginatedChannels = channels.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-4 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Aviso de Protección Parental Compacto */}
      <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
        <span className="leading-relaxed">
          <strong>Catálogo Protegido (+18):</strong> Estas señales solo son visibles en los dispositivos que tengan activada la casilla <strong>Contenido Adulto (+18)</strong> en Instalaciones.
        </span>
      </div>

      {/* Control Bar: Filtros Compactos + Limpiar + Exportar VLC + Nuevo Canal Adulto */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-200/90 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* Izquierda: Buscador Compacto + Selects + Botón Limpiar filtros */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
          {/* Buscador de ancho moderado */}
          <div className="relative w-full sm:w-60 md:w-64 shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, search: e.target.value }));
                setPage(1);
              }}
              placeholder="Buscar canal adulto (ej: 005, PLAYBOY)..."
              className="w-full pl-9 pr-8 py-2 bg-gray-50/80 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
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

          {/* Selector Categoría */}
          <div className="w-full sm:w-40 shrink-0">
            <select
              value={filters.category}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, category: e.target.value }));
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-gray-50/80 border border-gray-300 rounded-xl text-gray-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white truncate cursor-pointer"
            >
              <option value="all">Categoría: Todas</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Selector Estado */}
          <div className="w-full sm:w-36 shrink-0">
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, status: e.target.value as any }));
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-gray-50/80 border border-gray-300 rounded-xl text-gray-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white cursor-pointer"
            >
              <option value="all">Estado: Todos</option>
              <option value="active">Solo Activos (En Vivo)</option>
              <option value="inactive">Solo Inactivos</option>
              <option value="maintenance">En Mantenimiento</option>
            </select>
          </div>

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

        {/* Derecha: Exportar VLC (.xspf) + Botón Nuevo Canal Adulto */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 xl:pt-0 border-t xl:border-t-0 border-gray-100">
          <button
            type="button"
            onClick={handleExportVLC}
            disabled={channels.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition-all shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            title="Exportar canales adultos a playlist VLC (.xspf) ordenada alfabéticamente"
          >
            <Film className="w-3.5 h-3.5 text-orange-600" />
            <span>Exportar a VLC (.xspf)</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm shadow-rose-200 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Canal Adulto</span>
          </button>
        </div>
      </div>

      {/* Main Content Area: Table on Desktop, Cards on Mobile */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-9 h-9 border-3 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-xs sm:text-sm font-medium">Cargando catálogo de canales adultos...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-center max-w-lg mx-auto shadow-xs">
          <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
          <h3 className="text-gray-900 font-bold text-base mb-1">Error al consultar canales adultos</h3>
          <p className="text-gray-600 text-xs mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : channels.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 shadow-xs max-w-md mx-auto">
          <Flame className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-gray-900 font-bold text-base mb-1">Sin canales adultos registrados</h3>
          <p className="text-gray-500 text-xs mb-4 leading-relaxed">
            No se encontraron canales que coincidan con la búsqueda o el catálogo está vacío.
          </p>
          {filters.search || filters.category !== 'all' || filters.status !== 'all' ? (
            <button
              onClick={() => {
                setFilters({ search: '', category: 'all', status: 'all' });
                setPage(1);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl border border-gray-300 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer filtros</span>
            </button>
          ) : (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Crear primer canal adulto</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* 1. Mobile & Tablet Card View (visible on < lg) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
            {paginatedChannels.map((channel) => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                onEdit={handleOpenEdit}
                onDelete={(c) => setChannelToDelete(c)}
                onToggleActive={handleToggleActive}
                onToggleMaintenance={handleToggleMaintenance}
              />
            ))}
          </div>

          {/* 2. Desktop Full Table View (visible on lg+) - CELDA UNIFICADA Y SIN COLUMNAS INNECESARIAS */}
          <div className="hidden lg:block bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-gray-200 text-gray-600 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="py-3.5 px-6">Canal</th>
                    <th className="py-3.5 px-4">Stream URL</th>
                    <th className="py-3.5 px-4 text-center">Estado</th>
                    <th className="py-3.5 px-4 text-center">Mantenimiento</th>
                    <th className="py-3.5 px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedChannels.map((channel) => {
                    const isActive = !!channel.is_active;
                    const isMaint = !!channel.en_mantenimiento;

                    return (
                      <tr
                        key={channel.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* CELDA UNIFICADA: Logo + 3 Líneas Verticales (Nombre, CH XXX, Categoría) */}
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3.5">
                            <ChannelLogo
                              url={channel.logo_url}
                              name={channel.name}
                              size="md"
                            />
                            <div className="min-w-0 space-y-0.5">
                              {/* Línea 1: Nombre del Canal (Mayúsculas) */}
                              <div
                                className="font-extrabold text-gray-900 text-sm truncate uppercase tracking-tight"
                                title={channel.name}
                              >
                                {channel.name}
                              </div>

                              {/* Línea 2: Número de Canal Formateado CH XXX con icono de TV retro */}
                              <div className="flex items-center gap-1.5 font-mono text-xs font-black text-rose-800 tracking-tight">
                                <Tv className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                <span>{formatChannelNumber(channel.channel_number)}</span>
                              </div>

                              {/* Línea 3: Categoría del Canal */}
                              <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                                <Tag className="w-3 h-3 text-gray-400" />
                                <span>{formatCategory(channel.category) || 'Adultos'}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Columna: Stream URL con botón de copiar */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 max-w-[260px]">
                            <span
                              className="font-mono text-gray-600 text-[11px] truncate select-all"
                              title={channel.stream_url}
                            >
                              {channel.stream_url}
                            </span>
                            <button
                              onClick={() => handleCopyStream(channel.id, channel.stream_url)}
                              className="text-gray-400 hover:text-rose-700 p-1 rounded-md hover:bg-slate-100 transition-colors shrink-0"
                              title="Copiar URL de stream"
                            >
                              {copiedStreamId === channel.id ? (
                                <Check className="w-3.5 h-3.5 text-rose-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Columna: Estado (is_active) */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleToggleActive(channel)}
                            disabled={actionLoading[`${channel.id}-active`]}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all border cursor-pointer ${
                              isActive
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-200'
                            }`}
                            title={isActive ? 'Click para desactivar señal' : 'Click para activar señal'}
                          >
                            {actionLoading[`${channel.id}-active`] ? (
                              <div className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : isActive ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <XCircle className="w-3 h-3 text-gray-400" />
                            )}
                            <span>{isActive ? 'En Vivo' : 'Inactivo'}</span>
                          </button>
                        </td>

                        {/* Columna: Mantenimiento (en_mantenimiento) */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleToggleMaintenance(channel)}
                            disabled={actionLoading[`${channel.id}-maint`]}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all border cursor-pointer ${
                              isMaint
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-200'
                            }`}
                            title={isMaint ? 'Quitar modo mantenimiento' : 'Poner en mantenimiento'}
                          >
                            {actionLoading[`${channel.id}-maint`] ? (
                              <div className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Wrench className={`w-3 h-3 ${isMaint ? 'text-amber-600' : 'text-gray-400'}`} />
                            )}
                            <span>{isMaint ? 'Mantenimiento' : 'Normal'}</span>
                          </button>
                        </td>

                        {/* Columna: Acciones */}
                        <td className="py-3.5 px-6 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(channel)}
                              className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition-colors cursor-pointer"
                              title="Editar Canal"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setChannelToDelete(channel)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                              title="Eliminar Canal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

          {/* Paginación */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span>Mostrar por página:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-gray-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
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

      {/* Modal Formulario de Creación y Edición */}
      <ChannelFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        channelToEdit={channelToEdit}
        categories={categories}
        table="adult_channels"
        onSaved={() => {
          loadData();
          fetchCategories();
        }}
        onNotify={onNotify || (() => {})}
      />

      {/* Modal de Confirmación Obligatoria para Eliminar */}
      <ConfirmModal
        isOpen={!!channelToDelete}
        onClose={() => setChannelToDelete(null)}
        onConfirm={handleExecuteDelete}
        isLoading={isDeleting}
        title="¿Eliminar Canal Adulto?"
        message={
          channelToDelete
            ? `¿Estás seguro de que deseas eliminar permanentemente el canal adulto "${channelToDelete.name.toUpperCase()}"? Al eliminarlo, el número ${formatChannelNumber(channelToDelete.channel_number)} quedará liberado automáticamente para reaprovecharse en la categoría ${formatCategory(channelToDelete.category) || 'Adultos'}.`
            : ''
        }
        deviceModel={channelToDelete ? `${channelToDelete.name} (${formatChannelNumber(channelToDelete.channel_number)})` : undefined}
        deviceId={channelToDelete?.stream_url}
        variant="danger"
        confirmText="Sí, eliminar canal"
      />
    </div>
  );
};
