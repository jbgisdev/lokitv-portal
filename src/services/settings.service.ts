import { supabase } from '../lib/supabase';
import { AppSetting } from '../types';

export interface ValueArrayItem {
  raw: string;
  display: string;
  isJson: boolean;
  parsed?: Record<string, any>;
}

/**
 * Parsea un elemento individual del arreglo value_array para mostrarlo amigablemente.
 * Ejemplo: '{"codigo":"000000"}' -> display: 'codigo: 000000'
 */
export function parseValueArrayItem(item: string): ValueArrayItem {
  if (!item || typeof item !== 'string') {
    return { raw: String(item ?? ''), display: String(item ?? ''), isJson: false };
  }

  const trimmed = item.trim();

  // Si contiene JSON
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'object' && parsed !== null) {
        if ('codigo' in parsed) {
          return { raw: trimmed, display: `código: ${parsed.codigo}`, isJson: true, parsed };
        }
        const pairs = Object.entries(parsed)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
        return { raw: trimmed, display: pairs || trimmed, isJson: true, parsed };
      }
    } catch {
      // Ignorar error de parseo y mostrar como texto
    }
  }

  return { raw: item, display: item, isJson: false };
}

/**
 * Transforma una entrada de usuario simple en la estructura JSON requerida.
 * Ejemplo: '000000' -> '{"codigo":"000000"}'
 * Si el usuario introduce JSON directamente (ej: '{"empresa":"norte"}'), lo formatea y preserva.
 */
export function formatValueArrayInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  // Si el usuario ingresó un JSON válido
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      return JSON.stringify(parsed);
    } catch {
      // Si tiene llaves pero no es JSON válido, lo envolvemos como código
    }
  }

  // Por defecto, estructurar como objeto con propiedad 'codigo'
  return JSON.stringify({ codigo: trimmed });
}

export const settingsService = {
  /**
   * Obtiene todos los ajustes de la tabla app_settings con filtro de búsqueda opcional.
   */
  async getSettings(searchTerm?: string): Promise<{ data: AppSetting[]; error: string | null }> {
    try {
      const { data, error } = await (supabase.from('app_settings') as any)
        .select('*')
        .order('key', { ascending: true });

      if (error) throw error;

      let list = (data as AppSetting[]) || [];

      if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        list = list.filter((s) => {
          const matchKey = (s.key || '').toLowerCase().includes(term);
          const matchDesc = (s.description || '').toLowerCase().includes(term);
          const matchVal = (s.value || '').toLowerCase().includes(term);
          const matchArray = (s.value_array || []).some((item) =>
            (item || '').toLowerCase().includes(term)
          );
          return matchKey || matchDesc || matchVal || matchArray;
        });
      }

      return { data: list, error: null };
    } catch (err: any) {
      console.error('Error fetching app_settings:', err);
      return { data: [], error: err.message || 'Error al obtener configuraciones' };
    }
  },

  /**
   * Crea un nuevo registro en la tabla app_settings.
   */
  async createSetting(payload: {
    key: string;
    value: string;
    description?: string | null;
    value_array?: string[] | null;
  }): Promise<{ success: boolean; data?: AppSetting; error?: string }> {
    try {
      const cleanKey = payload.key.trim().toLowerCase().replace(/\s+/g, '_');

      if (!cleanKey) {
        return { success: false, error: 'La clave del ajuste es obligatoria.' };
      }

      // Validar si la clave ya existe
      const { data: existing } = await (supabase.from('app_settings') as any)
        .select('key')
        .eq('key', cleanKey)
        .maybeSingle();

      if (existing) {
        return {
          success: false,
          error: `La clave "${cleanKey}" ya existe en las configuraciones.`,
        };
      }

      const insertData = {
        key: cleanKey,
        value: payload.value ?? '',
        description: payload.description?.trim() || null,
        value_array: payload.value_array && payload.value_array.length > 0 ? payload.value_array : null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await (supabase.from('app_settings') as any)
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: data as AppSetting };
    } catch (err: any) {
      console.error('Error creating app setting:', err);
      return { success: false, error: err.message || 'Error al crear la configuración' };
    }
  },

  /**
   * Actualiza el valor, descripción y arreglo de un ajuste existente.
   * La clave (key) es protegida e inmutable.
   */
  async updateSetting(
    key: string,
    payload: {
      value: string;
      description?: string | null;
      value_array?: string[] | null;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData = {
        value: payload.value ?? '',
        description: payload.description?.trim() || null,
        value_array: payload.value_array && payload.value_array.length > 0 ? payload.value_array : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await (supabase.from('app_settings') as any)
        .update(updateData)
        .eq('key', key);

      if (error) throw error;

      return { success: true };
    } catch (err: any) {
      console.error('Error updating app setting:', err);
      return { success: false, error: err.message || 'Error al actualizar la configuración' };
    }
  },
};
