import { useState, useEffect, useCallback } from 'react'
import { User, Clock, Wrench, Sparkles, CheckCircle2, ChevronDown } from 'lucide-react'
import Layout from '../components/Layout/Layout'
import './RoomMatrixPage.css'

const TOKEN = () => localStorage.getItem('luxury_hotel_token')  // FIXED: đúng key
const BASE = 'http://localhost:3000'

const STATUS_CONFIG = {
  AVAILABLE:   { cls: 'status-available',   label: 'SẴN SÀNG',   color: '#4ade80' },
  RESERVED:    { cls: 'status-reserved',    label: 'ĐÃ ĐẶT',     color: '#fbbf24' },
  OCCUPIED:    { cls: 'status-occupied',    label: 'ĐANG THUÊ',  color: '#f87171' },
  CLEANING:    { cls: 'status-cleaning',    label: 'ĐANG DỌN',  color: '#38bdf8' },
  MAINTENANCE: { cls: 'status-maintenance', label: 'BẢO TRÌ',   color: '#94a3b8' },
}

const ROOM_STATUS_ACTIONS = [
  { value: 'AVAILABLE',   label: '✅ Sẵn sàng' },
  { value: 'CLEANING',    label: '🧹 Đang dọn' },
  { value: 'MAINTENANCE', label: '🔧 Bảo trì' },
]

