import React, { useState } from 'react';
import { Tv, Shield, ArrowRight, Lock, KeyRound, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginView: React.FC = () => {
  const { login, isLoading, error: authError } = useAuth();
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setLocalError('Por favor ingrese el código de empresa o administrador.');
      return;
    }
    setLocalError(null);
    const result = await login(code);
    if (!result.success) {
      setLocalError(result.error || 'Credenciales incorrectas');
    }
  };

  const handleQuickFill = (presetCode: string) => {
    setCode(presetCode);
    setLocalError(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0F17] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-tr from-emerald-600/30 to-emerald-400/10 border border-emerald-500/30 rounded-2xl mb-4 shadow-xl shadow-emerald-950/40">
            <Tv className="w-9 h-9 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
            LOKI <span className="text-emerald-400">TV</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1.5 font-medium">
            Portal Administrativo • Fase 1
          </p>
        </div>

        {/* Login Box */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 shadow-2xl border border-gray-800/80">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-800">
            <div>
              <h2 className="text-lg font-semibold text-white">Inicio de Sesión</h2>
              <p className="text-xs text-gray-400">Acceso exclusivo a empresas autorizadas</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Supabase RLS
            </div>
          </div>

          {(localError || authError) && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs sm:text-sm flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div>{localError || authError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2 uppercase tracking-wider">
                Código de Empresa / Credencial
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <KeyRound className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ej: admin, loki, comp123"
                  className="w-full pl-11 pr-4 py-3 bg-[#0B0F17]/80 border border-gray-700/80 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Validando permisos...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Portal</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Access Rules Reminder */}
          <div className="mt-6 pt-5 border-t border-gray-800/80 text-xs text-gray-400 space-y-2">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Políticas de Acceso:</strong> Solo usuarios de <code className="text-gray-300">companies</code> con <code className="text-gray-300">is_blocked = false</code> y rol <code className="text-emerald-400">admin</code> o <code className="text-emerald-400">multiuser</code>.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
              <span>
                <strong>Aislamiento Multi-inquilino:</strong> El rol <code className="text-emerald-400">multiuser</code> solo visualizará y modificará instalaciones de su propia compañía.
              </span>
            </div>
          </div>

          {/* Quick Helper for Testing / Demo */}
          <div className="mt-4 pt-3 border-t border-gray-800/50">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Códigos de prueba habituales:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className="px-2.5 py-1 bg-gray-800/80 hover:bg-gray-700 text-gray-300 text-xs rounded-lg border border-gray-700/60 transition-colors"
              >
                admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('lokitv')}
                className="px-2.5 py-1 bg-gray-800/80 hover:bg-gray-700 text-gray-300 text-xs rounded-lg border border-gray-700/60 transition-colors"
              >
                lokitv
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('demo')}
                className="px-2.5 py-1 bg-gray-800/80 hover:bg-gray-700 text-gray-300 text-xs rounded-lg border border-gray-700/60 transition-colors"
              >
                demo
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Loki TV &copy; {new Date().getFullYear()} • Sistema de Gestión y Monitoreo de Dispositivos
        </p>
      </div>
    </div>
  );
};

