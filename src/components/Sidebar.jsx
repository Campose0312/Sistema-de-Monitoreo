import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  FileBarChart, 
  Users,
  Settings, 
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';

// Configuración de navegación centralizada
const NAVIGATION_CONFIG = [
  { 
    name: 'Dashboard', 
    path: '/dashboard', 
    icon: LayoutDashboard,
    description: 'Vista general'
  },
  { 
    name: 'Alertas', 
    path: '/eventos', 
    icon: ShieldAlert,
    description: 'Eventos críticos'
  },
  { 
    name: 'Reportes', 
    path: '/reportes', 
    icon: FileBarChart,
    description: 'Análisis de datos'
  },
  { 
    name: 'Usuarios', 
    path: '/register', 
    icon: Users, 
    adminOnly: true,
    description: 'Gestión de accesos'
  },
  { 
    name: 'Configuración', 
    path: '/configuracion', 
    icon: Settings,
    description: 'Ajustes del sistema'
  },
];

export default function Sidebar({ isOpen, toggleSidebar, darkMode }) {
  const location = useLocation();
  const { user } = useAuth();

  // Filtrar navegación por rol de usuario
  const filteredNav = NAVIGATION_CONFIG.filter(item => 
    !item.adminOnly || (item.adminOnly && user?.role === 'admin')
  );

  return (
    <aside className={`fixed top-0 left-0 h-full w-64 z-50 border-r shadow-sm transition-all duration-300 ease-in-out flex flex-col
      ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${darkMode ? 'bg-slate-900 text-slate-100 border-slate-800' : 'bg-white text-slate-900 border-slate-200'}
    `}>
      {/* Header del Sidebar */}
      <div className={`p-5 border-b ${darkMode ? 'border-slate-800' : 'border-slate-50'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg ${darkMode ? 'bg-indigo-600' : 'bg-slate-900'}`}>
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
            </div>
            <span className={`text-sm font-black tracking-tight uppercase ${darkMode ? 'text-white' : 'text-slate-800'}`}>Siem <span className="text-indigo-600">Core</span></span>
          </div>
          <button onClick={toggleSidebar} className={`md:hidden p-1 rounded ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* System Health Indicator */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">System: Operational</span>
        </div>
      </div>

      {/* Navegación Principal */}
      <nav className="flex-1 mt-4 px-3 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
          <Link
            key={item.path}
            to={item.path}
            className={`relative flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${
              isActive 
              ? (darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50/50 text-indigo-700') 
              : (darkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800')
            }`}
          >
            {isActive && <div className="absolute left-0 w-1 h-5 bg-indigo-600 rounded-r-full" />}
            <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight">{item.name}</span>
            </div>
          </Link>
          );
        })}
      </nav>

      {/* Sección Inferior - Estado de Red */}
      <div className={`p-4 border-t transition-colors ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/50 border-slate-100'}`}>
        <div className="space-y-2">
          <div className={`flex justify-between items-center text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            <span>Tráfico de Red</span>
            <span className={darkMode ? 'text-indigo-400' : 'text-indigo-600'}>84%</span>
          </div>
          <div className={`w-full rounded-full h-1 ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <div className="bg-indigo-500 h-1 rounded-full w-[84%] shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
          </div>
        </div>
      </div>
    </aside>
  );
}