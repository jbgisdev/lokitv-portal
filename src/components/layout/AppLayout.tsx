import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { NavigationTab, ToastMessage } from '../../types';
import { DashboardView } from '../dashboard/DashboardView';
import { InstallationsView } from '../installations/InstallationsView';
import { ChannelsView } from '../channels/ChannelsView';
import { AdultChannelsView } from '../channels/AdultChannelsView';
import { UsersView } from '../users/UsersView';
import { PlaceholderView } from '../placeholder/PlaceholderView';
import { ToastContainer } from '../common/Toast';

export const AppLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: 'success' | 'error' | 'info' | 'warning', message: string, title?: string) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, type, message, title }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
    showToast('info', 'Actualizando datos desde Supabase...', 'Sincronización');
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans antialiased text-slate-800">
      {/* Sidebar (Left navigation) - Fijo / Estático */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Workspace Area (Right pane) */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-slate-50">
        {/* Header - Fijo en la parte superior */}
        <Header
          currentTab={currentTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Dynamic Content Body - SCROLL ÚNICAMENTE AQUÍ */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 text-slate-800">
          {currentTab === 'dashboard' && (
            <DashboardView
              key={refreshKey}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'installations' && (
            <InstallationsView
              key={refreshKey}
              onNotify={(type, msg) => showToast(type, msg)}
            />
          )}

          {currentTab === 'channels' && (
            <ChannelsView
              key={refreshKey}
              onNotify={(type, msg) => showToast(type, msg)}
            />
          )}

          {currentTab === 'adult_channels' && (
            <AdultChannelsView
              key={refreshKey}
              onNotify={(type, msg) => showToast(type, msg)}
            />
          )}

          {currentTab === 'users' && (
            <UsersView
              key={refreshKey}
              onNotify={(type, msg) => showToast(type, msg)}
            />
          )}

          {(currentTab === 'settings' || currentTab === 'map') && (
            <PlaceholderView
              tab={currentTab}
              onGoToDashboard={() => setCurrentTab('dashboard')}
            />
          )}
        </main>
      </div>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
