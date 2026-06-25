import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './LoginPage.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const successMessage = location.state?.message
  const { login } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email, password)
    if (result.success) {
      if (result.user.role === 'ADMIN') {
        navigate('/dashboard')
      } else if (result.user.role === 'RECEPTIONIST') {
        navigate('/reception')
      } else {
        navigate('/portal')
      }
    } else {
      setError(result.message)
    }
    setLoading(false)
  }

  return (
    <div className="login-page">
      {/* Background */}
      <div className="login-bg">
        <div className="login-bg-overlay" />
      </div>

      {/* Card */}
      <div className="login-card">
        {/* Left Panel */}
        <div className="login-left slide-in-left">
          <div className="login-brand">
            <span className="brand-logo">LuxeManage</span>
            <span className="brand-tagline">Elite Hospitality Systems</span>
          </div>

          <div className="login-features">
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <div className="feature-title">CỔNG BẢO MẬT</div>
                <div className="feature-desc">Quản lý mã hóa đầu cuối cho danh mục bất động sản toàn cầu của bạn.</div>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <div>
                <div className="feature-title">THÔNG TIN CHI TIẾT THỜI GIAN THỰC</div>
                <div className="feature-desc">Truy cập các số liệu doanh thu và sở thích của khách hàng trong một bảng điều khiển thống nhất.</div>
              </div>
            </div>
          </div>

          <div className="login-footer-text">
            © 2024 LuxeManage Hospitality Systems. Đã đăng ký bản quyền.
          </div>
        </div>

        {/* Right Panel */}
        <div className="login-right slide-in-right">
          <div className="login-form-container">
            {/* Back to home */}
            <Link to="/" className="login-back-home">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Trang chủ
            </Link>

            <h1 className="login-title">Chào mừng trở lại</h1>
            <p className="login-subtitle">Vui lòng nhập thông tin xác thực để truy cập hệ thống.</p>

            <form onSubmit={handleSubmit} className="login-form">
              {successMessage && (
                <div className="login-success" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  {successMessage}
                </div>
              )}
              {error && (
                <div className="login-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="email">EMAIL / TÊN ĐĂNG NHẬP</label>
                <div className="input-wrapper">
                  <input
                    id="email"
                    type="text"
                    className="form-input"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                  <span className="input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">MẬT KHẨU</label>
                <div className="input-wrapper">
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <span className="input-icon" onClick={() => setShowPass(!showPass)}>
                    {showPass ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </span>
                </div>
              </div>

              <div className="login-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                  />
                  <span className="checkbox-custom"/>
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <Link to="/forgot-password" className="forgot-link">Quên mật khẩu?</Link>
              </div>

              <button type="submit" className={`btn-primary login-btn ${loading ? 'loading' : ''}`} disabled={loading}>
                {loading ? (
                  <span className="spinner"/>
                ) : (
                  <>
                    ĐĂNG NHẬP
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            <p className="login-support">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="support-link">Đăng ký ngay</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
