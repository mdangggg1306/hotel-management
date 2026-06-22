import { useState, useEffect } from 'react'
import Layout from '../components/Layout/Layout'
import './CustomersPage.css'
import './UserPortalPage.css'

const TOKEN = () => localStorage.getItem('luxemanage_token')
const BASE = 'http://localhost:3000'

const STATUS_LABELS = {
  PENDING: { label: 'Chờ XN', cls: 'badge-gray' },
  CONFIRMED: { label: 'Đã XN', cls: 'badge-blue' },
  CHECKED_IN: { label: 'Lưu trú', cls: 'badge-green' },
  CHECKED_OUT: { label: 'Checkout', cls: 'badge-gray' },
  CANCELLED: { label: 'Đã hủy', cls: 'badge-yellow' }
}

function CustomerDetailModal({ customerId, onClose }) {
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!customerId) return
    fetch(`${BASE}/api/admin/customers/${customerId}`, { headers: { 'Authorization': `Bearer ${TOKEN()}` } })
      .then(r => r.json()).then(data => { if (!data.error) setCustomer(data) })
      .catch(console.error).finally(() => setLoading(false))
  }, [customerId])

  const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

  const totalSpent = customer?.bookings?.reduce((acc, b) => acc + (b.total_amount || 0), 0) || 0
  const completedStays = customer?.bookings?.filter(b => b.status === 'CHECKED_OUT').length || 0

  return (
    <div className="ub-modal-overlay" onClick={onClose}>
      <div className="ub-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <button className="ub-modal-close" onClick={onClose}>&times;</button>
        <div className="ub-modal-header">
          <h2>Hồ Sơ Khách Hàng</h2>
        </div>
        <div className="ub-modal-body">
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>Đang tải...</div>
          ) : !customer ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#ef4444' }}>Không tải được hồ sơ khách hàng.</div>
          ) : (
            <>
              {/* Customer Profile */}
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: '#c9a84c', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', fontWeight: 700, flexShrink: 0
                }}>
                  {(customer.full_name || '?').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>{customer.full_name}</div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>{customer.email}</div>
                  {customer.phone && <div style={{ fontSize: '13px', color: '#6b7280' }}>📞 {customer.phone}</div>}
                </div>
                <div style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '8px', padding: '10px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>Hạng</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#c9a84c' }}>{customer.membership_tier || 'Member'}</div>
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                {[
                  { label: 'Tổng đặt phòng', value: customer.bookings?.length || 0 },
                  { label: 'Lần lưu trú hoàn thành', value: completedStays },
                  { label: 'Tổng chi tiêu', value: fmt(totalSpent) },
                ].map(s => (
                  <div key={s.label} style={{ background: '#f9fafb', borderRadius: '8px', padding: '14px', border: '1px solid #f3f4f6' }}>
                    <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{s.label}</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Booking history */}
              <div className="ub-modal-section">
                <h3>Lịch sử đặt phòng</h3>
                {customer.bookings?.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', background: '#f9fafb', borderRadius: '8px' }}>Chưa có lịch sử đặt phòng.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                    {customer.bookings.map(b => {
                      const s = STATUS_LABELS[b.status] || { label: b.status, cls: 'badge-gray' }
                      const nights = Math.max(0, Math.round((new Date(b.check_out) - new Date(b.check_in)) / 86400000))
                      return (
                        <div key={b.id} style={{
                          background: 'white', border: '1px solid #e5e7eb',
                          borderRadius: '8px', padding: '14px 16px',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                              {b.roomType?.name}
                              <span style={{ marginLeft: '10px', fontSize: '11px', fontWeight: 400, color: '#9ca3af' }}>{b.booking_code}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              {new Date(b.check_in).toLocaleDateString('vi-VN')} – {new Date(b.check_out).toLocaleDateString('vi-VN')} ({nights} đêm)
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className={`badge ${s.cls}`} style={{ display: 'block', marginBottom: '6px' }}>{s.label}</span>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#059669' }}>{fmt(b.total_amount)}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    fetch(`${BASE}/api/admin/customers`, { headers: { 'Authorization': `Bearer ${TOKEN()}` } })
      .then(r => r.json())
      .then(data => { if (!data.error) setCustomers(data) })
      .catch(console.error).finally(() => setLoading(false))
  }, [])

  const getInitials = (name) => (name || '??').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

  const getCustomerStats = () => {
    let revenue = 0
    customers.forEach(c => c.bookings?.forEach(b => revenue += b.total_amount || 0))
    return { revenue, total: customers.length }
  }
  const stats = getCustomerStats()

  const filtered = customers.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return c.full_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q)
  })

  const getLastBookingDate = (c) => {
    if (!c.bookings?.length) return null
    return new Date(Math.max(...c.bookings.map(b => new Date(b.createdAt))))
  }

  return (
    <Layout>
      <div className="cust-page">
        {/* Header */}
        <div className="page-header">
          <div className="cust-header-row">
            <div>
              <h1 className="page-title">Quản Lý Khách Hàng</h1>
              <p className="page-subtitle">Quản lý thông tin và lịch sử lưu trú của toàn bộ khách hàng LUXE RESERVE.</p>
            </div>
            <div className="cust-header-actions">
              <button className="btn-outline-light">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Xuất Dữ Liệu
              </button>
            </div>
          </div>
        </div>

        <div className="page-body">
          {/* Stats */}
          <div className="cust-stats">
            <div className="stat-card">
              <div className="stat-card-label">Tổng Số Khách Hàng</div>
              <div className="stat-card-value">{stats.total}</div>
              <div className="stat-card-sub up">Tài khoản đã đăng ký</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Tổng Doanh Thu Từ KH</div>
              <div className="stat-card-value" style={{ fontSize: '18px' }}>{fmt(stats.revenue)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Trung bình / Khách</div>
              <div className="stat-card-value" style={{ fontSize: '18px' }}>{stats.total > 0 ? fmt(stats.revenue / stats.total) : '0'}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Đánh Giá Trung Bình</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <div className="stat-card-value">4.8</div>
                <span style={{ color: '#fbbf24', fontSize: 18 }}>★</span>
              </div>
            </div>
          </div>

          {/* Guest Table */}
          <div className="content-card">
            <div className="content-card-header">
              <span className="content-card-title">Danh Sách Khách Hàng ({filtered.length})</span>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input type="text" placeholder="Tìm khách hàng..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  style={{ padding: '7px 12px 7px 30px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', outline: 'none', width: '220px' }} />
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>Đang tải...</div>
            ) : (
              <div className="cust-table-header">
                <div className="ch guest-col">THÔNG TIN KHÁCH</div>
                <div className="ch">LIÊN HỆ</div>
                <div className="ch">SỐ BOOKING</div>
                <div className="ch">TỔNG CHI TIÊU</div>
                <div className="ch">LẦN ĐẶT CUỐI</div>
                <div className="ch">HÀNH ĐỘNG</div>
              </div>
            )}

            {!loading && filtered.map(c => {
              const totalSpent = c.bookings?.reduce((acc, b) => acc + (b.total_amount || 0), 0) || 0
              const lastDate = getLastBookingDate(c)
              return (
                <div
                  key={c.id}
                  className="cust-row"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedId(c.id)}
                >
                  <div className="cust-cell guest-col">
                    <div className="cust-avatar">{getInitials(c.full_name)}</div>
                    <div>
                      <div className="cust-name">{c.full_name}</div>
                      <div className="cust-id">{c.email}</div>
                    </div>
                  </div>
                  <div className="cust-cell">
                    <span style={{ fontSize: '13px', color: '#374151' }}>{c.phone || '—'}</span>
                  </div>
                  <div className="cust-cell">
                    <span className="badge badge-blue" style={{ fontSize: '12px' }}>{c.bookings?.length || 0} booking</span>
                  </div>
                  <div className="cust-cell">
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#059669' }}>{fmt(totalSpent)}</span>
                  </div>
                  <div className="cust-cell">
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {lastDate ? lastDate.toLocaleDateString('vi-VN') : '—'}
                    </span>
                  </div>
                  <div className="cust-cell" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedId(c.id)}
                      style={{ background: '#0d1b2a', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      Xem hồ sơ
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {selectedId && (
        <CustomerDetailModal customerId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </Layout>
  )
}
