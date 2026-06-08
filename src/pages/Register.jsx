import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { fakeAuth } from '../auth/fakeAuth'
import FormInput from '../components/FormInput'
import PrimaryButton from '../components/PrimaryButton'

export default function Register({ darkMode }) {
  const auth = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('create')
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [roleId, setRoleId] = useState('')
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    fakeAuth.getRoles().then(data => setRoles(data))
    if (activeTab === 'list') {
      fakeAuth.getUsers().then(data => setUsers(data))
    }
  }, [activeTab])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!auth.user || auth.user.role !== 'admin') {
      setMessage('No autorizado')
      return
    }

    let res
    if (editingId) {
      res = await fakeAuth.updateUser(editingId, { firstName, lastName, username, email, password, roleId })
    } else {
      res = await auth.register({ firstName, lastName, username, email, password, roleId })
    }

    if (!res.ok) {
      setMessage(res.message)
      return
    }
    setMessage(editingId ? 'Usuario actualizado' : 'Usuario creado')
    resetForm()
    if (editingId) {
      setActiveTab('list')
    }
    setTimeout(() => setMessage(''), 3000)
  }

  function resetForm() {
    setFirstName('')
    setLastName('')
    setUsername('')
    setEmail('')
    setPassword('')
    setRoleId(roles.length > 0 ? roles[0].id : '')
    setEditingId(null)
  }

  function handleEdit(user) {
    setFirstName(user.firstName || '')
    setLastName(user.lastName || '')
    setUsername(user.username || '')
    setEmail(user.email || '')
    setPassword(user.password || '')
    setRoleId(user.rol_id || (roles.length > 0 ? roles[0].id : ''))
    setEditingId(user.id)
    setActiveTab('create')
    setMessage('')
  }

  async function handleDelete(id) {
    if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
      if (window.confirm('Esta acción no se puede deshacer. ¿Confirmas la eliminación definitiva?')) {
        await fakeAuth.deleteUser(id)
        const updatedUsers = await fakeAuth.getUsers()
        setUsers(updatedUsers)
      }
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto pt-12 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={`text-3xl font-extrabold tracking-tight transition-colors ${darkMode ? 'text-white' : 'text-gray-900'}`}>Gestión de Usuarios</h1>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Administra los accesos al sistema</p>
        </div>
        <div className={`flex p-1 rounded-xl shadow-sm border transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <button
            onClick={() => {
              setActiveTab('create')
              resetForm()
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'create' 
                ? (darkMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-indigo-50 text-indigo-700 shadow-sm') 
                : (darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-600 hover:bg-gray-50')
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="20" x2="20" y1="8" y2="14"/><line x1="23" x2="17" y1="11" y2="11"/></svg>
            <span>Nuevo Usuario</span>
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'list' 
                ? (darkMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-indigo-50 text-indigo-700 shadow-sm') 
                : (darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-600 hover:bg-gray-50')
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>Ver Usuarios</span>
          </button>
        </div>
      </div>

      {activeTab === 'create' ? (
        <div className={`rounded-2xl shadow-sm border p-6 md:p-8 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{editingId ? 'Editar usuario' : 'Información del nuevo usuario'}</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <FormInput label="Nombre" type="text" name="firstName" value={firstName} onChange={(e)=>setFirstName(e.target.value)} darkMode={darkMode} />
              <FormInput label="Apellido" type="text" name="lastName" value={lastName} onChange={(e)=>setLastName(e.target.value)} darkMode={darkMode} />
            </div>
            <FormInput label="Usuario" type="text" name="username" value={username} onChange={(e)=>setUsername(e.target.value)} darkMode={darkMode} />
            <FormInput label="Correo electrónico" type="email" name="email" value={email} onChange={(e)=>setEmail(e.target.value)} darkMode={darkMode} />
            <FormInput 
              label={editingId ? "Nueva contraseña (opcional)" : "Contraseña"} 
              type="password" 
              name="password" 
              value={password} 
              onChange={(e)=>setPassword(e.target.value)}
              darkMode={darkMode} 
            />
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Rol de usuario</label>
              <select 
                value={roleId} 
                onChange={(e)=>setRoleId(e.target.value)} 
                className={`w-full rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 transition-colors border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-gray-300'}`}>
                <option value="">Seleccione un rol</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>{role.nombre}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">Los administradores tienen acceso completo al sistema.</p>
            </div>
            {message && (
              <div className={`p-3 rounded-lg text-sm ${message.includes('creado') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message}
              </div>
            )}
            <div className="pt-2">
              <PrimaryButton type="submit">{editingId ? 'Guardar cambios' : 'Crear usuario'}</PrimaryButton>
            </div>
          </form>
        </div>
      ) : (
        <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <div className="overflow-x-auto">
            <table className={`w-full text-left text-sm transition-colors ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              <thead className={`text-xs uppercase font-semibold transition-colors ${darkMode ? 'bg-slate-800/50 text-white' : 'bg-gray-50 text-gray-500'}`}>
                <tr>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Correo</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className={`divide-y transition-colors ${darkMode ? 'divide-slate-800' : 'divide-gray-100'}`}>
                {users.map((u, i) => (
                  <tr key={i} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50/50'}`}>
                    <td className={`px-6 py-4 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{u.username || '-'}</td>
                    <td className={darkMode ? 'text-slate-400' : 'text-gray-600'}>{u.firstName} {u.lastName}</td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        u.role === 'admin' 
                          ? (darkMode ? 'bg-purple-900/30 text-purple-400 border-purple-800/50' : 'bg-purple-100 text-purple-800 border-purple-200') 
                          : (darkMode ? 'bg-blue-900/30 text-blue-400 border-blue-800/50' : 'bg-blue-100 text-blue-800 border-blue-200')
                      }`}>
                        {u.role === 'admin' ? 'Administrador' : 'Analista'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => handleEdit(u)} 
                        className={`p-2 rounded-md transition-colors ${darkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-indigo-400' : 'text-gray-500 hover:bg-indigo-100 hover:text-indigo-600'}`}
                        title="Editar usuario"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(u.id)} 
                        className={`p-2 rounded-md transition-colors ${darkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-red-400' : 'text-gray-500 hover:bg-red-100 hover:text-red-600'}`}
                        title="Eliminar usuario"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="5" className={`px-6 py-8 text-center italic ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>No hay usuarios registrados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
