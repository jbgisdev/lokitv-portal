import React, { useState } from 'react';
import { Plus, X, Tag, Code2, AlertCircle, Trash2 } from 'lucide-react';
import { parseValueArrayItem, formatValueArrayInput } from '../../services/settings.service';

interface ValueArrayEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
  settingKey?: string;
}

export const ValueArrayEditor: React.FC<ValueArrayEditorProps> = ({
  items,
  onChange,
  settingKey,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanInput = inputValue.trim();

    if (!cleanInput) return;

    const formatted = formatValueArrayInput(cleanInput);

    // Evitar duplicados exactos
    if (items.includes(formatted)) {
      setError(`El elemento ya existe en la lista.`);
      return;
    }

    onChange([...items, formatted]);
    setInputValue('');
    setError(null);
  };

  const handleRemoveItem = (indexToRemove: number) => {
    onChange(items.filter((_, idx) => idx !== indexToRemove));
    setError(null);
  };

  const handleClearAll = () => {
    onChange([]);
    setError(null);
  };

  return (
    <div className="space-y-3 p-4 rounded-2xl bg-slate-50/80 border border-slate-200">
      {/* Header del Editor */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-emerald-600" />
          <span>Arreglo de Elementos (value_array)</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
            {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
          </span>
        </label>

        {items.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition-colors"
            title="Vaciar todos los elementos"
          >
            <Trash2 className="w-3 h-3" />
            <span>Vaciar arreglo</span>
          </button>
        )}
      </div>

      <p className="text-[11px] text-gray-500 leading-relaxed">
        Ingresa un código (ej: <code className="bg-slate-200 px-1 py-0.5 rounded font-bold">000000</code>). El sistema transformará automáticamente la entrada a la estructura requerida por Supabase sin necesidad de caracteres de escape manuales.
      </p>

      {/* Input de entrada interactivo */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddItem();
              }
            }}
            placeholder={
              settingKey === 'show_promotion'
                ? 'Código de empresa o usuario (ej: 000000, telecable)'
                : 'Código o valor a incluir en el arreglo...'
            }
            className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 text-xs sm:text-sm font-mono placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
          />
        </div>
        <button
          type="button"
          onClick={() => handleAddItem()}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Agregar</span>
        </button>
      </div>

      {error && (
        <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Lista de Chips / Tags Interactivos */}
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {items.map((rawItem, index) => {
            const parsed = parseValueArrayItem(rawItem);
            return (
              <div
                key={`${rawItem}-${index}`}
                className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-xl bg-white border border-emerald-300/80 text-emerald-950 text-xs font-mono font-bold shadow-2xs group hover:border-emerald-400 transition-colors"
              >
                <Tag className="w-3 h-3 text-emerald-600 shrink-0" />
                <span className="truncate max-w-[240px]" title={rawItem}>
                  {parsed.display}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Eliminar elemento"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-3 text-center rounded-xl bg-white/70 border border-dashed border-gray-200 text-gray-400 text-xs">
          No hay elementos en este arreglo. Puedes agregar códigos o valores arriba si este ajuste lo requiere.
        </div>
      )}

      {/* Vista previa en vivo del JSON serializado generado */}
      {items.length > 0 && (
        <div className="pt-2 border-t border-slate-200/80">
          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            <Code2 className="w-3 h-3 text-gray-400" />
            <span>Estructura generada para Supabase:</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto select-all">
            {JSON.stringify(items, null, 2)}
          </div>
        </div>
      )}
    </div>
  );
};
