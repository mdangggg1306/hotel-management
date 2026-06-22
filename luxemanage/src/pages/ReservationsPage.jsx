import { useState, useEffect, useCallback } from 'react'
import Layout from '../components/Layout/Layout'
import './ReservationsPage.css'
import './UserPortalPage.css'

const TOKEN = () => localStorage.getItem('luxemanage_token')
const BASE = 'http://localhost:3000'

const STATUS_LABELS = {
  PENDING: { label: 'CHỜ XÁC NHẬN', cls: 'badge-gray' },
  CONFIRMED: { label: 'ĐÃ XÁC NHẬN', cls: 'badge-blue' },
  CHECKED_IN: { label: 'ĐANG LƯU TRÚ', cls: 'badge-green' },
  CHECKED_OUT: { label: 'ĐÃ CHECK-OUT', cls: 'badge-gray' },
  CANCELLED: { label: 'ĐÃ HỦY', cls: 'badge-yellow' }
}

const TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'PENDING', label: 'Chờ xác nhận' },
  { key: 'CONFIRMED', label: 'Đã xác nhận' },
  { key: 'CHECKED_IN', label: 'Đang lưu trú' },
  { key: 'CHECKED_OUT', label: 'Đã check-out' },
  { key: 'CANCELLED', label: 'Đã hủy' },
]

