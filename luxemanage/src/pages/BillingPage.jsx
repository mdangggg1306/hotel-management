import { useState, useEffect, useCallback } from 'react'
import { Banknote, CalendarDays, Clock, RotateCcw, Download, Search, CreditCard, Landmark, Wallet } from 'lucide-react'
import Layout from '../components/Layout/Layout'
import './BillingPage.css'
import './UserPortalPage.css'

const TOKEN = () => localStorage.getItem('luxury_hotel_token')
const BASE = 'http://localhost:3000'

const METHOD_LABEL = {
  CREDIT_CARD:   <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CreditCard size={13} /> Thẻ tín dụng</span>,
  BANK_TRANSFER: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Landmark size={13} /> Chuyển khoản</span>,
  PAY_AT_DESK:   <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Wallet size={13} /> Tại quầy</span>
}

const STATUS_LABEL = {
  SUCCESS:  { label: 'Thành công', cls: 'badge-green' },
  FAILED:   { label: 'Thất bại',   cls: 'badge-red' },
  REFUNDED: { label: 'Hoàn tiền',  cls: 'badge-yellow' }
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

function PaymentDetailModal({ payment, onClose, onRefund }) {
  if (!payment) return null
  const b = payment.booking
  const nights = Math.max(0, Math.round((new Date(b.check_out) - new Date(b.check_in)) / 86400000))
  const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
  const [refunding, setRefunding] = useState(false)

  const handleRefund = async () => {
    if (!confirm(`Xác nhận hoàn tiền ${fmt(payment.amount)} cho ${b.guest.full_name}?\nBooking sẽ bị hủy sau khi hoàn tiền.`)) return
    setRefunding(true)
    try {
      const res = await fetch(`${BASE}/api/admin/payments/${payment.id}/refund`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN()}` }
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Hoàn tiền thất bại'); return }
      alert('Hoàn tiền thành công!')
      onRefund?.(); onClose()
    } catch { alert('Lỗi kết nối server') }
    finally { setRefunding(false) }
  }

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
              <div><label>Mã đặt phòng:</label><span style={{ fontWeight: 700, color: '#c9a84c' }}>{b.booking_code}</span></div>
              <div><label>Loại phòng:</label><span>{b.roomType.name}</span></div>
              <div><label>Nhận phòng:</label><span>{new Date(b.check_in).toLocaleDateString('vi-VN')}</span></div>
              <div><label>Trả phòng:</label><span>{new Date(b.check_out).toLocaleDateString('vi-VN')} ({nights} đêm)</span></div>
            </div>
          </div>
          <div className="ub-modal-section">
            <h3>Chi tiết thanh toán</h3>
            <div className="ub-price-breakdown">
              <div className="pb-row"><span>Tiền phòng</span><span>{fmt((b.roomType?.base_price || 0) * nights)}</span></div>
              {b.upsells?.length > 0 && (
                <>
                  <div className="pb-divider" />
                  <div className="pb-row-title">Dịch vụ bổ sung:</div>
                  {b.upsells.map(u => (
                    <div key={u.id} className="pb-row sub"><span>• {u.service_name}</span><span>{fmt(u.price)}</span></div>
                  ))}
                </>
              )}
              <div className="pb-divider" />
              <div className="pb-row total"><span>Tổng thanh toán</span><span style={{ color: payment.status === 'REFUNDED' ? '#ef4444' : '#059669', fontWeight: 700 }}>{fmt(payment.amount)}</span></div>
              <div className="pb-payment-method">Phương thức: <strong>{METHOD_LABEL[payment.payment_method]}</strong></div>
              <div className="pb-payment-method">Ngày giao dịch: <strong>{new Date(payment.transaction_date).toLocaleString('vi-VN')}</strong></div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            {payment.status === 'SUCCESS' && (
              <button onClick={handleRefund} disabled={refunding}
                style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '9px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', opacity: refunding ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
                {refunding ? 'Đang xử lý...' : <><RotateCcw size={13} /> Hoàn Tiền</>}
              </button>
            )}
            <button onClick={onClose}
              style={{ background: 'none', border: '1px solid #e5e7eb', padding: '9px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#6b7280' }}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const PAGE_SIZE = 20

export default function BillingPage() {
  const [payments, setPayments] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [stats, setStats] = useState({ totalRevenue: 0, todayRevenue: 0, pendingPayments: 0, activeBookings: 0, totalRefunded: 0, byMethod: [] })
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filterMethod, setFilterMethod] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchPayments = useCallback(() => {
    setLoading(true)
    const headers = { 'Authorization': `Bearer ${TOKEN()}` }
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (filterMethod !== 'all') params.append('payment_method', filterMethod)
    if (filterStatus !== 'all') params.append('status', filterStatus)
    if (dateFrom) params.append('date_from', dateFrom)
    if (dateTo) params.append('date_to', dateTo)
    params.append('page', String(currentPage))
    params.append('limit', String(PAGE_SIZE))

    Promise.all([
      fetch(`${BASE}/api/admin/billing?${params}`, { headers }).then(r => r.json()),
      fetch(`${BASE}/api/admin/billing/stats`, { headers }).then(r => r.json())
    ]).then(([p, s]) => {
      if (p.data) {
        setPayments(p.data)
        setTotal(p.total || 0)
        setTotalPages(p.totalPages || 1)
      }
      if (!s.error) setStats(s)
    }).catch(console.error).finally(() => setLoading(false))
  }, [search, filterMethod, filterStatus, dateFrom, dateTo, currentPage])

  useEffect(() => { fetchPayments() }, [fetchPayments])
  useEffect(() => { setCurrentPage(1) }, [search, filterMethod, filterStatus, dateFrom, dateTo])

  const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput) }

  const handleExport = async () => {
    const params = new URLSearchParams()
    if (dateFrom) params.append('date_from', dateFrom)
    if (dateTo) params.append('date_to', dateTo)
    const res = await fetch(`${BASE}/api/admin/export/billing?${params}`, {
      headers: { 'Authorization': `Bearer ${TOKEN()}` }
    })
    if (!res.ok) { alert('Xuất thất bại'); return }
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `billing-${Date.now()}.csv`
    a.click()
  }

  const clearFilters = () => {
    setSearch(''); setSearchInput(''); setFilterMethod('all')
    setFilterStatus('all'); setDateFrom(''); setDateTo('')
  }
  const hasFilters = search || filterMethod !== 'all' || filterStatus !== 'all' || dateFrom || dateTo

  return (
    <Layout>
      <div className="bill-page">
        {/* Header */}
        <div className="page-header">
          <div className="bill-header-row">
            <div>
              <h1 className="page-title">Quản Lý Billing</h1>
              <p className="page-subtitle">Tổng hợp giao dịch và doanh thu toàn hệ thống LUXURY HOTEL.</p>
            </div>
            <div className="bill-header-actions">
              <button className="btn-outline-light" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Download size={13} strokeWidth={2} />
                Xuất CSV
              </button>
            </div>
          </div>
        </div>

        <div className="page-body">
          {/* Stats */}
          <div className="dash-stats">
            <StatCard label="Tổng Doanh Thu" value={fmt(stats.totalRevenue)} sub="Tất cả thời gian"
              icon={<Banknote size={16} strokeWidth={2} />} />
            <StatCard label="Doanh Thu Hôm Nay" value={fmt(stats.todayRevenue)} sub={new Date().toLocaleDateString('vi-VN')}
              icon={<CalendarDays size={16} strokeWidth={2} />} />
            <StatCard label="Đang Chờ Thanh Toán" value={stats.pendingPayments} sub="Booking PENDING"
              icon={<Clock size={16} strokeWidth={2} />} />
            <StatCard label="Đã Hoàn Tiền" value={fmt(stats.totalRefunded || 0)} sub="Tổng refund"
              icon={<RotateCcw size={16} strokeWidth={2} />} />
          </div>

          {/* Method breakdown */}
          {stats.byMethod?.length > 0 && (
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {stats.byMethod.map(m => (
                <div key={m.payment_method} style={{
                  background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px',
                  padding: '10px 16px', display: 'flex', gap: '12px', alignItems: 'center'
                }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>{METHOD_LABEL[m.payment_method] || m.payment_method}</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#059669' }}>{fmt(m._sum.amount || 0)}</span>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>{m._count.id} GD</span>
                </div>
              ))}
            </div>
          )}

          {/* Filter Bar + Table */}
          <div className="content-card">
            {/* Filters */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '200px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={13} strokeWidth={2} opacity={0.4} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="text" placeholder="Tìm khách, mã đặt phòng..."
                      value={searchInput} onChange={e => setSearchInput(e.target.value)}
                      className="admin-input"
                      style={{ width: '100%', padding: '7px 12px 7px 32px', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <button type="submit" style={{ background: '#0d1b2a', color: 'white', border: 'none', padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    Tìm
                  </button>
                </form>

                {/* Method filter */}
                <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)}
                  className="admin-select"
                  style={{ padding: '7px 10px', borderRadius: '8px', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
                  <option value="all">Tất cả phương thức</option>
                  <option value="CREDIT_CARD">💳 Thẻ tín dụng</option>
                  <option value="BANK_TRANSFER">🏦 Chuyển khoản</option>
                  <option value="PAY_AT_DESK">💵 Tại quầy</option>
                </select>

                {/* Status filter */}
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="admin-select"
                  style={{ padding: '7px 10px', borderRadius: '8px', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
                  <option value="all">Tất cả trạng thái</option>
                  <option value="SUCCESS">Thành công</option>
                  <option value="FAILED">Thất bại</option>
                  <option value="REFUNDED">Hoàn tiền</option>
                </select>

                {/* Date range */}
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="admin-input"
                  style={{ padding: '7px 10px', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>→</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="admin-input"
                  style={{ padding: '7px 10px', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />

                {hasFilters && (
                  <button onClick={clearFilters}
                    style={{ padding: '7px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', color: '#6b7280', background: 'none', whiteSpace: 'nowrap' }}>
                    Xóa lọc
                  </button>
                )}
              </div>
            </div>

            <div className="content-card-header" style={{ padding: '10px 20px' }}>
              <span className="content-card-title">Lịch sử giao dịch ({total})</span>
            </div>

            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>Đang tải dữ liệu...</div>
            ) : payments.length === 0 ? (
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
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="avatar-initials" style={{ background: p.status === 'REFUNDED' ? '#9ca3af' : '#c9a84c', color: 'white', fontSize: '11px' }}>
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
                      <td style={{ textAlign: 'right', fontWeight: 700, color: p.status === 'REFUNDED' ? '#ef4444' : '#059669', fontSize: '14px' }}>
                        {p.status === 'REFUNDED' && <span style={{ fontSize: '11px', marginRight: '4px', opacity: 0.7 }}>-</span>}
                        {fmt(p.amount)}
                      </td>
                      <td>
                        <button onClick={() => setSelectedPayment(p)}
                          style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer', color: '#374151', transition: '0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                          Xem
                          {p.status === 'SUCCESS' && <span style={{ marginLeft: '4px', fontSize: '10px', color: '#f59e0b' }}>💸</span>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid #f3f4f6' }}>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                Hiển thị {payments.length} / {total} giao dịch
              </span>
              {totalPages > 1 && (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    style={{ padding: '5px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.4 : 1, fontSize: '13px' }}>
                    ←
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i
                    if (page < 1 || page > totalPages) return null
                    return (
                      <button key={page} onClick={() => setCurrentPage(page)}
                        style={{ padding: '5px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', background: page === currentPage ? '#0d1b2a' : 'white', color: page === currentPage ? 'white' : '#374151', cursor: 'pointer', fontSize: '13px', fontWeight: page === currentPage ? 700 : 400 }}>
                        {page}
                      </button>
                    )
                  })}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    style={{ padding: '5px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.4 : 1, fontSize: '13px' }}>
                    →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedPayment && (
        <PaymentDetailModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onRefund={fetchPayments}
        />
      )}
    </Layout>
  )
}
