import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Company, UserRole } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: Company | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isMultiuser: boolean;
  currentCompanyCode: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'lokitv_portal_company_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const validateAndSetCompany = useCallback((company: Company): { valid: boolean; error?: string } => {
    // 1. Verificar is_blocked / is_active
    // Si is_blocked está presente y es true
    if (company.is_blocked === true) {
      return {
        valid: false,
        error: 'Esta cuenta/empresa se encuentra bloqueada (is_blocked = true). Contacte a soporte.',
      };
    }
    // Si is_active es explícitamente false
    if (company.is_active === false) {
      return {
        valid: false,
        error: 'Esta cuenta/empresa se encuentra inactiva (is_active = false).',
      };
    }

    // 2. Verificar tipo: solo admin o multiuser
    const allowedTypes: UserRole[] = ['admin', 'multiuser'];
    const currentType = (company.type?.toLowerCase() || '') as UserRole;
    if (!allowedTypes.includes(currentType)) {
      return {
        valid: false,
        error: `Acceso restringido. Solo los roles 'admin' o 'multiuser' pueden ingresar al portal (Tipo actual: ${company.type || 'desconocido'}).`,
      };
    }

    return { valid: true };
  }, []);

  const login = async (code: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      const cleanCode = code.trim().toLowerCase();
      if (!cleanCode) {
        const msg = 'Por favor ingrese el código de empresa.';
        setError(msg);
        setIsLoading(false);
        return { success: false, error: msg };
      }

      // Consultar la tabla companies por código
      const { data, error: queryError } = await supabase
        .from('companies')
        .select('*')
        .or(`code.eq.${cleanCode},code.eq.${code.trim()}`)
        .maybeSingle();

      if (queryError) {
        console.error('Error al consultar empresa:', queryError);
        const msg = `Error al consultar la base de datos: ${queryError.message}`;
        setError(msg);
        setIsLoading(false);
        return { success: false, error: msg };
      }

      if (!data) {
        const msg = `No se encontró ninguna empresa registrada con el código "${code}".`;
        setError(msg);
        setIsLoading(false);
        return { success: false, error: msg };
      }

      const company = data as Company;
      const validation = validateAndSetCompany(company);

      if (!validation.valid) {
        setError(validation.error || 'Credenciales no autorizadas.');
        setIsLoading(false);
        return { success: false, error: validation.error };
      }

      // Guardar sesión
      setUser(company);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(company));
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Error inesperado durante la autenticación.';
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const refreshUser = async () => {
    if (!user?.code) return;
    try {
      const { data, error: queryError } = await supabase
        .from('companies')
        .select('*')
        .eq('code', user.code)
        .maybeSingle();

      if (!queryError && data) {
        const company = data as Company;
        const validation = validateAndSetCompany(company);
        if (validation.valid) {
          setUser(company);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(company));
        } else {
          logout();
        }
      }
    } catch (err) {
      console.warn('Error al refrescar sesión de usuario:', err);
    }
  };

  // Inicializar sesión desde localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Company;
          if (parsed && parsed.code) {
            // Validar de nuevo contra la BD
            const { data } = await supabase
              .from('companies')
              .select('*')
              .eq('code', parsed.code)
              .maybeSingle();

            if (data) {
              const freshCompany = data as Company;
              const validation = validateAndSetCompany(freshCompany);
              if (validation.valid) {
                setUser(freshCompany);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(freshCompany));
              } else {
                localStorage.removeItem(STORAGE_KEY);
              }
            } else {
              // Si no se puede verificar pero hay cache, verificamos si es válido
              const validation = validateAndSetCompany(parsed);
              if (validation.valid) {
                setUser(parsed);
              } else {
                localStorage.removeItem(STORAGE_KEY);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error restaurando sesión:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [validateAndSetCompany]);

  const role = (user?.type?.toLowerCase() as UserRole) || null;
  const isAdmin = role === 'admin';
  const isMultiuser = role === 'multiuser';
  const currentCompanyCode = user?.code || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
        refreshUser,
        isAdmin,
        isMultiuser,
        currentCompanyCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

