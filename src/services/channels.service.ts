import { supabase } from '../lib/supabase';
import { Channel } from '../types';

export type ChannelTable = 'channels' | 'adult_channels';

export interface ChannelCalculation {
  channelNumber: number;
  blockStart: number;
  blockEnd: number;
  isNewCategory: boolean;
  isFull: boolean;
  warning?: string;
}

export interface GetChannelsFilter {
  search?: string;
  category?: string;
  status?: 'all' | 'active' | 'inactive' | 'maintenance';
}

/**
 * Formatea un número de canal a 3 dígitos antecedido por 'CH ' (ej: 'CH 005', 'CH 514').
 * No utiliza el símbolo '#'.
 */
export function formatChannelNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined || num === '') return 'CH ---';
  const parsed = parseInt(String(num), 10);
  if (isNaN(parsed)) return `CH ${num}`;
  return `CH ${String(parsed).padStart(3, '0')}`;
}

/**
 * Da formato estándar a la categoría:
 * Primera letra en mayúscula y el resto en minúsculas (ej: 'Nacionales', 'Musicales', 'Deportes', 'Adultos').
 * Excepción: '24/7' u otros patrones numéricos similares se preservan intactos.
 */
export function formatCategory(cat: string | null | undefined): string {
  if (!cat) return '';
  const trimmed = cat.trim();
  if (!trimmed) return '';

  if (/^\d+\/\d+$/.test(trimmed)) {
    return trimmed;
  }

  return trimmed
    .split(/\s+/)
    .map((word) => {
      if (!word) return '';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

export const channelsService = {
  /**
   * Obtiene la lista de canales ordenada alfabéticamente por nombre.
   */
  async getChannels(
    filter: GetChannelsFilter = {},
    table: ChannelTable = 'channels'
  ): Promise<{ data: Channel[]; error: string | null }> {
    try {
      let query = (supabase.from(table) as any)
        .select('*')
        .order('name', { ascending: true });

      if (filter.category && filter.category !== 'all') {
        query = query.ilike('category', filter.category);
      }

      if (filter.status === 'active') {
        query = query.eq('is_active', true).eq('en_mantenimiento', false);
      } else if (filter.status === 'inactive') {
        query = query.eq('is_active', false);
      } else if (filter.status === 'maintenance') {
        query = query.eq('en_mantenimiento', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      let channelList = (data as Channel[]) || [];

      // Orden estricto alfabético por nombre en español
      channelList.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' }));

      // Filtrado por buscador: Nombre y Número de Canal (excluyendo stream_url)
      if (filter.search && filter.search.trim()) {
        const term = filter.search.trim().toLowerCase();
        // Quitar "ch" o "ch " si el usuario lo escribe en la búsqueda
        const numericTerm = term.replace(/^ch\s*/i, '').trim();

        channelList = channelList.filter((c) => {
          const nameMatch = (c.name || '').toLowerCase().includes(term);
          const rawNum = String(c.channel_number || '');
          const formattedNum = formatChannelNumber(c.channel_number).toLowerCase();

          const numMatch =
            rawNum.includes(numericTerm) ||
            rawNum.includes(term) ||
            formattedNum.includes(term);

          return nameMatch || numMatch;
        });
      }

      return { data: channelList, error: null };
    } catch (err: any) {
      console.error(`Error fetching from ${table}:`, err);
      return { data: [], error: err.message || 'Error al obtener canales' };
    }
  },

  /**
   * Obtiene las categorías únicas de la tabla indicada en formato Title Case (ej: 'Nacionales', 'Deportes', 'Adultos').
   */
  async getCategories(table: ChannelTable = 'channels'): Promise<string[]> {
    try {
      if (table === 'adult_channels') {
        return ['Adultos'];
      }

      const { data, error } = await (supabase.from(table) as any).select('category');

      if (error) throw error;

      const set = new Set<string>();
      ((data as any[]) || []).forEach((row: any) => {
        if (row?.category && typeof row.category === 'string' && row.category.trim()) {
          set.add(formatCategory(row.category));
        }
      });

      return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
    } catch (err) {
      console.error(`Error fetching categories from ${table}:`, err);
      return [];
    }
  },

  /**
   * Lógica de Auto-cálculo de channel_number:
   * - Cada categoría maneja un bloque de hasta 100 canales (ej: 100-199, 200-299, etc.).
   * - Categoría Existente: Reaprovecha huecos liberados (el primer entero disponible en ese bloque).
   * - Categoría Nueva: Consulta el channel_number más alto en la BD y asigna el inicio de la siguiente centena.
   */
  async calculateNextChannelNumber(
    targetCategory: string,
    excludeChannelId?: string,
    table: ChannelTable = 'channels'
  ): Promise<ChannelCalculation> {
    const formattedTarget = formatCategory(targetCategory);
    const cleanCategoryLower = formattedTarget.toLowerCase();

    const { data: allChannels, error } = await (supabase.from(table) as any)
      .select('id, category, channel_number');

    if (error) {
      console.error('Error calculando channel_number:', error);
      return {
        channelNumber: 100,
        blockStart: 100,
        blockEnd: 199,
        isNewCategory: true,
        isFull: false,
      };
    }

    const channelsList = (allChannels as Channel[]) || [];

    // Caso Especial: Categoría Nacionales o Nacional (rango reglamentario de 1 a 99)
    if (cleanCategoryLower === 'nacionales' || cleanCategoryLower === 'nacional') {
      const existingIn1to99 = channelsList
        .filter((c) => !excludeChannelId || c.id !== excludeChannelId)
        .map((c) => Number(c.channel_number))
        .filter((n) => !isNaN(n) && n >= 1 && n <= 99);

      const usedSet = new Set(existingIn1to99);
      for (let candidate = 1; candidate <= 99; candidate++) {
        if (!usedSet.has(candidate)) {
          return {
            channelNumber: candidate,
            blockStart: 1,
            blockEnd: 99,
            isNewCategory: false,
            isFull: false,
          };
        }
      }
    }

    // Canales de la categoría seleccionada (búsqueda insensible a mayúsculas/minúsculas)
    const categoryChannels = channelsList.filter(
      (c) =>
        c.category &&
        formatCategory(c.category).toLowerCase() === cleanCategoryLower &&
        (!excludeChannelId || c.id !== excludeChannelId)
    );

    const allAssignedNumbers = channelsList
      .map((c) => Number(c.channel_number))
      .filter((n) => !isNaN(n) && n > 0);

    const maxGlobalNumber = allAssignedNumbers.length > 0 ? Math.max(...allAssignedNumbers) : 0;

    // Caso 1: La categoría ya existe y tiene canales asignados
    if (categoryChannels.length > 0) {
      const categoryNumbers = categoryChannels
        .map((c) => Number(c.channel_number))
        .filter((n) => !isNaN(n) && n > 0);

      if (categoryNumbers.length > 0) {
        // Encontramos la centena predominante de los canales de esta categoría
        const centenaryCounts: Record<number, number> = {};
        categoryNumbers.forEach((num) => {
          const cent = Math.floor(num / 100) * 100;
          centenaryCounts[cent] = (centenaryCounts[cent] || 0) + 1;
        });

        let dominantBlockStart = 100;
        let maxCount = -1;
        for (const [centStr, count] of Object.entries(centenaryCounts)) {
          const cent = Number(centStr);
          if (count > maxCount) {
            maxCount = count;
            dominantBlockStart = cent;
          }
        }

        const blockStart = dominantBlockStart === 0 ? 1 : dominantBlockStart;
        const blockEnd = dominantBlockStart + 99;
        const startCandidate = dominantBlockStart === 0 ? 1 : dominantBlockStart;

        const usedSet = new Set(categoryNumbers);

        // Busca el primer entero libre de startCandidate a blockEnd (evita asignar 0)
        for (let candidate = startCandidate; candidate <= blockEnd; candidate++) {
          if (!usedSet.has(candidate)) {
            return {
              channelNumber: candidate,
              blockStart,
              blockEnd,
              isNewCategory: false,
              isFull: false,
            };
          }
        }

        // Si se llenaron los canales del bloque, pasa a la siguiente centena libre
        const nextBlockStart = Math.floor(maxGlobalNumber / 100) * 100 + 100;
        return {
          channelNumber: nextBlockStart,
          blockStart: nextBlockStart,
          blockEnd: nextBlockStart + 99,
          isNewCategory: false,
          isFull: true,
          warning: `El bloque (${blockStart}-${blockEnd}) está lleno. Se asignó la siguiente centena libre (${nextBlockStart}).`,
        };
      }
    }

    // Caso 2: Es una Categoría Nueva
    let newBlockStart = 100;
    if (maxGlobalNumber >= 100) {
      newBlockStart = Math.floor(maxGlobalNumber / 100) * 100 + 100;
    }

    return {
      channelNumber: newBlockStart,
      blockStart: newBlockStart,
      blockEnd: newBlockStart + 99,
      isNewCategory: true,
      isFull: false,
    };
  },

  /**
   * Crea un nuevo canal en la tabla correspondiente.
   * Por defecto: is_active = true, en_mantenimiento = false, order_num = channel_number.
   */
  async createChannel(
    channelData: {
      name: string;
      category: string;
      logo_url?: string | null;
      stream_url: string;
      channel_number: number;
      order_num?: number | null;
      is_active?: boolean;
      en_mantenimiento?: boolean;
    },
    table: ChannelTable = 'channels'
  ): Promise<{ success: boolean; data?: Channel; error?: string }> {
    try {
      const cleanName = channelData.name.trim().toUpperCase();
      const formattedCat = formatCategory(channelData.category);

      const insertPayload = {
        name: cleanName,
        category: formattedCat,
        logo_url: channelData.logo_url?.trim() || null,
        stream_url: channelData.stream_url.trim(),
        channel_number: channelData.channel_number,
        order_num: channelData.order_num ?? channelData.channel_number,
        is_active: channelData.is_active ?? true,
        en_mantenimiento: channelData.en_mantenimiento ?? false,
      };

      const { data, error } = await (supabase.from(table) as any)
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: data as Channel };
    } catch (err: any) {
      console.error(`Error creating in ${table}:`, err);
      return { success: false, error: err.message || 'Error al crear canal' };
    }
  },

  /**
   * Actualiza un canal existente.
   */
  async updateChannel(
    id: string,
    channelData: Partial<{
      name: string;
      category: string;
      logo_url: string | null;
      stream_url: string;
      channel_number: number;
      order_num: number | null;
      is_active: boolean;
      en_mantenimiento: boolean;
    }>,
    table: ChannelTable = 'channels'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updatePayload: any = { ...channelData };
      if (updatePayload.name) {
        updatePayload.name = updatePayload.name.trim().toUpperCase();
      }
      if (updatePayload.category) {
        updatePayload.category = formatCategory(updatePayload.category);
      }
      if (updatePayload.stream_url) {
        updatePayload.stream_url = updatePayload.stream_url.trim();
      }
      if (updatePayload.logo_url !== undefined) {
        updatePayload.logo_url = updatePayload.logo_url?.trim() || null;
      }

      const { error } = await (supabase.from(table) as any)
        .update(updatePayload)
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error(`Error updating in ${table}:`, err);
      return { success: false, error: err.message || 'Error al actualizar canal' };
    }
  },

  /**
   * Elimina un canal.
   */
  async deleteChannel(id: string, table: ChannelTable = 'channels'): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase.from(table) as any).delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error(`Error deleting from ${table}:`, err);
      return { success: false, error: err.message || 'Error al eliminar canal' };
    }
  },

  /**
   * Conmutador rápido para is_active.
   */
  async toggleActive(
    id: string,
    currentState: boolean | null,
    table: ChannelTable = 'channels'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase.from(table) as any)
        .update({ is_active: !currentState })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Conmutador rápido para en_mantenimiento.
   */
  async toggleMaintenance(
    id: string,
    currentState: boolean,
    table: ChannelTable = 'channels'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase.from(table) as any)
        .update({ en_mantenimiento: !currentState })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};
