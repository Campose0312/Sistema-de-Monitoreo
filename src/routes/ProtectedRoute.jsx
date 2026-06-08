import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export default function ProtectedRoute({ children, requireRole }) {
  const auth = useAuth()
  if (!auth.user) {
    return <Navigate to="/login" replace />
  }
  if (requireRole && auth.user.role !== requireRole) {
    return <Navigate to="/" replace />
  }
  return children
}
