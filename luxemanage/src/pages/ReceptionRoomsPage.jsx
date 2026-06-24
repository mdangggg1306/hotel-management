import { useState, useEffect, useCallback } from 'react'
import { Bed, RefreshCw, CheckCircle, AlertTriangle, Wrench, Users, Info } from 'lucide-react'
import Layout from '../components/Layout/Layout'
import './ReceptionRoomsPage.css'

const TOKEN = () => localStorage.getItem('luxemanage_token')
const BASE   = 'http://localhost:3000'
const fmt    = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0)

const STATUS_CONFIG = {
  AVAILABLE:   { label: 'Trống',         cls: 'rrp-available',    dot: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)', icon: <CheckCircle size={14}/> },
  OCCUPIED:    { label: 'Có khách',       cls: 'rrp-occupied',     dot: '#f87171', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)',  icon: <Users size={14}/> },
  CLEANING:    { label: 'Đang dọn',       cls: 'rrp-cleaning',     dot: '#fbbf24', bg: 'rgba(251,191,36,0.1)',border: 'rgba(251,191,36,0.35)', icon: <Bed size={14}/> },
  MAINTENANCE: { label: 'Bảo trì',        cls: 'rrp-maintenance',  dot: '#94a3b8', bg: 'rgba(148,163,184,0.1)',border:'rgba(148,163,184,0.3)',  icon: <Wrench size={14}/> },
}

const NEXT_STATUS = {
  CLEANING:    [{ value: 'AVAILABLE', label: '✅ Đã dọn xong → Mở phòng' }],
  AVAILABLE:   [{ value: 'MAINTENANCE', label: '🔧 Chuyển sang Bảo trì' }, { value: 'CLEANING', label: '🛏 Đánh dấu cần dọn' }],
  MAINTENANCE: [{ value: 'AVAILABLE', label: '✅ Xong bảo trì → Mở phòng' }, { value: 'CLEANING', label: '🛏 Chuyển sang dọn' }],
}

function RoomCard({ room, onStatusChange, loading }) {
  const stCfg = STATUS_CONFIG[room.status] || STATUS_CONFIG.AVAILABLE
  const nextOpts = NEXT_STATUS[room.status] || []
  const guest = room.bookings?.[0]?.guest

  return (
    <div
      className={`rrp-room-card ${stCfg.cls} ${loading === room.id ? 'rrp-room-card--loading' : ''}`}
      style={{ '--room-bg': stCfg.bg, '--room-border': stCfg.border }}
    >
      {/* Room number */}
      <div className="rrp-room-num">
        <span>{room.room_number}</span>
        {room.floor && <span className="rrp-floor">T{room.floor}</span>}
      </div>

      {/* Type */}
      <div className="rrp-room-type">{room.roomType?.name}</div>
      <div className="rrp-room-price">{fmt(room.roomType?.base_price)}/đêm</div>

      {/* Status badge */}
      <div className="rrp-status-badge" style={{ color: stCfg.dot }}>
        {stCfg.icon}
        {stCfg.label}
      </div>

      {/* Guest info if OCCUPIED */}
      {guest && (
        <div className="rrp-guest-tag">
          <Users size={11}/>
          {guest.full_name}
        </div>
      )}

      {/* Actions */}
      {nextOpts.length > 0 && (
        <div className="rrp-card-actions">
          {nextOpts.map(opt => (
            <button
              key={opt.value}
              className="rrp-action-btn"
              onClick={() => onStatusChange(room.id, opt.value)}
              disabled={loading === room.id}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
      {loading === room.id && <div className="rrp-card-spinner"/>}
    </div>
  )
}

export default function ReceptionRoomsPage() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [filterStatus, setFilterStatus] = useState('ALL')

  const fetchRooms = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BASE}/api/receptionist/rooms`, {
        headers: { Authorization: `Bearer ${TOKEN()}` }
      })
      const d = await res.json()
      setRooms(Array.isArray(d) ? d : [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRooms() }, [fetchRooms])

  const handleStatusChange = async (roomId, newStatus) => {
    setUpdating(roomId)
    try {
      const res = await fetch(`${BASE}/api/receptionist/rooms/${roomId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        // Optimistic update
        setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: newStatus } : r))
      }
    } finally {
      setUpdating(null)
    }
  }

  // Nhóm phòng theo tầng
  const floors = [...new Set(rooms.map(r => r.floor || 0))].sort((a, b) => a - b)
  const filteredRooms = rooms.filter(r => filterStatus === 'ALL' || r.status === filterStatus)

  // Stats
  const stats = Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
    key, ...cfg,
    count: rooms.filter(r => r.status === key).length
  }))

  return (
    <Layout>
      <div className="rrp-page">
        {/* Header */}
        <div className="rrp-header">
          <div>
            <h1 className="rrp-title">Sơ đồ phòng</h1>
            <p className="rrp-subtitle">Theo dõi trạng thái và cập nhật tình trạng phòng theo thời gian thực</p>
          </div>
          <button className="rrp-btn-refresh" onClick={fetchRooms} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'rrp-spin' : ''}/>
            Làm mới
          </button>
        </div>

        {/* Stats bar */}
        <div className="rrp-stats">
          {stats.map(s => (
            <div
              key={s.key}
              className={`rrp-stat-pill ${filterStatus === s.key ? 'rrp-stat-pill--active' : ''}`}
              style={{ '--pill-color': s.dot }}
              onClick={() => setFilterStatus(filterStatus === s.key ? 'ALL' : s.key)}
            >
              <span className="rrp-stat-dot" style={{ background: s.dot }}/>
              <span className="rrp-stat-label">{s.label}</span>
              <span className="rrp-stat-count">{s.count}</span>
            </div>
          ))}
          {filterStatus !== 'ALL' && (
            <button className="rrp-clear-filter" onClick={() => setFilterStatus('ALL')}>Tất cả</button>
          )}
        </div>

        {/* Room grid by floor */}
        {loading ? (
          <div className="rrp-loading">
            <div className="rrp-spinner"/>
            <span>Đang tải sơ đồ phòng...</span>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="rrp-empty">
            <Bed size={48} style={{ opacity: 0.3 }}/>
            <p>Không có phòng nào theo bộ lọc này</p>
          </div>
        ) : (
          floors.map(floor => {
            const floorRooms = filteredRooms.filter(r => (r.floor || 0) === floor)
            if (floorRooms.length === 0) return null
            return (
              <div key={floor} className="rrp-floor-section">
                <div className="rrp-floor-header">
                  <span className="rrp-floor-label">
                    {floor === 0 ? 'Tầng không xác định' : `Tầng ${floor}`}
                  </span>
                  <span className="rrp-floor-count">{floorRooms.length} phòng</span>
                </div>
                <div className="rrp-room-grid">
                  {floorRooms.map(room => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      onStatusChange={handleStatusChange}
                      loading={updating}
                    />
                  ))}
                </div>
              </div>
            )
          })
        )}

        {/* Legend */}
        <div className="rrp-legend">
          <div className="rrp-legend-title"><Info size={12}/> Hướng dẫn</div>
          <div className="rrp-legend-items">
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <div key={k} className="rrp-legend-item">
                <span className="rrp-legend-dot" style={{ background: v.dot }}/>
                <span>{v.label}</span>
              </div>
            ))}
          </div>
          <p className="rrp-legend-note">Click các nút trên thẻ phòng để cập nhật trạng thái. Phòng OCCUPIED chỉ có thể được xử lý sau khi khách check-out.</p>
        </div>
      </div>
    </Layout>
  )
}
