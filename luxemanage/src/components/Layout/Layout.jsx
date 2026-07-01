import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Bell, BellOff, ConciergeBell, ClipboardList,
  LayoutDashboard, Grid, CalendarDays, Users, Receipt,
  Star, Search, Home, LogIn, LogOut, Bed, MapPin
} from 'lucide-react'
import './Layout.css'

// Nav items cho ADMIN
const ADMIN_NAV = [
  { to: '/dashboard',   label: 'Tổng quan',   icon: <LayoutDashboard size={18} strokeWidth={1.8} /> },
  { to: '/room-matrix', label: 'Sơ đồ phòng', icon: <Grid size={18} strokeWidth={1.8} /> },
  { to: '/reservations',label: 'Đặt phòng',   icon: <CalendarDays size={18} strokeWidth={1.8} /> },
  { to: '/customers',   label: 'Khách hàng',  icon: <Users size={18} strokeWidth={1.8} /> },
  { to: '/billing',     label: 'Doanh thu',   icon: <Receipt size={18} strokeWidth={1.8} /> },
]

// Nav items cho RECEPTIONIST
const RECEPTIONIST_NAV = [
  { to: '/reception',           label: 'Tổng quan',       icon: <LayoutDashboard size={18} strokeWidth={1.8} /> },
  { to: '/reception/bookings',  label: 'Quản lý Booking', icon: <CalendarDays size={18} strokeWidth={1.8} /> },
  { to: '/reception/rooms',     label: 'Sơ đồ phòng',    icon: <Grid size={18} strokeWidth={1.8} /> },
  { to: '/reception/services',  label: 'Yêu cầu DV',     icon: <ConciergeBell size={18} strokeWidth={1.8} /> },
]