function RoomActionMenu({ roomId, currentStatus, onStatusChange }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = async (newStatus) => {
    if (newStatus === currentStatus) { setOpen(false); return }
    setLoading(true)
    try {
      const res = await fetch(`${BASE}/api/admin/rooms/${roomId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN()}` },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        onStatusChange()
      } else {
        const data = await res.json()
        alert(data.error || 'Không thể cập nhật trạng thái')
      }
    } catch {
      alert('Lỗi kết nối server')
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="room-menu-btn"
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        disabled={loading}
        title="Thay đổi trạng thái"
      >
        {loading ? '⏳' : '⋮'}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '28px', right: 0, zIndex: 100,
          background: 'white', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          border: '1px solid #e5e7eb', minWidth: '150px', overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
        >
          <div style={{ padding: '6px 12px', fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f3f4f6' }}>
            Đổi trạng thái
          </div>
          {ROOM_STATUS_ACTIONS.map(a => (
            <button key={a.value}
              onClick={() => handleChange(a.value)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '9px 14px', border: 'none', background: a.value === currentStatus ? '#f0fdf4' : 'white',
                fontSize: '13px', cursor: 'pointer', color: '#374151',
                fontWeight: a.value === currentStatus ? 700 : 400
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.background = a.value === currentStatus ? '#f0fdf4' : 'white'}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function RoomMatrixPage() {
  const [floor, setFloor]   = useState('Tất cả các tầng')
  const [type, setType]     = useState('all')
  const [status, setStatus] = useState('Mọi trạng thái')
  const [roomsData, setRoomsData] = useState([])
  const [roomTypes, setRoomTypes] = useState([])
  const [errorMsg, setErrorMsg] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchRooms = useCallback(() => {
    setLoading(true)
    fetch(`${BASE}/api/admin/rooms-matrix`, {
      headers: { 'Authorization': `Bearer ${TOKEN()}` }
    })
      .then(r => r.json())
      .then(data => {
        if (!data.error) setRoomsData(data)
        else setErrorMsg(data.error)
      })
      .catch(err => setErrorMsg(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchRooms()
    // Load room types for filter
    fetch(`${BASE}/api/rooms/search`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRoomTypes(data) })
      .catch(console.error)
  }, [fetchRooms])

  // Group rooms by floor
  const floorsMap = {
    '4': { name: 'Tầng 04 - Penthouse & Suites', rooms: [] },
    '3': { name: 'Tầng 03 - Deluxe Premium', rooms: [] },
    '2': { name: 'Tầng 02 - Standard', rooms: [] },
    '1': { name: 'Tầng 01 - Basic', rooms: [] },
  }

  roomsData.forEach((r) => {
    let f
    if (r.room_number.includes('-')) {
      f = r.room_number.split('-')[1][0]
    } else {
      f = r.room_number[0]
    }
    if (!floorsMap[f]) floorsMap[f] = { name: `Tầng 0${f}`, rooms: [] }
    
    let finalStatus = r.status
    let info = 'Sẵn sàng phục vụ'
    let Icon = CheckCircle2
    let iconColor = '#4ade80'

    if (r.bookings && r.bookings.length > 0) {
      const activeBooking = r.bookings[0]
      if (activeBooking.status === 'PENDING') {
        finalStatus = 'RESERVED'
        info = `Chờ XN: ${activeBooking.guest.full_name}`
        Icon = Clock; iconColor = '#fbbf24'
      } else {
        finalStatus = 'OCCUPIED'
        info = `Khách: ${activeBooking.guest.full_name}`
        Icon = User; iconColor = '#f87171'
      }
    } else if (finalStatus === 'CLEANING') {
      info = 'Nhân viên đang dọn'
      Icon = Sparkles; iconColor = '#38bdf8'
    } else if (finalStatus === 'MAINTENANCE') {
      info = 'Đang bảo trì kỹ thuật'
      Icon = Wrench; iconColor = '#94a3b8'
    }

    floorsMap[f].rooms.push({
      id: r.id,
      num: r.room_number,
      type: r.roomType?.name?.toUpperCase() || 'UNKNOWN',
      typeId: r.room_type_id,
      rawStatus: r.status,  // trạng thái thật từ DB để update
      status: finalStatus,
      info, Icon, iconColor
    })
  })

  const FLOORS = Object.values(floorsMap).filter(f => f.rooms.length > 0).sort((a, b) => b.name.localeCompare(a.name))

  const filterRoom = (room) => {
    if (floor !== 'Tất cả các tầng') {
      const floorNum = room.num.includes('-') ? room.num.split('-')[1][0] : room.num[0]
      if (!floor.includes(`Tầng 0${floorNum}`)) return false
    }
    if (type !== 'all' && room.typeId !== type) return false
    if (status !== 'Mọi trạng thái') {
      if (status === 'AVAILABLE' && room.status !== 'AVAILABLE') return false
      if (status === 'RESERVED' && room.status !== 'RESERVED') return false
      if (status === 'OCCUPIED' && room.status !== 'OCCUPIED') return false
      if (status === 'CLEANING' && room.status !== 'CLEANING') return false
      if (status === 'MAINTENANCE' && room.status !== 'MAINTENANCE') return false
    }
    return true
  }

  const getStats = () => {
    let available = 0, occupied = 0, reserved = 0, cleaning = 0, maintenance = 0
    roomsData.forEach((r) => {
      if (r.bookings && r.bookings.length > 0) {
        if (r.bookings[0].status === 'PENDING') reserved++
        else occupied++
      } else if (r.status === 'CLEANING') cleaning++
      else if (r.status === 'MAINTENANCE') maintenance++
      else available++
    })
    return { available, occupied, reserved, cleaning, maintenance }
  }
  const stats = getStats()

  return (
    <Layout>
      <div className="rm-page">
        {/* Header */}
        <div className="page-header" style={{paddingBottom: 0}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', paddingBottom:20}}>
            <div>
              <h1 className="page-title">Sơ Đồ Phòng (Matrix)</h1>
              <p className="page-subtitle">
                Xem trực tiếp <span style={{color:'#c9a84c'}}>trạng thái phòng</span> theo thời gian thực. Click <strong>⋮</strong> để đổi trạng thái.
              </p>
            </div>
            <div className="rm-legend">
              {[
                { color: '#4ade80', label: 'SẴN SÀNG', count: stats.available },
                { color: '#fbbf24', label: 'ĐÃ ĐẶT', count: stats.reserved },
                { color: '#f87171', label: 'ĐANG THUÊ', count: stats.occupied },
                { color: '#38bdf8', label: 'ĐANG DỌN', count: stats.cleaning },
                { color: '#94a3b8', label: 'BẢO TRÌ', count: stats.maintenance },
              ].map(item => (
                <div key={item.label} className="legend-item">
                  <span className="legend-bullet" style={{background: item.color}}/>
                  <span className="legend-label">{item.label}:</span>
                  <span className="legend-count">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="rm-filters">
            <div className="rm-filter-group">
              <label className="filter-label">Tầng</label>
              <select className="filter-select" value={floor} onChange={e => setFloor(e.target.value)}>
                <option>Tất cả các tầng</option>
                <option>Tầng 04 - Penthouse &amp; Suites</option>
                <option>Tầng 03 - Deluxe Premium</option>
                <option>Tầng 02 - Standard</option>
                <option>Tầng 01 - Basic</option>
              </select>
            </div>
            <div className="rm-filter-group">
              <label className="filter-label">Loại Phòng</label>
              <select className="filter-select" value={type} onChange={e => setType(e.target.value)}>
                <option value="all">Tất cả loại phòng</option>
                {roomTypes.map((rt) => (
                  <option key={rt.id} value={rt.id}>{rt.name}</option>
                ))}
              </select>
            </div>
            <div className="rm-filter-group">
              <label className="filter-label">Trạng Thái</label>
              <select className="filter-select" value={status} onChange={e => setStatus(e.target.value)}>
                <option>Mọi trạng thái</option>
                <option value="AVAILABLE">Sẵn sàng</option>
                <option value="OCCUPIED">Đang thuê</option>
                <option value="RESERVED">Đã đặt</option>
                <option value="CLEANING">Đang dọn</option>
                <option value="MAINTENANCE">Bảo trì</option>
              </select>
            </div>
            <button className="btn-reset-view" onClick={() => { setFloor('Tất cả các tầng'); setStatus('Mọi trạng thái'); setType('all') }}>
              Bỏ Lọc
            </button>
            <button
              style={{ marginLeft: 'auto', background: '#0d1b2a', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              onClick={fetchRooms}
            >
              🔄 Làm mới
            </button>
          </div>
        </div>

        {/* Floors */}
        <div className="rm-body">
          {errorMsg && (
            <div style={{color: '#dc2626', padding: '16px 20px', background: '#fef2f2', borderRadius: '8px', marginBottom: '20px', border: '1px solid #fecaca'}}>
              ⚠️ Lỗi tải dữ liệu: {errorMsg}
            </div>
          )}
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>Đang tải sơ đồ phòng...</div>
          ) : FLOORS.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>Không có phòng nào.</div>
          ) : FLOORS.map((floorObj, fi) => (
            <div key={fi} className="rm-floor">
              <div className="floor-heading">
                <span className="floor-name">{floorObj.name}</span>
                <span className="floor-count">{floorObj.rooms.filter(filterRoom).length} / {floorObj.rooms.length} Phòng</span>
              </div>
              <div className="room-grid">
                {floorObj.rooms.filter(filterRoom).map((room, ri) => {
                  const cfg = STATUS_CONFIG[room.status] || STATUS_CONFIG.AVAILABLE
                  return (
                    <div key={ri} className={`room-card ${cfg.cls}`}>
                      <div className="room-card-top">
                        <span className="room-number">{room.num}</span>
                        {/* Chỉ cho phép đổi trạng thái nếu phòng không bị occupied bởi booking */}
                        {!['OCCUPIED', 'RESERVED'].includes(room.status) && (
                          <RoomActionMenu
                            roomId={room.id}
                            currentStatus={room.rawStatus}
                            onStatusChange={fetchRooms}
                          />
                        )}
                      </div>
                      <div className="room-type">{room.type}</div>
                      <div className="room-card-bottom">
                        <div className="room-status-badge" style={{color: cfg.color}}>
                          {cfg.label}
                        </div>
                        <div className="room-info">
                          {room.Icon && <room.Icon size={14} style={{ color: room.iconColor }} />}
                          <span className="info-text">{room.info}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
