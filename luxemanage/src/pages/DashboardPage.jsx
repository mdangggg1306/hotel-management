import { useState, useEffect } from 'react'
import { ResponsiveContainer, ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import Layout from '../components/Layout/Layout'
import './DashboardPage.css'

const TOKEN = () => localStorage.getItem('luxemanage_token')
const BASE = 'http://localhost:3000'

const RECENT_ACTIVITY = [
  { icon: '👤', color: '#c9a84c', title: 'VIP Check-in: Alexander Du Pont', sub: 'Penthouse Suite · 2 mins ago' },
  { icon: '🔧', color: '#60a5fa', title: 'Room 402 Maintenance Completed', sub: 'Housekeeping Dept · 15 mins ago' },
  { icon: '🎉', color: '#a78bfa', title: 'Large Event Booking: Gala Night', sub: 'Ballroom A · 1 hour ago' },
  { icon: '💳', color: '#4ade80', title: 'Invoice #8821 Settled', sub: 'Guest: Maria Rossi · 3 hours ago' },
]

export default function DashboardPage() {
  const [stats, setStats] = useState({ checkInsToday: 0, occupancyRate: 0, totalRevenue: 0, bookingsToday: 0, roomsCleaning: 0, breakfastServed: 0, spaBooked: 0, totalRooms: 0 });
  const [chartData, setChartData] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    const headers = { 'Authorization': `Bearer ${TOKEN()}` };
    fetch(`${BASE}/api/admin/stats`, { headers })
      .then(r => r.json()).then(data => { if (!data.error) setStats(data); }).catch(console.error);
    fetch(`${BASE}/api/admin/revenue-chart`, { headers })
      .then(r => r.json()).then(data => { if (Array.isArray(data)) setChartData(data); }).catch(console.error);
    fetch(`${BASE}/api/admin/bookings?status=PENDING`, { headers })
      .then(r => r.json()).then(data => { if (Array.isArray(data)) setRecentBookings(data.slice(0, 4)); }).catch(console.error);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <Layout>
      <div className="dashboard-page">
        {/* Header */}
        <div className="dash-header">
          <div>
            <h1 className="page-title">Báo Cáo Hoạt Động (Admin)</h1>
            <p className="page-subtitle">Cơ sở: LUXE RESERVE</p>
          </div>
          <div className="dash-header-right">
            <div className="dash-date">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {new Date().toLocaleDateString('vi-VN')}
            </div>
            <button className="btn-dark">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Xuất Báo Cáo
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
                  <div className="stat-card-sub up">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15"/></svg>
                    +12% so với hôm qua
                  </div>
                </div>
                <div className="stat-card-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">Tỉ Lệ Lấp Đầy (Occupancy)</div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div className="stat-card-value">{stats.occupancyRate}%</div>
                  <div className="dash-progress-bar">
                    <div className="dash-progress-fill" style={{width:`${stats.occupancyRate}%`}}/>
                  </div>
                </div>
                <div className="stat-card-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">Doanh Thu (YTD)</div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div className="stat-card-value gold" style={{fontSize: '24px'}}>{formatCurrency(stats.totalRevenue)}</div>
                  <div className="stat-card-sub">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3"><circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/></svg>
                    Đạt mục tiêu
                  </div>
                </div>
                <div className="stat-card-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>


          {/* Main Grid */}
          <div className="dash-grid">
            {/* Real Revenue Chart */}
            <div className="content-card dash-chart-card">
              <div className="content-card-header">
                <span className="content-card-title">Doanh Thu 7 Ngày Qua</span>
                <div className="chart-legend">
                  <span className="legend-dot regular" /> Doanh thu (USD)
                  <span className="legend-dot vip" /> Booking
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
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} dy={10} tickFormatter={(val) => val.split(',')[0]} />
                      <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} width={50} tickFormatter={(val) => {
                        if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
                        if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
                        return `$${val}`;
                      }} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}
                        formatter={(value, name) => [name === 'revenue' ? formatCurrency(value) : value, name === 'revenue' ? 'Doanh thu' : 'Booking']}
                      />
                      <Area yAxisId="left" type="monotone" dataKey="revenue" name="revenue" stroke="#c9a84c" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                      <Bar yAxisId="right" dataKey="bookings" name="bookings" fill="rgba(255,255,255,0.15)" barSize={16} radius={[4, 4, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Pending Bookings */}
            <div className="content-card">
              <div className="content-card-header">
                <span className="content-card-title">Booking Chờ Xác Nhận</span>
              </div>
              <div className="activity-list">
                {recentBookings.length === 0 ? (
                  <div style={{ padding: '20px', color: '#9ca3af', fontSize: '13px', textAlign: 'center' }}>Không có booking nào cần xử lý ✓</div>
                ) : recentBookings.map((b, i) => (
                  <div key={b.id} className="activity-item">
                    <div className="activity-dot" style={{ background: '#c9a84c' }} />
                    <div style={{ flex: 1 }}>
                      <div className="activity-title">{b.guest?.full_name} · {b.roomType?.name}</div>
                      <div className="activity-sub">{b.booking_code} · {new Date(b.check_in).toLocaleDateString('vi-VN')}</div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#059669' }}>${b.total_amount?.toLocaleString()}</span>
                  </div>
                ))}
                <button className="btn-view-all" onClick={() => window.location.href='/reservations'}>Xem tất cả →</button>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="dash-bottom">
            {/* Housekeeping Alert */}
            <div className="hk-alert-card">
              <div className="hk-alert-bg" />
              <div className="hk-alert-content">
                <div className="hk-alert-title">Dọn Dẹp (Housekeeping)</div>
                <div className="hk-alert-desc">
                  {stats.roomsCleaning > 0 
                    ? `${stats.roomsCleaning} phòng đang chờ dọn dẹp` 
                    : `Tất cả các phòng đã sẵn sàng`}
                </div>
                <button className="hk-assign-btn">Phân công nhân viên</button>
              </div>
              <div className="hk-alert-icon">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
            </div>

            {/* Breakfast */}
            <div className="content-card mini-stat-card">
              <div className="mini-stat-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                  <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/>
                  <line x1="14" y1="1" x2="14" y2="4"/>
                </svg>
              </div>
              <div className="mini-stat-label">BỮA SÁNG (BREAKFAST)</div>
              <div className="mini-stat-value">{stats.breakfastServed || 0} Khách</div>
              <div className="mini-stat-sub">Đã đặt kèm phòng</div>
            </div>

            {/* Spa */}
            <div className="content-card mini-stat-card">
              <div className="mini-stat-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div className="mini-stat-label">LỊCH ĐẶT SPA</div>
              <div className="mini-stat-value">{stats.spaBooked || 0} Lượt</div>
              <div className="mini-stat-sub">Đã xác nhận</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
