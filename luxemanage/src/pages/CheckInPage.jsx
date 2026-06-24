import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, User, Bed, Sparkles, CheckCircle,
  Printer, Star, Clock, Phone, Mail, Shield,
  ChevronRight, AlertCircle, CreditCard, Banknote, Building2
} from 'lucide-react'
import Layout from '../components/Layout/Layout'
import './CheckInPage.css'

const TOKEN = () => localStorage.getItem('luxemanage_token')
const BASE   = 'http://localhost:3000'

const STEPS = ['Xác thực', 'Chọn phòng', 'Xác nhận']

const fmt = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0)

const PAYMENT_METHODS = [
  { value: 'PAY_AT_DESK',   label: 'Thanh toán tại quầy',    icon: <Banknote size={15}/> },
  { value: 'CREDIT_CARD',   label: 'Thẻ tín dụng / Ghi nợ', icon: <CreditCard size={15}/> },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản',           icon: <Building2 size={15}/> },
]

export default function CheckInPage() {
  const { bookingId } = useParams()
  const navigate      = useNavigate()

  const [step, setStep]                 = useState(0)
  const [booking, setBooking]           = useState(null)
  const [rooms, setRooms]               = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [passportId, setPassportId]     = useState('')
  const [loading, setLoading]           = useState(true)
  const [submitting, setSubmitting]     = useState(false)
  const [done, setDone]                 = useState(false)
  const [error, setError]               = useState('')
  const [payMethod, setPayMethod]       = useState('PAY_AT_DESK')

  /* ── Fetch booking by ID directly ── */
  const fetchBooking = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BASE}/api/receptionist/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${TOKEN()}` }
      })
      if (!res.ok) { setLoading(false); return }
      const data = await res.json()
      setBooking(data)

      // Fetch available rooms theo room_type
      const roomsRes = await fetch(
        `${BASE}/api/receptionist/rooms/available?room_type_id=${data.room_type_id}`,
        { headers: { Authorization: `Bearer ${TOKEN()}` } }
      )
      const roomsData = await roomsRes.json()
      const roomList = Array.isArray(roomsData) ? roomsData : []
      setRooms(roomList)
      // Pre-select if already has a room
      if (data.room_id) {
        const preSelected = roomList.find(r => r.id === data.room_id)
        if (preSelected) setSelectedRoom(preSelected)
        else setSelectedRoom(roomList[0] || null)
      } else if (roomList.length > 0) {
        setSelectedRoom(roomList[0])
      }
    } finally {
      setLoading(false)
    }
  }, [bookingId])

  useEffect(() => { fetchBooking() }, [fetchBooking])

  /* ── Step 0 → 1: Identity verified ── */
  const handleNextStep0 = () => {
    setError('')
    setStep(1)
  }

  /* ── Step 1 → 2: Room selected ── */
  const handleNextStep1 = () => {
    setError('')
    setStep(2)
  }

  /* ── Step 2: Confirm Check-in ── */
  const handleCheckIn = async () => {
    setSubmitting(true); setError('')
    try {
      const body = {}
      if (selectedRoom) body.room_id = selectedRoom.id

      const res = await fetch(`${BASE}/api/receptionist/bookings/${bookingId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        setDone(true)
        setTimeout(() => navigate('/reception'), 3000)
      } else {
        const err = await res.json()
        setError(err.error || 'Check-in thất bại')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="ci-loading">
          <div className="ci-spinner" />
          <span>Đang tải thông tin booking...</span>
        </div>
      </Layout>
    )
  }

  if (!booking) {
    return (
      <Layout>
        <div className="ci-loading">
          <Shield size={48} style={{ color: '#ef4444', opacity: 0.6 }} />
          <p>Không tìm thấy booking</p>
          <button className="ci-btn-back" onClick={() => navigate('/reception')}>
            <ArrowLeft size={14} /> Trở về Dashboard
          </button>
        </div>
      </Layout>
    )
  }

  if (done) {
    return (
      <Layout>
        <div className="ci-loading ci-success">
          <div className="ci-success-icon"><CheckCircle size={56} /></div>
          <h2>Check-in thành công!</h2>
          <p>{booking.guest?.full_name} đã được check-in{selectedRoom ? ` phòng ${selectedRoom.room_number}` : ''}.</p>
          <p style={{ fontSize: '12px', opacity: 0.5 }}>Đang quay về Dashboard...</p>
        </div>
      </Layout>
    )
  }

  const nights = Math.max(1, Math.round(
    (new Date(booking.check_out) - new Date(booking.check_in)) / 86400000
  ))
  const upsellTotal = (booking.upsells || []).reduce((s, u) => s + u.price, 0)
  const alreadyCheckedIn = booking.status === 'CHECKED_IN'

  return (
    <Layout>
      <div className="ci-page">
        {/* ── Header ── */}
        <div className="ci-header">
          <button className="ci-btn-back" onClick={() => navigate('/reception')}>
            <ArrowLeft size={16} />
          </button>
          <div className="ci-header-info">
            <h1 className="ci-title">Guest Check-in Flow</h1>
            <p className="ci-subtitle">
              Reservation #{booking.booking_code} · {booking.guest?.full_name}
              {alreadyCheckedIn && (
                <span style={{ marginLeft: 8, color: '#34d399', fontSize: '12px', fontWeight: 600 }}>
                  ✓ Đã check-in
                </span>
              )}
            </p>
          </div>
        </div>

        {/* ── Step Indicator ── */}
        <div className="ci-steps">
          {STEPS.map((s, i) => (
            <div key={i} className={`ci-step ${i === step ? 'ci-step--active' : ''} ${i < step ? 'ci-step--done' : ''}`}>
              <div className="ci-step-circle" onClick={() => i < step && setStep(i)} style={{ cursor: i < step ? 'pointer' : 'default' }}>
                {i < step ? <CheckCircle size={16} /> : (
                  [<User size={16} />, <Bed size={16} />, <Sparkles size={16} />][i]
                )}
              </div>
              <span className="ci-step-label">{s}</span>
              {i < STEPS.length - 1 && <div className="ci-step-line" />}
            </div>
          ))}
        </div>

        {/* ── Content ── */}
        <div className="ci-body">
          {/* ── STEP 0: Identity Verification ── */}
          {step === 0 && (
            <div className="ci-step-content">
              <div className="ci-left">
                <div className="ci-card">
                  <div className="ci-card-header">
                    <User size={16} className="ci-card-icon" />
                    <span>Xác thực danh tính</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Star size={12} fill="#c9a84c" color="#c9a84c"/>
                      <span style={{ fontSize: '11px', color: '#c9a84c' }}>{booking.guest?.membership_tier || 'Member'}</span>
                    </div>
                  </div>
                  <div className="ci-card-body">
                    <div className="ci-field-group">
                      <label>Họ và tên</label>
                      <div className="ci-field-value ci-field-value--name">{booking.guest?.full_name}</div>
                    </div>
                    <div className="ci-field-row">
                      <div className="ci-field-group">
                        <label>CCCD / Hộ chiếu</label>
                        <input
                          className="ci-input"
                          placeholder="Nhập số CCCD / Passport"
                          value={passportId}
                          onChange={e => setPassportId(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="ci-field-group">
                        <label>Số điện thoại</label>
                        <div className="ci-field-value">
                          {booking.guest?.phone
                            ? <><Phone size={12} style={{ display: 'inline', marginRight: 4 }}/>{booking.guest.phone}</>
                            : <span style={{ color: '#475569' }}>Chưa có</span>
                          }
                        </div>
                      </div>
                    </div>
                    <div className="ci-field-group">
                      <label>Email</label>
                      <div className="ci-field-value">
                        <Mail size={12} style={{ display: 'inline', marginRight: 4 }}/>{booking.guest?.email}
                      </div>
                    </div>
                    {booking.guest?.membership_points > 0 && (
                      <div className="ci-points-badge">
                        <Star size={12} fill="#c9a84c" color="#c9a84c"/>
                        Khách có <strong>{booking.guest.membership_points}</strong> điểm thưởng tích lũy
                      </div>
                    )}
                  </div>
                </div>

                {/* Reservation Summary */}
                <div className="ci-card">
                  <div className="ci-card-header">
                    <Clock size={16} className="ci-card-icon" />
                    <span>Thông tin đặt phòng</span>
                  </div>
                  <div className="ci-card-body">
                    <div className="ci-summary-grid">
                      <div className="ci-summary-block">
                        <label>THỜI GIAN LƯU TRÚ</label>
                        <div className="ci-summary-value">
                          {new Date(booking.check_in).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {' — '}
                          {new Date(booking.check_out).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="ci-summary-sub">{nights} đêm · {booking.roomType?.max_adults || 2} người lớn</div>
                      </div>
                      <div className="ci-summary-block">
                        <label>LOẠI PHÒNG</label>
                        <div className="ci-summary-value ci-summary-value--gold">
                          <Star size={13} fill="#c9a84c" />
                          {booking.roomType?.name}
                        </div>
                        <div className="ci-summary-sub">{booking.roomType?.view || ''} · {booking.roomType?.area || ''}</div>
                      </div>
                    </div>
                    {booking.special_request && (
                      <div className="ci-special-request">
                        <Shield size={13} />
                        <span><strong>Yêu cầu đặc biệt:</strong> {booking.special_request}</span>
                      </div>
                    )}
                    {(booking.upsells || []).length > 0 && (
                      <div className="ci-upsells">
                        <div className="ci-upsells-title">Dịch vụ đã đặt kèm</div>
                        {booking.upsells.map(u => (
                          <div key={u.id} className="ci-upsell-row">
                            <Sparkles size={12} />
                            <span>{u.service_name}</span>
                            <span className="ci-upsell-price">{fmt(u.price)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="ci-step-nav">
                {error && <div className="ci-error"><AlertCircle size={14}/> {error}</div>}
                <div className="ci-nav-actions">
                  <button className="ci-btn-back-nav" onClick={() => navigate('/reception')}>
                    <ArrowLeft size={14}/> Quay lại
                  </button>
                  <button className="ci-btn-next" onClick={handleNextStep0}>
                    Tiếp theo: Chọn phòng <ChevronRight size={15}/>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 1: Room Selection ── */}
          {step === 1 && (
            <div className="ci-step-content">
              <div className="ci-left">
                <div className="ci-card">
                  <div className="ci-card-header">
                    <Bed size={16} className="ci-card-icon" />
                    <span>Chọn phòng</span>
                    {rooms.length > 0 && <span className="ci-room-count">{rooms.length} phòng trống</span>}
                  </div>
                  <div className="ci-card-body ci-rooms-list">
                    {rooms.length === 0 ? (
                      <div className="ci-no-rooms">
                        <Bed size={28} opacity={0.3} />
                        <p>Không có phòng trống cho loại <strong>{booking.roomType?.name}</strong></p>
                        <span>Bạn vẫn có thể check-in mà không cần gán phòng ngay</span>
                      </div>
                    ) : (
                      rooms.map(room => (
                        <div
                          key={room.id}
                          className={`ci-room-card ${selectedRoom?.id === room.id ? 'ci-room-card--selected' : ''}`}
                          onClick={() => setSelectedRoom(room)}
                        >
                          <div className="ci-room-img"><Bed size={20} /></div>
                          <div className="ci-room-info">
                            <div className="ci-room-number">Phòng {room.room_number}</div>
                            <div className="ci-room-meta">
                              {room.floor && `Tầng ${room.floor} · `}
                              {room.roomType?.name}
                            </div>
                          </div>
                          <div className="ci-room-radio">
                            {selectedRoom?.id === room.id && <CheckCircle size={18} />}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="ci-step-nav">
                <div className="ci-nav-actions">
                  <button className="ci-btn-back-nav" onClick={() => setStep(0)}>
                    <ArrowLeft size={14}/> Quay lại
                  </button>
                  <button className="ci-btn-next" onClick={handleNextStep1}>
                    {selectedRoom ? `Xác nhận phòng ${selectedRoom.room_number}` : 'Tiếp theo (gán phòng sau)'}
                    <ChevronRight size={15}/>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Confirmation ── */}
          {step === 2 && (
            <div className="ci-step-content">
              <div className="ci-left">
                <div className="ci-card">
                  <div className="ci-card-header">
                    <Sparkles size={16} className="ci-card-icon" />
                    <span>Xác nhận Check-in</span>
                  </div>
                  <div className="ci-card-body">
                    {/* Summary */}
                    <div className="ci-confirm-summary">
                      <div className="ci-confirm-row">
                        <User size={14} style={{ color: '#64748b' }}/>
                        <span className="ci-confirm-label">Khách hàng</span>
                        <span className="ci-confirm-val">{booking.guest?.full_name}</span>
                      </div>
                      <div className="ci-confirm-row">
                        <Bed size={14} style={{ color: '#64748b' }}/>
                        <span className="ci-confirm-label">Phòng</span>
                        <span className="ci-confirm-val" style={{ color: '#34d399' }}>
                          {selectedRoom ? `Phòng ${selectedRoom.room_number}` : '— Gán sau —'}
                        </span>
                      </div>
                      <div className="ci-confirm-row">
                        <Clock size={14} style={{ color: '#64748b' }}/>
                        <span className="ci-confirm-label">Lưu trú</span>
                        <span className="ci-confirm-val">{nights} đêm ({new Date(booking.check_in).toLocaleDateString('vi-VN')} → {new Date(booking.check_out).toLocaleDateString('vi-VN')})</span>
                      </div>
                      <div className="ci-confirm-row">
                        <Star size={14} style={{ color: '#c9a84c' }}/>
                        <span className="ci-confirm-label">Loại phòng</span>
                        <span className="ci-confirm-val">{booking.roomType?.name}</span>
                      </div>
                      <div className="ci-confirm-divider"/>
                      <div className="ci-confirm-row ci-confirm-total">
                        <span>Tổng tiền</span>
                        <span>{fmt(booking.total_amount)}</span>
                      </div>
                      {upsellTotal > 0 && (
                        <div className="ci-confirm-row" style={{ fontSize: '12px', color: '#c9a84c' }}>
                          <Sparkles size={12}/>
                          <span>Dịch vụ thêm</span>
                          <span>{fmt(upsellTotal)}</span>
                        </div>
                      )}
                    </div>

                    {booking.special_request && (
                      <div className="ci-special-request" style={{ marginTop: 14 }}>
                        <Shield size={13} />
                        <span><strong>Lưu ý:</strong> {booking.special_request}</span>
                      </div>
                    )}

                    {/* Phương thức thanh toán dự kiến */}
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                        Phương thức thanh toán khi trả phòng
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {PAYMENT_METHODS.map(m => (
                          <button
                            key={m.value}
                            onClick={() => setPayMethod(m.value)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '8px 14px',
                              background: payMethod === m.value ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                              border: `1px solid ${payMethod === m.value ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.1)'}`,
                              borderRadius: 9, color: payMethod === m.value ? '#f0f4ff' : '#94a3b8',
                              fontSize: 12, cursor: 'pointer'
                            }}
                          >
                            {m.icon} {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ci-step-nav">
                {error && <div className="ci-error"><AlertCircle size={14}/> {error}</div>}
                <div className="ci-nav-actions">
                  <button className="ci-btn-back-nav" onClick={() => setStep(1)}>
                    <ArrowLeft size={14}/> Quay lại
                  </button>
                  <button className="ci-btn-print" onClick={() => window.print()}>
                    <Printer size={14}/> In phiếu
                  </button>
                  <button className="ci-btn-confirm" onClick={handleCheckIn} disabled={submitting || alreadyCheckedIn}>
                    {alreadyCheckedIn
                      ? <><CheckCircle size={15}/> Đã Check-in</>
                      : submitting
                        ? <><div className="ci-spinner-sm"/> Đang xử lý...</>
                        : <><CheckCircle size={15}/> Hoàn tất Check-in</>
                    }
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
