// Servicio de autenticación conectado al Backend

const API_URL = 'http://localhost:3001/api';
const TOKEN_KEY = 'auth_token_v1';
const USER_KEY = 'auth_user_v1';

export const fakeAuth = {
  async login(username, password) {
    try {
      // Enviamos 'username' porque el backend espera ese campo (sirve para usuario o correo)
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();

      if (data.ok) {
        // TRADUCCIÓN CLAVE: Mapeamos el rol de la BD ('Administrador') al del frontend ('admin')
        const userToStore = {
          ...data.user,
          role: data.user.role === 'Administrador' ? 'admin' : 'user'
        };

        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(userToStore));
        return { ok: true, user: userToStore };
      } else {
        return { ok: false, message: data.message || 'Credenciales inválidas' };
      }
    } catch (error) {
      console.error("Error en login:", error);
      return { ok: false, message: 'Error de conexión con el servidor' };
    }
  },

  async resetPassword(data) {
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      return { ok: false, message: error.message };
    }
  },

  async logout() {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Error notificando logout al servidor:", error);
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser() {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  // --- GESTIÓN DE USUARIOS (Conectado a BD) ---

  async getUsers() {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Error al cargar usuarios');
      const users = await response.json();
      
      // Mapeamos los datos de la BD (español) al formato del frontend (inglés)
      return users.map(u => ({
        id: u.id,
        firstName: u.nombre,
        lastName: u.apellido,
        username: u.username,
        email: u.correo,
        // TRADUCCIÓN CLAVE: Si la BD dice 'Administrador', el front recibe 'admin'
        role: u.rol === 'Administrador' ? 'admin' : 'user',
        rol_id: u.rol_id, // Pasamos el ID real para poder editarlo correctamente
        status: u.estado
      }));
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  async getRoles() {
    try {
      const response = await fetch(`${API_URL}/catalogs/roles`);
      if (!response.ok) throw new Error('Error al cargar roles');
      return await response.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  async register(newUser) {
    // Mapeamos los datos del frontend a la estructura de la BD
    const userForDb = {
      nombre: newUser.firstName,
      apellido: newUser.lastName,
      username: newUser.username,
      correo: newUser.email,
      password: newUser.password,
      rol_id: newUser.roleId // Usamos el ID seleccionado directamente
    };

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userForDb),
      });
      const data = await response.json();
      return data.id ? { ok: true } : { ok: false, message: data.error };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  },

  async deleteUser(id) {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      await fetch(`${API_URL}/users/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  },

  async updateUser(id, updatedUser) {
    const userForDb = {
      nombre: updatedUser.firstName,
      apellido: updatedUser.lastName,
      username: updatedUser.username,
      correo: updatedUser.email,
      rol_id: updatedUser.roleId, // Usamos el ID seleccionado directamente
      estado: 1
    };

    // Solo enviamos la contraseña si el usuario escribió algo nuevo
    if (updatedUser.password) {
      userForDb.password = updatedUser.password;
    }

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userForDb),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return { ok: false, message: errorData.error || 'Error al actualizar usuario' };
      }
      
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }
};
