export default function Footer({ isSidebarOpen, darkMode }) {
  const year = new Date().getFullYear()
  // IP local simulada, en producción se puede obtener dinámicamente
  const localIp = '192.168.1.124'
  
  const footerPositionClass = isSidebarOpen ? 'left-0 md:left-64' : 'left-0';

  return (
    <footer className={`fixed bottom-0 right-0 ${footerPositionClass} z-40 px-8 py-3 border-t text-[10px] flex justify-between items-center backdrop-blur-md transition-all duration-300 ${darkMode ? 'bg-slate-900/80 border-slate-800 text-slate-500' : 'bg-white/80 border-slate-200 text-slate-400'}`}>
      <div className="flex gap-4">
        <span>ESTADO: <span className="font-bold text-green-600">PROTEGIDO</span></span>
        <span className="text-indigo-600">IP LOCAL: {localIp}</span>
      </div>
      <div className="flex items-center gap-4">
        <span>© {year} Catatumbo Foods, C.A.</span>
        <div className="flex items-center gap-3 text-gray-400">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" title="Instagram" className="hover:text-gray-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" title="LinkedIn" className="hover:text-gray-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
          </a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" title="GitHub" className="hover:text-gray-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
          </a>
        </div>
      </div>
    </footer>
  )
}
