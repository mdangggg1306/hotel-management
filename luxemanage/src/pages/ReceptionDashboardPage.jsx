import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LogIn, LogOut, Layers, ConciergeBell, TrendingUp,
  Clock, Star, CheckCircle, ChevronRight,
  RefreshCw, Users, Send, Zap, Grid3X3,
  CreditCard, Banknote, Building2, X, AlertCircle, Sparkles
} from 'lucide-react'
import Layout from '../components/Layout/Layout'
import { useAuth } from '../context/AuthContext'
import './ReceptionDashboardPage.css'

const TOKEN = () => localStorage.getItem('luxemanage_token')
const BASE   = 'http://localhost:3000'
const fmt    = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0)

const MEMBERSHIP_COLORS = {
  VIP:      { bg: 'rgba(201,168,76,0.2)',   color: '#c9a84c' },
  Platinum: { bg: 'rgba(148,163,184,0.2)', color: '#94a3b8' },
  Gold:     { bg: 'rgba(251,191,36,0.2)',  color: '#fbbf24' },
  Silver:   { bg: 'rgba(156,163,175,0.2)', color: '#9ca3af' },
  Member:   { bg: 'rgba(99,102,241,0.15)', color: '#818cf8' },
}

const PAYMENT_METHODS = [
  { value: 'PAY_AT_DESK', label: 'Tại quầy', icon: <Banknote size={14}/> },
  { value: 'CREDIT_CARD', label: 'Thẻ', icon: <CreditCard size={14}/> },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản', icon: <Building2 size={14}/> },
]

function timeGreeting(name) {
  const h = new Date().getHours()
  const prefix = h < 12 ? 'Chào buổi sáng' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'
  return `${prefix}, ${name?.split(' ').pop() || 'Nhân viên'}`
}

function MemberBadge({ tier }) {
  const style = MEMBERSHIP_COLORS[tier] || MEMBERSHIP_COLORS.Member
  return (
    <span className="rd-member-badge" style={{ background: style.bg, color: style.color }}>
      {tier === 'VIP' && <Star size={9} fill="currentColor" />}
      {tier}
    </span>
  )
}

function StatCard({ icon, label, value, sub, color = '#c9a84c', onClick }) {
  return (
    <div className={`rd-stat-card${onClick ? ' rd-stat-card--clickable' : ''}`} onClick={onClick}>
      <div className="rd-stat-icon" style={{ color }}>{icon}</div>
      <div className="rd-stat-value" style={{ color }}>{value}</div>
      <div className="rd-stat-label">{label}</div>
      {sub && <div className="rd-stat-sub">{sub}</div>}
    </div>
  )
}

