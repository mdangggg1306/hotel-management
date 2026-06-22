/**
 * PrivateRoute - Bảo vệ route theo role
 * adminOnly: chỉ admin được vào
 * userOnly:  chỉ user được vào
 * Nếu chưa login → redirect về /login
 */
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function RequireAuth({ children }) {
  const { isLoggedIn } = useAuth()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return children
}

export function RequireAdmin({ children }) {
  const { isLoggedIn, isAdmin } = useAuth()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (!isAdmin)    return <Navigate to="/portal" replace />
  return children
}

export function RequireUser({ children }) {
  const { isLoggedIn, isUser } = useAuth()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (!isUser)     return <Navigate to="/dashboard" replace />
  return children
}
