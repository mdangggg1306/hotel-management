import { useState, useEffect } from 'react'
import { User, Clock, Wrench, Sparkles, CheckCircle2 } from 'lucide-react'
import Layout from '../components/Layout/Layout'
import './RoomMatrixPage.css'

const STATUS_CONFIG = {
  AVAILABLE:   { cls: 'status-available',   label: 'SẴN SÀNG',   color: '#4ade80' },
  RESERVED:    { cls: 'status-reserved',    label: 'ĐÃ ĐẶT',     color: '#fbbf24' },
  OCCUPIED:    { cls: 'status-occupied',     label: 'ĐANG THUÊ',    color: '#f87171' },
  CLEANING:    { cls: 'status-cleaning',     label: 'ĐANG DỌN',    color: '#38bdf8' },
  MAINTENANCE: { cls: 'status-maintenance',  label: 'BẢO TRÌ',    color: '#94a3b8' },
}

export default function RoomMatrixPage() {
  const [floor, setFloor]   = useState('Tất cả các tầng')
  const [type, setType]     = useState('Tất cả loại phòng')
  const [status, setStatus] = useState('Mọi trạng thái')
  const [roomsData, setRoomsData] = useState([])
  const [errorMsg, setErrorMsg] = useState(null)

  useEffect(() => {
    fetch('http://localhost:3000/api/admin/rooms-matrix', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(async r => {
         const text = await r.text();
         console.log("Raw response:", text);
         try {
             return JSON.parse(text);
         } catch(e) {
             throw new Error("Invalid JSON: " + text.slice(0, 50));
         }
      })
      .then(data => {
        if (!data.error) setRoomsData(data);
        else setErrorMsg(data.error);
      })
      .catch(err => {
         console.error(err);
         setErrorMsg(err.message);
      });
  }, []);

  // Group rooms by floor
  const floorsMap = {
    '4': { name: 'Tầng 04 - Penthouse & Suites', rooms: [] },
    '3': { name: 'Tầng 03 - Deluxe Premium', rooms: [] },
    '2': { name: 'Tầng 02 - Standard', rooms: [] },
    '1': { name: 'Tầng 01 - Basic', rooms: [] },
  };

  roomsData.forEach(r => {
    let f;
    if (r.room_number.includes('-')) {
        f = r.room_number.split('-')[1][0];
    } else {
        f = r.room_number[0];
    }

    if (!floorsMap[f]) floorsMap[f] = { name: `Tầng 0${f} - Khu Vực Thường`, rooms: [] };
    
    let finalStatus = r.status;
    let info = 'Sẵn sàng phục vụ';
    let Icon = CheckCircle2;
    let iconColor = '#4ade80';

    if (r.bookings && r.bookings.length > 0) {
      const activeBooking = r.bookings[0];
      if (activeBooking.status === 'PENDING') {
        finalStatus = 'RESERVED';
        info = `Chờ xác nhận: ${activeBooking.guest.full_name}`;
        Icon = Clock;
        iconColor = '#fbbf24';
      } else {
        finalStatus = 'OCCUPIED';
        info = `Khách: ${activeBooking.guest.full_name}`;
        Icon = User;
        iconColor = '#f87171';
      }
    } else if (finalStatus === 'CLEANING') {
      info = 'Nhân viên đang dọn';
      Icon = Sparkles;
      iconColor = '#38bdf8';
    } else if (finalStatus === 'MAINTENANCE') {
      info = 'Đang bảo trì kỹ thuật';
      Icon = Wrench;
      iconColor = '#94a3b8';
    }

    floorsMap[f].rooms.push({
      num: r.room_number,
      type: r.roomType?.name?.toUpperCase() || 'UNKNOWN',
      status: finalStatus,
      info,
      Icon,
      iconColor
    });
  });

  const FLOORS = Object.values(floorsMap).filter(f => f.rooms.length > 0).sort((a,b) => b.name.localeCompare(a.name));

  const filterRoom = (room) => {
    if (floor !== 'Tất cả các tầng' && !floor.includes(`Tầng 0${room.num[0]}`)) return false;
    if (status !== 'Mọi trạng thái') {
       if (status === 'AVAILABLE' && room.status !== 'AVAILABLE') return false;
       if (status === 'RESERVED' && room.status !== 'RESERVED') return false;
       if (status === 'OCCUPIED' && room.status !== 'OCCUPIED') return false;
    }
    return true
  }

  const getStats = () => {
     let available = 0, occupied = 0, reserved = 0, cleaning = 0, maintenance = 0;
     roomsData.forEach(r => {
        if (r.bookings && r.bookings.length > 0) {
           if (r.bookings[0].status === 'PENDING') reserved++;
           else occupied++;
        }
        else if (r.status === 'CLEANING') cleaning++;
        else if (r.status === 'MAINTENANCE') maintenance++;
        else available++;
     });
     return { available, occupied, reserved, cleaning, maintenance };
  }
  const stats = getStats();

  return (
    <Layout>
      <div className="rm-page">
        {/* Header */}
        <div className="page-header" style={{paddingBottom: 0}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', paddingBottom:20}}>
            <div>
              <h1 className="page-title">Sơ Đồ Phòng (Matrix)</h1>
              <p className="page-subtitle">
                Xem trực tiếp <span style={{color:'#c9a84c'}}>trạng thái phòng</span> theo thời gian thực.
              </p>
            </div>
            <div className="rm-legend">
              <div className="legend-item">
                <span className="legend-bullet" style={{background:'#4ade80'}}/>
                <span className="legend-label">SẴN SÀNG:</span>
                <span className="legend-count">{stats.available}</span>
              </div>
              <div className="legend-item">
                <span className="legend-bullet" style={{background:'#fbbf24'}}/>
                <span className="legend-label">ĐÃ ĐẶT:</span>
                <span className="legend-count">{stats.reserved}</span>
              </div>
              <div className="legend-item">
                <span className="legend-bullet" style={{background:'#f87171'}}/>
                <span className="legend-label">ĐANG THUÊ:</span>
                <span className="legend-count">{stats.occupied}</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="rm-filters">
            <div className="rm-filter-group">
              <label className="filter-label">Tầng</label>
              <select className="filter-select" value={floor} onChange={e => setFloor(e.target.value)}>
                <option>Tất cả các tầng</option>
                <option>Tầng 04 - Penthouse & Suites</option>
                <option>Tầng 03 - Deluxe Premium</option>
              </select>
            </div>
            <div className="rm-filter-group">
              <label className="filter-label">Loại Phòng</label>
              <select className="filter-select" value={type} onChange={e => setType(e.target.value)}>
                <option>Tất cả loại phòng</option>
              </select>
            </div>
            <div className="rm-filter-group">
              <label className="filter-label">Trạng Thái</label>
              <select className="filter-select" value={status} onChange={e => setStatus(e.target.value)}>
                <option>Mọi trạng thái</option>
                <option value="AVAILABLE">Sẵn sàng (Available)</option>
                <option value="OCCUPIED">Đang thuê (Occupied)</option>
              </select>
            </div>
            <button className="btn-reset-view" onClick={() => {setFloor('Tất cả các tầng'); setStatus('Mọi trạng thái')}}>Bỏ Lọc</button>
          </div>
        </div>

        {/* Floors */}
        <div className="rm-body">
          {errorMsg && (
            <div style={{color: 'red', padding: '20px', background: '#fee2e2', borderRadius: '8px', marginBottom: '20px'}}>
               Lỗi Tải Dữ Liệu: {errorMsg}
            </div>
          )}
          {FLOORS.map((floorObj, fi) => (
            <div key={fi} className="rm-floor">
              <div className="floor-heading">
                <span className="floor-name">{floorObj.name}</span>
                <span className="floor-count">{floorObj.rooms.length} Phòng</span>
              </div>
              <div className="room-grid">
                {floorObj.rooms.filter(filterRoom).map((room, ri) => {
                  const cfg = STATUS_CONFIG[room.status] || STATUS_CONFIG.AVAILABLE
                  return (
                    <div key={ri} className={`room-card ${cfg.cls}`}>
                      <div className="room-card-top">
                        <span className="room-number">{room.num}</span>
                        <button className="room-menu-btn">⋮</button>
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
