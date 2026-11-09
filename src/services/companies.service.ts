import { supabase } from '../lib/supabase';
import { Company, UserRole } from '../types';

export interface GetCompaniesFilter {
  search?: string;
  type?: string;
  status?: 'all' | 'active' | 'inactive' | 'blocked';
}

export interface CompanyWithDeviceCount extends Company {
  actual_devices_count?: number;
}

/**
 * Genera un código aleatorio único de 6 caracteres compuesto exclusivamente por letras minúsculas.
 */
export function generateRandomCompanyCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz'.split('');
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.slice(0, 6).join('');
}

export const companiesService = {
  /**
   * Obtiene la lista de empresas / usuarios con filtros y conteo de instalaciones reales.
   */
  async getCompanies(filter: GetCompaniesFilter = {}): Promise<{ data: CompanyWithDeviceCount[]; error: string | null }> {
    try {
      let query = (supabase.from('companies') as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (filter.type && filter.type !== 'all') {
        query = query.eq('type', filter.type);
      }

      if (filter.status === 'active') {
        query = query.eq('is_active', true);
      } else if (filter.status === 'inactive') {
        query = query.eq('is_active', false);
      } else if (filter.status === 'blocked') {
        query = query.eq('is_blocked', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      let companiesList = (data as CompanyWithDeviceCount[]) || [];

      // Consulta conteo real de dispositivos por empresa en app_installations
      try {
        const { data: installations } = await (supabase.from('app_installations') as any)
          .select('company');

        if (installations) {
          const countMap: Record<string, number> = {};
          installations.forEach((inst: any) => {
            if (inst.company) {
              const code = String(inst.company).toLowerCase().trim();
              countMap[code] = (countMap[code] || 0) + 1;
            }
          });

          companiesList = companiesList.map((comp) => ({
            ...comp,
            actual_devices_count: countMap[comp.code?.toLowerCase().trim()] || 0,
          }));
        }
      } catch (countErr) {
        console.warn('No se pudo obtener el conteo de dispositivos por empresa:', countErr);
      }

      // Filtrado por buscador en cliente para búsqueda instantánea
      if (filter.search && filter.search.trim()) {
        const term = filter.search.trim().toLowerCase();
        companiesList = companiesList.filter(
          (c) =>
            (c.name || '').toLowerCase().includes(term) ||
            (c.code || '').toLowerCase().includes(term) ||
            (c.alias || '').toLowerCase().includes(term)
        );
      }

      return { data: companiesList, error: null };
    } catch (err: any) {
      console.error('Error fetching companies:', err);
      return { data: [], error: err.message || 'Error al obtener empresas' };
    }
  },

  /**
   * Genera un código de 6 letras minúsculas asegurando que no exista en la base de datos.
   */
  async generateUniqueCompanyCode(): Promise<string> {
    for (let i = 0; i < 10; i++) {
      const code = generateRandomCompanyCode();
      const { data } = await (supabase.from('companies') as any)
        .select('code')
        .eq('code', code)
        .maybeSingle();

      if (!data) {
        return code;
      }
    }
    return generateRandomCompanyCode();
  },

  /**
   * Crea una nueva empresa / usuario en la tabla companies.
   */
  async createCompany(payload: {
    name: string;
    code: string;
    alias?: string | null;
    type: UserRole | string;
    installations_count?: number;
    is_active?: boolean;
    is_blocked?: boolean;
  }): Promise<{ success: boolean; data?: Company; error?: string }> {
    try {
      const cleanCode = payload.code.trim().toLowerCase();
      const isUser = payload.type === 'user';
      const cleanName = isUser ? cleanCode : (payload.name.trim() || cleanCode);

      // Verificar que el código no exista
      const { data: existing } = await (supabase.from('companies') as any)
        .select('code')
        .eq('code', cleanCode)
        .maybeSingle();

      if (existing) {
        return { success: false, error: `El código "${cleanCode}" ya está registrado en otra empresa o usuario.` };
      }

      const insertData: any = {
        name: cleanName,
        code: cleanCode,
        alias: isUser ? cleanCode : (payload.alias?.trim() || cleanName),
        type: payload.type || 'user',
        installations_count: isUser ? 1 : (payload.installations_count ?? 5),
        is_active: isUser ? false : (payload.is_active ?? true),
        is_blocked: isUser ? false : (payload.is_blocked ?? false),
      };

      const { data, error } = await (supabase.from('companies') as any)
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: data as Company };
    } catch (err: any) {
      console.error('Error creating company:', err);
      return { success: false, error: err.message || 'Error al crear empresa' };
    }
  },

  /**
   * Actualiza los datos de una empresa existente.
   */
  async updateCompany(
    id: number,
    payload: Partial<{
      name: string;
      code: string;
      alias: string | null;
      type: UserRole | string;
      installations_count: number;
      is_active: boolean;
      is_blocked: boolean;
    }>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = { ...payload };
      if (updateData.name) updateData.name = updateData.name.trim();
      if (updateData.code) updateData.code = updateData.code.trim().toLowerCase();
      if (updateData.alias !== undefined) updateData.alias = updateData.alias?.trim() || null;

      const { error } = await (supabase.from('companies') as any)
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error('Error updating company:', err);
      return { success: false, error: err.message || 'Error al actualizar empresa' };
    }
  },

  /**
   * Elimina una empresa de la base de datos.
   */
  async deleteCompany(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase.from('companies') as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting company:', err);
      return { success: false, error: err.message || 'Error al eliminar empresa' };
    }
  },

  /**
   * Conmuta el estado is_active de la empresa.
   */
  async toggleActive(id: number, currentState: boolean | null): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase.from('companies') as any)
        .update({ is_active: !currentState })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Conmuta el estado is_blocked de la empresa (si la columna existe, o simula con is_active).
   */
  async toggleBlocked(id: number, currentState: boolean | null): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase.from('companies') as any)
        .update({ is_blocked: !currentState })
        .eq('id', id);

      if (error) {
        // Si no existe la columna is_blocked, ajustamos is_active de forma invertida
        const fallback = await (supabase.from('companies') as any)
          .update({ is_active: currentState })
          .eq('id', id);
        if (fallback.error) throw fallback.error;
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};

