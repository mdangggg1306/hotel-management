import { useState, useEffect, useCallback } from 'react'
import { ResponsiveContainer, ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { TrendingUp, TrendingDown, CalendarDays, Download, RefreshCw, UserCheck, Home, Banknote, CalendarCheck, Coffee, Sparkles, Clock, Check, LogIn, LogOut, X, ClipboardList } from 'lucide-react'
import Layout from '../components/Layout/Layout'
import './DashboardPage.css'

const TOKEN = () => localStorage.getItem('luxemanage_token')
const BASE = 'http://localhost:3000'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    checkInsToday: 0, checkInGrowth: '0',
    bookingsToday: 0, bookingGrowth: '0',
    occupancyRate: 0,
    totalRevenue: 0, todayRevenue: 0, revenueGrowth: '0',
    roomsCleaning: 0, breakfastServed: 0, spaBooked: 0, totalRooms: 0
  })
  const [chartData, setChartData] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [recentBookings, setRecentBookings] = useState([])
  const [chartDays, setChartDays] = useState(7)
  const [loadingStats, setLoadingStats] = useState(true)

  const fetchAll = useCallback(() => {
    const headers = { 'Authorization': `Bearer ${TOKEN()}` }
    setLoadingStats(true)

    Promise.all([
      fetch(`${BASE}/api/admin/stats`, { headers }).then(r => r.json()),
      fetch(`${BASE}/api/admin/revenue-chart?days=${chartDays}`, { headers }).then(r => r.json()),
      fetch(`${BASE}/api/admin/bookings?status=PENDING&limit=5`, { headers }).then(r => r.json()),
      fetch(`${BASE}/api/admin/recent-activity`, { headers }).then(r => r.json()),
    ]).then(([statsData, chartArr, bookingsData, activityData]) => {
      if (!statsData.error) setStats(statsData)
      if (Array.isArray(chartArr)) setChartData(chartArr)
      if (bookingsData?.data && Array.isArray(bookingsData.data)) setRecentBookings(bookingsData.data)
      if (Array.isArray(activityData)) setRecentActivity(activityData.slice(0, 5))
    }).catch(console.error).finally(() => setLoadingStats(false))
  }, [chartDays])

  useEffect(() => { fetchAll() }, [fetchAll])

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

  const GrowthBadge = ({ value }) => {
    const num = parseFloat(value)
    const isUp = num >= 0
    return (
      <div className={`stat-card-sub ${isUp ? 'up' : 'down'}`} style={{ color: isUp ? '#4ade80' : '#f87171' }}>
        {isUp ? <TrendingUp size={11} strokeWidth={3} /> : <TrendingDown size={11} strokeWidth={3} />}
        {isUp ? '+' : ''}{num.toFixed(1)}% so với hôm qua
      </div>
    )
  }

  const handleExport = async () => {
    const token = TOKEN()
    const url = `${BASE}/api/admin/export/bookings`
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
    if (!res.ok) { alert('Xuất thất bại'); return }
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `bookings-${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`
    a.click()
  }

  const statusColors = {
    PENDING: '#f59e0b', CONFIRMED: '#3b82f6',
    CHECKED_IN: '#10b981', CHECKED_OUT: '#9ca3af', CANCELLED: '#ef4444'
  }

  const ActivityIcon = ({ status }) => {
    switch (status) {
      case 'PENDING': return <Clock size={16} />
      case 'CONFIRMED': return <Check size={16} />
      case 'CHECKED_IN': return <LogIn size={16} />
      case 'CHECKED_OUT': return <LogOut size={16} />
      case 'CANCELLED': return <X size={16} />
      default: return <ClipboardList size={16} />
    }
  }

  return (
    <Layout>
      <div className="dashboard-page">
        {/* Header */}
        <div className="dash-header">
          <div>
            <h1 className="page-title">Báo Cáo Hoạt Động</h1>
            <p className="page-subtitle">Cơ sở: LUXE RESERVE</p>
          </div>
          <div className="dash-header-right">
            <div className="dash-date">
              <CalendarDays size={14} strokeWidth={2} />
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <button className="btn-dark" onClick={handleExport}>
              <Download size={14} strokeWidth={2} />
              Xuất CSV
            </button>
            <button className="btn-dark" onClick={fetchAll} style={{ background: 'rgba(255,255,255,0.1)' }}>
              <RefreshCw size={14} strokeWidth={2} />
              Làm mới
            </button>
          </div>
        </div>

        <div className="page-body">
          {/* Stat Cards */}
          <div className="dash-stats">
            <div className="stat-card">
              <div className="stat-card-label">Check-in Hôm Nay</div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div className="stat-card-value">{stats.checkInsToday}</div>
                  <GrowthBadge value={stats.checkInGrowth} />
                </div>
                <div className="stat-card-icon">
                  <UserCheck size={16} strokeWidth={2} />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">Tỉ Lệ Lấp Đầy</div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div className="stat-card-value">{stats.occupancyRate}%</div>
                  <div className="dash-progress-bar">
                    <div className="dash-progress-fill" style={{width:`${Math.min(100, stats.occupancyRate)}%`}}/>
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                    {stats.totalRooms} phòng tổng
                  </div>
                </div>
                <div className="stat-card-icon">
                  <Home size={16} strokeWidth={2} />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">Doanh Thu Hôm Nay</div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div className="stat-card-value gold" style={{fontSize: '20px'}}>{formatCurrency(stats.todayRevenue)}</div>
                  <GrowthBadge value={stats.revenueGrowth} />
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>
                    Tổng: {formatCurrency(stats.totalRevenue)}
                  </div>
                </div>
                <div className="stat-card-icon">
                  <Banknote size={16} strokeWidth={2} />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">Booking Hôm Nay</div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div className="stat-card-value">{stats.bookingsToday}</div>
                  <GrowthBadge value={stats.bookingGrowth} />
                </div>
                <div className="stat-card-icon">
                  <CalendarCheck size={16} strokeWidth={2} />
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="dash-grid">
            {/* Revenue Chart */}
            <div className="content-card dash-chart-card">
              <div className="content-card-header">
                <span className="content-card-title">Doanh Thu {chartDays} Ngày Qua</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {[7, 14, 30].map(d => (
                    <button key={d} onClick={() => setChartDays(d)}
                      style={{
                        padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                        border: 'none', cursor: 'pointer',
                        background: chartDays === d ? '#c9a84c' : 'rgba(255,255,255,0.1)',
                        color: chartDays === d ? '#0d1b2a' : 'rgba(255,255,255,0.5)'
                      }}
                    >
                      {d}N
                    </button>
                  ))}
                </div>
              </div>
              {chartData.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Đang tải biểu đồ...</div>
              ) : (
                <div style={{ width: '100%', height: '220px', padding: '10px 10px 0 0', marginTop: '10px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#c9a84c" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#c9a84c" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false}
                        tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} dy={10}
                        tickFormatter={(val) => val.split(',')[0]} />
                      <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false}
                        tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} width={60}
                        tickFormatter={(val) => {
                          if (val >= 1000000000) return `${(val/1000000000).toFixed(1)}B`
                          if (val >= 1000000) return `${(val/1000000).toFixed(1)}M`
                          if (val >= 1000) return `${(val/1000).toFixed(0)}K`
                          return `${val}`
                        }} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false}
                        tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                        formatter={(value, name) => [name === 'revenue' ? formatCurrency(value) : value, name === 'revenue' ? 'Doanh thu' : 'Booking']}
                      />
                      <Area yAxisId="left" type="monotone" dataKey="revenue" name="revenue"
                        stroke="#c9a84c" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                      <Bar yAxisId="right" dataKey="bookings" name="bookings"
                        fill="rgba(255,255,255,0.15)" barSize={16} radius={[4, 4, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Pending Bookings */}
            <div className="content-card">
              <div className="content-card-header">
                <span className="content-card-title">Booking Chờ Xác Nhận</span>
                <span style={{ fontSize: '12px', background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '20px', fontWeight: 600 }}>
                  {recentBookings.length}
                </span>
              </div>
              <div className="activity-list">
                {recentBookings.length === 0 ? (
                  <div style={{ padding: '20px', color: '#9ca3af', fontSize: '13px', textAlign: 'center' }}>
                    Không có booking nào cần xử lý ✓
                  </div>
                ) : recentBookings.map((b) => (
                  <div key={b.id} className="activity-item">
                    <div className="activity-dot" style={{ background: '#c9a84c' }} />
                    <div style={{ flex: 1 }}>
                      <div className="activity-title">{b.guest?.full_name} · {b.roomType?.name}</div>
                      <div className="activity-sub">{b.booking_code} · {new Date(b.check_in).toLocaleDateString('vi-VN')}</div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#059669' }}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(b.total_amount)}
                    </span>
                  </div>
                ))}
                <button className="btn-view-all" onClick={() => window.location.href='/reservations'}>
                  Quản lý đặt phòng →
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="dash-bottom">
            {/* Housekeeping */}
            <div className="hk-alert-card">
              <div className="hk-alert-bg" />
              <div className="hk-alert-content">
                <div className="hk-alert-title">Dọn Dẹp (Housekeeping)</div>
                <div className="hk-alert-desc">
                  {stats.roomsCleaning > 0
                    ? `${stats.roomsCleaning} phòng đang chờ dọn dẹp`
                    : `Tất cả các phòng đã sẵn sàng ✓`}
                </div>
                <button className="hk-assign-btn" onClick={() => window.location.href='/room-matrix'}>
                  Xem sơ đồ phòng →
                </button>
              </div>
              <div className="hk-alert-icon">
                <Home size={60} strokeWidth={0.8} color="rgba(255,255,255,0.2)" />
              </div>
            </div>

            {/* Breakfast */}
            <div className="content-card mini-stat-card">
              <div className="mini-stat-icon">
                <Coffee size={22} strokeWidth={1.5} />
              </div>
              <div className="mini-stat-label">BỮA SÁNG (BREAKFAST)</div>
              <div className="mini-stat-value">{stats.breakfastServed || 0} Khách</div>
              <div className="mini-stat-sub">Đã đặt kèm phòng</div>
            </div>

            {/* Spa */}
            <div className="content-card mini-stat-card">
              <div className="mini-stat-icon">
                <Sparkles size={22} strokeWidth={1.5} />
              </div>
              <div className="mini-stat-label">LỊCH ĐẶT SPA</div>
              <div className="mini-stat-value">{stats.spaBooked || 0} Lượt</div>
              <div className="mini-stat-sub">Đã xác nhận</div>
            </div>
          </div>

          {/* Recent Activity (real data) */}
          <div className="content-card" style={{ marginTop: '20px' }}>
            <div className="content-card-header">
              <span className="content-card-title">Hoạt Động Gần Đây</span>
              <button style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={fetchAll}>
                <RefreshCw size={12} strokeWidth={2} /> Cập nhật
              </button>
            </div>
            <div className="activity-list">
              {recentActivity.length === 0 ? (
                <div style={{ padding: '20px', color: '#9ca3af', fontSize: '13px', textAlign: 'center' }}>Chưa có hoạt động nào</div>
              ) : recentActivity.map((act, i) => (
                <div key={act.id || i} className="activity-item">
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    background: `${statusColors[act.status] || '#c9a84c'}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'
                  }}>
                    <ActivityIcon status={act.status} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="activity-title">{act.title}</div>
                    <div className="activity-sub">{act.sub}</div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                    {act.timestamp ? new Date(act.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
