import { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Eventos from './pages/Eventos'
import Monitoreo from './pages/Monitoreo'
import Reportes from './pages/Reportes'
import Configuracion from './pages/Configuracion'
import ForgotPassword from './pages/ForgotPassword'
import ProtectedRoute from './routes/ProtectedRoute'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Footer from './components/Footer'
import AlertSystem from './components/AlertSystem'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [darkMode, setDarkMode] = useState(() => {
    // Persistencia básica del tema
    return localStorage.getItem('siem_dark_mode') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('siem_dark_mode', darkMode)
    // Sincronizar la clase 'dark' con el documento para habilitar variantes de Tailwind
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode])

  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  
  // Páginas que NO deben tener el diseño de dashboard (Header/Sidebar/etc)
  const isAuthPage = location.pathname === '/login' || location.pathname === '/forgot-password';

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    );
  }

  return (
    <div className={`relative flex min-h-screen transition-colors duration-300 overflow-x-hidden ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar Fijo */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} darkMode={darkMode} />

      {/* Contenedor de Contenido */}
      <div className={`flex flex-col flex-1 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        
        {/* Header Fijo */}
        <Header toggleSidebar={toggleSidebar} isSidebarOpen={sidebarOpen} darkMode={darkMode} />

        {/* Área de Contenido Principal */}
        <main className="flex-1 p-4 lg:p-8 pt-40 pb-24 min-h-[calc(100vh-56px)]">
          <AlertSystem />
          <div className="max-w-[1600px] mx-auto">
            <Routes>
              <Route path="/" element={<ProtectedRoute><Dashboard darkMode={darkMode} /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard darkMode={darkMode} /></ProtectedRoute>} />
              <Route
                path="/register"
                element={<ProtectedRoute requireRole="admin"><Register darkMode={darkMode} /></ProtectedRoute>}
              />
              <Route path="/eventos" element={<ProtectedRoute><Eventos darkMode={darkMode} /></ProtectedRoute>} />
              <Route path="/monitoreo" element={<ProtectedRoute><Monitoreo darkMode={darkMode} /></ProtectedRoute>} />
              <Route path="/reportes" element={<ProtectedRoute><Reportes darkMode={darkMode} /></ProtectedRoute>} />
              <Route path="/configuracion" element={<ProtectedRoute><Configuracion darkMode={darkMode} setDarkMode={setDarkMode} /></ProtectedRoute>} />
            </Routes>
          </div>
        </main>

        {/* Footer */}
        <Footer isSidebarOpen={sidebarOpen} darkMode={darkMode} />
      </div>
    </div>
  )
}

export default App
