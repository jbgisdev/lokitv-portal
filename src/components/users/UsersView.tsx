import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Building2,
  Shield,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Smartphone,
  Edit2,
  Copy,
  Check,
  RotateCcw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  Key,
  User,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  companiesService,
  CompanyWithDeviceCount,
  GetCompaniesFilter,
} from '../../services/companies.service';
import { CompanyCard } from './CompanyCard';
import { CompanyFormModal } from './CompanyFormModal';
import { ConfirmModal } from '../common/ConfirmModal';

interface UsersViewProps {
  onNotify?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  onCountChange?: (count: number) => void;
}

export const UsersView: React.FC<UsersViewProps> = ({ onNotify, onCountChange }) => {
  const { user, role } = useAuth();
  const isAdmin = role === 'admin';

  const [companies, setCompanies] = useState<CompanyWithDeviceCount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Paginación
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Filtros
  const [filters, setFilters] = useState<GetCompaniesFilter>({
    search: '',
    type: 'all',
    status: 'all',
  });

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<CompanyWithDeviceCount | null>(null);

  // Modal de confirmación para Bloqueo (disponible para cualquier usuario)
  const [companyToBlock, setCompanyToBlock] = useState<CompanyWithDeviceCount | null>(null);
  const [isBlocking, setIsBlocking] = useState(false);

  // Estado de carga individual para toggles
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Feedback de código copiado
  const [copiedCodeId, setCopiedCodeId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await companiesService.getCompanies(filters);
      if (res.error) {
        setError(res.error);
        if (onNotify) onNotify('error', res.error);
      } else {
        let list = res.data;
        // Si no es admin global, se restringe a la empresa del usuario en sesión
        if (!isAdmin && user?.code) {
          list = list.filter((c) => c.code?.toLowerCase() === user.code.toLowerCase());
        }
        setCompanies(list);
        if (onCountChange) onCountChange(list.length);
      }
    } catch (err: any) {
      const msg = err.message || 'Error al cargar usuarios y empresas';
      setError(msg);
      if (onNotify) onNotify('error', msg);
    } finally {
      setIsLoading(false);
    }
  }, [filters, isAdmin, user?.code, onNotify, onCountChange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleResetFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      status: 'all',
    });
    setPage(1);
  };

  const handleOpenCreate = () => {
    setCompanyToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (comp: CompanyWithDeviceCount) => {
    setCompanyToEdit(comp);
    setIsFormOpen(true);
  };

  const handleCopyCode = (id: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Toggle Activo: Solo permitido si type != 'user'
  const handleToggleActive = async (comp: CompanyWithDeviceCount) => {
    if (comp.type === 'user') {
      if (onNotify) {
        onNotify('warning', 'Los usuarios tipo "user" se activan al registrar su dispositivo en la app.');
      }
      return;
    }

    const key = `${comp.id}-active`;
    setActionLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await companiesService.toggleActive(comp.id, comp.is_active);
      if (res.success) {
        setCompanies((prev) =>
          prev.map((c) => (c.id === comp.id ? { ...c, is_active: !comp.is_active } : c))
        );
        if (onNotify) {
          onNotify(
            'success',
            `Cuenta "${comp.name || comp.code}" ${!comp.is_active ? 'activada' : 'desactivada'} correctamente.`
          );
        }
      } else {
        if (onNotify) onNotify('error', res.error || 'Error al cambiar estado de activación');
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Confirmar y Ejecutar Bloqueo (Permitido para TODOS los usuarios)
  const handleConfirmToggleBlock = (comp: CompanyWithDeviceCount) => {
    setCompanyToBlock(comp);
  };

  const handleExecuteBlock = async () => {
    if (!companyToBlock) return;
    setIsBlocking(true);
    try {
      const newBlockedState = !companyToBlock.is_blocked;
      const res = await companiesService.toggleBlocked(companyToBlock.id, companyToBlock.is_blocked ?? false);
      if (res.success) {
        setCompanies((prev) =>
          prev.map((c) => (c.id === companyToBlock.id ? { ...c, is_blocked: newBlockedState } : c))
        );
        if (onNotify) {
          onNotify(
            'success',
            `Usuario "${companyToBlock.name || companyToBlock.code}" ${
              newBlockedState ? 'bloqueado' : 'desbloqueado'
            } exitosamente.`
          );
        }
      } else {
        if (onNotify) onNotify('error', res.error || 'Error al cambiar bloqueo');
      }
    } finally {
      setIsBlocking(false);
      setCompanyToBlock(null);
    }
  };

  // Filtrado adicional si se selecciona status 'blocked'
  const filteredCompanies = companies.filter((comp) => {
    if (filters.status === 'blocked') {
      return !!comp.is_blocked;
    }
    return true;
  });

  // Cálculo de paginación
  const totalCount = filteredCompanies.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const paginatedCompanies = filteredCompanies.slice((page - 1) * pageSize, page * pageSize);

  const renderRoleBadge = (type: string | null) => {
    switch (type) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
            <Shield className="w-2.5 h-2.5 text-purple-600" />
            admin
          </span>
        );
      case 'multiuser':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
            <Building2 className="w-2.5 h-2.5 text-blue-600" />
            multiuser
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
            <User className="w-2.5 h-2.5 text-slate-500" />
            user
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Control Bar: Filtros Compactos + Contador + Botón Agregar Usuario */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Izquierda: Buscador Compacto + Selects */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
          {/* Buscador de ancho moderado */}
          <div className="relative w-full sm:w-64 md:w-72 shrink-0">
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
              placeholder="Buscar nombre, código o alias..."
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

          {/* Selector Tipo */}
          <div className="w-full sm:w-44 shrink-0">
            <select
              value={filters.type}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, type: e.target.value }));
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-gray-50/80 border border-gray-300 rounded-xl text-gray-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white cursor-pointer"
            >
              <option value="all">Tipo: Todos</option>
              <option value="user">user (Estándar)</option>
              <option value="multiuser">multiuser (Empresa)</option>
              <option value="admin">admin (Administrador)</option>
            </select>
          </div>

          {/* Selector Estado */}
          <div className="w-full sm:w-40 shrink-0">
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

        {/* Derecha: Contador Reubicado + Botón Agregar Usuario */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100">
          <div className="text-xs text-gray-500 font-medium whitespace-nowrap">
            Total: <strong className="text-emerald-700 font-bold">{totalCount}</strong>{' '}
            <span className="hidden sm:inline">{totalCount === 1 ? 'cuenta' : 'cuentas'}</span>
            {filters.search || filters.type !== 'all' || filters.status !== 'all' ? (
              <span className="text-gray-400 text-[11px] ml-1">(filtrado)</span>
            ) : null}
          </div>

          {isAdmin && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm shadow-emerald-200 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Usuario</span>
            </button>
          )}
        </div>
      </div>

      {/* Contenido Principal */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-9 h-9 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-xs sm:text-sm font-medium">Cargando usuarios desde Supabase...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-center max-w-lg mx-auto shadow-xs">
          <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
          <h3 className="text-gray-900 font-bold text-base mb-1">Error al consultar usuarios</h3>
          <p className="text-gray-600 text-xs mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 shadow-xs max-w-md mx-auto">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-gray-900 font-bold text-base mb-1">Sin usuarios registrados</h3>
          <p className="text-gray-500 text-xs mb-4 leading-relaxed">
            No se encontraron cuentas que coincidan con los criterios de búsqueda.
          </p>
          {filters.search || filters.type !== 'all' || filters.status !== 'all' ? (
            <button
              onClick={() => {
                setFilters({ search: '', type: 'all', status: 'all' });
                setPage(1);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl border border-gray-300 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer filtros</span>
            </button>
          ) : (
            isAdmin && (
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Crear primer usuario</span>
              </button>
            )
          )}
        </div>
      ) : (
        <>
          {/* Vista Móvil y Tablet: Tarjetas Optimizadas (visible en < lg) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
            {paginatedCompanies.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                onEdit={handleOpenEdit}
                onToggleActive={handleToggleActive}
                onToggleBlocked={handleConfirmToggleBlock}
                isActiveLoading={actionLoading[`${company.id}-active`]}
              />
            ))}
          </div>

          {/* Vista Desktop: Tabla Optimizada Sin Scroll Horizontal (visible en lg+) */}
          <div className="hidden lg:block bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs table-auto">
              <thead className="bg-slate-50 border-b border-gray-200 text-gray-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Usuario / Empresa</th>
                  <th className="py-3.5 px-4 text-center">Instalaciones</th>
                  <th className="py-3.5 px-4 text-center">Estado (Activo)</th>
                  <th className="py-3.5 px-4 text-center">Bloqueo</th>
                  <th className="py-3.5 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedCompanies.map((company) => {
                  const isUserType = company.type === 'user';
                  const isActive = company.is_active === true;
                  const isBlocked = !!company.is_blocked;
                  const deviceCount = company.actual_devices_count ?? 0;
                  const limitCount = company.installations_count ?? (isUserType ? 1 : 5);

                  return (
                    <tr key={company.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* CELDA UNIFICADA CON JERARQUÍA VERTICAL */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                            {isUserType ? <User className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0 space-y-1">
                            {/* Línea 1: Nombre + Alias */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-gray-900 text-sm truncate" title={company.name || company.code}>
                                {company.name || company.code}
                              </span>
                              {company.alias && company.alias !== company.name && (
                                <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200 truncate">
                                  Alias: {company.alias}
                                </span>
                              )}
                            </div>

                            {/* Línea 2: Código con botón de copiar + Badge de Tipo */}
                            <div className="flex items-center gap-2 flex-wrap text-xs">
                              <div className="inline-flex items-center gap-1.5 font-mono font-black text-emerald-900 bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200/90 tracking-wider">
                                <Key className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>{company.code}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyCode(company.id, company.code)}
                                  className="text-gray-400 hover:text-emerald-700 p-0.5 rounded hover:bg-emerald-100 transition-colors cursor-pointer"
                                  title="Copiar código de acceso"
                                >
                                  {copiedCodeId === company.id ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>

                              {renderRoleBadge(company.type)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Columna: Conteo de Instalaciones */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold">
                          <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className={deviceCount > limitCount ? 'text-rose-600' : 'text-gray-900'}>
                            {deviceCount}
                          </span>
                          <span className="text-gray-400">/</span>
                          <span className="text-gray-600">{limitCount}</span>
                        </div>
                      </td>

                      {/* Columna: Estado (is_active) - Solo toggleable para type != 'user' */}
                      <td className="py-3.5 px-4 text-center">
                        {!isUserType ? (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(company)}
                            disabled={actionLoading[`${company.id}-active`]}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all border cursor-pointer ${
                              isActive
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-200'
                            }`}
                            title={isActive ? 'Click para desactivar cuenta' : 'Click para activar cuenta'}
                          >
                            {actionLoading[`${company.id}-active`] ? (
                              <div className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : isActive ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <XCircle className="w-3 h-3 text-gray-400" />
                            )}
                            <span>{isActive ? 'Activo' : 'Inactivo'}</span>
                          </button>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed select-none"
                            title="Los usuarios estándar se activan mediante sus dispositivos vinculados."
                          >
                            <Lock className="w-2.5 h-2.5 text-gray-400" />
                            <span>{isActive ? 'Activo' : 'Inactivo'}</span>
                          </span>
                        )}
                      </td>

                      {/* Columna: Bloqueo (is_blocked) - Toggleable para CUALQUIER usuario */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleConfirmToggleBlock(company)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all border cursor-pointer ${
                            isBlocked
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                          title={isBlocked ? 'Click para desbloquear acceso' : 'Click para bloquear acceso'}
                        >
                          {isBlocked ? (
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                          ) : (
                            <Shield className="w-3 h-3 text-slate-400" />
                          )}
                          <span>{isBlocked ? 'Bloqueado' : 'Normal'}</span>
                        </button>
                      </td>

                      {/* Columna: Acciones (Solo Editar - SIN BOTÓN DE ELIMINAR) */}
                      <td className="py-3.5 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(company)}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition-colors cursor-pointer"
                          title="Editar Usuario / Empresa"
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
                className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-gray-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>• Total: <strong className="text-gray-900">{totalCount}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <span>
                Página <strong className="text-gray-900">{page}</strong> de{' '}
                <strong className="text-gray-900">{totalPages}</strong>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed border border-gray-300 cursor-pointer shadow-2xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
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
      <CompanyFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        companyToEdit={companyToEdit}
        onSaved={loadData}
        onNotify={onNotify || (() => {})}
      />

      {/* Modal de Confirmación para Bloquear / Desbloquear (Aplica a cualquier usuario) */}
      <ConfirmModal
        isOpen={!!companyToBlock}
        onClose={() => setCompanyToBlock(null)}
        onConfirm={handleExecuteBlock}
        isLoading={isBlocking}
        title={companyToBlock?.is_blocked ? '¿Desbloquear Acceso al Usuario?' : '¿Bloquear Acceso al Usuario?'}
        message={
          companyToBlock
            ? companyToBlock.is_blocked
              ? `¿Deseas desbloquear el acceso para "${companyToBlock.name || companyToBlock.code}"? Los dispositivos vinculados al código "${companyToBlock.code}" podrán volver a conectarse.`
              : `¿Deseas bloquear el acceso para "${companyToBlock.name || companyToBlock.code}"? Los dispositivos vinculados al código "${companyToBlock.code}" perderán el acceso al servicio.`
            : ''
        }
        deviceModel={companyToBlock ? `${companyToBlock.name || companyToBlock.code} (Código: ${companyToBlock.code})` : undefined}
        variant={companyToBlock?.is_blocked ? 'warning' : 'danger'}
        confirmText={companyToBlock?.is_blocked ? 'Sí, desbloquear' : 'Sí, bloquear acceso'}
      />
    </div>
  );
};
