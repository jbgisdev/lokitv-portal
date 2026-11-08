import React, { useState } from 'react';
import { Tag, Plus, Check } from 'lucide-react';

interface CategorySelectProps {
  value: string;
  onChange: (category: string) => void;
  categories: string[];
}

export const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onChange,
  categories,
}) => {
  const [isCustom, setIsCustom] = useState(() => {
    return value && !categories.includes(value.toUpperCase());
  });

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === '__NEW__') {
      setIsCustom(true);
      onChange('');
    } else {
      setIsCustom(false);
      onChange(selected);
    }
  };

  const handleCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value.toUpperCase());
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
          Categoría
        </label>
        <button
          type="button"
          onClick={() => {
            setIsCustom(!isCustom);
            if (!isCustom) {
              onChange('');
            } else if (categories.length > 0) {
              onChange(categories[0]);
            }
          }}
          className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
        >
          {isCustom ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Elegir existente</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Escribir nueva categoría</span>
            </>
          )}
        </button>
      </div>

      {!isCustom ? (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Tag className="w-4 h-4" />
          </div>
          <select
            value={value || (categories.length > 0 ? categories[0] : '')}
            onChange={handleSelectChange}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
          >
            {categories.length === 0 && <option value="">Sin categorías</option>}
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            <option value="__NEW__" className="font-bold text-emerald-700">
              + Nueva categoría personalizada...
            </option>
          </select>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Tag className="w-4 h-4 text-emerald-600" />
          </div>
          <input
            type="text"
            value={value}
            onChange={handleCustomInput}
            placeholder="Ej: DEPORTES, NOTICIAS, INFANTIL..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-emerald-400 ring-1 ring-emerald-400/30 rounded-xl text-gray-900 font-bold uppercase placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm shadow-2xs"
            autoFocus
          />
        </div>
      )}
    </div>
  );
};

