import { createContext, useContext, useState } from 'react'
import api from '../api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('zemerp_user'))
    } catch {
      return null
    }
  })

  const login = async (email, password) => {
    const { data } = await api.post('/login', { email, password })
    localStorage.setItem('zemerp_token', data.token)
    localStorage.setItem('zemerp_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    try {
      await api.post('/logout')
    } catch {
      // ignore
    }
    localStorage.removeItem('zemerp_token')
    localStorage.removeItem('zemerp_user')
    setUser(null)
  }

  const updateUser = (u) => {
    localStorage.setItem('zemerp_user', JSON.stringify(u))
    setUser(u)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
