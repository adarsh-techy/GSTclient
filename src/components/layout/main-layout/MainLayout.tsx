import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../../';
import { Topbar } from '../../';
import { BottomBar } from '../../';
import { AdvisorPanel } from '../../ui';
import { useTheme } from '../../../theme/ThemeContext';

export interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isSidebarCollapsed } = useTheme();

  return (
    <div
      className="layout flex min-h-screen transition-colors duration-150"
      style={{ backgroundColor: 'var(--custom-page-bg, var(--bg))' }}
    >
      <Sidebar />
      <div
        className={`content-wrapper flex-1 flex flex-col min-w-0 ${
          isSidebarCollapsed ? 'pl-0' : 'pl-0 lg:pl-[250px]'
        } w-full transition-all duration-300`}
      >
        <Topbar />
        <main className="main flex-1 p-3.5 sm:p-5 md:p-6 max-w-[1600px] w-full mx-auto animate-fade-in">
          {children || <Outlet />}
        </main>
        <BottomBar />
      </div>
      <AdvisorPanel />
    </div>
  );
};

export default MainLayout;
