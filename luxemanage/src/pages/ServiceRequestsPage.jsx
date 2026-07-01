import { useState, useEffect, useCallback } from 'react'
import {
  ConciergeBell, Utensils, Sparkles, Bed, Wrench, Car,
  Clock, CheckCircle, AlertCircle, RefreshCw, Plus,
  Star, Zap, Timer, ChevronDown, X, Phone, Mail, Info
} from 'lucide-react'
import Layout from '../components/Layout/Layout'
import './ServiceRequestsPage.css'

const TOKEN = () => localStorage.getItem('luxury_hotel_token')
const BASE   = 'http://localhost:3000'

const CATEGORY_CONFIG = {
  ALL:          { label: 'Tất cả',    icon: null, color: '#c9a84c' },
  FOOD_BEVERAGE:{ label: 'Ẩm thực',  icon: <Utensils size={14} />, color: '#f59e0b' },
  SPA:          { label: 'Spa',       icon: <Sparkles size={14} />, color: '#a78bfa' },
  HOUSEKEEPING: { label: 'Buồng phòng',icon:<Bed size={14} />,      color: '#34d399' },
  TECHNICAL:    { label: 'Kỹ thuật', icon: <Wrench size={14} />,   color: '#60a5fa' },
  TRANSPORT:    { label: 'Đón/tiễn', icon: <Car size={14} />,      color: '#fb923c' },
  OTHER:        { label: 'Khác',     icon: <ConciergeBell size={14} />, color: '#9ca3af' },
}

const STATUS_CONFIG = {
  PENDING:    { label: 'Mới',          cls: 'sr-status--pending',    dotCls: 'sr-dot--pending' },
  IN_PROGRESS:{ label: 'Đang xử lý',  cls: 'sr-status--inprogress', dotCls: 'sr-dot--inprogress' },
  COMPLETED:  { label: 'Hoàn thành',  cls: 'sr-status--done',       dotCls: 'sr-dot--done' },
  CANCELLED:  { label: 'Đã hủy',      cls: 'sr-status--cancelled',  dotCls: 'sr-dot--cancelled' },
}

const PRIORITY_CONFIG = {
  URGENT: { label: 'Khẩn cấp', color: '#ef4444' },
  HIGH:   { label: 'Cao',      color: '#f59e0b' },
  NORMAL: { label: 'Thường',   color: '#94a3b8' },
  LOW:    { label: 'Thấp',     color: '#6b7280' },
}

const MEMBERSHIP_COLORS = {
  VIP:      { bg: 'rgba(201,168,76,0.2)',   color: '#c9a84c' },
  Platinum: { bg: 'rgba(148,163,184,0.2)', color: '#94a3b8' },
  Gold:     { bg: 'rgba(251,191,36,0.2)',  color: '#fbbf24' },
  Silver:   { bg: 'rgba(156,163,175,0.2)', color: '#9ca3af' },
  Member:   { bg: 'rgba(99,102,241,0.15)', color: '#818cf8' },
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (diff < 60) return `${diff}s trước`
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
  return `${Math.floor(diff / 86400)} ngày trước`
}

function MemberBadge({ tier }) {
  const style = MEMBERSHIP_COLORS[tier] || MEMBERSHIP_COLORS.Member
  return (
    <span className="sr-member-badge" style={{ background: style.bg, color: style.color }}>
      {tier === 'VIP' && <Star size={9} fill="currentColor" />}
      {tier}
    </span>
  )
}