function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const dropRef = useRef(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user?.role !== 'ADMIN') return

    const token = localStorage.getItem('luxury_hotel_token')
    if (!token) return

    const es = new EventSource(`/api/admin/notifications/stream?token=${token}`)

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'connected') return
        setNotifications(prev => [data, ...prev].slice(0, 20))
        setUnreadCount(c => c + 1)
      } catch {}
    }

    return () => es.close()
  }, [])

  useEffect(() => {
    function handleClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const openBell = () => {
    setOpen(o => !o)
    if (!open) setUnreadCount(0)
  }

  const timeAgo = (ts) => {
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
    if (diff < 60) return `${diff}s trước`
    if (diff < 3600) return `${Math.floor(diff/60)}m trước`
    return `${Math.floor(diff/3600)}h trước`
  }

  return (
    <div style={{ position: 'relative' }} ref={dropRef}>
      <button className="topbar-icon-btn" title="Thông báo" onClick={openBell} style={{ position: 'relative' }}>
        <Bell size={17} strokeWidth={2} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: '#ef4444', color: 'white',
            borderRadius: '50%', width: '16px', height: '16px',
            fontSize: '10px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #0d1b2a'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '44px', right: 0,
          width: '360px', background: 'white',
          borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          border: '1px solid #e5e7eb', zIndex: 1000,
          animation: 'slideDown 0.2s ease'
        }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid #e5e7eb',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bell size={16} fill="#f59e0b" color="#f59e0b" /> Thông báo realtime
            </span>
            <span style={{
              background: '#f3f4f6', borderRadius: '20px',
              padding: '2px 8px', fontSize: '11px', color: '#6b7280'
            }}>
              {notifications.length} tin
            </span>
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                <BellOff size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <div>Chưa có thông báo mới</div>
              </div>
            ) : notifications.map((n, i) => (
              <div key={i} style={{
                padding: '14px 20px', borderBottom: '1px solid #f9fafb',
                display: 'flex', gap: '12px', alignItems: 'flex-start',
                transition: '0.15s',
                cursor: 'pointer',
                background: i === 0 ? '#fffbeb' : 'white'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.background = i === 0 ? '#fffbeb' : 'white'}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: n.type === 'new_booking' ? 'rgba(201,168,76,0.15)' : 'rgba(99,102,241,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', flexShrink: 0,
                  color: n.type === 'new_booking' ? '#c9a84c' : '#6366f1'
                }}>
                  {n.type === 'new_booking' ? <ConciergeBell size={18} /> : <ClipboardList size={18} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '3px' }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.4 }}>
                    {n.message}
                  </div>
                  {n.timestamp && (
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                      {timeAgo(n.timestamp)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {notifications.length > 0 && (
            <div style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid #f3f4f6' }}>
              <button
                onClick={() => setNotifications([])}
                style={{ background: 'none', border: 'none', fontSize: '12px', color: '#6b7280', cursor: 'pointer' }}
              >
                Xóa tất cả thông báo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Layout({ children }) {
  const navigate = useNavigate()
  const { user, logout, isAdmin, isReceptionist } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')

  // Chọn nav items và home path theo role
  const navItems = isAdmin ? ADMIN_NAV : RECEPTIONIST_NAV
  const homePath = isAdmin ? '/dashboard' : '/reception'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleGlobalSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    if (isAdmin) {
      navigate(`/reservations?search=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate(`/reception?search=${encodeURIComponent(searchQuery.trim())}`)
    }
    setSearchQuery('')
  }

  const getRoleLabel = () => {
    if (user?.role === 'ADMIN') return 'Quản trị viên'
    if (user?.role === 'RECEPTIONIST') return 'Lễ Tân'
    return 'Nhân viên'
  }

  return (
    <div className="layout">
      {/* ===== SIDEBAR ===== */}
      <aside className="sidebar">
        <div className="sidebar-brand" onClick={() => navigate(homePath)}>
          <span className="sb-logo">Luxury Hotel</span>
          <span className="sb-sub">{isReceptionist ? 'STAFF PORTAL' : 'Elite Hospitality'}</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/reception'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span className="nav-item-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          {isAdmin && (
            <>
              <button className="btn-vip" onClick={() => navigate('/reservations?status=CHECKED_IN')} title="Xem danh sách khách đang lưu trú">
                <Star size={14} fill="currentColor" />
                Khách VIP Check-in
              </button>

              <div className="sidebar-footer-links">
                <button className="footer-link-btn" onClick={() => navigate('/customers')} title="Quản lý khách hàng">
                  <Users size={15} strokeWidth={1.8} />
                  Khách hàng
                </button>
                <button className="footer-link-btn" onClick={() => navigate('/billing')} title="Báo cáo doanh thu">
                  <Receipt size={15} strokeWidth={1.8} />
                  Doanh thu
                </button>
              </div>
            </>
          )}

          {isReceptionist && (
            <div className="sidebar-footer-links">
              <button className="footer-link-btn" onClick={() => navigate('/reception/bookings')} title="Tạo booking walk-in">
                <LogIn size={15} strokeWidth={1.8} />
                Booking mới
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <div className="main-wrapper">
        {/* Top Bar */}
        <header className="topbar">
          <form className="topbar-search" onSubmit={handleGlobalSearch} style={{ display: 'flex', alignItems: 'center' }}>
            <Search size={15} strokeWidth={2} />
            <input
              type="text"
              placeholder={isAdmin ? 'Tìm khách, mã booking...' : 'Tìm khách, phòng, booking...'}
              className="topbar-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </form>

          <div className="topbar-actions">
            <NotificationBell />

            <button className="topbar-icon-btn" title="Trang chủ" onClick={() => window.open('/', '_blank')}>
              <Home size={16} strokeWidth={2} />
            </button>

            <div className="topbar-user" style={{ cursor: 'default' }}>
              <div className="user-info">
                <span className="user-name">{user?.full_name || user?.name || 'Staff'}</span>
                <span className="user-role">{getRoleLabel()}</span>
              </div>
              <div
                className="user-avatar"
                onClick={handleLogout}
                title="Click để đăng xuất"
                style={{ cursor: 'pointer' }}
              >
                {(user?.full_name || user?.name || 'S')[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  )
}
