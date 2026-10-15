import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { PageContainer } from './PageContainer';
import { Drawer } from '../ui/Drawer';

export function Layout({ children, user, onLogout, onToggleTheme, theme = 'dark', className = '', noPageContainer = false, onStartNewAnalysis }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userRole = user?.role || 'PATIENT';

  return (
    <div
      className={`bg-[var(--bg-primary)] text-[var(--text-main)] flex flex-col font-sans transition-colors duration-200 ${
        noPageContainer ? 'h-screen max-h-screen overflow-hidden' : 'min-h-screen'
      }`}
    >
      {/* Desktop Fixed Left Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        userRole={userRole}
        user={user}
        onStartNewAnalysis={onStartNewAnalysis}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 min-h-0 ${
          noPageContainer ? 'h-screen max-h-screen overflow-hidden' : ''
        } ${
          isSidebarCollapsed ? 'lg:pl-[80px]' : 'lg:pl-[280px]'
        }`}
      >
        {/* Sticky Topbar */}
        <Topbar
          user={user}
          onLogout={onLogout}
          onToggleTheme={onToggleTheme}
          theme={theme}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        {/* Page Container */}
        <main
          className={`flex-1 flex flex-col min-h-0 ${
            noPageContainer ? 'h-[calc(100vh-72px)] max-h-[calc(100vh-72px)] overflow-y-auto custom-scrollbar' : ''
          }`}
          style={{ '--sidebar-width': isSidebarCollapsed ? '80px' : '280px' }}
        >
          {noPageContainer ? (
            children
          ) : (
            <PageContainer className={className}>
              {children}
            </PageContainer>
          )}
        </main>
      </div>

      {/* Mobile Menu Drawer */}
      <Drawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        title="TeleMed AI Navigation"
        position="left"
      >
        <div className="py-2">
          <Sidebar
            isCollapsed={false}
            onToggleCollapse={() => {}}
            userRole={userRole}
            user={user}
            onStartNewAnalysis={onStartNewAnalysis}
            className="!flex !static !w-full !border-none"
          />
        </div>
      </Drawer>
    </div>
  );
}
