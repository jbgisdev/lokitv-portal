import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginView } from './components/auth/LoginView';
import { AppLayout } from './components/layout/AppLayout';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#0B0F17] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <p className="text-gray-400 text-sm font-medium animate-pulse">
          Iniciando Loki TV Portal...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return <AppLayout />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;

