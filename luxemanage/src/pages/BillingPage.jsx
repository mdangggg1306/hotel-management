import { useState, useEffect } from 'react'
import Layout from '../components/Layout/Layout'
import './BillingPage.css'
import './UserPortalPage.css'

const TOKEN = () => localStorage.getItem('luxemanage_token')
const BASE = 'http://localhost:3000'

const METHOD_LABEL = {
  CREDIT_CARD: '💳 Thẻ tín dụng',
  BANK_TRANSFER: '🏦 Chuyển khoản',
  PAY_AT_DESK: '💵 Tại quầy'
}

const STATUS_LABEL = {
  SUCCESS: { label: 'Thành công', cls: 'badge-green' },
  FAILED: { label: 'Thất bại', cls: 'badge-red' },
  REFUNDED: { label: 'Hoàn tiền', cls: 'badge-yellow' }
}

function StatCard({ label, value, sub, icon }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="stat-card-label">{label}</div>
          <div className="stat-card-value">{value}</div>
          {sub && <div className="stat-card-sub up">{sub}</div>}
        </div>
        <div className="stat-card-icon">{icon}</div>
      </div>
    </div>
  )
}

function PaymentDetailModal({ payment, onClose }) {
  if (!payment) return null
  const b = payment.booking
  const nights = Math.max(0, Math.round((new Date(b.check_out) - new Date(b.check_in)) / 86400000))

  return (
    <div className="ub-modal-overlay" onClick={onClose}>
      <div className="ub-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <button className="ub-modal-close" onClick={onClose}>&times;</button>
        <div className="ub-modal-header">
          <h2>Chi Tiết Giao Dịch</h2>
          <span className={`badge ${STATUS_LABEL[payment.status]?.cls}`}>
            {STATUS_LABEL[payment.status]?.label}
          </span>
        </div>
        <div className="ub-modal-body">
          <div className="ub-modal-section">
            <h3>Thông tin khách</h3>
            <div className="ub-info-grid">
              <div><label>Họ tên:</label><span>{b.guest.full_name}</span></div>
              <div><label>Email:</label><span>{b.guest.email}</span></div>
              <div><label>Mã đặt phòng:</label><span>{b.booking_code}</span></div>
              <div><label>Loại phòng:</label><span>{b.roomType.name}</span></div>
              <div><label>Nhận phòng:</label><span>{new Date(b.check_in).toLocaleDateString('vi-VN')}</span></div>
              <div><label>Trả phòng:</label><span>{new Date(b.check_out).toLocaleDateString('vi-VN')} ({nights} đêm)</span></div>
            </div>
          </div>
          <div className="ub-modal-section">
            <h3>Chi tiết thanh toán</h3>
            <div className="ub-price-breakdown">
              <div className="pb-row"><span>Tiền phòng</span><span>${(b.roomType?.base_price * nights || 0).toLocaleString()}.00</span></div>
              {b.upsells?.length > 0 && (
                <>
                  <div className="pb-divider" />
                  <div className="pb-row-title">Dịch vụ bổ sung:</div>
                  {b.upsells.map(u => (
                    <div key={u.id} className="pb-row sub"><span>• {u.service_name}</span><span>${u.price.toLocaleString()}.00</span></div>
                  ))}
                </>
              )}
              <div className="pb-divider" />
              <div className="pb-row total"><span>Tổng thanh toán</span><span>${payment.amount.toLocaleString()}.00</span></div>
              <div className="pb-payment-method">
                Phương thức: <strong>{METHOD_LABEL[payment.payment_method]}</strong>
              </div>
              <div className="pb-payment-method">
                Ngày giao dịch: <strong>{new Date(payment.transaction_date).toLocaleString('vi-VN')}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BillingPage() {
  const [payments, setPayments] = useState([])
  const [stats, setStats] = useState({ totalRevenue: 0, todayRevenue: 0, pendingPayments: 0, activeBookings: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const headers = { 'Authorization': `Bearer ${TOKEN()}` }
    Promise.all([
      fetch('http://localhost:3000/api/admin/billing', { headers }).then(r => r.json()),
      fetch('http://localhost:3000/api/admin/billing/stats', { headers }).then(r => r.json())
    ]).then(([p, s]) => {
      if (!p.error) setPayments(p)
      if (!s.error) setStats(s)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

  const filtered = payments.filter(p => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.booking?.guest?.full_name?.toLowerCase().includes(q) ||
      p.booking?.booking_code?.toLowerCase().includes(q) ||
      p.booking?.roomType?.name?.toLowerCase().includes(q)
    )
  })

  return (
    <Layout>
      <div className="bill-page">
        {/* Header */}
        <div className="page-header">
          <div className="bill-header-row">
            <div>
              <h1 className="page-title">Quản Lý Billing</h1>
              <p className="page-subtitle">Tổng hợp giao dịch và doanh thu toàn hệ thống LUXE RESERVE.</p>
            </div>
            <div className="bill-header-actions">
              <button className="btn-outline-light">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Xuất Báo Cáo
              </button>
            </div>
          </div>
        </div>

        <div className="page-body">
          {/* Stats */}
          <div className="dash-stats">
            <StatCard
              label="Tổng Doanh Thu"
              value={fmt(stats.totalRevenue)}
              sub="Tất cả thời gian"
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
            />
            <StatCard
              label="Doanh Thu Hôm Nay"
              value={fmt(stats.todayRevenue)}
              sub={new Date().toLocaleDateString('vi-VN')}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
            />
            <StatCard
              label="Đang Chờ Thanh Toán"
              value={stats.pendingPayments}
              sub="Booking PENDING"
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
            />
            <StatCard
              label="Booking Đang Hoạt Động"
              value={stats.activeBookings}
              sub="Confirmed + Check-in"
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
            />
          </div>

          {/* Payments Table */}
          <div className="content-card">
            <div className="content-card-header" style={{ alignItems: 'center' }}>
              <span className="content-card-title">Lịch sử giao dịch ({filtered.length})</span>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Tìm khách, mã đặt phòng..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                      padding: '7px 12px 7px 32px', border: '1px solid #e5e7eb',
                      borderRadius: '8px', fontSize: '13px', outline: 'none', width: '240px'
                    }}
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>Đang tải dữ liệu...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>Không có giao dịch nào.</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Khách Hàng</th>
                    <th>Loại Phòng</th>
                    <th>Phương Thức</th>
                    <th>Ngày GD</th>
                    <th>Trạng Thái</th>
                    <th style={{ textAlign: 'right' }}>Số Tiền</th>
                    <th>Chi Tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="avatar-initials" style={{ background: '#c9a84c', color: 'white', fontSize: '11px' }}>
                            {(p.booking?.guest?.full_name || '??').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>{p.booking?.guest?.full_name}</div>
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>{p.booking?.booking_code}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', color: '#374151' }}>{p.booking?.roomType?.name}</td>
                      <td style={{ fontSize: '13px' }}>{METHOD_LABEL[p.payment_method]}</td>
                      <td style={{ fontSize: '12px', color: '#6b7280' }}>{new Date(p.transaction_date).toLocaleDateString('vi-VN')}</td>
                      <td><span className={`badge ${STATUS_LABEL[p.status]?.cls || 'badge-gray'}`}>{STATUS_LABEL[p.status]?.label}</span></td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669', fontSize: '14px' }}>{fmt(p.amount)}</td>
                      <td>
                        <button
                          onClick={() => setSelectedPayment(p)}
                          style={{
                            background: 'none', border: '1px solid #e5e7eb',
                            borderRadius: '6px', padding: '4px 10px',
                            fontSize: '12px', cursor: 'pointer', color: '#374151',
                            transition: '0.15s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                          Xem
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {selectedPayment && (
        <PaymentDetailModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
      )}
    </Layout>
  )
}
