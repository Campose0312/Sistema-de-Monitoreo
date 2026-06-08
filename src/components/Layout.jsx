import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import AlertSystem from './AlertSystem';

/**
 * Layout principal tipo Dashboard
 * Maneja Sidebar colapsable, Header fijo y Footer al final
 */
export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Función para alternar Sidebar
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="relative flex min-h-screen bg-slate-50 overflow-x-hidden">
      {/* Sidebar: Ahora le pasamos el estado directamente */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Contenedor principal */}
      <div
        className={`flex flex-col flex-1 transition-all duration-300
          ${sidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}
      >
        <Header toggleSidebar={toggleSidebar} isSidebarOpen={sidebarOpen} />

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-8 pt-36 pb-20 min-h-screen">
          {/* Sistema de alertas */}
          <AlertSystem />
          <div className="max-w-[1600px] mx-auto mt-8">{children}</div>
        </main>

        {/* Footer */}
        <Footer isSidebarOpen={sidebarOpen} />
      </div>
    </div>
  );
}