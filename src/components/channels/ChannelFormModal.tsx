import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Channel } from '../../types';
import {
  channelsService,
  ChannelCalculation,
  ChannelTable,
  formatChannelNumber,
} from '../../services/channels.service';
import { CategoryTagSelect } from './CategoryTagSelect';
import { ChannelLogo } from './ChannelLogo';
import {
  Tv,
  Link,
  Hash,
  AlertCircle,
  CheckCircle2,
  Wrench,
  RotateCcw,
} from 'lucide-react';

interface ChannelFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelToEdit: Channel | null;
  categories: string[];
  table?: ChannelTable;
  onSaved: () => void;
  onNotify: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const ChannelFormModal: React.FC<ChannelFormModalProps> = ({
  isOpen,
  onClose,
  channelToEdit,
  categories,
  table = 'channels',
  onSaved,
  onNotify,
}) => {
  const isEditing = !!channelToEdit;
  const isAdult = table === 'adult_channels';

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [channelNumber, setChannelNumber] = useState<number | null>(null);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [enMantenimiento, setEnMantenimiento] = useState<boolean>(false);

  const [calculation, setCalculation] = useState<ChannelCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form
  useEffect(() => {
    if (channelToEdit) {
      setName(channelToEdit.name || '');
      setCategory(isAdult ? 'ADULTOS' : (channelToEdit.category || 'GENERAL'));
      setLogoUrl(channelToEdit.logo_url || '');
      setStreamUrl(channelToEdit.stream_url || '');
      setChannelNumber(channelToEdit.channel_number ? Number(channelToEdit.channel_number) : null);
      setIsActive(channelToEdit.is_active ?? true);
      setEnMantenimiento(channelToEdit.en_mantenimiento ?? false);
    } else {
      setName('');
      const defaultCat = isAdult ? 'ADULTOS' : (categories.length > 0 ? categories[0] : 'GENERAL');
      setCategory(defaultCat);
      setLogoUrl('');
      setStreamUrl('');
      setChannelNumber(null);
      setIsActive(true);
      setEnMantenimiento(false);
    }
    setError(null);
  }, [channelToEdit, isOpen, categories, isAdult]);

  // Recalculate channel_number
  const computeChannelNumber = async (targetCat: string, forceRecalculate = false) => {
    if (!targetCat.trim()) {
      setChannelNumber(null);
      setCalculation(null);
      return;
    }

    // Si está en edición, no forzó recálculo y la categoría es la misma que la original:
    if (
      isEditing &&
      !forceRecalculate &&
      channelToEdit?.category &&
      channelToEdit.category.trim().toUpperCase() === targetCat.trim().toUpperCase() &&
      channelToEdit.channel_number
    ) {
      const currentChNum = Number(channelToEdit.channel_number);
      // Si el canal guardado previamente tenía 0 o un valor inválido, recalculamos automáticamente a uno válido (>= 1)
      if (currentChNum > 0) {
        const computedStart = Math.floor(currentChNum / 100) * 100;
        setChannelNumber(currentChNum);
        setCalculation({
          channelNumber: currentChNum,
          blockStart: computedStart === 0 ? 1 : computedStart,
          blockEnd: computedStart + 99,
          isNewCategory: false,
          isFull: false,
        });
        return;
      }
    }

    setIsCalculating(true);
    const res = await channelsService.calculateNextChannelNumber(
      targetCat,
      channelToEdit?.id,
      table
    );

    setCalculation(res);
    setChannelNumber(res.channelNumber);
    setIsCalculating(false);
  };

  // Trigger compute when category changes
  useEffect(() => {
    if (isOpen) {
      const isOriginalCategory =
        isEditing &&
        channelToEdit?.category &&
        channelToEdit.category.trim().toUpperCase() === category.trim().toUpperCase();

      computeChannelNumber(category, !isOriginalCategory);
    }
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre del canal es obligatorio.');
      return;
    }
    if (!category.trim()) {
      setError('Debes seleccionar o asignar una categoría.');
      return;
    }
    if (!streamUrl.trim()) {
      setError('La URL de streaming es obligatoria.');
      return;
    }
    if (!channelNumber || channelNumber <= 0) {
      setError('No se pudo determinar un número de canal válido (debe ser mayor a 0).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing && channelToEdit) {
        // En edición: permite actualizar nombre, categoría, logo, stream, número (si cambió o se recalculó) y estados
        const res = await channelsService.updateChannel(
          channelToEdit.id,
          {
            name,
            category,
            logo_url: logoUrl || null,
            stream_url: streamUrl,
            channel_number: channelNumber,
            is_active: isActive,
            en_mantenimiento: enMantenimiento,
          },
          table
        );

        if (!res.success) {
          setError(res.error || 'Error al actualizar canal');
          setIsSubmitting(false);
          return;
        }

        onNotify('success', `Canal "${name.toUpperCase()}" actualizado correctamente.`);
      } else {
        // En creación: order_num = channel_number, is_active = true, en_mantenimiento = false
        const res = await channelsService.createChannel(
          {
            name,
            category,
            logo_url: logoUrl || null,
            stream_url: streamUrl,
            channel_number: channelNumber,
            order_num: channelNumber,
            is_active: true,
            en_mantenimiento: false,
          },
          table
        );

        if (!res.success) {
          setError(res.error || 'Error al crear canal');
          setIsSubmitting(false);
          return;
        }

        onNotify(
          'success',
          `Canal "${name.toUpperCase()}" creado exitosamente como ${formatChannelNumber(channelNumber)}.`
        );
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error inesperado al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrar categorías si es adultos (solo 'ADULTOS')
  const availableCategories = isAdult ? ['ADULTOS'] : categories;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditing
          ? isAdult
            ? 'Editar Canal Adulto'
            : 'Editar Canal General'
          : isAdult
          ? 'Nuevo Canal Adulto'
          : 'Nuevo Canal General'
      }
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
            form="channel-form"
            disabled={isSubmitting || isCalculating}
            className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
              isAdult
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <span>{isEditing ? 'Guardar Cambios' : 'Crear Canal'}</span>
            )}
          </button>
        </>
      }
    >
      <form id="channel-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Nombre del Canal (Forzado a Mayúsculas) */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Nombre del Canal *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Tv className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              placeholder="Ej: ESPN DEPORTES, HBO, CARACOL..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 font-bold uppercase placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm shadow-2xs"
              autoFocus
              required
            />
          </div>
        </div>

        {/* 2. Selector de Categoría (UI de Tags / Badges Visuales) */}
        <CategoryTagSelect
          value={category}
          onChange={(newCat) => setCategory(newCat)}
          categories={availableCategories}
          accentColor={isAdult ? 'rose' : 'emerald'}
          allowAddNew={!isAdult}
        />

        {/* 3. Número de Canal (Formato CH XXX con asignación automática o recálculo) */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-emerald-600" />
              <span>Número de Canal</span>
            </label>
            <div className="flex items-center gap-2">
              {/* En Canales Generales: permite forzar recálculo en edición */}
              {isEditing && !isAdult && (
                <button
                  type="button"
                  onClick={() => computeChannelNumber(category, true)}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Buscar el siguiente número libre en esta categoría"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Recalcular número</span>
                </button>
              )}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {isCalculating ? 'Calculando...' : 'Asignación Automática'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              readOnly
              value={
                isCalculating
                  ? 'Calculando...'
                  : channelNumber !== null
                  ? formatChannelNumber(channelNumber)
                  : 'CH ---'
              }
              className="w-36 py-2 px-3 bg-white border border-gray-300 rounded-xl text-gray-900 font-mono font-black text-base text-center shadow-2xs cursor-not-allowed select-all"
            />
            <div className="text-xs text-gray-600 leading-snug">
              {calculation && (
                <>
                  Bloque de categoría: <strong className="text-gray-900">CH {String(calculation.blockStart).padStart(3, '0')} - CH {String(calculation.blockEnd).padStart(3, '0')}</strong>
                  <br />
                  <span className="text-[11px] text-gray-500">
                    Capacidad de hasta 100 señales por bloque de categoría.
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 4. Logo URL con Live Preview Inmediato */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            URL del Logo del Canal
          </label>
          <div className="flex items-start gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Link className="w-4 h-4" />
              </div>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://servidor.com/logos/canal.png"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm shadow-2xs"
              />
            </div>

            {/* Live Preview Box */}
            <div className="flex flex-col items-center">
              <ChannelLogo url={logoUrl || null} name={name || 'Canal'} size="md" />
              <span className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">Preview</span>
            </div>
          </div>
        </div>

        {/* 5. URL de Streaming (HLS/TS) */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            URL de Streaming (HLS / m3u8 / TS) *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Link className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="https://servidor.com/live/stream.m3u8"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 font-mono text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
              required
            />
          </div>
        </div>

        {/* 6. En Edición: Permite conmutar is_active y en_mantenimiento (ocultos en creación) */}
        {isEditing && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Estado de Señal
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
                <span>{isActive ? 'Canal Activo' : 'Canal Inactivo'}</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Modo Transmisión
              </label>
              <button
                type="button"
                onClick={() => setEnMantenimiento(!enMantenimiento)}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  enMantenimiento
                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span>{enMantenimiento ? 'En Mantenimiento' : 'Transmisión Normal'}</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
