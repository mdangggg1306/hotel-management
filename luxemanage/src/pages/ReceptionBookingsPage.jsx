import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, LogIn, LogOut, Clock, Star, RefreshCw,
  Plus, Filter, CheckCircle, X, CreditCard, Banknote,
  Building2, ChevronLeft, ChevronRight, Eye, AlertCircle,
  User, Phone, Mail, CalendarDays, Bed, Sparkles, Shield
} from 'lucide-react'
import Layout from '../components/Layout/Layout'
import './ReceptionBookingsPage.css'

const TOKEN = () => localStorage.getItem('luxury_hotel_token')
const BASE   = 'http://localhost:3000'

const fmt = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0)

const STATUS_CONFIG = {
  PENDING:    { label: 'Chờ xác nhận', cls: 'rb-status--pending',    bg: 'rgba(251,191,36,0.15)',  color: '#fbbf24' },
  CONFIRMED:  { label: 'Đã xác nhận', cls: 'rb-status--confirmed',  bg: 'rgba(99,102,241,0.15)', color: '#818cf8' },
  CHECKED_IN: { label: 'Đang lưu trú', cls: 'rb-status--checkedin', bg: 'rgba(52,211,153,0.15)', color: '#34d399' },
  CHECKED_OUT:{ label: 'Đã trả phòng', cls: 'rb-status--out',       bg: 'rgba(148,163,184,0.15)',color: '#94a3b8' },
  CANCELLED:  { label: 'Đã hủy',       cls: 'rb-status--cancelled',  bg: 'rgba(239,68,68,0.15)',  color: '#f87171' },
}

const MEMBERSHIP_COLORS = {
  VIP:      { bg: 'rgba(201,168,76,0.2)', color: '#c9a84c' },
  Platinum: { bg: 'rgba(148,163,184,0.2)', color: '#94a3b8' },
  Gold:     { bg: 'rgba(251,191,36,0.2)', color: '#fbbf24' },
  Silver:   { bg: 'rgba(156,163,175,0.2)', color: '#9ca3af' },
  Member:   { bg: 'rgba(99,102,241,0.15)', color: '#818cf8' },
}

const PAYMENT_METHODS = [
  { value: 'PAY_AT_DESK', label: 'Thanh toán tại quầy', icon: <Banknote size={16}/> },
  { value: 'CREDIT_CARD', label: 'Thẻ tín dụng / Ghi nợ', icon: <CreditCard size={16}/> },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng', icon: <Building2 size={16}/> },
]

function MemberBadge({ tier }) {
  const s = MEMBERSHIP_COLORS[tier] || MEMBERSHIP_COLORS.Member
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      background: s.bg, color: s.color,
      borderRadius: '20px', padding: '1px 7px', fontSize: '10px', fontWeight: 700
    }}>
      {tier === 'VIP' && <Star size={8} fill="currentColor"/>}
      {tier}
    </span>
  )
}

