import React, { useState } from 'react';
import { CompanyWithDeviceCount } from '../../services/companies.service';
import {
  Building2,
  Shield,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Edit2,
  Smartphone,
  Key,
  User,
  Lock,
} from 'lucide-react';

interface CompanyCardProps {
  company: CompanyWithDeviceCount;
  onEdit: (company: CompanyWithDeviceCount) => void;
  onToggleActive: (company: CompanyWithDeviceCount) => void;
  onToggleBlocked: (company: CompanyWithDeviceCount) => void;
  isActiveLoading?: boolean;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({
  company,
  onEdit,
  onToggleActive,
  onToggleBlocked,
  isActiveLoading = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (company.code) {
      navigator.clipboard.writeText(company.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isUserType = company.type === 'user';
  const isActive = company.is_active === true;
  const isBlocked = !!company.is_blocked;
  const deviceCount = company.actual_devices_count ?? 0;
  const limitCount = company.installations_count ?? (isUserType ? 1 : 5);

  const renderRoleBadge = () => {
    switch (company.type) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-50 text-purple-700 border border-purple-200">
            <Shield className="w-3 h-3 text-purple-600" />
            admin
          </span>
        );
      case 'multiuser':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200">
            <Building2 className="w-3 h-3 text-blue-600" />
            multiuser
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
            <User className="w-3 h-3 text-slate-500" />
            user
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/90 shadow-xs hover:shadow-md transition-all space-y-3.5">
      {/* Top Header: Jerarquía Vertical Nombre + Alias */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            {isUserType ? <User className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <h4 className="font-extrabold text-gray-900 text-sm sm:text-base truncate">
              {company.name || company.code}
            </h4>
            {company.alias && company.alias !== company.name && (
              <p className="text-xs text-gray-500 truncate mt-0.5">
                Alias: <span className="font-medium text-gray-700">{company.alias}</span>
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0">{renderRoleBadge()}</div>
      </div>

      {/* Code Box with Copy Button */}
      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Key className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="text-[11px] text-gray-500 font-medium">Código:</span>
          <code className="text-xs font-mono font-black text-emerald-800 tracking-wider truncate">
            {company.code}
          </code>
        </div>
        <button
          onClick={handleCopyCode}
          className="text-gray-400 hover:text-emerald-700 p-1 rounded-md hover:bg-slate-200/70 transition-colors shrink-0 cursor-pointer"
          title="Copiar código de acceso"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Dispositivos vs Límite */}
      <div className="flex items-center justify-between text-xs py-1 px-1 border-t border-b border-gray-100">
        <div className="flex items-center gap-1.5 text-gray-600">
          <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
          <span>Dispositivos:</span>
        </div>
        <div className="font-mono font-bold text-gray-900">
          <span className={deviceCount > limitCount ? 'text-rose-600' : 'text-emerald-700'}>
            {deviceCount}
          </span>
          <span className="text-gray-400"> / {limitCount}</span>
        </div>
      </div>

      {/* Estados y Acción de Edición (Sin botón de eliminar) */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          {/* Active status: Solo editable si type != 'user' */}
          {!isUserType ? (
            <button
              onClick={() => onToggleActive(company)}
              disabled={isActiveLoading}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all border cursor-pointer ${
                isActive
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-200'
              }`}
              title={isActive ? 'Click para desactivar cuenta' : 'Click para activar cuenta'}
            >
              {isActiveLoading ? (
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
              title="Los usuarios tipo 'user' se activan mediante sus dispositivos."
            >
              <Lock className="w-2.5 h-2.5 text-gray-400" />
              <span>{isActive ? 'Activo' : 'Inactivo'}</span>
            </span>
          )}

          {/* Blocked status: Editable para TODOS los usuarios con ConfirmModal */}
          <button
            onClick={() => onToggleBlocked(company)}
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
        </div>

        {/* Solo botón de Edición (Sin botón de eliminar) */}
        <button
          onClick={() => onEdit(company)}
          className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition-colors cursor-pointer"
          title="Editar Usuario"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
