import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import {
  CompanyWithDeviceCount,
  generateRandomCompanyCode,
  companiesService,
} from '../../services/companies.service';
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
  Check,
  Lock,
  Info,
} from 'lucide-react';

interface CompanyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyToEdit: CompanyWithDeviceCount | null;
  onSaved: () => void;
  onNotify: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

const TYPE_OPTIONS: { id: UserRole; label: string; desc: string }[] = [
  { id: 'user', label: 'user', desc: 'Usuario Estándar (1 dispositivo, activación por app)' },
  { id: 'admin', label: 'admin', desc: 'Administrador (acceso total al portal)' },
  { id: 'multiuser', label: 'multiuser', desc: 'Empresa Multi (panel de control multi-dispositivo)' },
];

export const CompanyFormModal: React.FC<CompanyFormModalProps> = ({
  isOpen,
  onClose,
  companyToEdit,
  onSaved,
  onNotify,
}) => {
  const isEditing = !!companyToEdit;

  const [type, setType] = useState<UserRole>('user');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [alias, setAlias] = useState('');
  const [installationsCount, setInstallationsCount] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isBlocked, setIsBlocked] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inicializar o resetear formulario
  useEffect(() => {
    if (!isOpen) return;

    if (companyToEdit) {
      const currentType = (companyToEdit.type as UserRole) || 'user';
      setType(currentType);
      setName(companyToEdit.name || '');
      setCode(companyToEdit.code || '');
      setAlias(companyToEdit.alias || '');
      setInstallationsCount(companyToEdit.installations_count ?? (currentType === 'user' ? 1 : 5));
      setIsActive(companyToEdit.is_active === true);
      setIsBlocked(!!companyToEdit.is_blocked);
    } else {
      // Modo Creación: por defecto tipo 'user'
      setType('user');
      setName('');
      setAlias('');
      setInstallationsCount(1);
      setIsActive(false);
      setIsBlocked(false);

      // Generar código único aleatorio de 6 letras minúsculas
      generateNewUserCode();
    }
    setError(null);
  }, [companyToEdit, isOpen]);

  const generateNewUserCode = async () => {
    setIsGeneratingCode(true);
    try {
      const uniqueCode = await companiesService.generateUniqueCompanyCode();
      setCode(uniqueCode);
    } catch {
      setCode(generateRandomCompanyCode());
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleTypeChange = async (newType: UserRole) => {
    if (isEditing) return; // Tipo es estructural y no se puede cambiar en edición

    setType(newType);
    setError(null);

    if (newType === 'user') {
      setName('');
      setAlias('');
      setInstallationsCount(1);
      setIsActive(false);
      setIsBlocked(false);
      await generateNewUserCode();
    } else if (newType === 'admin') {
      setInstallationsCount(999);
      setIsActive(true);
      setIsBlocked(false);
      if (!code || code.length !== 6) {
        await generateNewUserCode();
      }
    } else if (newType === 'multiuser') {
      setInstallationsCount(5);
      setIsActive(true);
      setIsBlocked(false);
      if (!code || code.length !== 6) {
        await generateNewUserCode();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing && companyToEdit) {
        // En edición
        if (companyToEdit.type === 'user') {
          // Para tipo user, solo se permite actualizar bloqueo
          const res = await companiesService.updateCompany(companyToEdit.id, {
            is_blocked: isBlocked,
          });

          if (!res.success) {
            setError(res.error || 'Error al actualizar el usuario.');
            setIsSubmitting(false);
            return;
          }

          onNotify('success', `Usuario "${companyToEdit.code}" actualizado correctamente.`);
        } else {
          // Para admin y multiuser: se permite editar instalaciones, nombre, alias, activo y bloqueo
          const cleanName = name.trim();
          if (!cleanName) {
            setError('El nombre de la empresa o administrador es obligatorio.');
            setIsSubmitting(false);
            return;
          }

          const res = await companiesService.updateCompany(companyToEdit.id, {
            name: cleanName,
            alias: alias.trim() || cleanName,
            installations_count: installationsCount,
            is_active: isActive,
            is_blocked: isBlocked,
          });

          if (!res.success) {
            setError(res.error || 'Error al actualizar la cuenta.');
            setIsSubmitting(false);
            return;
          }

          onNotify('success', `Cuenta "${cleanName}" actualizada correctamente.`);
        }
      } else {
        // Modo Creación
        if (type === 'user') {
          // Si type == 'user': código de 6 letras autogenerado, active = false, is_blocked = false
          const cleanCode = code.trim().toLowerCase();
          if (!cleanCode || cleanCode.length < 3) {
            setError('No se pudo generar un código válido. Por favor regenera el código.');
            setIsSubmitting(false);
            return;
          }

          const res = await companiesService.createCompany({
            name: cleanCode,
            code: cleanCode,
            alias: cleanCode,
            type: 'user',
            installations_count: 1,
            is_active: false,
            is_blocked: false,
          });

          if (!res.success) {
            setError(res.error || 'Error al registrar el usuario estándar.');
            setIsSubmitting(false);
            return;
          }

          onNotify(
            'success',
            `Usuario creado exitosamente con código único "${cleanCode}".`
          );
        } else {
          // Si type es admin o multiuser: admin diligencia code, name y alias
          const cleanName = name.trim();
          const cleanCode = code.trim().toLowerCase();

          if (!cleanName) {
            setError('El nombre es obligatorio.');
            setIsSubmitting(false);
            return;
          }

          if (!cleanCode || cleanCode.length < 3) {
            setError('El código de acceso debe tener al menos 3 caracteres.');
            setIsSubmitting(false);
            return;
          }

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
            setError(res.error || 'Error al registrar la cuenta.');
            setIsSubmitting(false);
            return;
          }

          onNotify(
            'success',
            `Cuenta "${cleanName}" (${type}) creada exitosamente con código "${cleanCode}".`
          );
        }
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error inesperado al guardar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUserType = type === 'user';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Cuenta de Usuario' : 'Nuevo Registro de Usuario'}
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
            disabled={isSubmitting || isGeneratingCode}
            className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm shadow-emerald-200 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <span>{isEditing ? 'Guardar Cambios' : 'Crear Usuario'}</span>
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

        {/* 1. Selector Visual de Tipo (Tags / Badges - Componente idéntico a Categorías) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-gray-400" />
              <span>Tipo de Usuario (type) *</span>
            </label>
            <span className="text-[11px] text-gray-500">
              Seleccionado:{' '}
              <strong className="text-gray-900 font-bold uppercase">{type}</strong>
            </span>
          </div>

          {/* Chips tipo Badges con exactamente 1 opción seleccionable */}
          <div className="flex flex-wrap gap-2 items-center">
            {TYPE_OPTIONS.map((opt) => {
              const isSelected = type === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isEditing}
                  onClick={() => handleTypeChange(opt.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border select-none ${
                    isEditing ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                  } ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-200'
                      : 'bg-slate-50 hover:bg-slate-100 text-gray-700 border-gray-200 hover:border-gray-300'
                  }`}
                  title={opt.desc}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-gray-500">
            {TYPE_OPTIONS.find((t) => t.id === type)?.desc}
          </p>

          {isEditing && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200/80 p-2 rounded-lg">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>El tipo de cuenta es estructural y no se puede alterar una vez creada.</span>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* COMPORTAMIENTO CONDICIONAL SEGÚN TIPO                          */}
        {/* ============================================================== */}

        {/* CASO A: type === 'user' EN CREACIÓN */}
        {isUserType && !isEditing && (
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Código Asignado Automáticamente</span>
              </div>
              <button
                type="button"
                onClick={generateNewUserCode}
                disabled={isGeneratingCode}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer transition-colors"
                title="Generar otro código aleatorio de 6 letras"
              >
                <RotateCcw className={`w-3 h-3 ${isGeneratingCode ? 'animate-spin' : ''}`} />
                <span>Regenerar</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="font-mono text-base font-black text-emerald-950 bg-white px-3.5 py-2 rounded-xl border border-emerald-300 tracking-widest shadow-2xs">
                {isGeneratingCode ? '...' : code}
              </div>
              <div className="text-xs text-emerald-800 font-medium leading-tight">
                Código único de 6 letras minúsculas verificado en Supabase.
              </div>
            </div>

            <div className="text-[11px] text-emerald-800/90 space-y-1 pt-1 border-t border-emerald-100">
              <div className="flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />
                <span>
                  Los campos <strong>Código</strong>, <strong>Nombre</strong> y <strong>Alias</strong> se configuran automáticamente con este valor.
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />
                <span>
                  Valores asignados por defecto: <strong>active = false</strong> (se activa desde la app del dispositivo), <strong>is_blocked = false</strong> y <strong>1 instalación permitida</strong>.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* CASO B: type === 'user' EN EDICIÓN */}
        {isUserType && isEditing && (
          <div className="space-y-4">
            {/* Código (solo lectura) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-gray-400" />
                <span>Código de Usuario (Estructural)</span>
              </label>
              <input
                type="text"
                value={code}
                disabled
                className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-300 rounded-xl text-gray-700 font-mono font-black text-sm tracking-wider cursor-not-allowed"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                El código de usuario es el identificador único y no puede cambiarse.
              </p>
            </div>

            {/* Límite de instalaciones (fijo en 1) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-gray-400" />
                <span>Límite de Instalaciones</span>
              </label>
              <input
                type="number"
                value={1}
                disabled
                className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-300 rounded-xl text-gray-600 font-mono font-bold text-sm cursor-not-allowed"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Los usuarios estándar tienen un límite fijo de 1 instalación.
              </p>
            </div>

            {/* Acciones de Estado permitidas para user: Bloqueo SÍ, Activación NO */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Estado (is_active)
                </label>
                <div
                  className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed`}
                  title="La activación de usuarios estándar solo se gestiona mediante el registro de sus dispositivos."
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isActive ? 'Activo (Dispositivo)' : 'Inactivo (Sin Dispositivo)'}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Solo editable en admin / multiuser</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Acceso al Sistema (is_blocked)
                </label>
                <button
                  type="button"
                  onClick={() => setIsBlocked(!isBlocked)}
                  className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isBlocked
                      ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>{isBlocked ? 'Acceso Bloqueado' : 'Acceso Permitido'}</span>
                </button>
                <p className="text-[10px] text-gray-500 mt-1">Click para alternar bloqueo</p>
              </div>
            </div>
          </div>
        )}

        {/* CASO C: type !== 'user' (admin o multiuser) */}
        {!isUserType && (
          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Nombre de la Empresa o Administrador *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Cablevisión Norte, Administrador Principal..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 font-semibold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm shadow-2xs"
                  required
                />
              </div>
            </div>

            {/* Código de Acceso */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Código de Acceso {isEditing ? '(Estructural)' : '*'}</span>
                </label>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={generateNewUserCode}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer transition-colors"
                    title="Generar código aleatorio de 6 letras"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Generar aleatorio</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                </div>
                <input
                  type="text"
                  value={code}
                  disabled={isEditing}
                  onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="ej: abcdxy"
                  className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 font-mono font-black text-sm tracking-wider uppercase shadow-2xs ${
                    isEditing
                      ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                      : 'bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white'
                  }`}
                  required
                />
              </div>
            </div>

            {/* Alias */}
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
                  placeholder="Ej: CV-Norte, Admin Central"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm shadow-2xs"
                />
              </div>
            </div>

            {/* Límite de Instalaciones (Permitido editar para type != 'user') */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-gray-400" />
                <span>Número Máximo de Instalaciones Permitidas</span>
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
              <p className="text-[11px] text-gray-500 mt-1">
                Límite de dispositivos que pueden registrarse bajo este código de cuenta.
              </p>
            </div>

            {/* Estados para admin / multiuser: ambos editables */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Estado (is_active)
                </label>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
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
                  Acceso (is_blocked)
                </label>
                <button
                  type="button"
                  onClick={() => setIsBlocked(!isBlocked)}
                  className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
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
          </div>
        )}
      </form>
    </Modal>
  );
};