/* ── Checkout Modal ── */
function CheckoutModal({ booking, onClose, onDone }) {
  const [payMethod, setPayMethod] = useState('PAY_AT_DESK')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const nights = Math.max(1, Math.round(
    (new Date(booking.check_out) - new Date(booking.check_in)) / 86400000
  ))
  const upsellTotal = (booking.upsells || []).reduce((s, u) => s + u.price, 0)
  const paidTotal   = (booking.payments || []).filter(p => p.status === 'SUCCESS').reduce((s, p) => s + p.amount, 0)
  const remaining   = booking.total_amount - paidTotal

  const handleCheckout = async () => {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`${BASE}/api/receptionist/bookings/${booking.id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify({ payment_method: remaining > 0 ? payMethod : undefined })
      })
      if (res.ok) {
        onDone()
      } else {
        const d = await res.json()
        setError(d.error || 'Check-out thất bại')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rb-modal-overlay" onClick={onClose}>
      <div className="rb-modal rb-checkout-modal" onClick={e => e.stopPropagation()}>
        <div className="rb-modal-header">
          <div>
            <h3 className="rb-modal-title">
              <LogOut size={18}/> Check-out & Thanh toán
            </h3>
            <p className="rb-modal-sub">{booking.booking_code} · {booking.guest?.full_name}</p>
          </div>
          <button className="rb-modal-close" onClick={onClose}><X size={18}/></button>
        </div>

        <div className="rb-modal-body">
          {/* Folio */}
          <div className="rb-folio">
            <div className="rb-folio-title">Hóa đơn phòng (Folio)</div>
            <div className="rb-folio-row">
              <span>{booking.roomType?.name}</span>
              <span>{nights} đêm × {fmt(booking.roomType?.base_price)}</span>
            </div>
            {(booking.upsells || []).map(u => (
              <div key={u.id} className="rb-folio-row rb-folio-row--upsell">
                <span><Sparkles size={11}/> {u.service_name}</span>
                <span>{fmt(u.price)}</span>
              </div>
            ))}
            <div className="rb-folio-divider"/>
            <div className="rb-folio-row rb-folio-total">
              <span>Tổng cộng</span>
              <span>{fmt(booking.total_amount)}</span>
            </div>
            {paidTotal > 0 && (
              <div className="rb-folio-row rb-folio-paid">
                <span>Đã thanh toán</span>
                <span>- {fmt(paidTotal)}</span>
              </div>
            )}
            <div className="rb-folio-row rb-folio-remaining">
              <span>Còn lại</span>
              <span style={{ color: remaining > 0 ? '#f87171' : '#34d399', fontWeight: 700 }}>
                {fmt(remaining)}
              </span>
            </div>
          </div>

          {/* Phương thức thanh toán */}
          {remaining > 0 && (
            <div className="rb-pay-section">
              <div className="rb-pay-label">Phương thức thanh toán</div>
              <div className="rb-pay-methods">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.value}
                    className={`rb-pay-btn ${payMethod === m.value ? 'rb-pay-btn--active' : ''}`}
                    onClick={() => setPayMethod(m.value)}
                  >
                    {m.icon}
                    {m.label}
                    {payMethod === m.value && <CheckCircle size={14} className="rb-pay-check"/>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Thông tin phòng */}
          <div className="rb-checkout-info">
            <div className="rb-checkout-info-row">
              <Bed size={14}/>
              <span>Phòng {booking.room?.room_number || '—'} · {booking.roomType?.name}</span>
            </div>
            <div className="rb-checkout-info-row">
              <CalendarDays size={14}/>
              <span>
                {new Date(booking.check_in).toLocaleDateString('vi-VN')} →{' '}
                {new Date(booking.check_out).toLocaleDateString('vi-VN')} ({nights} đêm)
              </span>
            </div>
          </div>

          {error && (
            <div className="rb-error-msg">
              <AlertCircle size={14}/> {error}
            </div>
          )}
        </div>

        <div className="rb-modal-footer">
          <button className="rb-btn-cancel" onClick={onClose} disabled={submitting}>Hủy</button>
          <button className="rb-btn-checkout" onClick={handleCheckout} disabled={submitting}>
            {submitting ? <><div className="rb-spinner-sm"/> Đang xử lý...</> : <><LogOut size={15}/> Hoàn tất Check-out</>}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Walk-in Booking Modal ── */
function WalkInModal({ onClose, onCreated }) {
  const [guestSearch, setGuestSearch] = useState('')
  const [guests, setGuests]           = useState([])
  const [selectedGuest, setSelectedGuest] = useState(null)
  const [roomTypes, setRoomTypes]     = useState([])
  const [roomTypeId, setRoomTypeId]   = useState('')
  const [availRooms, setAvailRooms]   = useState([])
  const [roomId, setRoomId]           = useState('')
  const [checkIn, setCheckIn]         = useState(() => new Date().toISOString().slice(0, 10))
  const [checkOut, setCheckOut]       = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10)
  })
  const [special, setSpecial]         = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  // Load room types on mount
  useEffect(() => {
    fetch(`${BASE}/api/receptionist/room-types`, { headers: { Authorization: `Bearer ${TOKEN()}` } })
      .then(r => r.json()).then(d => { setRoomTypes(d); if (d.length) setRoomTypeId(d[0].id) })
  }, [])

  // Load available rooms when roomTypeId changes
  useEffect(() => {
    if (!roomTypeId) return
    fetch(`${BASE}/api/receptionist/rooms/available?room_type_id=${roomTypeId}`, {
      headers: { Authorization: `Bearer ${TOKEN()}` }
    }).then(r => r.json()).then(d => { setAvailRooms(Array.isArray(d) ? d : []); setRoomId('') })
  }, [roomTypeId])

  const searchGuests = async () => {
    if (!guestSearch.trim()) return
    const res = await fetch(`${BASE}/api/receptionist/guests?search=${encodeURIComponent(guestSearch)}`, {
      headers: { Authorization: `Bearer ${TOKEN()}` }
    })
    const d = await res.json()
    setGuests(Array.isArray(d) ? d : [])
  }

  const nights = Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000))
  const selType = roomTypes.find(rt => rt.id === roomTypeId)
  const estimated = selType ? selType.base_price * nights : 0

  const handleSubmit = async () => {
    if (!selectedGuest) return setError('Vui lòng chọn khách hàng')
    if (!roomTypeId) return setError('Vui lòng chọn loại phòng')
    setLoading(true); setError('')
    try {
      const res = await fetch(`${BASE}/api/receptionist/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify({
          guest_id: selectedGuest.id, room_type_id: roomTypeId,
          room_id: roomId || undefined, check_in: checkIn, check_out: checkOut, special_request: special
        })
      })
      if (res.ok) { onCreated(); onClose() }
      else { const d = await res.json(); setError(d.error || 'Tạo booking thất bại') }
    } finally { setLoading(false) }
  }

  return (
    <div className="rb-modal-overlay" onClick={onClose}>
      <div className="rb-modal rb-walkin-modal" onClick={e => e.stopPropagation()}>
        <div className="rb-modal-header">
          <div>
            <h3 className="rb-modal-title"><Plus size={18}/> Booking Walk-in</h3>
            <p className="rb-modal-sub">Tạo đặt phòng trực tiếp tại quầy</p>
          </div>
          <button className="rb-modal-close" onClick={onClose}><X size={18}/></button>
        </div>
        <div className="rb-modal-body">
          {/* Tìm khách */}
          <div className="rb-form-group">
            <label>Khách hàng *</label>
            {selectedGuest ? (
              <div className="rb-selected-guest">
                <div className="rb-guest-avatar-sm">{selectedGuest.full_name[0]}</div>
                <div>
                  <div style={{ fontWeight: 600 }}>{selectedGuest.full_name}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{selectedGuest.email} · {selectedGuest.phone || '—'}</div>
                </div>
                <button className="rb-btn-unselect" onClick={() => setSelectedGuest(null)}><X size={14}/></button>
              </div>
            ) : (
              <>
                <div className="rb-search-row">
                  <input
                    className="rb-input"
                    placeholder="Tìm theo tên, email, SĐT..."
                    value={guestSearch}
                    onChange={e => setGuestSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchGuests()}
                  />
                  <button className="rb-btn-search" onClick={searchGuests}>Tìm</button>
                </div>
                {guests.length > 0 && (
                  <div className="rb-guest-results">
                    {guests.map(g => (
                      <div key={g.id} className="rb-guest-result-row" onClick={() => { setSelectedGuest(g); setGuests([]) }}>
                        <div className="rb-guest-avatar-sm">{g.full_name[0]}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>{g.full_name}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{g.email} · {g.phone || '—'}</div>
                        </div>
                        <MemberBadge tier={g.membership_tier}/>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="rb-form-row">
            <div className="rb-form-group">
              <label>Ngày nhận phòng *</label>
              <input type="date" className="rb-input" value={checkIn} onChange={e => setCheckIn(e.target.value)} min={new Date().toISOString().slice(0, 10)}/>
            </div>
            <div className="rb-form-group">
              <label>Ngày trả phòng *</label>
              <input type="date" className="rb-input" value={checkOut} onChange={e => setCheckOut(e.target.value)} min={checkIn}/>
            </div>
          </div>

          <div className="rb-form-row">
            <div className="rb-form-group">
              <label>Loại phòng *</label>
              <select className="rb-select" value={roomTypeId} onChange={e => setRoomTypeId(e.target.value)}>
                {roomTypes.map(rt => (
                  <option key={rt.id} value={rt.id}>{rt.name} — {fmt(rt.base_price)}/đêm</option>
                ))}
              </select>
            </div>
            <div className="rb-form-group">
              <label>Phòng cụ thể (tùy chọn)</label>
              <select className="rb-select" value={roomId} onChange={e => setRoomId(e.target.value)}>
                <option value="">— Gán sau khi check-in —</option>
                {availRooms.map(r => (
                  <option key={r.id} value={r.id}>Phòng {r.room_number}{r.floor ? ` · Tầng ${r.floor}` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rb-form-group">
            <label>Yêu cầu đặc biệt</label>
            <textarea className="rb-textarea" rows={2} placeholder="Ví dụ: phòng tầng cao, không hút thuốc..." value={special} onChange={e => setSpecial(e.target.value)}/>
          </div>

          {selType && (
            <div className="rb-estimate">
              <span>Dự tính: <strong>{nights} đêm × {fmt(selType.base_price)}</strong></span>
              <span className="rb-estimate-total">{fmt(estimated)}</span>
            </div>
          )}

          {error && <div className="rb-error-msg"><AlertCircle size={14}/> {error}</div>}
        </div>
        <div className="rb-modal-footer">
          <button className="rb-btn-cancel" onClick={onClose}>Hủy</button>
          <button className="rb-btn-checkout" onClick={handleSubmit} disabled={loading}>
            {loading ? <><div className="rb-spinner-sm"/> Đang tạo...</> : <><Plus size={15}/> Tạo Booking</>}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Detail Drawer ── */
function DetailDrawer({ booking, onClose }) {
  const nights = Math.max(1, Math.round(
    (new Date(booking.check_out) - new Date(booking.check_in)) / 86400000
  ))
  const statusCfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING
  return (
    <div className="rb-modal-overlay" onClick={onClose}>
      <div className="rb-drawer" onClick={e => e.stopPropagation()}>
        <div className="rb-modal-header">
          <div>
            <h3 className="rb-modal-title"><Eye size={18}/> Chi tiết Booking</h3>
            <p className="rb-modal-sub">{booking.booking_code}</p>
          </div>
          <button className="rb-modal-close" onClick={onClose}><X size={18}/></button>
        </div>
        <div className="rb-modal-body">
          <div className="rb-detail-guest">
            <div className="rb-guest-avatar-lg">{booking.guest?.full_name?.[0] || 'G'}</div>
            <div>
              <div className="rb-detail-name">{booking.guest?.full_name}</div>
              <div className="rb-detail-meta">
                <Mail size={12}/> {booking.guest?.email}
              </div>
              {booking.guest?.phone && (
                <div className="rb-detail-meta"><Phone size={12}/> {booking.guest.phone}</div>
              )}
              {booking.guest?.id_card && (
                <div className="rb-detail-meta">
                  <Shield size={12}/> CCCD: {booking.guest.id_card}
                </div>
              )}
              {booking.guest?.dob && (
                <div className="rb-detail-meta">
                  <CalendarDays size={12}/> Ngày sinh: {new Date(booking.guest.dob).toLocaleDateString('vi-VN')}
                </div>
              )}
              {booking.guest?.address && (
                <div className="rb-detail-meta" style={{ maxWidth: 260 }}>
                  <User size={12}/> {booking.guest.address}
                </div>
              )}
            </div>
            <MemberBadge tier={booking.guest?.membership_tier || 'Member'}/>
          </div>

          <div className="rb-detail-grid">
            <div className="rb-detail-card">
              <div className="rb-detail-card-label">Trạng thái</div>
              <span style={{ color: statusCfg.color, fontWeight: 700 }}>{statusCfg.label}</span>
            </div>
            <div className="rb-detail-card">
              <div className="rb-detail-card-label">Loại phòng</div>
              <div style={{ fontWeight: 600 }}>{booking.roomType?.name}</div>
            </div>
            <div className="rb-detail-card">
              <div className="rb-detail-card-label">Phòng</div>
              <div style={{ fontWeight: 600 }}>{booking.room?.room_number || '—'}</div>
            </div>
            <div className="rb-detail-card">
              <div className="rb-detail-card-label">Số đêm</div>
              <div style={{ fontWeight: 600 }}>{nights} đêm</div>
            </div>
            <div className="rb-detail-card">
              <div className="rb-detail-card-label">Nhận phòng</div>
              <div>{new Date(booking.check_in).toLocaleDateString('vi-VN')}</div>
            </div>
            <div className="rb-detail-card">
              <div className="rb-detail-card-label">Trả phòng</div>
              <div>{new Date(booking.check_out).toLocaleDateString('vi-VN')}</div>
            </div>
          </div>

          {booking.special_request && (
            <div className="rb-detail-section">
              <div className="rb-detail-section-title">Yêu cầu đặc biệt</div>
              <p className="rb-detail-text">{booking.special_request}</p>
            </div>
          )}

          {(booking.upsells || []).length > 0 && (
            <div className="rb-detail-section">
              <div className="rb-detail-section-title">Dịch vụ đã đặt</div>
              {booking.upsells.map(u => (
                <div key={u.id} className="rb-detail-upsell">
                  <Sparkles size={12} style={{ color: '#c9a84c' }}/> {u.service_name}
                  <span>{fmt(u.price)}</span>
                </div>
              ))}
            </div>
          )}

          {(booking.payments || []).length > 0 && (
            <div className="rb-detail-section">
              <div className="rb-detail-section-title">Lịch sử thanh toán</div>
              {booking.payments.map(p => (
                <div key={p.id} className="rb-detail-payment">
                  <span>{p.payment_method.replace('_', ' ')} · {new Date(p.transaction_date).toLocaleDateString('vi-VN')}</span>
                  <span style={{ color: p.status === 'REFUNDED' ? '#f87171' : '#34d399', fontWeight: 600 }}>
                    {p.status === 'REFUNDED' ? '-' : '+'}{fmt(p.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="rb-detail-total">
            <span>Tổng cộng</span>
            <span>{fmt(booking.total_amount)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════ MAIN PAGE ══════════════════════════════ */
export default function ReceptionBookingsPage() {
  const navigate = useNavigate()
  const [bookings, setBookings]     = useState([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch]         = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading]       = useState(true)
  const [checkoutTarget, setCheckoutTarget] = useState(null)
  const [detailTarget, setDetailTarget]     = useState(null)
  const [showWalkIn, setShowWalkIn] = useState(false)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 15 })
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`${BASE}/api/receptionist/bookings?${params}`, {
        headers: { Authorization: `Bearer ${TOKEN()}` }
      })
      const d = await res.json()
      setBookings(d.data || [])
      setTotal(d.total || 0)
      setTotalPages(d.totalPages || 1)
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const handleCheckoutDone = () => {
    setCheckoutTarget(null)
    fetchBookings()
  }

  return (
    <Layout>
      <div className="rb-page">
        {/* Header */}
        <div className="rb-header">
          <div>
            <h1 className="rb-title">Quản lý Đặt phòng</h1>
            <p className="rb-subtitle">Tìm kiếm, check-in, check-out và theo dõi tất cả booking</p>
          </div>
          <div className="rb-header-actions">
            <button className="rb-btn-refresh" onClick={fetchBookings}><RefreshCw size={14}/></button>
            <button className="rb-btn-new" onClick={() => setShowWalkIn(true)}>
              <Plus size={15}/> Booking Walk-in
            </button>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="rb-controls">
          <form className="rb-search-form" onSubmit={handleSearch}>
            <Search size={15} className="rb-search-icon"/>
            <input
              className="rb-search-input"
              placeholder="Tìm theo tên khách, mã booking, SĐT..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button type="button" className="rb-search-clear" onClick={() => { setSearchInput(''); setSearch(''); setPage(1) }}>
                <X size={14}/>
              </button>
            )}
          </form>
          <div className="rb-status-tabs">
            {[
              { k: 'all', label: 'Tất cả' },
              { k: 'CONFIRMED', label: 'Xác nhận' },
              { k: 'CHECKED_IN', label: 'Đang lưu trú' },
              { k: 'CHECKED_OUT', label: 'Đã trả' },
              { k: 'PENDING', label: 'Chờ xử lý' },
              { k: 'CANCELLED', label: 'Đã hủy' },
            ].map(({ k, label }) => (
              <button
                key={k}
                className={`rb-status-tab ${statusFilter === k ? 'rb-status-tab--active' : ''}`}
                onClick={() => { setStatusFilter(k); setPage(1) }}
              >{label}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rb-table-wrap">
          {loading ? (
            <div className="rb-loading"><div className="rb-spinner"/> Đang tải...</div>
          ) : bookings.length === 0 ? (
            <div className="rb-empty">
              <CalendarDays size={48} style={{ opacity: 0.3 }}/>
              <p>Không tìm thấy booking nào</p>
            </div>
          ) : (
            <table className="rb-table">
              <thead>
                <tr>
                  <th>Mã Booking</th>
                  <th>Khách hàng</th>
                  <th>Loại phòng / Phòng</th>
                  <th>Ngày lưu trú</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => {
                  const stCfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.PENDING
                  const tier = b.guest?.membership_tier || 'Member'
                  const nights = Math.max(1, Math.round(
                    (new Date(b.check_out) - new Date(b.check_in)) / 86400000
                  ))
                  return (
                    <tr key={b.id} className="rb-row">
                      <td>
                        <div className="rb-booking-code">{b.booking_code}</div>
                        <div className="rb-booking-nights">{nights} đêm</div>
                      </td>
                      <td>
                        <div className="rb-guest-cell">
                          <div className="rb-guest-avatar-sm">{(b.guest?.full_name || 'G')[0]}</div>
                          <div>
                            <div className="rb-guest-name-cell">
                              {b.guest?.full_name}
                              <MemberBadge tier={tier}/>
                            </div>
                            <div className="rb-guest-contact">{b.guest?.phone || b.guest?.email || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="rb-room-type">{b.roomType?.name}</div>
                        <div className="rb-room-num">
                          {b.room?.room_number ? `Phòng ${b.room.room_number}` : 'Chưa gán phòng'}
                        </div>
                      </td>
                      <td>
                        <div className="rb-dates">
                          <span>{new Date(b.check_in).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' })}</span>
                          <span className="rb-dates-arrow">→</span>
                          <span>{new Date(b.check_out).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' })}</span>
                        </div>
                      </td>
                      <td>
                        <div className="rb-amount">{fmt(b.total_amount)}</div>
                      </td>
                      <td>
                        <span className="rb-status-badge" style={{ background: stCfg.bg, color: stCfg.color }}>
                          {stCfg.label}
                        </span>
                      </td>
                      <td>
                        <div className="rb-actions">
                          <button className="rb-action-btn" onClick={() => setDetailTarget(b)} title="Xem chi tiết">
                            <Eye size={14}/>
                          </button>
                          {(b.status === 'CONFIRMED' || b.status === 'PENDING') && (
                            <button
                              className="rb-action-btn rb-action-btn--checkin"
                              onClick={() => navigate(`/reception/checkin/${b.id}`)}
                              title="Tiến hành Check-in"
                            >
                              <LogIn size={14}/> Check-in
                            </button>
                          )}
                          {b.status === 'CHECKED_IN' && (
                            <button
                              className="rb-action-btn rb-action-btn--checkout"
                              onClick={() => setCheckoutTarget(b)}
                              title="Tiến hành Check-out"
                            >
                              <LogOut size={14}/> Check-out
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="rb-pagination">
            <span className="rb-page-info">Tổng: {total} booking</span>
            <div className="rb-page-btns">
              <button className="rb-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={16}/>
              </button>
              <span className="rb-page-num">{page} / {totalPages}</span>
              <button className="rb-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight size={16}/>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {checkoutTarget && (
        <CheckoutModal booking={checkoutTarget} onClose={() => setCheckoutTarget(null)} onDone={handleCheckoutDone}/>
      )}
      {detailTarget && (
        <DetailDrawer booking={detailTarget} onClose={() => setDetailTarget(null)}/>
      )}
      {showWalkIn && (
        <WalkInModal onClose={() => setShowWalkIn(false)} onCreated={fetchBookings}/>
      )}
    </Layout>
  )
}
