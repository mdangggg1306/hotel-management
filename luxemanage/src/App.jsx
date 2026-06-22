import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { RequireAdmin, RequireUser } from './components/PrivateRoute'

import HomePage           from './pages/HomePage'
import LoginPage          from './pages/LoginPage'
import RegisterPage       from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage  from './pages/ResetPasswordPage'
import UserPortalPage     from './pages/UserPortalPage'

// Admin pages
import DashboardPage      from './pages/DashboardPage'
import RoomMatrixPage     from './pages/RoomMatrixPage'
import ReservationsPage   from './pages/ReservationsPage'
import CustomersPage      from './pages/CustomersPage'
import BillingPage        from './pages/BillingPage'

import './index.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ===== PUBLIC ===== */}
          <Route path="/"                element={<HomePage />} />
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password"  element={<ResetPasswordPage />} />

          {/* ===== USER (khách đặt phòng) ===== */}
          <Route path="/portal" element={
            <RequireUser><UserPortalPage /></RequireUser>
          } />

          {/* ===== ADMIN (quản trị) ===== */}
          <Route path="/dashboard" element={
            <RequireAdmin><DashboardPage /></RequireAdmin>
          } />
          <Route path="/room-matrix" element={
            <RequireAdmin><RoomMatrixPage /></RequireAdmin>
          } />
          <Route path="/reservations" element={
            <RequireAdmin><ReservationsPage /></RequireAdmin>
          } />
          <Route path="/customers" element={
            <RequireAdmin><CustomersPage /></RequireAdmin>
          } />
          <Route path="/billing" element={
            <RequireAdmin><BillingPage /></RequireAdmin>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
