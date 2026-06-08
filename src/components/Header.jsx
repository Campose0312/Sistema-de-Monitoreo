import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Menu, Search, LogOut, Bell, AlertTriangle, CheckCircle2, ChevronRight, Clock } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { useAlerts } from '../context/AlertContext'

export default function Header({ toggleSidebar, isSidebarOpen, darkMode }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const auth = useAuth()
  const { recentCriticalCount, criticalEvents } = useAlerts()
  const navigate = useNavigate()

  const dropdownRef = useRef(null)
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const notifRef = useRef(null)

  function handleLogout() {
    auth.logout()
    navigate('/')
    setDropdownOpen(false)
    setShowLogoutConfirm(false)
  }

  // Estilo base del header que responde al estado del sidebar
  const headerWidthClass = isSidebarOpen ? 'left-0 md:left-64' : 'left-0';

  // Si no hay usuario, mostramos una versión simplificada del header en lugar de una vacía
  if (!auth || !auth.user) {
    return (
      <header className={`fixed top-0 right-0 ${headerWidthClass} z-40 h-14 bg-white border-b border-gray-200 flex items-center px-8 text-gray-400 text-sm font-medium`}>
        Cargando sistema de seguridad...
      </header>
    );
  }

  // Calculamos el nombre de la persona (priorizando nombre real)
  const personName = (auth.user.firstName || auth.user.lastName || auth.user.nombre || auth.user.apellido)
    ? `${auth.user.firstName || auth.user.nombre || ''} ${auth.user.lastName || auth.user.apellido || ''}`.trim()
    : (auth.user.username || 'Usuario');

  const userName = auth.user.username || 'usuario';
  const userRole = auth.user.role === 'admin' ? 'Administrador' : 'Analista'
  const userInitial = (personName.charAt(0) || 'U').toUpperCase()

  return (
    <header className={`fixed top-0 right-0 ${headerWidthClass} z-40 h-16 px-4 lg:px-8 flex items-center justify-between backdrop-blur-xl border-b shadow-sm transition-all duration-300 ${darkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white/70 border-slate-200/60'}`}>
      {/* Botón Hamburguesa */}
      <button 
        onClick={toggleSidebar}
        className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-all active:scale-95"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search Bar - Minimalista */}
      <div className="hidden md:flex items-center w-full max-w-xs lg:max-w-md relative group ml-4">
        <Search className={`absolute left-3.5 w-4 h-4 transition-colors ${darkMode ? 'text-slate-500 group-focus-within:text-indigo-400' : 'text-slate-400 group-focus-within:text-indigo-500'}`} />
        <input
          className={`flex h-10 w-full rounded-xl border px-3 py-2 text-sm transition-all pl-10 focus-visible:outline-none focus-visible:ring-2 ${darkMode ? 'bg-slate-800/40 border-slate-700 placeholder:text-slate-600 text-slate-200 focus-visible:ring-indigo-500/30' : 'bg-slate-100/40 border-slate-200/80 placeholder:text-slate-400 text-slate-900 focus-visible:ring-indigo-500/20'}`}
          placeholder="Buscar eventos, IPs o dispositivos..."
        />
      </div>

      {/* Actions & Profile - Lado Derecho */}
      <div className="flex items-center gap-3 sm:gap-5">
        
        {/* System Status Indicator */}
        <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-wider transition-all duration-500 ${
          recentCriticalCount > 0 
            ? 'bg-red-50 border-red-100 text-red-600 animate-pulse' 
            : 'bg-emerald-50 border-emerald-100 text-emerald-600'
        }`}>
          {recentCriticalCount > 0 ? (
            <AlertTriangle className="w-3.5 h-3.5" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
          <span className="hidden lg:inline">Sistema {recentCriticalCount > 0 ? 'en riesgo' : 'estable'}</span>
        </div>

        {/* Notification Center */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setNotifOpen(!notifOpen)}
            className={`relative p-2.5 rounded-xl transition-all active:scale-95 ${
              notifOpen ? 'bg-indigo-50 text-indigo-600' : darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-5 h-5" />
            {recentCriticalCount > 0 && (
              <span className="absolute top-2 right-2 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] text-white font-bold items-center justify-center">
                  {recentCriticalCount > 9 ? '9+' : recentCriticalCount}
                </span>
              </span>
            )}
          </button>

          {/* Notif Dropdown */}
          {notifOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl py-2 z-50 border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-5 py-3 border-b border-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm">Alertas Críticas</h3>
                <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Recientes</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {criticalEvents.length > 0 ? (
                  criticalEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="px-5 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-red-600">{event.eventType}</span>
                        <div className="flex items-center text-[10px] text-slate-400 font-mono">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{event.details}</p>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-8 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-200 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-medium">No hay amenazas detectadas</p>
                  </div>
                )}
              </div>
              <Link 
                to="/eventos" 
                onClick={() => setNotifOpen(false)}
                className="mx-4 my-2 flex items-center justify-center gap-2 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                Ver todas las alertas
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
        
        <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        <div className="relative" ref={dropdownRef}>
          {/* User Profile */}
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-3 pl-2 cursor-pointer group transition-all">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{personName}</span>
              <span className="text-[10px] text-gray-400 font-mono uppercase tracking-tighter">{userRole}</span>
            </div>
            <div className="relative flex shrink-0 overflow-hidden rounded-xl h-10 w-10 border border-slate-200 ring-4 ring-slate-50 group-hover:ring-indigo-50 group-hover:border-indigo-200 transition-all duration-300">
              <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-black text-sm">
                {userInitial}
              </span>
            </div>
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] py-2 z-50 border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-5 py-4 border-b border-slate-50 mb-1 bg-slate-50/50 rounded-t-2xl">
                <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-1">Sesión Activa</p>
                <p className="text-sm font-bold text-slate-800">@{userName}</p>
                <p className="text-[11px] text-slate-500 truncate font-mono">{auth.user.email}</p>
              </div>
              <button 
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center gap-3 w-full text-left px-5 py-3 text-sm text-red-500 font-bold hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Finalizar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cuadro de Confirmación de Cierre de Sesión */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`rounded-3xl shadow-[0_20px_70px_-10px_rgba(0,0,0,0.3)] w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 ${darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
            <div className="p-8 text-center">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-8 ${darkMode ? 'bg-red-500/10 text-red-500 ring-red-500/5' : 'bg-red-50 text-red-600 ring-red-50/50'}`}>
                <LogOut className="w-10 h-10" />
              </div>
              <h3 className={`text-xl font-black mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>¿Finalizar Sesión?</h3>
              <p className={`text-sm leading-relaxed px-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Estás a punto de salir del sistema de monitoreo. Tendrás que autenticarte de nuevo para acceder.
              </p>
            </div>
            <div className={`flex border-t ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className={`flex-1 px-6 py-4 text-sm font-bold transition-colors border-r ${darkMode ? 'text-slate-400 hover:bg-slate-800 border-slate-800' : 'text-slate-500 hover:bg-slate-50 border-slate-100'}`}
              >
                Cancelar
              </button>
              <button 
                onClick={handleLogout}
                className="flex-1 px-6 py-4 text-sm font-bold text-red-600 hover:bg-red-500/10 transition-colors"
              >
                Sí, Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}