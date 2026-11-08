import { supabase } from '../lib/supabase';
import { AppInstallation, InstallationFilterState, UserRole } from '../types';

export interface GetInstallationsParams {
  filter: InstallationFilterState;
  userRole: UserRole | null;
  userCompanyCode: string | null;
  page: number;
  pageSize: number;
}

export interface GetInstallationsResult {
  data: AppInstallation[];
  totalCount: number;
  error: string | null;
}

export const installationsService = {
  async getInstallations({
    filter,
    userRole,
    userCompanyCode,
    page,
    pageSize,
  }: GetInstallationsParams): Promise<GetInstallationsResult> {
    try {
      let query = supabase
        .from('app_installations')
        .select('*', { count: 'exact' });

      // 1. REGLA ESTRICTA DE ROLES:
      // Si el rol es multiuser, SOLO puede ver los registros de su compañía.
      if (userRole === 'multiuser') {
        if (!userCompanyCode) {
          return { data: [], totalCount: 0, error: 'Código de empresa no válido para usuario multiuser' };
        }
        query = query.eq('company', userCompanyCode);
      } else if (userRole === 'admin') {
        // Si es admin y seleccionó filtrar por una compañía específica:
        if (filter.company && filter.company !== 'all') {
          query = query.eq('company', filter.company);
        }
      } else {
        // Cualquier otro rol no tiene permisos para ver instalaciones
        return { data: [], totalCount: 0, error: 'Permisos insuficientes para ver instalaciones' };
      }

      // 2. Filtro de búsqueda (device_id, device_model, alias o company)
      if (filter.search && filter.search.trim()) {
        const term = filter.search.trim();
        query = query.or(`device_id.ilike.%${term}%,device_model.ilike.%${term}%,alias.ilike.%${term}%,company.ilike.%${term}%`);
      }

      // 3. Filtro por estado
      if (filter.status === 'active') {
        query = query.eq('is_active', true).or('is_blocked.is.null,is_blocked.eq.false');
      } else if (filter.status === 'inactive') {
        query = query.eq('is_active', false);
      } else if (filter.status === 'blocked') {
        query = query.eq('is_blocked', true);
      }

      // 4. Filtro por Contenido Adulto
      if (filter.adultContent === 'enabled') {
        query = query.eq('adult_content', true);
      } else if (filter.adultContent === 'disabled') {
        query = query.or('adult_content.is.null,adult_content.eq.false');
      }

      // 5. Ordenación
      query = query.order('created_at', { ascending: false });

      // 6. Paginación
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) {
        console.error('Error fetching installations:', error);
        return { data: [], totalCount: 0, error: error.message };
      }

      return {
        data: (data as AppInstallation[]) || [],
        totalCount: count || 0,
        error: null,
      };
    } catch (err: any) {
      console.error('Unexpected error in getInstallations:', err);
      return { data: [], totalCount: 0, error: err.message || 'Error inesperado' };
    }
  },

  async toggleActive(id: string, currentState: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase.from('app_installations') as any)
        .update({ is_active: !currentState })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async toggleBlocked(id: string, currentState: boolean | null): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase.from('app_installations') as any)
        .update({ is_blocked: !currentState })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async toggleAdultContent(id: string, currentState: boolean | null): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase.from('app_installations') as any)
        .update({ adult_content: !currentState })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async updateAlias(id: string, alias: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase.from('app_installations') as any)
        .update({ alias: alias.trim() || null })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async getCompaniesList(): Promise<{ code: string; name: string }[]> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('code, name')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching companies list:', err);
      return [];
    }
  },
};
