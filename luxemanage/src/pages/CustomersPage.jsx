import { useState, useEffect, useCallback } from 'react'
import { UserPlus, Download, Search, Pencil, Trash2, Check, Phone } from 'lucide-react'
import Layout from '../components/Layout/Layout'
import './CustomersPage.css'
import './UserPortalPage.css'

const TOKEN = () => localStorage.getItem('luxemanage_token')
const BASE = 'http://localhost:3000'

const STATUS_LABELS = {
  PENDING:     { label: 'Chờ XN',  cls: 'badge-gray' },
  CONFIRMED:   { label: 'Đã XN',   cls: 'badge-blue' },
  CHECKED_IN:  { label: 'Lưu trú', cls: 'badge-green' },
  CHECKED_OUT: { label: 'Checkout', cls: 'badge-gray' },
  CANCELLED:   { label: 'Đã hủy',  cls: 'badge-yellow' }
}

function CustomerDetailModal({ customerId, onClose, onUpdated }) {
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!customerId) return
    fetch(`${BASE}/api/admin/customers/${customerId}`, { headers: { 'Authorization': `Bearer ${TOKEN()}` } })
      .then(r => r.json()).then(data => {
        if (!data.error) {
          setCustomer(data)
          setEditForm({
            full_name: data.full_name || '',
            phone: data.phone || '',
            address: data.address || '',
            id_card: data.id_card || '',
            membership_tier: data.membership_tier || 'Member',
            membership_points: data.membership_points || 0
          })
        }
      })
      .catch(console.error).finally(() => setLoading(false))
  }, [customerId])

  const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
  const totalSpent = customer?.bookings?.reduce((acc, b) => acc + (b.total_amount || 0), 0) || 0
  const completedStays = customer?.bookings?.filter(b => b.status === 'CHECKED_OUT').length || 0

  const handleSave = async () => {
    setSaving(true); setError('')
    try {
      const res = await fetch(`${BASE}/api/admin/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN()}` },
        body: JSON.stringify(editForm)
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Lỗi cập nhật'); return }
      setCustomer(prev => ({ ...prev, ...data })); setEditMode(false)
      onUpdated?.()
    } catch { setError('Lỗi kết nối server') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirm(`Bạn chắc chắn muốn xóa khách hàng "${customer?.full_name}"?\nHành động này không thể hoàn tác.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`${BASE}/api/admin/customers/${customerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${TOKEN()}` }
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Không thể xóa'); return }
      onUpdated?.(); onClose()
    } catch { alert('Lỗi kết nối server') }
    finally { setDeleting(false) }
  }

  return (
    <div className="ub-modal-overlay" onClick={onClose}>
      <div className="ub-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '720px' }}>
        <button className="ub-modal-close" onClick={onClose}>&times;</button>
        <div className="ub-modal-header" style={{ justifyContent: 'space-between' }}>
          <h2>Hồ Sơ Khách Hàng</h2>
          {!loading && customer && (
            <div style={{ display: 'flex', gap: '8px' }}>
              {!editMode ? (
                <>
                  <button onClick={() => setEditMode(true)}
                    style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Pencil size={13} /> Chỉnh sửa
                  </button>
                  <button onClick={handleDelete} disabled={deleting}
                    style={{ background: '#ef4444', color: 'white', border: 'none', padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: deleting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {deleting ? '...' : <><Trash2 size={13} /> Xóa</>}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={handleSave} disabled={saving}
                    style={{ background: '#10b981', color: 'white', border: 'none', padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {saving ? 'Đang lưu...' : <><Check size={13} /> Lưu</>}
                  </button>
                  <button onClick={() => { setEditMode(false); setError('') }}
                    style={{ background: 'none', border: '1px solid #e5e7eb', padding: '7px 16px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: '#6b7280' }}>
                    Hủy
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="ub-modal-body">
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>Đang tải...</div>
          ) : !customer ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#ef4444' }}>Không tải được hồ sơ khách hàng.</div>
          ) : (
            <>
              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: '#dc2626', fontSize: '13px', marginBottom: '16px' }}>
                  {error}
                </div>
              )}

              {/* Avatar + basic info */}
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#c9a84c', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, flexShrink: 0 }}>
                  {(customer.full_name || '?').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  {editMode ? (
                    <input value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                      style={{ width: '100%', fontSize: '18px', fontWeight: 700, border: '1px solid #d1d5db', borderRadius: '8px', padding: '6px 10px', outline: 'none', marginBottom: '6px' }} />
                  ) : (
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>{customer.full_name}</div>
                  )}
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>{customer.email}</div>
                  {editMode ? (
                    <input placeholder="Số điện thoại" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                      style={{ width: '100%', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '6px', padding: '4px 8px', outline: 'none', marginTop: '4px' }} />
                  ) : (
                    customer.phone && <div style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}><Phone size={11} /> {customer.phone}</div>
                  )}
                </div>

                {/* Membership */}
                <div style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '8px', padding: '10px 16px', textAlign: 'center', minWidth: '110px' }}>
                  <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Hạng</div>
                  {editMode ? (
                    <select value={editForm.membership_tier} onChange={e => setEditForm({ ...editForm, membership_tier: e.target.value })}
                      className="admin-select"
                      style={{ fontSize: '13px', fontWeight: 700, color: '#c9a84c', borderRadius: '6px', padding: '3px 6px' }}>
                      {['Member', 'Silver', 'Gold', 'Platinum', 'VIP'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  ) : (
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#c9a84c' }}>{customer.membership_tier || 'Member'}</div>
                  )}
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                    {editMode ? (
                      <input type="number" value={editForm.membership_points} onChange={e => setEditForm({ ...editForm, membership_points: parseInt(e.target.value) || 0 })}
                        className="admin-input"
                        style={{ width: '70px', fontSize: '11px', borderRadius: '4px', padding: '2px 4px', textAlign: 'center' }} />
                    ) : (
                      `${customer.membership_points || 0} điểm`
                    )}
                  </div>
                </div>
              </div>

              {/* Identity info */}
              {!editMode && customer.id_card && (
                <div style={{ marginBottom: '12px', padding: '10px 14px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', fontSize: '13px', color: '#374151' }}>
                  <span style={{ fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>CCCD / CMND: </span>
                  <span style={{ fontWeight: 600 }}>{customer.id_card}</span>
                </div>
              )}

              {/* Address (edit mode) */}
              {editMode && (
                <div style={{ marginBottom: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>CCCD / CMND</label>
                    <input value={editForm.id_card} onChange={e => setEditForm({ ...editForm, id_card: e.target.value })}
                      placeholder="Số CCCD / CMND"
                      className="admin-input"
                      style={{ width: '100%', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Địa chỉ</label>
                    <input value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                      placeholder="Địa chỉ khách hàng"
                      className="admin-input"
                      style={{ width: '100%', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
              )}

              {/* Stats */}
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
                {(!customer.bookings || customer.bookings.length === 0) ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', background: '#f9fafb', borderRadius: '8px' }}>Chưa có lịch sử.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
                    {customer.bookings.map(b => {
                      const s = STATUS_LABELS[b.status] || { label: b.status, cls: 'badge-gray' }
                      const nights = Math.max(0, Math.round((new Date(b.check_out) - new Date(b.check_in)) / 86400000))
                      return (
                        <div key={b.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '3px' }}>
                              {b.roomType?.name}
                              <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: 400, color: '#9ca3af' }}>{b.booking_code}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              {new Date(b.check_in).toLocaleDateString('vi-VN')} – {new Date(b.check_out).toLocaleDateString('vi-VN')} ({nights} đêm)
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className={`badge ${s.cls}`} style={{ display: 'block', marginBottom: '4px' }}>{s.label}</span>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#059669' }}>{fmt(b.total_amount)}</div>
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

function CreateCustomerModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.full_name || !form.email) { setError('Tên và email là bắt buộc'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${BASE}/api/admin/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN()}` },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Lỗi tạo khách hàng'); return }
      onCreated(); onClose()
    } catch { setError('Lỗi kết nối server') }
    finally { setLoading(false) }
  }

  return (
    <div className="ub-modal-overlay" onClick={onClose}>
      <div className="ub-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <button className="ub-modal-close" onClick={onClose}>&times;</button>
        <div className="ub-modal-header"><h2>Thêm Khách Hàng Mới</h2></div>
        <div className="ub-modal-body">
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: '#dc2626', fontSize: '13px', marginBottom: '14px' }}>{error}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'Họ và tên *', key: 'full_name', placeholder: 'Nguyễn Văn A' },
              { label: 'Email *', key: 'email', type: 'email', placeholder: 'khach@email.com' },
              { label: 'Số điện thoại', key: 'phone', placeholder: '0901234567' },
              { label: 'Mật khẩu tạm (để trống = Luxe@2024)', key: 'password', type: 'password', placeholder: 'Luxe@2024' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>{f.label}</label>
                <input type={f.type || 'text'} placeholder={f.placeholder} value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  className="admin-input"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
          <div className="ub-modal-actions" style={{ marginTop: '20px' }}>
            <button onClick={onClose} style={{ background: 'none', border: '1px solid #e5e7eb', padding: '9px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#6b7280' }}>Hủy</button>
            <button onClick={handleSubmit} disabled={loading}
              style={{ background: '#0d1b2a', color: 'white', border: 'none', padding: '9px 22px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Đang tạo...' : '+ Thêm Khách'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const PAGE_SIZE = 15

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [summaryStats, setSummaryStats] = useState({ total: 0, revenue: 0 })

  const fetchCustomers = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    params.append('page', String(currentPage))
    params.append('limit', String(PAGE_SIZE))

    fetch(`${BASE}/api/admin/customers?${params}`, { headers: { 'Authorization': `Bearer ${TOKEN()}` } })
      .then(r => r.json())
      .then(data => {
        if (data.data) {
          setCustomers(data.data)
          setTotal(data.total || 0)
          setTotalPages(data.totalPages || 1)
        }
      })
      .catch(console.error).finally(() => setLoading(false))
  }, [search, currentPage])

  // Lấy summary stats (all customers, không phân trang)
  const fetchSummaryStats = useCallback(() => {
    fetch(`${BASE}/api/admin/customers?limit=1000`, { headers: { 'Authorization': `Bearer ${TOKEN()}` } })
      .then(r => r.json())
      .then(data => {
        if (data.data) {
          let revenue = 0
          data.data.forEach(c => c.bookings?.forEach(b => revenue += b.total_amount || 0))
          setSummaryStats({ total: data.total || 0, revenue })
        }
      }).catch(console.error)
  }, [])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])
  useEffect(() => { fetchSummaryStats() }, [fetchSummaryStats])
  useEffect(() => { setCurrentPage(1) }, [search])

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput) }

  const handleExport = async () => {
    const res = await fetch(`${BASE}/api/admin/export/customers`, { headers: { 'Authorization': `Bearer ${TOKEN()}` } })
    if (!res.ok) { alert('Xuất thất bại'); return }
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `customers-${Date.now()}.csv`
    a.click()
  }

  const getInitials = (name) => (name || '??').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

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
              <button className="btn-dark" onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserPlus size={13} strokeWidth={2.5} />
                Thêm Khách
              </button>
              <button className="btn-outline-light" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Download size={13} strokeWidth={2} />
                Xuất CSV
              </button>
            </div>
          </div>
        </div>

        <div className="page-body">
          {/* Stats */}
          <div className="cust-stats">
            <div className="stat-card">
              <div className="stat-card-label">Tổng Số Khách Hàng</div>
              <div className="stat-card-value">{summaryStats.total}</div>
              <div className="stat-card-sub up">Tài khoản đã đăng ký</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Tổng Doanh Thu Từ KH</div>
              <div className="stat-card-value" style={{ fontSize: '18px' }}>{fmt(summaryStats.revenue)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Trung bình / Khách</div>
              <div className="stat-card-value" style={{ fontSize: '18px' }}>
                {summaryStats.total > 0 ? fmt(summaryStats.revenue / summaryStats.total) : '—'}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Đang Tìm Kiếm</div>
              <div className="stat-card-value">{total}</div>
              <div className="stat-card-sub">{search ? `"${search}"` : 'Tất cả'}</div>
            </div>
          </div>

          {/* Customer Table */}
          <div className="content-card">
            <div className="content-card-header">
              <span className="content-card-title">Danh Sách Khách Hàng ({total})</span>
              <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={13} strokeWidth={2} opacity={0.4} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="text" placeholder="Tìm tên, email, SĐT..."
                    value={searchInput} onChange={e => setSearchInput(e.target.value)}
                    className="admin-input"
                    style={{ padding: '7px 12px 7px 30px', borderRadius: '8px', fontSize: '13px', outline: 'none', width: '220px' }} />
                </div>
                <button type="submit" style={{ background: '#0d1b2a', color: 'white', border: 'none', padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  Tìm
                </button>
                {search && (
                  <button type="button" onClick={() => { setSearch(''); setSearchInput('') }}
                    style={{ background: 'none', border: '1px solid #e5e7eb', padding: '7px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', color: '#6b7280' }}>
                    Xóa
                  </button>
                )}
              </form>
            </div>

            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>Đang tải...</div>
            ) : (
              <>
                <div className="cust-table-header">
                  <div className="ch guest-col">THÔNG TIN KHÁCH</div>
                  <div className="ch">LIÊN HỆ</div>
                  <div className="ch">SỐ BOOKING</div>
                  <div className="ch">TỔNG CHI TIÊU</div>
                  <div className="ch">LẦN ĐẶT CUỐI</div>
                  <div className="ch">HÀNH ĐỘNG</div>
                </div>

                {customers.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Không có khách hàng nào.</div>
                ) : customers.map(c => {
                  const totalSpent = c.bookings?.reduce((acc, b) => acc + (b.total_amount || 0), 0) || 0
                  const lastDate = getLastBookingDate(c)
                  return (
                    <div key={c.id} className="cust-row" style={{ cursor: 'pointer' }} onClick={() => setSelectedId(c.id)}>
                      <div className="cust-cell guest-col">
                        <div className="cust-avatar">{getInitials(c.full_name)}</div>
                        <div>
                          <div className="cust-name">{c.full_name}</div>
                          <div className="cust-id">{c.email}</div>
                          {c.membership_tier && c.membership_tier !== 'Member' && (
                            <span style={{ fontSize: '10px', background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: '10px', fontWeight: 600 }}>
                              {c.membership_tier}
                            </span>
                          )}
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
                        <button onClick={() => setSelectedId(c.id)}
                          style={{ background: '#0d1b2a', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          Xem hồ sơ
                        </button>
                      </div>
                    </div>
                  )
                })}
              </>
            )}

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid #f3f4f6' }}>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                Hiển thị {customers.length} / {total} khách hàng
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

      {selectedId && (
        <CustomerDetailModal
          customerId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={() => { fetchCustomers(); fetchSummaryStats() }}
        />
      )}
      {showCreate && (
        <CreateCustomerModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { fetchCustomers(); fetchSummaryStats() }}
        />
      )}
    </Layout>
  )
}
