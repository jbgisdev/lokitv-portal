export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'admin' | 'multiuser' | 'user';

export interface Company {
  id: number;
  code: string;
  name: string;
  alias: string | null;
  type: UserRole | string | null;
  is_active: boolean | null;
  is_blocked?: boolean | null;
  installations_count: number | null;
  created_at: string;
}

export interface AppInstallation {
  id: string;
  device_id: string;
  device_model: string | null;
  company: string | null;
  alias: string | null;
  app_version: string | null;
  os_version: string | null;
  is_active: boolean;
  is_blocked: boolean | null;
  adult_content: boolean | null;
  x: number | null;
  y: number | null;
  last_seen_at: string | null;
  created_at: string;
}

export interface Channel {
  id: string;
  name: string;
  channel_number: number | null;
  order_num: number | null;
  category: string | null;
  logo_url: string | null;
  stream_url: string;
  is_active: boolean | null;
  en_mantenimiento: boolean;
  created_at: string;
}

export interface AppSetting {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
  value_array: string[] | null;
}

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: Company;
        Insert: Partial<Company>;
        Update: Partial<Company>;
        Relationships: [];
      };
      app_installations: {
        Row: AppInstallation;
        Insert: Partial<AppInstallation>;
        Update: Partial<AppInstallation>;
        Relationships: [];
      };
      channels: {
        Row: Channel;
        Insert: Partial<Channel>;
        Update: Partial<Channel>;
        Relationships: [];
      };
      adult_channels: {
        Row: Channel;
        Insert: Partial<Channel>;
        Update: Partial<Channel>;
        Relationships: [];
      };
      app_settings: {
        Row: AppSetting;
        Insert: Partial<AppSetting>;
        Update: Partial<AppSetting>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
