import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { AppSetting } from '../../types';
import { settingsService } from '../../services/settings.service';
import { ValueArrayEditor } from './ValueArrayEditor';
import { Key, FileText, AlignLeft, AlertCircle, Lock } from 'lucide-react';

interface SettingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  settingToEdit: AppSetting | null;
  onSaved: () => void;
  onNotify: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const SettingFormModal: React.FC<SettingFormModalProps> = ({
  isOpen,
  onClose,
  settingToEdit,
  onSaved,
  onNotify,
}) => {
  const isEditing = !!settingToEdit;

  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [valueArray, setValueArray] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (settingToEdit) {
      setKey(settingToEdit.key || '');
      setValue(settingToEdit.value || '');
      setDescription(settingToEdit.description || '');
      setValueArray(Array.isArray(settingToEdit.value_array) ? settingToEdit.value_array : []);
    } else {
      setKey('');
      setValue('');
      setDescription('');
      setValueArray([]);
    }
    setError(null);
  }, [settingToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '_');
    const cleanValue = value.trim();

    if (!cleanKey) {
      setError('La clave del parámetro es obligatoria.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && settingToEdit) {
        // En edición, key es inmutable (clave protegida)
        const res = await settingsService.updateSetting(settingToEdit.key, {
          value: cleanValue,
          description: description.trim() || null,
          value_array: valueArray.length > 0 ? valueArray : null,
        });

        if (!res.success) {
          setError(res.error || 'Error al actualizar el parámetro.');
          setIsSubmitting(false);
          return;
        }

        onNotify('success', `Configuración "${settingToEdit.key}" actualizada correctamente.`);
      } else {
        // En creación
        const res = await settingsService.createSetting({
          key: cleanKey,
          value: cleanValue,
          description: description.trim() || null,
          value_array: valueArray.length > 0 ? valueArray : null,
        });

        if (!res.success) {
          setError(res.error || 'Error al registrar el parámetro.');
          setIsSubmitting(false);
          return;
        }

        onNotify('success', `Configuración "${cleanKey}" creada exitosamente.`);
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
      title={isEditing ? 'Editar Configuración' : 'Nueva Configuración'}
      maxWidth="max-w-2xl"
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
            form="setting-form"
            disabled={isSubmitting}
            className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm shadow-emerald-200 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <span>{isEditing ? 'Guardar Cambios' : 'Crear Ajuste'}</span>
            )}
          </button>
        </>
      }
    >
      <form id="setting-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Clave (key) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-600" />
              <span>Clave de Parámetro (key) *</span>
            </label>
            {isEditing && (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Clave Protegida (Solo Lectura)</span>
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              value={key}
              disabled={isEditing}
              onChange={(e) => setKey(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
              placeholder="ej: last_version, url_promotion, timeout_seconds"
              className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono font-bold shadow-2xs ${
                isEditing
                  ? 'bg-gray-100 text-gray-600 border-gray-300 cursor-not-allowed'
                  : 'bg-white text-gray-900 border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500'
              }`}
              required
              autoFocus={!isEditing}
            />
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {isEditing
              ? 'Por integridad del sistema, la clave es inmutable una vez creada.'
              : 'Identificador único en minúsculas y sin espacios (se reemplazan por guiones bajos).'}
          </p>
        </div>

        {/* 2. Valor Principal (value) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              <span>Valor Principal (value) *</span>
            </label>

            {/* Accesos rápidos para booleanos */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setValue('true')}
                className={`text-[11px] font-mono px-2 py-0.5 rounded border cursor-pointer transition-colors ${
                  value.toLowerCase() === 'true'
                    ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                true
              </button>
              <button
                type="button"
                onClick={() => setValue('false')}
                className={`text-[11px] font-mono px-2 py-0.5 rounded border cursor-pointer transition-colors ${
                  value.toLowerCase() === 'false'
                    ? 'bg-rose-600 text-white border-rose-600 font-bold'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                false
              </button>
            </div>
          </div>

          <textarea
            rows={2}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Texto, número, booleano (true/false) o URL..."
            className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 font-mono text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs resize-none"
            required
          />
        </div>

        {/* 3. Descripción */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <AlignLeft className="w-3.5 h-3.5 text-gray-400" />
            <span>Descripción del Ajuste (Opcional)</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Define la última versión permitida para el inicio de sesión..."
            className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
          />
        </div>

        {/* 4. Manejo Dinámico del Campo value_array */}
        <div>
          <ValueArrayEditor
            items={valueArray}
            onChange={(newItems) => setValueArray(newItems)}
            settingKey={key}
          />
        </div>
      </form>
    </Modal>
  );
};
