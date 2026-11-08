import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { AppInstallation } from '../../types';
import { Smartphone, Tag } from 'lucide-react';

interface AliasModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: AppInstallation | null;
  onSave: (id: string, newAlias: string) => Promise<boolean>;
}

export const AliasModal: React.FC<AliasModalProps> = ({
  isOpen,
  onClose,
  device,
  onSave,
}) => {
  const [alias, setAlias] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (device) {
      setAlias(device.alias || '');
    }
  }, [device]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!device) return;
    setIsSaving(true);
    const success = await onSave(device.id, alias);
    setIsSaving(false);
    if (success) {
      onClose();
    }
  };

  if (!device) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Alias del Dispositivo"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="alias-form"
            disabled={isSaving}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm shadow-emerald-100 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <span>Guardar Cambios</span>
            )}
          </button>
        </>
      }
    >
      <form id="alias-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-gray-700 flex items-center gap-3">
          <Smartphone className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="truncate">
            <div className="font-bold text-gray-900">{device.device_model || 'Modelo genérico'}</div>
            <div className="font-mono text-gray-500 truncate">ID: {device.device_id}</div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Nombre / Alias Amigable
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Tag className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Ej: TV Sala Principal, Habitación 204"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              autoFocus
            />
          </div>
          <p className="text-[11px] text-gray-500 mt-1.5">
            Este nombre facilitará identificar el dispositivo en el panel y en la red.
          </p>
        </div>
      </form>
    </Modal>
  );
};
