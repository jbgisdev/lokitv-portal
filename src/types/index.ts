export * from './database.types';

export type NavigationTab = 
  | 'dashboard'
  | 'installations'
  | 'channels'
  | 'adult_channels'
  | 'users'
  | 'settings'
  | 'map';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

export interface InstallationFilterState {
  search: string;
  status: 'all' | 'active' | 'inactive' | 'blocked';
  adultContent: 'all' | 'enabled' | 'disabled';
  company: string; // for admin filtering by specific company
}

