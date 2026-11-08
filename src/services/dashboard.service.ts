import { supabase } from '../lib/supabase';
import { AppInstallation, UserRole } from '../types';

export interface DashboardMetrics {
  totalInstallations: number;
  totalChannels: number;
  totalAdultChannels: number;
  activeInstallations: number;
  blockedInstallations: number;
  adultContentInstallations: number;
  recentInstallations: AppInstallation[];
  devicesByModel: { model: string; count: number }[];
}

export const dashboardService = {
  async getMetrics(userRole: UserRole | null, companyCode: string | null): Promise<DashboardMetrics> {
    const isMultiuser = userRole === 'multiuser';

    // 1. Conteo de Instalaciones (filtrado por compañía si es multiuser)
    let installationsQuery = supabase
      .from('app_installations')
      .select('*', { count: 'exact' });

    if (isMultiuser && companyCode) {
      installationsQuery = installationsQuery.eq('company', companyCode);
    }

    const { data: installationsData, count: totalInstallations } = await installationsQuery;
    const installationsList = (installationsData as AppInstallation[]) || [];

    // Calcular estadísticas secundarias
    let activeInstallations = 0;
    let blockedInstallations = 0;
    let adultContentInstallations = 0;
    const modelCounts: Record<string, number> = {};

    installationsList.forEach((device) => {
      if (device.is_active && !device.is_blocked) {
        activeInstallations++;
      }
      if (device.is_blocked) {
        blockedInstallations++;
      }
      if (device.adult_content) {
        adultContentInstallations++;
      }
      const model = device.device_model || 'Desconocido / Genérico';
      modelCounts[model] = (modelCounts[model] || 0) + 1;
    });

    const devicesByModel = Object.entries(modelCounts)
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Obtener las 5 instalaciones más recientes
    const recentInstallations = [...installationsList]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    // 2. Conteo de Canales Generales
    let totalChannels = 0;
    try {
      const { count } = await supabase
        .from('channels')
        .select('*', { count: 'exact', head: true });
      totalChannels = count || 0;
    } catch (err) {
      console.warn('Error counting channels:', err);
    }

    // 3. Conteo de Canales Adultos
    let totalAdultChannels = 0;
    try {
      const { count } = await supabase
        .from('adult_channels')
        .select('*', { count: 'exact', head: true });
      totalAdultChannels = count || 0;
    } catch (err) {
      console.warn('Error counting adult channels:', err);
    }

    return {
      totalInstallations: totalInstallations || installationsList.length || 0,
      totalChannels,
      totalAdultChannels,
      activeInstallations,
      blockedInstallations,
      adultContentInstallations,
      recentInstallations,
      devicesByModel,
    };
  },
};

