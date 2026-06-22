import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import './ForgotPasswordPage.css' // Reuse the nice card styling from forgot password

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setError('Token không hợp lệ hoặc đã bị thiếu trên đường dẫn.')
    }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }

    setIsSubmitting(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Mật khẩu của bạn đã được cập nhật thành công.')
        setTimeout(() => navigate('/login'), 3000)
      } else {
        setError(data.error || 'Có lỗi xảy ra. Vui lòng thử lại.')
      }
    } catch (err) {
      setError('Không thể kết nối đến máy chủ.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="forgot-page">
      {/* Background */}
      <div className="forgot-bg">
        <div className="forgot-bg-overlay" />
      </div>

      {/* Modal Card */}
      <div className="forgot-card fade-in">
        <div className="forgot-icon-wrap">
          <div className="forgot-icon">
            {/* Lock icon for reset password */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0"/>
            </svg>
          </div>
        </div>

        <div className="forgot-logo">LuxeManage</div>
        <div className="forgot-system">ELITE HOSPITALITY SYSTEMS</div>

        {message && (
          <div className="hl-auth-success" style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '12px', borderRadius: '4px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>
            {message}
          </div>
        )}

        {error && (
          <div className="hl-auth-error" style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '12px', borderRadius: '4px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {!message && token && (
          <>
            <h1 className="forgot-title">Đặt lại mật khẩu</h1>
            <p className="forgot-desc">
              Vui lòng nhập mật khẩu mới bảo mật cho tài khoản của bạn.
            </p>

            <form onSubmit={handleSubmit} className="forgot-form">
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>MẬT KHẨU MỚI</label>
                <input
                  type="password"
                  className="forgot-input"
                  placeholder="Nhập mật khẩu mới"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>XÁC NHẬN MẬT KHẨU</label>
                <input
                  type="password"
                  className="forgot-input"
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                className={`btn-send ${isSubmitting ? 'loading' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? <span className="spinner-dark" /> : 'XÁC NHẬN ĐỔI MẬT KHẨU'}
              </button>
            </form>
          </>
        )}

        <Link to="/login" className="back-to-login" style={{ marginTop: '30px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Quay lại đăng nhập
        </Link>

        <div className="forgot-footer">© 2024 LuxeManage Hospitality Systems. Bảo lưu mọi quyền.</div>
      </div>
    </div>
  )
}
