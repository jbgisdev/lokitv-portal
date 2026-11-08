import React, { useState } from 'react';
import { Tag, Plus, Check, X } from 'lucide-react';

interface CategoryTagSelectProps {
  value: string;
  onChange: (category: string) => void;
  categories: string[];
  accentColor?: 'emerald' | 'rose';
  allowAddNew?: boolean;
}

export const CategoryTagSelect: React.FC<CategoryTagSelectProps> = ({
  value,
  onChange,
  categories,
  accentColor = 'emerald',
  allowAddNew = true,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  const activeStyles =
    accentColor === 'rose'
      ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-200'
      : 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-200';

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryInput.trim()) {
      const clean = newCategoryInput.trim().toUpperCase();
      onChange(clean);
      setNewCategoryInput('');
      setIsAddingNew(false);
    }
  };

  const isCurrentInList = categories.some(
    (c) => c.toUpperCase() === (value || '').toUpperCase()
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-gray-400" />
          <span>Categoría * {!allowAddNew && '(Categoría Única)'}</span>
        </label>
        {value && (
          <span className="text-[11px] text-gray-500">
            Seleccionada: <strong className="text-gray-900 font-bold uppercase">{value}</strong>
          </span>
        )}
      </div>

      {/* Visual Chips / Tags Grid */}
      <div className="flex flex-wrap gap-2 items-center">
        {categories.map((cat) => {
          const isSelected = (value || '').toUpperCase() === cat.toUpperCase();
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onChange(cat)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer select-none ${
                isSelected
                  ? activeStyles
                  : 'bg-slate-50 hover:bg-slate-100 text-gray-700 border-gray-200 hover:border-gray-300'
              }`}
            >
              {isSelected && <Check className="w-3.5 h-3.5" />}
              <span>{cat}</span>
            </button>
          );
        })}

        {/* Custom category if not in preloaded list and allowed */}
        {value && !isCurrentInList && allowAddNew && (
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer select-none ${activeStyles}`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{value.toUpperCase()}</span>
          </button>
        )}

        {/* Add New Category Button / Inline Input (Solo si allowAddNew = true) */}
        {allowAddNew && !isAddingNew && (
          <button
            type="button"
            onClick={() => setIsAddingNew(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-gray-600 hover:text-gray-900 border border-dashed border-gray-300 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva categoría</span>
          </button>
        )}

        {allowAddNew && isAddingNew && (
          <div className="inline-flex items-center gap-1 p-0.5 bg-white border border-gray-300 rounded-xl shadow-2xs">
            <input
              type="text"
              value={newCategoryInput}
              onChange={(e) => setNewCategoryInput(e.target.value.toUpperCase())}
              placeholder="NOMBRE CATEGORÍA..."
              className="px-2.5 py-1 text-xs font-bold uppercase text-gray-900 placeholder-gray-400 focus:outline-none w-36"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddNew(e);
                } else if (e.key === 'Escape') {
                  setIsAddingNew(false);
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddNew}
              className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs cursor-pointer"
              title="Guardar"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 text-xs cursor-pointer"
              title="Cancelar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