function BookingDetailModal({ booking, onClose, onStatusUpdate }) {
  if (!booking) return null
  const nights = Math.max(0, Math.round((new Date(booking.check_out) - new Date(booking.check_in)) / 86400000))
  const s = STATUS_LABELS[booking.status] || { label: booking.status, cls: 'badge-gray' }

  const updateStatus = (newStatus) => {
    fetch(`${BASE}/api/admin/bookings/${booking.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN()}` },
      body: JSON.stringify({ status: newStatus })
    }).then(() => { onStatusUpdate(); onClose() })
  }

  return (
    <div className="ub-modal-overlay" onClick={onClose}>
      <div className="ub-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        <button className="ub-modal-close" onClick={onClose}>&times;</button>
        <div className="ub-modal-header">
          <h2>Chi Tiết Đặt Phòng</h2>
          <span className={`badge ${s.cls}`}>{s.label}</span>
        </div>
        <div className="ub-modal-body">
          <div className="ub-modal-section">
            <h3>Thông tin khách hàng</h3>
            <div className="ub-info-grid">
              <div><label>Họ tên:</label><span>{booking.guest.full_name}</span></div>
              <div><label>Email:</label><span>{booking.guest.email}</span></div>
              <div><label>SĐT:</label><span>{booking.guest.phone || '—'}</span></div>
              <div><label>Mã booking:</label><span style={{ fontWeight: 700, color: '#c9a84c' }}>{booking.booking_code}</span></div>
            </div>
          </div>
          <div className="ub-modal-section">
            <h3>Thông tin đặt phòng</h3>
            <div className="ub-info-grid">
              <div><label>Loại phòng:</label><span>{booking.roomType.name}</span></div>
              <div><label>Ngày nhận phòng:</label><span>{new Date(booking.check_in).toLocaleDateString('vi-VN')} (14:00)</span></div>
              <div><label>Ngày trả phòng:</label><span>{new Date(booking.check_out).toLocaleDateString('vi-VN')} (12:00)</span></div>
              <div><label>Số đêm:</label><span>{nights} đêm</span></div>
              {booking.special_request && (
                <div style={{ gridColumn: 'span 2' }}>
                  <label>Yêu cầu đặc biệt:</label>
                  <span style={{ color: '#92400e', background: '#fffbeb', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '4px' }}>
                    {booking.special_request}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="ub-modal-section">
            <h3>Thanh toán</h3>
            <div className="ub-price-breakdown">
              <div className="pb-row"><span>Tiền phòng ({nights} đêm)</span><span>${(booking.roomType.base_price * nights).toLocaleString()}.00</span></div>
              {booking.upsells?.length > 0 && (
                <>
                  <div className="pb-divider" />
                  {booking.upsells.map(u => <div key={u.id} className="pb-row sub"><span>• {u.service_name}</span><span>${u.price.toLocaleString()}.00</span></div>)}
                </>
              )}
              <div className="pb-divider" />
              <div className="pb-row total"><span>Tổng cộng</span><span>${booking.total_amount.toLocaleString()}.00</span></div>
              {booking.payments?.length > 0 && (
                <div className="pb-payment-method">
                  Trạng thái: <strong style={{ color: '#059669' }}>✓ Đã thanh toán</strong>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {booking.status === 'PENDING' && (
              <button onClick={() => updateStatus('CONFIRMED')} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                ✅ Xác nhận
              </button>
            )}
            {booking.status === 'CONFIRMED' && (
              <button onClick={() => updateStatus('CHECKED_IN')} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                🏨 Check-in
              </button>
            )}
            {booking.status === 'CHECKED_IN' && (
              <button onClick={() => updateStatus('CHECKED_OUT')} style={{ background: '#8b5cf6', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                🚪 Check-out
              </button>
            )}
            {['PENDING','CONFIRMED'].includes(booking.status) && (
              <button onClick={() => updateStatus('CANCELLED')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                ❌ Hủy booking
              </button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: '1px solid #e5e7eb', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#6b7280' }}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CreateBookingModal({ roomTypes, onClose, onCreated }) {
  const [form, setForm] = useState({ guest_email: '', room_type_id: '', check_in: '', check_out: '', special_request: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const calcTotal = () => {
    if (!form.room_type_id || !form.check_in || !form.check_out) return 0
    const rt = roomTypes.find(r => r.id === form.room_type_id)
    if (!rt) return 0
    const nights = Math.max(0, Math.round((new Date(form.check_out) - new Date(form.check_in)) / 86400000))
    return rt.base_price * nights
  }

  const handleSubmit = async () => {
    if (!form.guest_email || !form.room_type_id || !form.check_in || !form.check_out) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc.'); return
    }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${BASE}/api/admin/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN()}` },
        body: JSON.stringify({ ...form, total_amount: calcTotal() })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Lỗi tạo booking'); return }
      onCreated(); onClose()
    } catch { setError('Lỗi kết nối server') }
    finally { setLoading(false) }
  }

  return (
    <div className="ub-modal-overlay" onClick={onClose}>
      <div className="ub-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <button className="ub-modal-close" onClick={onClose}>&times;</button>
        <div className="ub-modal-header"><h2>Tạo Booking Thủ Công</h2></div>
        <div className="ub-modal-body">
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', color: '#dc2626', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: 'Email khách hàng *', key: 'guest_email', type: 'email', placeholder: 'khach@email.com' },
              { label: 'Ngày nhận phòng *', key: 'check_in', type: 'date' },
              { label: 'Ngày trả phòng *', key: 'check_out', type: 'date' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>{f.label}</label>
                <input type={f.type} placeholder={f.placeholder || ''} value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Loại phòng *</label>
              <select value={form.room_type_id} onChange={e => setForm({ ...form, room_type_id: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', background: 'white' }}>
                <option value="">-- Chọn loại phòng --</option>
                {roomTypes.map(r => <option key={r.id} value={r.id}>{r.name} (${r.base_price.toLocaleString()}/đêm)</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Yêu cầu đặc biệt</label>
              <textarea value={form.special_request} onChange={e => setForm({ ...form, special_request: e.target.value })}
                rows={3} placeholder="Ghi chú..."
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            {calcTotal() > 0 && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#065f46' }}>Tổng dự kiến:</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#059669' }}>${calcTotal().toLocaleString()}.00</span>
              </div>
            )}
          </div>
          <div className="ub-modal-actions" style={{ marginTop: '24px' }}>
            <button onClick={onClose} style={{ background: 'none', border: '1px solid #e5e7eb', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#6b7280' }}>Hủy</button>
            <button onClick={handleSubmit} disabled={loading}
              style={{ background: '#0d1b2a', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Đang tạo...' : '+ Tạo Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ReservationsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [bookings, setBookings] = useState([])
  const [roomTypes, setRoomTypes] = useState([])
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchBookings = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (activeTab !== 'all') params.append('status', activeTab)
    if (search) params.append('search', search)
    fetch(`${BASE}/api/admin/bookings?${params}`, { headers: { 'Authorization': `Bearer ${TOKEN()}` } })
      .then(r => r.json()).then(data => { if (!data.error) setBookings(data) })
      .catch(console.error).finally(() => setLoading(false))
  }, [activeTab, search])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  useEffect(() => {
    fetch(`${BASE}/api/rooms/search`)
      .then(r => r.json()).then(data => { if (Array.isArray(data)) setRoomTypes(data) })
      .catch(console.error)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const getInitials = (name) => (name || '??').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

  return (
    <Layout>
      <div className="res-page">
        <div className="page-header">
          <div className="res-header-row">
            <div>
              <h1 className="page-title">Quản Lý Đặt Phòng</h1>
              <p className="page-subtitle">Giám sát và vận hành các lượt khách ra vào tại hệ thống LUXE RESERVE.</p>
            </div>
            <div className="res-header-actions">
              <button className="btn-dark" onClick={() => setShowCreate(true)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Tạo Booking
              </button>
              <button className="btn-outline-light">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Xuất File
              </button>
            </div>
          </div>
        </div>

        <div className="page-body">
          <div className="content-card">
            {/* Search Bar */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
              <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input type="text" placeholder="Tìm theo tên khách, mã booking, email..."
                    value={searchInput} onChange={e => setSearchInput(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <button type="submit" style={{ background: '#0d1b2a', color: 'white', border: 'none', padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  Tìm kiếm
                </button>
                {search && (
                  <button type="button" onClick={() => { setSearch(''); setSearchInput('') }}
                    style={{ background: 'none', border: '1px solid #e5e7eb', padding: '9px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', color: '#6b7280' }}>
                    Xóa lọc
                  </button>
                )}
              </form>
            </div>

            {/* Tabs */}
            <div className="res-tabs">
              {TABS.map(t => (
                <button key={t.key} className={`res-tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>Đang tải...</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Khách Hàng</th>
                    <th>Phòng</th>
                    <th>Thời Gian</th>
                    <th>Trạng Thái</th>
                    <th>Tổng Tiền</th>
                    <th>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Không có booking nào.</td></tr>
                  ) : bookings.map(r => {
                    const s = STATUS_LABELS[r.status] || { label: r.status, cls: 'badge-gray' }
                    return (
                      <tr key={r.id}>
                        <td>
                          <div className="res-guest-cell">
                            <div className="avatar-initials" style={{ background: '#c9a84c', color: 'white' }}>{getInitials(r.guest.full_name)}</div>
                            <div>
                              <div className="res-guest-name">{r.guest.full_name}</div>
                              <div className="res-conf-id">{r.booking_code}</div>
                            </div>
                          </div>
                        </td>
                        <td className="res-room">{r.roomType.name}</td>
                        <td className="res-dates">
                          {new Date(r.check_in).toLocaleDateString('vi-VN')} – {new Date(r.check_out).toLocaleDateString('vi-VN')}
                        </td>
                        <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                        <td className="res-total">{fmt(r.total_amount)}</td>
                        <td>
                          <div className="res-actions">
                            <button className="btn-checkout" style={{ background: '#0d1b2a', color: '#fff' }} onClick={() => setSelectedBooking(r)}>
                              Chi tiết
                            </button>
                            {r.status === 'CONFIRMED' && (
                              <button className="btn-checkout" style={{ background: '#10b981', color: '#fff' }}
                                onClick={() => fetch(`${BASE}/api/admin/bookings/${r.id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN()}` }, body: JSON.stringify({ status: 'CHECKED_IN' }) }).then(fetchBookings)}>
                                Check-in
                              </button>
                            )}
                            {r.status === 'CHECKED_IN' && (
                              <button className="btn-checkout"
                                onClick={() => fetch(`${BASE}/api/admin/bookings/${r.id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN()}` }, body: JSON.stringify({ status: 'CHECKED_OUT' }) }).then(fetchBookings)}>
                                Check-out
                              </button>
                            )}
                            {['PENDING', 'CONFIRMED'].includes(r.status) && (
                              <button className="btn-checkout" style={{ background: '#ef4444', color: '#fff' }}
                                onClick={() => fetch(`${BASE}/api/admin/bookings/${r.id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN()}` }, body: JSON.stringify({ status: 'CANCELLED' }) }).then(fetchBookings)}>
                                Hủy
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

            <div className="res-pagination">
              <span className="res-showing">Đang hiển thị {bookings.length} lượt đặt phòng</span>
            </div>
          </div>
        </div>
      </div>

      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onStatusUpdate={fetchBookings}
        />
      )}
      {showCreate && (
        <CreateBookingModal
          roomTypes={roomTypes}
          onClose={() => setShowCreate(false)}
          onCreated={fetchBookings}
        />
      )}
    </Layout>
  )
}