/* ── Quick Checkout Modal ── */
function QuickCheckoutModal({ booking, onClose, onDone }) {
  const [payMethod, setPayMethod] = useState('PAY_AT_DESK')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const nights = Math.max(1, Math.round(
    (new Date(booking.check_out) - new Date(booking.check_in)) / 86400000
  ))
  const paidTotal = (booking.payments || []).filter(p => p.status === 'SUCCESS').reduce((s, p) => s + p.amount, 0)
  const remaining = booking.total_amount - paidTotal

  const handleCheckout = async () => {
    setSubmitting(true); setError('')
    try {
      const res = await fetch(`${BASE}/api/receptionist/bookings/${booking.id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify({ payment_method: remaining > 0 ? payMethod : undefined })
      })
      if (res.ok) { onDone() }
      else { const d = await res.json(); setError(d.error || 'Check-out thất bại') }
    } finally { setSubmitting(false) }
  }

  return (
    <div className="rd-modal-overlay" onClick={onClose}>
      <div className="rd-modal" onClick={e => e.stopPropagation()}>
        <div className="rd-modal-header">
          <div>
            <h3><LogOut size={16}/> Check-out nhanh</h3>
            <p>{booking.booking_code} · {booking.guest?.full_name}</p>
          </div>
          <button className="rd-modal-close" onClick={onClose}><X size={16}/></button>
        </div>
        <div className="rd-modal-body">
          <div className="rd-folio">
            <div className="rd-folio-row"><span>{booking.roomType?.name} × {nights} đêm</span><span>{fmt(booking.total_amount)}</span></div>
            {(booking.upsells || []).map(u => (
              <div key={u.id} className="rd-folio-row rd-folio-upsell">
                <span><Sparkles size={10}/> {u.service_name}</span><span>{fmt(u.price)}</span>
              </div>
            ))}
            {paidTotal > 0 && <div className="rd-folio-row rd-folio-paid"><span>Đã thanh toán</span><span>- {fmt(paidTotal)}</span></div>}
            <div className="rd-folio-row rd-folio-remaining">
              <span>Còn lại</span>
              <span style={{ color: remaining > 0 ? '#f87171' : '#34d399' }}>{fmt(remaining)}</span>
            </div>
          </div>
          {remaining > 0 && (
            <div className="rd-pay-methods">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.value}
                  className={`rd-pay-btn ${payMethod === m.value ? 'rd-pay-btn--active' : ''}`}
                  onClick={() => setPayMethod(m.value)}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
          )}
          {error && <div className="rd-error"><AlertCircle size={13}/> {error}</div>}
        </div>
        <div className="rd-modal-footer">
          <button className="rd-btn-cancel" onClick={onClose}>Hủy</button>
          <button className="rd-btn-confirm-co" onClick={handleCheckout} disabled={submitting}>
            {submitting ? 'Đang xử lý...' : <><LogOut size={14}/> Hoàn tất Check-out</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ReceptionDashboardPage() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [data, setData]         = useState(null)
  const [checkouts, setCheckouts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [shiftNote, setShiftNote] = useState(() => localStorage.getItem('rd_shift_note') || '')
  const [noteSaved, setNoteSaved] = useState(false)
  const [checkingIn, setCheckingIn] = useState(null)
  const [checkoutTarget, setCheckoutTarget] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [dashRes, coRes] = await Promise.all([
        fetch(`${BASE}/api/receptionist/dashboard`, { headers: { Authorization: `Bearer ${TOKEN()}` } }),
        fetch(`${BASE}/api/receptionist/checkouts-today`, { headers: { Authorization: `Bearer ${TOKEN()}` } })
      ])
      const [dashData, coData] = await Promise.all([dashRes.json(), coRes.json()])
      setData(dashData)
      setCheckouts(Array.isArray(coData) ? coData : [])
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleSaveNote = () => {
    localStorage.setItem('rd_shift_note', shiftNote)
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 2000)
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  if (loading) {
    return (
      <Layout>
        <div className="rd-loading">
          <div className="rd-spinner" />
          <span>Đang tải dữ liệu...</span>
        </div>
      </Layout>
    )
  }

  const checkins     = data?.checkInsDetails || []
  const pendingCIs   = checkins.filter(b => b.status !== 'CHECKED_IN')
  const doneCIs      = checkins.filter(b => b.status === 'CHECKED_IN')

  return (
    <Layout>
      <div className="rd-page">
        {/* ── Header ── */}
        <div className="rd-header">
          <div className="rd-header-left">
            <h1 className="rd-greeting">{timeGreeting(user?.full_name)}</h1>
            <p className="rd-subline">
              <span className="rd-date">{dateStr}</span>
              {data?.occupancyRate !== undefined && (
                <span className="rd-occupancy">
                  <TrendingUp size={13} />
                  Khách sạn đạt <strong>{data.occupancyRate}%</strong> công suất
                </span>
              )}
            </p>
          </div>
          <button className="rd-btn-refresh" onClick={fetchAll} title="Làm mới">
            <RefreshCw size={14} />
            Làm mới
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="rd-stats">
          <StatCard icon={<LogIn size={22} />} label="Khách đến hôm nay"
            value={data?.checkInsToday ?? '—'} sub={`${pendingCIs.length} chờ check-in`} color="#c9a84c"
          />
          <StatCard icon={<LogOut size={22} />} label="Khách trả phòng"
            value={data?.checkOutsToday ?? '—'} sub={`${checkouts.length} cần check-out`} color="#60a5fa"
            onClick={() => document.getElementById('rd-checkout-section')?.scrollIntoView({ behavior: 'smooth' })}
          />
          <StatCard icon={<Layers size={22} />} label="Phòng trống"
            value={data?.availableRooms ?? '—'} sub={`/ ${data?.totalRooms || '?'} phòng`} color="#34d399"
            onClick={() => navigate('/reception/rooms')}
          />
          <StatCard icon={<ConciergeBell size={22} />} label="Yêu cầu chờ"
            value={data?.pendingRequests ?? '—'} sub="Cần xử lý"
            color={data?.pendingRequests > 0 ? '#f87171' : '#34d399'}
            onClick={() => navigate('/reception/services')}
          />
        </div>

        {/* ── Quick Nav ── */}
        <div className="rd-quick-nav">
          <button className="rd-qnav-btn" onClick={() => navigate('/reception/bookings')}>
            <ChevronRight size={14}/> Quản lý tất cả Booking
          </button>
          <button className="rd-qnav-btn" onClick={() => navigate('/reception/rooms')}>
            <Grid3X3 size={14}/> Sơ đồ phòng
          </button>
          <button className="rd-qnav-btn" onClick={() => navigate('/reception/services')}>
            <ConciergeBell size={14}/> Yêu cầu dịch vụ
          </button>
        </div>

        {/* ── Main Grid ── */}
        <div className="rd-grid">
          {/* Left: Check-in queue */}
          <div className="rd-card rd-checkin-list">
            <div className="rd-card-header">
              <div className="rd-card-title">
                <LogIn size={16} /> Khách đến hôm nay
              </div>
              <span className="rd-badge-count">{checkins.length} booking</span>
            </div>

            {checkins.length === 0 ? (
              <div className="rd-empty">
                <CheckCircle size={40} />
                <p>Không có khách check-in hôm nay</p>
              </div>
            ) : (
              <div className="rd-guest-list">
                {checkins.map(booking => {
                  const isCheckedIn = booking.status === 'CHECKED_IN'
                  const tier = booking.guest?.membership_tier || 'Member'
                  const initials = (booking.guest?.full_name || 'G')
                    .split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
                  return (
                    <div key={booking.id} className={`rd-guest-row ${isCheckedIn ? 'rd-guest-row--done' : ''}`}>
                      <div className="rd-guest-avatar">{initials}</div>
                      <div className="rd-guest-info">
                        <div className="rd-guest-name">
                          {booking.guest?.full_name}
                          <MemberBadge tier={tier} />
                        </div>
                        <div className="rd-guest-meta">
                          <span>{booking.booking_code}</span>
                          <span>·</span>
                          <span>{booking.roomType?.name}</span>
                          {booking.room && <><span>·</span><span>Phòng {booking.room.room_number}</span></>}
                        </div>
                      </div>
                      <div className="rd-guest-time">
                        <Clock size={12} />
                        {new Date(booking.check_in).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {isCheckedIn ? (
                        <span className="rd-status-done"><CheckCircle size={14} /> Đã CI</span>
                      ) : (
                        <button
                          className="rd-btn-checkin"
                          onClick={() => navigate(`/reception/checkin/${booking.id}`)}
                          disabled={checkingIn === booking.id}
                        >
                          <LogIn size={13} /> Check-in
                        </button>
                      )}
                      <button
                        className="rd-btn-more"
                        onClick={() => navigate(`/reception/checkin/${booking.id}`)}
                        title="Xem chi tiết"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="rd-right-panel">
            {/* Yêu cầu khẩn cấp */}
            <div className="rd-card rd-urgent-card">
              <div className="rd-card-header">
                <div className="rd-card-title"><Zap size={16} /> Yêu cầu khẩn cấp</div>
                {data?.pendingRequests > 0 && (
                  <span className="rd-badge-urgent">{data.pendingRequests} mới</span>
                )}
              </div>
              {data?.pendingRequests === 0 ? (
                <div className="rd-empty rd-empty--sm">
                  <CheckCircle size={28} style={{ color: '#34d399' }} />
                  <p>Không có yêu cầu khẩn cấp</p>
                </div>
              ) : (
                <div className="rd-urgent-cta">
                  <p className="rd-urgent-text">
                    Có <strong>{data?.pendingRequests}</strong> yêu cầu dịch vụ đang chờ xử lý.
                  </p>
                  <button className="rd-btn-goto-services" onClick={() => navigate('/reception/services')}>
                    <ConciergeBell size={14} /> Xem tất cả yêu cầu
                  </button>
                </div>
              )}
            </div>

            {/* Bàn giao ca */}
            <div className="rd-card rd-shift-card">
              <div className="rd-card-header">
                <div className="rd-card-title"><Users size={16} /> Bàn giao ca trực</div>
              </div>
              <div className="rd-shift-body">
                <textarea
                  className="rd-shift-textarea"
                  placeholder="Nhập chú ý quan trọng cho ca trực tiếp theo..."
                  value={shiftNote}
                  onChange={e => setShiftNote(e.target.value)}
                  rows={4}
                />
                <button
                  className={`rd-btn-save-shift ${noteSaved ? 'rd-btn-save-shift--saved' : ''}`}
                  onClick={handleSaveNote}
                >
                  {noteSaved
                    ? <><CheckCircle size={14} /> Đã lưu!</>
                    : <><Send size={14} /> Lưu & Kết thúc ca</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Checkout Queue ── */}
        <div id="rd-checkout-section" className="rd-card rd-checkout-section">
          <div className="rd-card-header">
            <div className="rd-card-title"><LogOut size={16}/> Khách trả phòng hôm nay</div>
            <span className="rd-badge-count">{checkouts.length} cần check-out</span>
          </div>
          {checkouts.length === 0 ? (
            <div className="rd-empty">
              <CheckCircle size={36} style={{ color: '#34d399' }}/>
              <p>Không có khách trả phòng hôm nay</p>
            </div>
          ) : (
            <div className="rd-guest-list">
              {checkouts.map(booking => {
                const tier = booking.guest?.membership_tier || 'Member'
                const paidTotal = (booking.payments || []).filter(p => p.status === 'SUCCESS').reduce((s, p) => s + p.amount, 0)
                const remaining = booking.total_amount - paidTotal
                return (
                  <div key={booking.id} className="rd-guest-row rd-checkout-row">
                    <div className="rd-guest-avatar" style={{ background: 'linear-gradient(135deg,#60a5fa,#3b82f6)' }}>
                      {(booking.guest?.full_name || 'G')[0]}
                    </div>
                    <div className="rd-guest-info">
                      <div className="rd-guest-name">
                        {booking.guest?.full_name}
                        <MemberBadge tier={tier}/>
                      </div>
                      <div className="rd-guest-meta">
                        <span>{booking.booking_code}</span>
                        <span>·</span>
                        <span>Phòng {booking.room?.room_number || booking.roomType?.name}</span>
                        <span>·</span>
                        <span style={{ color: remaining > 0 ? '#f87171' : '#34d399', fontWeight: 600 }}>
                          Còn lại: {fmt(remaining)}
                        </span>
                      </div>
                    </div>
                    <div className="rd-guest-time">
                      <Clock size={12}/>
                      Trả: {new Date(booking.check_out).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <button
                      className="rd-btn-checkout"
                      onClick={() => setCheckoutTarget(booking)}
                    >
                      <LogOut size={13}/> Check-out
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal checkout nhanh */}
      {checkoutTarget && (
        <QuickCheckoutModal
          booking={checkoutTarget}
          onClose={() => setCheckoutTarget(null)}
          onDone={() => { setCheckoutTarget(null); fetchAll() }}
        />
      )}
    </Layout>
  )
}