function NewRequestModal({ onClose, onCreated }) {
  const [bookingCode, setBookingCode] = useState('')
  const [bookingId, setBookingId]     = useState('')
  const [category, setCategory]       = useState('HOUSEKEEPING')
  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority]       = useState('NORMAL')
  const [loading, setLoading]         = useState(false)
  const [searching, setSearching]     = useState(false)
  const [found, setFound]             = useState(null)

  const searchBooking = async () => {
    if (!bookingCode.trim()) return
    setSearching(true)
    try {
      const res = await fetch(
        `${BASE}/api/receptionist/bookings?search=${encodeURIComponent(bookingCode.trim())}`,
        { headers: { Authorization: `Bearer ${TOKEN()}` } }
      )
      const data = await res.json()
      const b = data.data?.[0]
      if (b) {
        setFound(b)
        setBookingId(b.id)
      } else {
        setFound(null)
        alert('Không tìm thấy booking')
      }
    } finally {
      setSearching(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!bookingId || !title) return alert('Vui lòng tìm booking và nhập tiêu đề')
    setLoading(true)
    try {
      const res = await fetch(`${BASE}/api/receptionist/service-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify({ booking_id: bookingId, category, title, description, priority })
      })
      if (res.ok) {
        onCreated()
        onClose()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="sr-modal-overlay" onClick={onClose}>
      <div className="sr-modal" onClick={e => e.stopPropagation()}>
        <div className="sr-modal-header">
          <h3>Tạo yêu cầu dịch vụ mới</h3>
          <button className="sr-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form className="sr-modal-body" onSubmit={handleSubmit}>
          <div className="sr-form-group">
            <label>Tìm Booking</label>
            <div className="sr-search-row">
              <input
                className="sr-input"
                placeholder="Mã booking hoặc tên khách..."
                value={bookingCode}
                onChange={e => setBookingCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), searchBooking())}
              />
              <button type="button" className="sr-btn-search" onClick={searchBooking} disabled={searching}>
                {searching ? 'Đang tìm...' : 'Tìm'}
              </button>
            </div>
            {found && (
              <div className="sr-found-booking">
                ✓ {found.guest?.full_name} · {found.booking_code} · Phòng {found.room?.room_number || found.roomType?.name}
              </div>
            )}
          </div>

          <div className="sr-form-row">
            <div className="sr-form-group">
              <label>Bộ phận</label>
              <select className="sr-select" value={category} onChange={e => setCategory(e.target.value)}>
                {Object.entries(CATEGORY_CONFIG).filter(([k]) => k !== 'ALL').map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="sr-form-group">
              <label>Mức độ ưu tiên</label>
              <select className="sr-select" value={priority} onChange={e => setPriority(e.target.value)}>
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="sr-form-group">
            <label>Tiêu đề yêu cầu</label>
            <input
              className="sr-input"
              placeholder="Ví dụ: Giao 2 ly vang đỏ..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="sr-form-group">
            <label>Mô tả chi tiết</label>
            <textarea
              className="sr-textarea"
              placeholder="Chi tiết yêu cầu..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="sr-modal-footer">
            <button type="button" className="sr-btn-cancel" onClick={onClose}>Hủy</button>
            <button type="submit" className="sr-btn-submit" disabled={loading}>
              {loading ? 'Đang tạo...' : 'Tạo yêu cầu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DetailModal({ req, onClose }) {
  if (!req) return null
  return (
    <div className="sr-modal-overlay" onClick={onClose}>
      <div className="sr-modal" onClick={e => e.stopPropagation()}>
        <div className="sr-modal-header">
          <h3>Chi tiết yêu cầu</h3>
          <button className="sr-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="sr-modal-body">
          <p><strong>Khách:</strong> {req.booking?.guest?.full_name}</p>
          <p><strong>Phòng:</strong> {req.booking?.room?.room_number}</p>
          <p><strong>Tiêu đề:</strong> {req.title}</p>
          <p><strong>Mô tả:</strong> {req.description || 'Không có'}</p>
        </div>
      </div>
    </div>
  )
}

function RequestCard({ req, onStatusChange, onDetail }) {
  const catCfg      = CATEGORY_CONFIG[req.category] || CATEGORY_CONFIG.OTHER
  const statusCfg   = STATUS_CONFIG[req.status]     || STATUS_CONFIG.PENDING
  const priorityCfg = PRIORITY_CONFIG[req.priority] || PRIORITY_CONFIG.NORMAL
  const tier        = req.booking?.guest?.membership_tier || 'Member'
  const roomNum     = req.booking?.room?.room_number

  const isUrgent = req.priority === 'URGENT'
  const isPending = req.status === 'PENDING'
  const isInProgress = req.status === 'IN_PROGRESS'
  const isDone = req.status === 'COMPLETED'

  return (
    <div className={`sr-card ${isUrgent ? 'sr-card--urgent' : ''} ${isDone ? 'sr-card--done' : ''}`}>
      {/* Card Top */}
      <div className="sr-card-top">
        <div className="sr-card-room">
          <div className="sr-room-badge">
            {roomNum ? roomNum : '—'}
          </div>
          <div className="sr-card-guest">
            <div className="sr-guest-name">
              {req.booking?.guest?.full_name || '—'}
              <MemberBadge tier={tier} />
            </div>
            <div className="sr-guest-type">{req.booking?.roomType?.name}</div>
          </div>
        </div>
        <div className={`sr-status-badge ${statusCfg.cls}`}>
          <span className={`sr-dot ${statusCfg.dotCls}`} />
          {statusCfg.label}
        </div>
      </div>

      {/* Category icon + Title */}
      <div className="sr-card-category" style={{ color: catCfg.color }}>
        {catCfg.icon}
        <span>{catCfg.label}</span>
      </div>
      <div className="sr-card-title">{req.title}</div>
      {req.description && (
        <div className="sr-card-desc">"{req.description.slice(0, 80)}{req.description.length > 80 ? '...' : ''}"</div>
      )}

      {/* Footer */}
      <div className="sr-card-footer">
        <div className="sr-card-meta">
          <div className="sr-card-time">
            <Clock size={11} />
            {timeAgo(req.createdAt)}
          </div>
          {isUrgent && (
            <span className="sr-priority-tag" style={{ color: priorityCfg.color }}>
              <Zap size={11} fill="currentColor" />
              Cần xử lý ngay
            </span>
          )}
        </div>

        <div className="sr-card-actions">
          {isPending && (
            <button className="sr-btn-action sr-btn--process"
              onClick={() => onStatusChange(req.id, 'IN_PROGRESS')}>
              Xử lý
            </button>
          )}
          {isInProgress && (
            <button className="sr-btn-action sr-btn--done"
              onClick={() => onStatusChange(req.id, 'COMPLETED')}>
              Xong
            </button>
          )}
          {isDone && (
            <span className="sr-done-label">
              <CheckCircle size={13} /> Hoàn thành
            </span>
          )}
          <button className="sr-btn-action sr-btn--detail" onClick={() => onDetail(req)}>
            <Info size={12}/> Chi tiết
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ServiceRequestsPage() {
  const [requests, setRequests] = useState([])
  const [stats, setStats]       = useState({ avgTime: 0, inProgress: 0, completed: 0 })
  const [loading, setLoading]   = useState(true)
  const [catFilter, setCatFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showModal, setShowModal] = useState(false)
  const [detailReq, setDetailReq] = useState(null)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (catFilter !== 'ALL') params.set('category', catFilter)
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      params.set('limit', '50')

      const res = await fetch(`${BASE}/api/receptionist/service-requests?${params}`, {
        headers: { Authorization: `Bearer ${TOKEN()}` }
      })
      const data = await res.json()
      setRequests(data.data || [])
      if (data.stats) setStats(data.stats)
    } finally {
      setLoading(false)
    }
  }, [catFilter, statusFilter])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const handleStatusChange = async (id, newStatus) => {
    try {
      await fetch(`${BASE}/api/receptionist/service-requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify({ status: newStatus })
      })
      fetchRequests()
      // Also update detail if open
      if (detailReq?.id === id) setDetailReq(prev => ({ ...prev, status: newStatus }))
    } catch {}
  }

  const pendingCount    = requests.filter(r => r.status === 'PENDING').length
  const inProgressCount = requests.filter(r => r.status === 'IN_PROGRESS').length
  const doneCount       = requests.filter(r => r.status === 'COMPLETED').length

  return (
    <Layout>
      <div className="sr-page">
        {/* ── Header ── */}
        <div className="sr-header">
          <div>
            <h1 className="sr-title">Quản lý Yêu cầu Dịch vụ</h1>
            <p className="sr-subtitle">Giám sát và điều phối các yêu cầu phục vụ khách hàng theo thời gian thực</p>
          </div>
          <div className="sr-header-actions">
            <button className="sr-btn-refresh" onClick={fetchRequests}>
              <RefreshCw size={14} />
            </button>
            <button className="sr-btn-new" onClick={() => setShowModal(true)}>
              <Plus size={15} />
              Tạo yêu cầu mới
            </button>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="sr-filters">
          <div className="sr-filter-group">
            <span className="sr-filter-label">BỘ PHẬN DỊCH VỤ</span>
            <div className="sr-filter-tabs">
              {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                <button
                  key={k}
                  className={`sr-filter-tab ${catFilter === k ? 'sr-filter-tab--active' : ''}`}
                  onClick={() => setCatFilter(k)}
                >
                  {v.icon && <span style={{ color: v.color }}>{v.icon}</span>}
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <div className="sr-filter-group">
            <span className="sr-filter-label">TRẠNG THÁI</span>
            <div className="sr-filter-tabs">
              {[
                { k: 'ALL', label: 'Tất cả' },
                { k: 'PENDING',     label: 'Mới',         dot: 'sr-dot--pending' },
                { k: 'IN_PROGRESS', label: 'Đang xử lý',  dot: 'sr-dot--inprogress' },
                { k: 'COMPLETED',   label: 'Hoàn thành',  dot: 'sr-dot--done' },
              ].map(({ k, label, dot }) => (
                <button
                  key={k}
                  className={`sr-filter-tab ${statusFilter === k ? 'sr-filter-tab--active' : ''}`}
                  onClick={() => setStatusFilter(k)}
                >
                  {dot && <span className={`sr-dot ${dot}`} />}
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Request Cards ── */}
        {loading ? (
          <div className="sr-loading">
            <div className="sr-spinner" />
            <span>Đang tải yêu cầu...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="sr-empty">
            <CheckCircle size={48} style={{ color: '#34d399', opacity: 0.5 }} />
            <p>Không có yêu cầu nào</p>
            <span>Tất cả yêu cầu đã được xử lý!</span>
          </div>
        ) : (
          <div className="sr-cards-grid">
            {requests.map(req => (
              <RequestCard key={req.id} req={req} onStatusChange={handleStatusChange} onDetail={setDetailReq} />
            ))}
          </div>
        )}

        {/* ── Bottom: Stats + Notifications ── */}
        <div className="sr-bottom">
          <div className="sr-metrics-card">
            <div className="sr-metrics-header">
              <span>Hiệu suất Phục vụ</span>
              <span className="sr-metrics-sub">Cập nhật lúc {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} hôm nay</span>
            </div>
            <div className="sr-metrics-row">
              <div className="sr-metric">
                <div className="sr-metric-value sr-metric-value--yellow">{stats.avgTime}</div>
                <div className="sr-metric-label">phút</div>
                <div className="sr-metric-sub">THỜI GIAN TB</div>
              </div>
              <div className="sr-metric">
                <div className="sr-metric-value sr-metric-value--orange">{inProgressCount}</div>
                <div className="sr-metric-label"></div>
                <div className="sr-metric-sub">ĐANG XỬ LÝ</div>
              </div>
              <div className="sr-metric">
                <div className="sr-metric-value sr-metric-value--green">{doneCount}</div>
                <div className="sr-metric-label"></div>
                <div className="sr-metric-sub">ĐÃ XONG</div>
              </div>
            </div>
            <div className="sr-progress-bar">
              <div
                className="sr-progress-fill"
                style={{ width: `${doneCount + inProgressCount > 0 ? (doneCount / (doneCount + inProgressCount + pendingCount)) * 100 : 0}%` }}
              />
            </div>
            <div className="sr-progress-labels">
              <span>Tỷ lệ hoàn thành: {doneCount + inProgressCount + pendingCount > 0 ? Math.round(doneCount / (doneCount + inProgressCount + pendingCount) * 100) : 0}%</span>
              <span>Mục tiêu ngày: 120 yêu cầu</span>
            </div>
          </div>

          <div className="sr-notif-card">
            <div className="sr-notif-header">
              <span>Thông báo Hệ thống</span>
              {pendingCount > 0 && <span className="sr-notif-badge">{pendingCount} MỚI</span>}
            </div>
            <div className="sr-notif-list">
              {pendingCount > 0 ? (
                <div className="sr-notif-item">
                  <div className="sr-notif-icon"><Zap size={16} /></div>
                  <div>
                    <div className="sr-notif-title">{pendingCount} yêu cầu đang chờ xử lý</div>
                    <div className="sr-notif-desc">Vui lòng xử lý sớm các yêu cầu mới.</div>
                  </div>
                </div>
              ) : (
                <div className="sr-notif-item sr-notif-item--ok">
                  <div className="sr-notif-icon sr-notif-icon--green"><CheckCircle size={16} /></div>
                  <div>
                    <div className="sr-notif-title">Tất cả đã xử lý!</div>
                    <div className="sr-notif-desc">Không có yêu cầu tồn đọng.</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <NewRequestModal
          onClose={() => setShowModal(false)}
          onCreated={fetchRequests}
        />
      )}
      {detailReq && (
        <DetailModal req={detailReq} onClose={() => setDetailReq(null)} />
      )}
    </Layout>
  )
}
