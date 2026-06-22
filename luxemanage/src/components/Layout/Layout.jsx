import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Layout.css'

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    to: '/room-matrix',
    label: 'Room Matrix',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    to: '/reservations',
    label: 'Reservations',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    to: '/customers',
    label: 'Customers',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    to: '/billing',
    label: 'Billing',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    ),
  },
]

function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const dropRef = useRef(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user?.role !== 'ADMIN') return

    const token = localStorage.getItem('luxemanage_token')
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
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
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
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>
              🔔 Thông báo realtime
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
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔕</div>
                Chưa có thông báo mới
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
                  fontSize: '16px', flexShrink: 0
                }}>
                  {n.type === 'new_booking' ? '🛎️' : '📋'}
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
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="layout">
      {/* ===== SIDEBAR ===== */}
      <aside className="sidebar">
        <div className="sidebar-brand" onClick={() => navigate('/dashboard')}>
          <span className="sb-logo">LuxeManage</span>
          <span className="sb-sub">Elite Hospitality</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span className="nav-item-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="btn-vip" onClick={() => alert('Check-in VIP!')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            Check-in VIP
          </button>

          <div className="sidebar-footer-links">
            <button className="footer-link-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 0-14.14 0M4.93 19.07a10 10 0 0 0 14.14 0"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              </svg>
              Settings
            </button>
            <button className="footer-link-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Support
            </button>
          </div>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <div className="main-wrapper">
        {/* Top Bar */}
        <header className="topbar">
          <div className="topbar-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Search guests, rooms, or events..." className="topbar-input" />
          </div>

          <div className="topbar-actions">
            <NotificationBell />

            <button className="topbar-icon-btn" title="Dark mode">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            </button>

            <div className="topbar-user" onClick={handleLogout} title="Đăng xuất">
              <div className="user-info">
                <span className="user-name">{user?.name || 'Admin'}</span>
                <span className="user-role">{user?.title || 'Manager'}</span>
              </div>
              <div className="user-avatar">{user?.initials || 'A'}</div>
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
