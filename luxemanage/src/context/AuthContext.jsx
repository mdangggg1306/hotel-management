/**
 * Auth Context - Quản lý trạng thái đăng nhập & phân quyền
 * Lưu trữ trong localStorage để giữ session khi reload
 */
import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const API_URL = 'http://localhost:3000/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Khôi phục session từ localStorage khi reload trang
    try {
      const saved = localStorage.getItem('luxemanage_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    const token = localStorage.getItem('luxemanage_token')
    if (token) {
      fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) {
          logout();
        }
      })
      .catch(() => logout())
    }
  }, [])

  // Hàm đăng ký
  const register = async (full_name, email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Đăng ký thất bại');
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Hàm đăng nhập
  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Đăng nhập thất bại');
      
      const safeUser = { ...data.user, name: data.user.full_name };
      setUser(safeUser);
      localStorage.setItem('luxemanage_token', data.token);
      localStorage.setItem('luxemanage_user', JSON.stringify(safeUser));
      
      return { success: true, user: safeUser };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Hàm đăng xuất
  const logout = () => {
    setUser(null)
    localStorage.removeItem('luxemanage_token')
    localStorage.removeItem('luxemanage_user')
  }

  // Helper checks
  const isAdmin = user?.role === 'ADMIN'
  const isUser  = user?.role === 'GUEST'
  const isLoggedIn = !!user

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAdmin, isUser, isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook tiện dụng
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
