import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user_data')
    try {
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('token') || '')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      api.get('/api/auth/me')
        .then(u => {
          setUser(u)
          localStorage.setItem('user_data', JSON.stringify(u))
        })
        .catch(() => {
          logout()
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const login = async (username, password, role) => {
    const res = await api.post('/api/auth/login', { username, password, role })
    localStorage.setItem('token', res.access_token)
    localStorage.setItem('user_data', JSON.stringify(res.user))
    setToken(res.access_token)
    setUser(res.user)
    return res.user
  }

  const register = async (data) => {
    const res = await api.post('/api/auth/register', data)
    localStorage.setItem('token', res.access_token)
    localStorage.setItem('user_data', JSON.stringify(res.user))
    setToken(res.access_token)
    setUser(res.user)
    return res.user
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user_data')
    setToken('')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isPolice: user?.role === 'police',
        isCitizen: user?.role === 'citizen'
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
