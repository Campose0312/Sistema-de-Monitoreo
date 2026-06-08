import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export default function Home(){
  const auth = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (auth.user) {
      navigate('/dashboard')
    } else {
      navigate('/login')
    }
  }, [auth.user, navigate])

  return null
}
