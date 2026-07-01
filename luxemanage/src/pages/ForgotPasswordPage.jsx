import { useState } from 'react'
import { Link } from 'react-router-dom'
import './ForgotPasswordPage.css'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message || 'Link khôi phục mật khẩu đã được gửi đến email của bạn.')
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
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
              <path d="M12 16v.01" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        <div className="forgot-logo">Luxury Hotel</div>
        <div className="forgot-system">ELITE HOSPITALITY SYSTEMS</div>

        {message && (
          <div className="hl-auth-success" style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '12px', borderRadius: '4px', marginBottom: '20px', fontSize: '0.9rem' }}>
            {message}
          </div>
        )}

        {error && (
          <div className="hl-auth-error" style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '12px', borderRadius: '4px', marginBottom: '20px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {!message && (
          <>
            <h1 className="forgot-title">Quên mật khẩu?</h1>
            <p className="forgot-desc">
              Nhập địa chỉ email của bạn dưới đây và chúng tôi sẽ gửi cho bạn hướng dẫn để khôi phục quyền truy cập.
            </p>

            <form onSubmit={handleSubmit} className="forgot-form">
              <input
                id="forgot-email"
                type="email"
                className="forgot-input"
                placeholder="Địa chỉ Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />

              <button
                type="submit"
                className={`btn-send ${isSubmitting ? 'loading' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? <span className="spinner-dark" /> : 'GỬI LINK KHÔI PHỤC'}
              </button>
            </form>
          </>
        )}


        <Link to="/login" className="back-to-login">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Quay lại đăng nhập
        </Link>

        <div className="forgot-footer">© 2024 Luxury Hotel Hospitality Systems. Bảo lưu mọi quyền.</div>
      </div>
    </div>
  )
}
