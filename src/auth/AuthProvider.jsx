import React, { createContext, useContext, useEffect, useState } from 'react'
import { fakeAuth } from './fakeAuth'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => fakeAuth.getUser())

  useEffect(() => {
    setUser(fakeAuth.getUser())
  }, [])

  function login(email, password) {
    const res = fakeAuth.login(email, password)
    if (res.ok) {
      setUser(fakeAuth.getUser())
    }
    return res
  }

  function logout() {
    fakeAuth.logout()
    setUser(null)
  }

  function register(newUser) {
    return fakeAuth.register(newUser)
  }

  function hasRole(role) {
    return user && user.role === role
  }

  const value = { user, login, logout, register, hasRole }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
