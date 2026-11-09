import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { CompanyWithDeviceCount, generateRandomCompanyCode, companiesService } from '../../services/companies.service';
import { UserRole } from '../../types';
import {
  Building2,
  Key,
  Tag,
  Shield,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface CompanyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyToEdit: CompanyWithDeviceCount | null;
  onSaved: () => void;
  onNotify: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const CompanyFormModal: React.FC<CompanyFormModalProps> = ({
  isOpen,
  onClose,
  companyToEdit,
  onSaved,
  onNotify,
}) => {
  const isEditing = !!companyToEdit;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [alias, setAlias] = useState('');
  const [type, setType] = useState<UserRole>('multiuser');
  const [installationsCount, setInstallationsCount] = useState<number>(5);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isBlocked, setIsBlocked] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (companyToEdit) {
      setName(companyToEdit.name || '');
      setCode(companyToEdit.code || '');
      setAlias(companyToEdit.alias || '');
      setType((companyToEdit.type as UserRole) || 'multiuser');
      setInstallationsCount(companyToEdit.installations_count ?? 5);
      setIsActive(companyToEdit.is_active !== false);
      setIsBlocked(!!companyToEdit.is_blocked);
    } else {
      setName('');
      setCode(generateRandomCompanyCode());
      setAlias('');
      setType('multiuser');
      setInstallationsCount(5);
      setIsActive(true);
      setIsBlocked(false);
    }
    setError(null);
  }, [companyToEdit, isOpen]);

  const handleGenerateCode = () => {
    setCode(generateRandomCompanyCode());
  };

  const handleTypeChange = (newType: UserRole) => {
    setType(newType);
    if (!isEditing) {
      if (newType === 'admin') setInstallationsCount(999);
      else if (newType === 'multiuser') setInstallationsCount(5);
      else setInstallationsCount(1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanCode = code.trim().toLowerCase();

    if (!cleanName) {
      setError('El nombre de la empresa es obligatorio.');
      return;
    }

    if (!cleanCode) {
      setError('El código de acceso es obligatorio.');
      return;
    }

    if (cleanCode.length < 3) {
      setError('El código debe tener al menos 3 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing && companyToEdit) {
        const res = await companiesService.updateCompany(companyToEdit.id, {
          name: cleanName,
          code: cleanCode,
          alias: alias.trim() || cleanName,
          type,
          installations_count: installationsCount,
          is_active: isActive,
          is_blocked: isBlocked,
        });

        if (!res.success) {
          setError(res.error || 'Error al actualizar la empresa.');
          setIsSubmitting(false);
          return;
        }

        onNotify('success', `Empresa "${cleanName}" actualizada correctamente.`);
      } else {
        const res = await companiesService.createCompany({
          name: cleanName,
          code: cleanCode,
          alias: alias.trim() || cleanName,
          type,
          installations_count: installationsCount,
          is_active: isActive,
          is_blocked: isBlocked,
        });

        if (!res.success) {
          setError(res.error || 'Error al registrar la empresa.');
          setIsSubmitting(false);
          return;
        }

        onNotify('success', `Empresa "${cleanName}" creada exitosamente con código "${cleanCode}".`);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error inesperado al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Empresa / Usuario' : 'Nueva Empresa / Usuario'}
      maxWidth="max-w-xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="company-form"
            disabled={isSubmitting}
            className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm shadow-emerald-200 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <span>{isEditing ? 'Guardar Cambios' : 'Crear Empresa'}</span>
            )}
          </button>
        </>
      }
    >
      <form id="company-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Nombre de la Empresa */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Nombre de la Empresa o Usuario *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Building2 className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Cablevisión Norte, TV Familiar..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 font-semibold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm shadow-2xs"
              autoFocus
              required
            />
          </div>
        </div>

        {/* 2. Código de Acceso Único (con generador aleatorio) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-600" />
              <span>Código Único de Acceso *</span>
            </label>
            <button
              type="button"
              onClick={handleGenerateCode}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer transition-colors"
              title="Generar código aleatorio de 6 letras minúsculas"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Generar nuevo código</span>
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
              placeholder="ej: abcdxy"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-gray-300 rounded-xl text-gray-900 font-mono font-black text-sm tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white shadow-2xs"
              required
            />
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Este código se utiliza para el inicio de sesión y vincular las instalaciones de la app.
          </p>
        </div>

        {/* 3. Alias Descriptivo */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Alias / Nombre Corto
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Tag className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Ej: CV-Norte, Sucursal Centro"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm shadow-2xs"
            />
          </div>
        </div>

        {/* 4. Selector de Rol / Tipo de Acceso */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-gray-400" />
            <span>Rol y Nivel de Acceso</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => handleTypeChange('multiuser')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                type === 'multiuser'
                  ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-200'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-extrabold text-xs text-blue-900 mb-0.5">Empresa (Multi)</div>
              <div className="text-[11px] text-gray-500 leading-tight">
                Acceso aislado únicamente a sus propias instalaciones.
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('admin')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                type === 'admin'
                  ? 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-200'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-extrabold text-xs text-purple-900 mb-0.5">Administrador</div>
              <div className="text-[11px] text-gray-500 leading-tight">
                Control y visualización global de todo el sistema.
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('user')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                type === 'user'
                  ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-200'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-extrabold text-xs text-emerald-900 mb-0.5">Usuario Estándar</div>
              <div className="text-[11px] text-gray-500 leading-tight">
                Dispositivo único sin acceso al portal web.
              </div>
            </button>
          </div>
        </div>

        {/* 5. Límite de Instalaciones Permitidas */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-gray-400" />
            <span>Límite de Instalaciones Permitidas</span>
          </label>
          <input
            type="number"
            min={1}
            max={9999}
            value={installationsCount}
            onChange={(e) => setInstallationsCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
            required
          />
        </div>

        {/* 6. Estados (Activo y Bloqueado) */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Estado de la Cuenta
            </label>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isActive ? 'Cuenta Activa' : 'Cuenta Inactiva'}</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Acceso al Sistema
            </label>
            <button
              type="button"
              onClick={() => setIsBlocked(!isBlocked)}
              className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isBlocked
                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>{isBlocked ? 'Acceso Bloqueado' : 'Acceso Permitido'}</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
