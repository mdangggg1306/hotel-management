import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './UserPortalPage.css'

/* ──────────────────────────────────────────────────────── */
/*  DATA                                                    */
/* ──────────────────────────────────────────────────────── */
const ROOM_TYPE_FILTERS = ['All Categories', 'Suite', 'Penthouse', 'Deluxe']

function Stars({ count = 5 }) {
  return (
    <span className="star-row">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24"
          fill={i < count ? '#c9a84c' : 'none'}
          stroke={i < count ? '#c9a84c' : '#4b5563'}
          strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  )
}

const UPSELLS = [
  { id: 'airport', icon: '✈️', title: 'Đưa đón sân bay cao cấp', desc: 'Dịch vụ tài xế riêng với dòng xe sang trọng.', price: 120 },
  { id: 'dining', icon: '🍽️', title: 'Tín dụng ẩm thực tại phòng', desc: 'Tín dụng $150 cho trải nghiệm ẩm thực thượng hạng.', price: 85 },
  { id: 'spa', icon: '💆', title: 'Gói thư giãn Spa', desc: 'Massage phục hồi 60 phút cho một khách.', price: 160 },
  { id: 'champagne', icon: '🥂', title: 'Sâm-panh chào mừng', desc: 'Một chai Dom Pérignon ướp lạnh chờ sẵn trong phòng.', price: 390 },
]

function BookingDetailsModal({ booking, onClose }) {
  if (!booking) return null;

  const nights = Math.max(0, Math.round((new Date(booking.check_out) - new Date(booking.check_in)) / 86400000));
  const hasUpsells = booking.upsells && booking.upsells.length > 0;

  return (
    <div className="ub-modal-overlay" onClick={onClose}>
      <div className="ub-modal-content" onClick={e => e.stopPropagation()}>
        <button className="ub-modal-close" onClick={onClose}>&times;</button>
        <div className="ub-modal-header">
          <h2>Chi Tiết Đặt Phòng</h2>
          <span className={`ub-status status-${booking.status.toLowerCase()}`}>{booking.status === 'PENDING' ? 'CHỜ XÁC NHẬN' : booking.status === 'CONFIRMED' ? 'ĐÃ XÁC NHẬN' : 'ĐÃ HỦY'}</span>
        </div>

        <div className="ub-modal-body">
          <div className="ub-modal-section">
            <h3>Thông tin chung</h3>
            <div className="ub-info-grid">
              <div><label>Mã Đặt Phòng:</label><span>{booking.booking_code}</span></div>
              <div><label>Ngày Đặt:</label><span>{new Date(booking.createdAt).toLocaleDateString('vi-VN')}</span></div>
              <div><label>Nhận Phòng:</label><span>{new Date(booking.check_in).toLocaleDateString('vi-VN')} (Từ 14:00)</span></div>
              <div><label>Trả Phòng:</label><span>{new Date(booking.check_out).toLocaleDateString('vi-VN')} (Trước 12:00)</span></div>
              <div><label>Thời gian lưu trú:</label><span>{nights} Đêm</span></div>
            </div>
          </div>

          <div className="ub-modal-section">
            <h3>Chi tiết phòng</h3>
            <div className="ub-room-preview">
              <img src={booking.roomType?.images?.[0] || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&q=80'} alt="Room" />
              <div>
                <h4>{booking.roomType?.name}</h4>
                <p>{booking.roomType?.description}</p>
                {booking.special_request && <p className="special-req"><strong>Yêu cầu đặc biệt:</strong> {booking.special_request}</p>}
              </div>
            </div>
          </div>

          <div className="ub-modal-section">
            <h3>Chi tiết thanh toán</h3>
            <div className="ub-price-breakdown">
              <div className="pb-row">
                <span>Giá phòng ({nights} đêm)</span>
                <span>${(booking.roomType?.base_price * nights).toLocaleString()}.00</span>
              </div>
              {hasUpsells && (
                <>
                  <div className="pb-divider"></div>
                  <div className="pb-row-title">Dịch vụ bổ sung:</div>
                  {booking.upsells.map(u => (
                    <div key={u.id} className="pb-row sub">
                      <span>• {u.service_name}</span>
                      <span>${u.price.toLocaleString()}.00</span>
                    </div>
                  ))}
                </>
              )}
              <div className="pb-divider"></div>
              <div className="pb-row total">
                <span>Tổng Cộng</span>
                <span>${booking.total_amount.toLocaleString()}.00</span>
              </div>
              {booking.payments && booking.payments.length > 0 && (
                <div className="pb-payment-method">
                  Phương thức thanh toán: <strong>{booking.payments[0].payment_method.replace('_', ' ')}</strong>
                </div>
              )}
            </div>
          </div>

          <div className="ub-modal-actions">
            <button className="ub-btn-outline" onClick={onClose}>Đóng</button>
            <button className="ub-btn-dark">Tải Hóa Đơn PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserBookingsList() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem('luxemanage_token');
        const res = await fetch('/api/user/bookings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setBookings(data);
        }
      } catch (err) {
        console.error('Error fetching bookings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  if (loading) return <div className="ub-loading">Đang tải lịch sử đặt phòng...</div>;
  if (bookings.length === 0) return <div className="ub-empty">Bạn chưa có đặt phòng nào.</div>;

  return (
    <div className="ub-list">
      {bookings.map(b => (
        <div key={b.id} className="ub-card">
          <img src={b.roomType?.images?.[0] || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&q=80'} alt="Room" className="ub-room-img" />
          <div className="ub-details">
            <div className="ub-header-top">
              <h3>{b.roomType?.name || 'Phòng Khách Sạn'}</h3>
              <span className={`ub-status status-${b.status.toLowerCase()}`}>{b.status === 'PENDING' ? 'CHỜ XÁC NHẬN' : b.status === 'CONFIRMED' ? 'ĐÃ XÁC NHẬN' : 'ĐÃ HỦY'}</span>
            </div>
            <p className="ub-resort-name">LUXEMANAGE RESORT</p>
            <div className="ub-grid">
              <div>
                <label>NGÀY LƯU TRÚ</label>
                <p>{new Date(b.check_in).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' })} - {new Date(b.check_out).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
              <div>
                <label>MÃ ĐẶT PHÒNG</label>
                <p>{b.booking_code}</p>
              </div>
              <div>
                <label>TỔNG CỘNG</label>
                <p className="ub-price">${b.total_amount.toLocaleString()}</p>
              </div>
            </div>
            <div className="ub-actions">
              <button className="ub-btn-dark" onClick={() => setSelectedBooking(b)}>Chi Tiết Đặt Phòng</button>
              <button className="ub-btn-outline">Quản Lý Đặt Phòng</button>
              <button className="ub-btn-text">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                Tải Hóa Đơn
              </button>
            </div>
          </div>
        </div>
      ))}
      <BookingDetailsModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
    </div>
  );
}

function UserProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [profile, setProfile] = useState({
    full_name: '', phone: '', email: '', dob: '', address: '',
    dietary_prefs: '', pillow_type: '', room_location_pref: '', payment_method_pref: 'card'
  });
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('luxemanage_token');
      const res = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const { user: u } = await res.json();
        setProfile({
          full_name: u.full_name || '',
          email: u.email || '',
          phone: u.phone || '',
          dob: u.dob ? u.dob.split('T')[0] : '',
          address: u.address || '',
          dietary_prefs: u.dietary_prefs || '',
          pillow_type: u.pillow_type || '',
          room_location_pref: u.room_location_pref || '',
          payment_method_pref: u.payment_method_pref || 'card'
        });
      }
    };
    fetchMe();
  }, []);

  const handleChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });
  const handlePassChange = (e) => setPasswords({ ...passwords, [e.target.name]: e.target.value });

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('luxemanage_token');
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(profile)
      });
      if (res.ok) alert('Cập nhật hồ sơ thành công!');
      else alert('Cập nhật thất bại!');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }
    if (passwords.newPassword.length < 6) {
      alert('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('luxemanage_token');
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ oldPassword: passwords.oldPassword, newPassword: passwords.newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Đổi mật khẩu thành công!');
        setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        alert(data.error || 'Lỗi đổi mật khẩu');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="up-profile-layout">
      <div className="up-sidebar">
        <div className="up-settings-menu">
          <h3>Cài đặt</h3>
          <ul>
            <li className={activeTab === 'personal' ? 'active' : ''} onClick={() => setActiveTab('personal')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill={activeTab === 'personal' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg> Thông tin cá nhân
            </li>
            <li className={activeTab === 'security' ? 'active' : ''} onClick={() => setActiveTab('security')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg> Bảo mật
            </li>
            <li className={activeTab === 'payment' ? 'active' : ''} onClick={() => setActiveTab('payment')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg> Phương thức thanh toán
            </li>
            <li className={activeTab === 'preferences' ? 'active' : ''} onClick={() => setActiveTab('preferences')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg> Tùy chọn
            </li>
          </ul>
        </div>
        <div className="up-membership-card">
          <p className="tier-label">HẠNG THÀNH VIÊN</p>
          <h3>Gold Elite</h3>
          <div className="tier-points">
            <span>12,450 điểm</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="7" />
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
            </svg>
          </div>
        </div>
      </div>

      <div className="up-main-content">
        {activeTab === 'personal' && (
          <div className="up-profile-card slide-in-bottom">
            <div className="up-profile-header">
              <div className="up-avatar-large">
                <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&q=80" alt="Avatar" />
                <button className="edit-avatar"><svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg></button>
              </div>
              <h2>Thông tin cá nhân</h2>
            </div>
            <div className="up-form-grid">
              <div className="up-form-group">
                <label>HỌ VÀ TÊN</label>
                <input type="text" name="full_name" value={profile.full_name} onChange={handleChange} />
              </div>
              <div className="up-form-group">
                <label>EMAIL</label>
                <input type="email" name="email" value={profile.email} onChange={handleChange} readOnly style={{ backgroundColor: '#f9fafb' }} />
              </div>
              <div className="up-form-group">
                <label>SỐ ĐIỆN THOẠI</label>
                <input type="text" name="phone" value={profile.phone} onChange={handleChange} />
              </div>
              <div className="up-form-group">
                <label>NGÀY SINH</label>
                <input type="date" name="dob" value={profile.dob} onChange={handleChange} />
              </div>
              <div className="up-form-group full-width">
                <label>ĐỊA CHỈ</label>
                <input type="text" name="address" value={profile.address} onChange={handleChange} />
              </div>
            </div>
            <div className="up-form-actions">
              <button className="up-btn-dark" onClick={handleSaveProfile} disabled={saving}>
                {saving ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="up-profile-card slide-in-bottom">
            <div className="up-profile-header">
              <h2>Bảo mật tài khoản</h2>
            </div>
            <div className="up-form-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '500px' }}>
              <div className="up-form-group">
                <label>MẬT KHẨU HIỆN TẠI</label>
                <input type="password" name="oldPassword" value={passwords.oldPassword} onChange={handlePassChange} />
              </div>
              <div className="up-form-group">
                <label>MẬT KHẨU MỚI</label>
                <input type="password" name="newPassword" value={passwords.newPassword} onChange={handlePassChange} />
              </div>
              <div className="up-form-group">
                <label>XÁC NHẬN MẬT KHẨU</label>
                <input type="password" name="confirmPassword" value={passwords.confirmPassword} onChange={handlePassChange} />
              </div>
            </div>
            <div className="up-form-actions">
              <button className="up-btn-dark" onClick={handleChangePassword} disabled={saving}>
                {saving ? 'ĐANG XỬ LÝ...' : 'ĐỔI MẬT KHẨU'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="up-profile-card slide-in-bottom">
            <div className="up-profile-header">
              <h2>Phương thức thanh toán ưu tiên</h2>
              <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '5px' }}>Phương thức này sẽ được tự động chọn khi bạn tiến hành thanh toán đặt phòng.</p>
            </div>
            <div className="up-form-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '500px' }}>
              <div className="up-form-group">
                <label>CHỌN PHƯƠNG THỨC</label>
                <select name="payment_method_pref" value={profile.payment_method_pref} onChange={handleChange} style={{ width: '100%', padding: '12px 14px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', background: 'white' }}>
                  <option value="card">💳 Thẻ tín dụng/Ghi nợ</option>
                  <option value="paypal">PayPal</option>
                  <option value="transfer">🏦 Chuyển khoản ngân hàng</option>
                  <option value="crypto">Tiền điện tử (Crypto)</option>
                </select>
              </div>
            </div>
            <div className="up-form-actions">
              <button className="up-btn-dark" onClick={handleSaveProfile} disabled={saving}>
                {saving ? 'ĐANG LƯU...' : 'LƯU LỰA CHỌN'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="up-profile-card slide-in-bottom">
            <div className="up-profile-header">
              <h2>Tùy chọn dịch vụ phòng</h2>
              <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '5px' }}>Giúp chúng tôi chuẩn bị phòng tốt nhất cho bạn.</p>
            </div>
            <div className="up-prefs-grid">
              <div className="up-pref-card">
                <h4><span className="pref-icon">🍴</span> Chế độ ăn uống</h4>
                <input type="text" name="dietary_prefs" placeholder="Ưu tiên món ăn..." value={profile.dietary_prefs} onChange={handleChange} />
              </div>
              <div className="up-pref-card">
                <h4><span className="pref-icon">🛌</span> Loại gối</h4>
                <input type="text" name="pillow_type" placeholder="Gối lông vũ..." value={profile.pillow_type} onChange={handleChange} />
              </div>
              <div className="up-pref-card">
                <h4><span className="pref-icon">🏢</span> Vị trí phòng</h4>
                <input type="text" name="room_location_pref" placeholder="Tầng cao..." value={profile.room_location_pref} onChange={handleChange} />
              </div>
            </div>
            <div className="up-form-actions" style={{ marginTop: '30px' }}>
              <button className="up-btn-dark" onClick={handleSaveProfile} disabled={saving}>
                {saving ? 'ĐANG LƯU...' : 'LƯU TÙY CHỌN'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function UserPortalPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // ── search state ──
  const today = new Date().toISOString().split('T')[0]
  const [checkin, setCheckin] = useState('')
  const [checkout, setCheckout] = useState('')
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [roomType, setRoomType] = useState('All Categories')

  const [roomsData, setRoomsData] = useState([])

  useEffect(() => {
    let url = '/api/rooms/search';
    if (checkin && checkout) {
      url += `?checkin=${checkin}&checkout=${checkout}`;
    }
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          // Map backend fields to frontend fields
          const mappedRooms = data.map(rt => ({
            ...rt,
            price: rt.base_price,
            desc: rt.description
          }));
          setRoomsData(mappedRooms);
        }
      })
      .catch(console.error)
  }, [checkin, checkout])

  // Fetch user preferences on mount to set default payment method
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('luxemanage_token');
      fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          if (data && data.user && data.user.payment_method_pref) {
            setPayMethod(data.user.payment_method_pref);
          }
        })
        .catch(console.error);
    }
  }, [user]);

  // ── filter & paginate state ──
  const [sortBy, setSortBy] = useState('price_asc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  // ── navigation state ──
  const [step, setStep] = useState('browse') // browse | detail | confirm | payment | success
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [activePhoto, setActivePhoto] = useState(0)
  const [payMethod, setPayMethod] = useState('card')
  const [selectedUpsells, setSelectedUpsells] = useState([])
  const [bookingRef, setBookingRef] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  const nights = checkin && checkout
    ? Math.max(0, Math.round((new Date(checkout) - new Date(checkin)) / 86400000))
    : 0

  // ── filter & sort & paginate logic ──
  let filteredRooms = [...roomsData]
  if (roomType !== 'Tất cả hạng phòng' && roomType !== 'All Categories') {
    const keyword = roomType.split(' ')[0] // e.g. "Suite", "Penthouse", "Deluxe"
    filteredRooms = filteredRooms.filter(r => r.name.toLowerCase().includes(keyword.toLowerCase()))
  }

  if (sortBy === 'price_asc') {
    filteredRooms.sort((a, b) => a.price - b.price)
  } else if (sortBy === 'price_desc') {
    filteredRooms.sort((a, b) => b.price - a.price)
  } else if (sortBy === 'name_asc') {
    filteredRooms.sort((a, b) => a.name.localeCompare(b.name))
  }

  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage)
  const displayedRooms = filteredRooms.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 400, behavior: 'smooth' })
  }

  const guestLabel = `${adults} Người lớn${children > 0 ? `, ${children} Trẻ em` : ''}`

  const handleLogout = () => { logout(); navigate('/login') }

  const openDetail = (room) => {
    setSelectedRoom(room)
    setActivePhoto(0)
    setStep('detail')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openConfirm = (room) => {
    if (!checkin || !checkout) {
      alert('Vui lòng chọn ngày nhận và trả phòng!')
      return
    }
    if (nights <= 0) {
      alert('Ngày trả phòng phải sau ngày nhận phòng!')
      return
    }
    setSelectedRoom(room)
    setSelectedUpsells([])
    setStep('confirm')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleProceedPayment = () => {
    setStep('payment')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleConfirm = async () => {
    if (isProcessingPayment) return;
    setIsProcessingPayment(true);
    try {
      const token = localStorage.getItem('luxemanage_token');
      if (!token) throw new Error('Vui lòng đăng nhập lại');

      const upsellsData = UPSELLS.filter(u => selectedUpsells.includes(u.id)).map(u => ({
        service_name: u.title,
        price: u.price
      }));

      // 1. Create Booking
      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          room_type_id: selectedRoom.id,
          check_in: checkin,
          check_out: checkout,
          total_amount: grandTotal,
          special_request: '',
          upsells: upsellsData
        })
      });
      if (!bookingRes.ok) throw new Error('Không thể tạo booking');
      const bookingData = await bookingRes.json();

      // 2. Create Payment
      const paymentRes = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          booking_id: bookingData.id,
          amount: grandTotal,
          payment_method: payMethod
        })
      });
      if (!paymentRes.ok) throw new Error('Thanh toán thất bại');

      setBookingRef(bookingData.booking_code);
      setStep('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      alert('Lỗi đặt phòng: ' + err.message);
    } finally {
      setIsProcessingPayment(false);
    }
  }

  const resetAll = () => {
    setStep('browse')
    setSelectedRoom(null)
    setCheckin('')
    setCheckout('')
    setSelectedUpsells([])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleUpsell = (id) => {
    setSelectedUpsells(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const roomTotal = selectedRoom ? selectedRoom.price * nights : 0
  const upsellTotal = UPSELLS.filter(u => selectedUpsells.includes(u.id)).reduce((s, u) => s + u.price, 0)
  const taxAmount = selectedRoom ? Math.round(roomTotal * 0.12) : 0
  const resortFee = selectedRoom ? selectedRoom.serviceFee : 0
  const grandTotal = roomTotal + taxAmount + resortFee + upsellTotal

  /* ── NAV ── */
  const NavBar = ({ activeTab }) => (
    <header className="up-nav">
      <div className="up-nav-inner">
        <div className="up-brand" onClick={resetAll}>
          <span className="up-logo">LUXE RESERVE</span>
        </div>
        <nav className="up-nav-links">
          {['Phòng', 'Ẩm thực', 'Spa', 'Lịch sử đặt phòng'].map(l => (
            <button key={l}
              className={`up-nav-link ${(activeTab || (step === 'browse' ? 'Phòng' : '')) === l ? 'active' : ''}`}
              onClick={() => {
                if (l === 'Phòng') resetAll();
                if (l === 'Lịch sử đặt phòng') setStep('bookings');
              }}
            >{l}</button>
          ))}
        </nav>
        <div className="up-nav-right">
          <button className="up-nav-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Tìm kiếm
          </button>
          <div className="up-avatar-wrap">
            <div className="up-avatar" onClick={() => setShowUserMenu(!showUserMenu)} title={user?.name || user?.full_name}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            {showUserMenu && (
              <div className="user-dropdown-menu">
                <div className="ud-header">
                  <strong>{user?.name || user?.full_name || 'Khách'}</strong>
                  <span>{user?.email}</span>
                </div>
                <div className="ud-divider" />
                <button className="ud-item" onClick={() => { setStep('profile'); setShowUserMenu(false); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  Hồ sơ của tôi
                </button>
                <button className="ud-item" onClick={() => { setStep('bookings'); setShowUserMenu(false); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  Lịch sử đặt phòng
                </button>
                <div className="ud-divider" />
                <button className="ud-item ud-logout" onClick={handleLogout}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )

  /* ── STEP INDICATOR ── */
  const StepIndicator = ({ current }) => {
    const steps = [
      { n: 1, label: 'Thông tin' },
      { n: 2, label: 'Thanh toán' },
      { n: 3, label: 'Xác nhận' },
    ]
    return (
      <div className="step-indicator">
        {steps.map((s, i) => (
          <div key={s.n} className="step-indicator-item">
            <div className={`step-circle ${current > s.n ? 'done' : current === s.n ? 'active' : ''
              }`}>
              {current > s.n
                ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                : s.n
              }
            </div>
            <span className={`step-label ${current === s.n ? 'active' : ''}`}>{s.label}</span>
            {i < steps.length - 1 && <div className={`step-line ${current > s.n ? 'done' : ''}`} />}
          </div>
        ))}
      </div>
    )
  }

  /* ══════════════════════════════════════════════════════ */
  /*  PROFILE STEP                                          */
  /* ══════════════════════════════════════════════════════ */
  if (step === 'profile') return (
    <div className="up-page" style={{ backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <NavBar />
      <UserProfile />
    </div>
  )

  /* ══════════════════════════════════════════════════════ */
  /*  BOOKINGS STEP                                         */
  /* ══════════════════════════════════════════════════════ */
  if (step === 'bookings') return (
    <div className="up-page" style={{ backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <NavBar activeTab="Đặt phòng của tôi" />
      <div className="up-bookings-container">
        <div className="ub-hero-section">
          <h1 className="ub-title">Lịch sử đặt phòng</h1>
          <p className="ub-subtitle">Quản lý và xem lại tất cả các chuyến lưu trú tuyệt vời của bạn tại LuxeManage.</p>
        </div>
        <div className="ub-tabs">
          <button className="active">SẮP TỚI</button>
          <button>ĐÃ QUA</button>
          <button>ĐÃ HỦY</button>
        </div>
        <UserBookingsList />
      </div>
    </div>
  )

  /* ══════════════════════════════════════════════════════ */
  /*  BROWSE STEP                                           */
  /* ══════════════════════════════════════════════════════ */
  if (step === 'browse') return (
    <div className="up-page">
      <NavBar />

      {/* ROOMS LIST */}
      <main className="up-rooms-main">
        <div className="up-search-bar" style={{ margin: '0 auto 40px auto', boxShadow: 'none', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '10px', alignItems: 'center' }}>
          <div className="up-search-field">
            <label>THỜI GIAN LƯU TRÚ</label>
            <div className="up-search-dates">
              <input type="date" value={checkin} min={today} style={{ paddingLeft: '5px' }}
                onChange={e => setCheckin(e.target.value)} placeholder="Nhận phòng" />
              <span className="date-sep">–</span>
              <input type="date" value={checkout} min={checkin || today} style={{ paddingLeft: '5px' }}
                onChange={e => setCheckout(e.target.value)} placeholder="Trả phòng" />
            </div>
          </div>

          <div className="up-search-divider" />

          <div className="up-search-field">
            <label>KHÁCH</label>
            <div className="up-search-dates">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              <select value={`${adults}_${children}`} onChange={e => {
                const [a, c] = e.target.value.split('_')
                setAdults(+a); setChildren(+c)
              }}>
                <option value="1_0">1 người lớn</option>
                <option value="2_0">2 người lớn</option>
                <option value="2_1">2 người lớn, 1 trẻ em</option>
                <option value="2_2">2 người lớn, 2 trẻ em</option>
                <option value="4_0">4 người lớn</option>
              </select>
            </div>
          </div>

          <div className="up-search-divider" />

          <div className="up-search-field">
            <label>HẠNG PHÒNG</label>
            <div className="up-search-dates">
              <select value={roomType} onChange={e => setRoomType(e.target.value)}>
                <option>Tất cả hạng phòng</option>
                <option>Suite</option>
                <option>Penthouse</option>
                <option>Deluxe</option>
              </select>
            </div>
          </div>

          <div className="up-search-divider" />

          <div className="up-search-field">
            <label>TIỆN ÍCH & GIÁ</label>
            <div className="up-search-dates">
              <select>
                <option>Thêm bộ lọc</option>
              </select>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ marginLeft: 'auto' }}>
                <line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line>
              </svg>
            </div>
          </div>

          <button className="up-search-btn" style={{ borderRadius: '4px', marginLeft: '16px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            TÌM PHÒNG
          </button>
        </div>

        <div className="up-rooms-header">
          <div className="up-rooms-header-left">
            <h1>Danh sách phòng nghỉ</h1>
            <p>Khám phá không gian nghỉ dưỡng sang trọng bậc nhất dành riêng cho bạn.</p>
          </div>
          <div className="up-rooms-header-right">
            <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' }}>SẮP XẾP THEO:</span>
            <select className="up-sort-select" value={sortBy} onChange={e => { setSortBy(e.target.value); setCurrentPage(1); }}>
              <option value="price_asc">Giá từ Thấp đến Cao</option>
              <option value="price_desc">Giá từ Cao đến Thấp</option>
              <option value="name_asc">Tên (A-Z)</option>
            </select>
          </div>
        </div>

        {nights > 0 && (
          <div className="up-nights-banner">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {nights} đêm · {checkin} → {checkout} · {guestLabel}
          </div>
        )}

        <div className="up-rooms-grid">
          {displayedRooms.map((room) => (
            <div key={room.id} className="up-room-card">
              <div className="up-room-card-img-wrap">
                {room.badge && (
                  <div className={`up-room-card-badge ${room.badgeClass}`}>{room.badge}</div>
                )}
                <img src={room.images[0]} alt={room.name} className="up-room-img" loading="lazy" />
              </div>

              <div className="up-room-card-body">
                <div className="up-room-card-header">
                  <h2 className="up-room-card-name">{room.name}</h2>
                  <div className="up-room-card-price-box">
                    <div className="up-room-card-price">{room.price.toLocaleString('vi-VN')}đ</div>
                    <div className="up-room-card-per">/ đêm</div>
                  </div>
                </div>

                <div className="up-room-card-tags">
                  {room.tags.slice(0, 4).map((tag, i) => (
                    <span key={tag} className="up-room-card-tag">
                      <span className="tag-icon">{room.tagIcons[i]}</span> {tag}
                    </span>
                  ))}
                </div>

                <div className="up-room-card-actions">
                  <button className="btn-card-outline" onClick={() => openDetail(room)}>XEM CHI TIẾT</button>
                  {room.available_count === 0 ? (
                    <button className="btn-card-primary" style={{ backgroundColor: '#6b7280', color: '#fff', cursor: 'not-allowed' }} disabled>HẾT PHÒNG</button>
                  ) : (
                    <button className="btn-card-primary" onClick={() => openConfirm(room)}>ĐẶT NGAY</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="up-pagination">
            <button className="up-page-btn" onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                className={`up-page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button className="up-page-btn" onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        )}
      </main>

      <footer className="up-footer">
        <div className="up-footer-inner">
          <span className="up-logo" style={{ fontSize: 18 }}>LuxeManage</span>
          <div className="up-footer-links">
            {['Privacy Policy', 'Terms of Service', 'Contact Us', 'Careers', 'Press'].map(l => (
              <a key={l} href="#" className="up-footer-link">{l}</a>
            ))}
          </div>
          <span className="up-footer-copy">© 2024 LuxeManage Hospitality Group. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )

  /* ══════════════════════════════════════════════════════ */
  /*  DETAIL STEP                                           */
  /* ══════════════════════════════════════════════════════ */
  if (step === 'detail' && selectedRoom) {
    const r = selectedRoom
    return (
      <div className="up-page">
        <NavBar />

        {/* Breadcrumb */}
        <div className="up-breadcrumb">
          <button onClick={resetAll}>Trang chủ</button>
          <span>/</span>
          <button onClick={resetAll}>Phòng Cao Cấp</button>
          <span>/</span>
          <span className="bc-current">{r.name}</span>
        </div>

        <div className="up-detail-layout">
          {/* LEFT COLUMN */}
          <div className="up-detail-left">
            {/* Photo Gallery */}
            <div className="up-gallery">
              <div className="up-gallery-main" onClick={() => setActivePhoto((activePhoto + 1) % r.images.length)}>
                <img src={r.images[activePhoto]} alt={r.name} className="gallery-main-img" key={activePhoto} />
                <button className="gallery-view-all" onClick={e => e.stopPropagation()}>Xem tất cả ảnh ({r.images.length * 6})</button>
              </div>
              <div className="up-gallery-thumbs">
                {r.images.map((img, i) => (
                  <div
                    key={i}
                    className={`gallery-thumb ${activePhoto === i ? 'active' : ''}`}
                    onClick={() => setActivePhoto(i)}
                  >
                    <img src={img} alt="" />
                  </div>
                ))}
              </div>
            </div>

            {/* Badges & Title */}
            <div className="up-detail-hero">
              <div className="detail-badges">
                <span className="detail-badge-seller">BÁN CHẠY NHẤT</span>
                <span className="detail-badge-reviews">({r.reviewCount} Đánh giá)</span>
              </div>
              <h1 className="detail-room-name">{r.name}</h1>
              <div className="detail-quick-facts">
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 3H3v18h18V3z" /><path d="M21 9H3" /><path d="M9 21V9" /></svg>
                  {r.area}
                </span>
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9" /></svg>
                  {r.beds}
                </span>
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  {r.capacity}
                </span>
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  {r.view}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="detail-section">
              <h2 className="detail-section-title">Không Gian Nghỉ Dưỡng Đẳng Cấp</h2>
              <p className="detail-section-text">
                Designed for the most discerning travelers, the {r.name} offers an unparalleled blend of coastal elegance and modern sophistication. Featuring bespoke Italian furniture and hand-curated artworks, every corner of this sanctuary has been crafted to provide an atmosphere of effortless luxury.
              </p>
              <p className="detail-section-text">
                Wake up to panoramic views of the horizon, enjoy your morning espresso on the private wrap-around terrace, or unwind in the white marble bathroom equipped with an oversized soaking tub and premium aromatherapy amenities.
              </p>
            </div>

            {/* Amenities */}
            <div className="detail-section">
              <h2 className="detail-section-title">Tiện Ích Đẳng Cấp Quốc Tế</h2>
              <div className="detail-amenities-grid">
                {r.amenities.map(a => (
                  <div key={a} className="detail-amenity">{a}</div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="detail-section">
              <div className="reviews-header">
                <h2 className="detail-section-title">Đánh Giá Của Khách</h2>
                <button className="write-review-btn">Viết Đánh Giá</button>
              </div>
              <div className="reviews-list">
                {(r.reviews || [
                  { name: "Trần Bảo Nam", date: "12 Thg 5, 2026", rating: 5, text: "Trải nghiệm tuyệt vời, không gian cực kỳ sang trọng và yên tĩnh. Chắc chắn sẽ quay lại." },
                  { name: "Nguyễn Hương Giang", date: "2 Thg 4, 2026", rating: 5, text: "Phòng sạch sẽ, view đẹp xuất sắc. Nhân viên phục vụ chuẩn 5 sao, vô cùng chu đáo." }
                ]).map((rev, i) => (
                  <div key={i} className="review-card">
                    <div className="review-avatar">{rev.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
                    <div className="review-body">
                      <div className="review-top">
                        <strong className="review-name">{rev.name}</strong>
                        <span className="review-date">{rev.date}</span>
                      </div>
                      <Stars count={rev.rating} />
                      <p className="review-text">{rev.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN – BOOKING CARD */}
          <div className="up-detail-right">
            <div className="detail-book-card">
              <div className="dbc-starts">Chỉ từ</div>
              <div className="dbc-price">
                <span className="dbc-price-val">${r.price.toLocaleString()}</span>
                <span className="dbc-price-per"> / đêm</span>
              </div>

              <div className="dbc-dates">
                <div className="dbc-date-field">
                  <label>NHẬN PHÒNG</label>
                  <input type="date" value={checkin} min={today}
                    onChange={e => setCheckin(e.target.value)} />
                </div>
                <div className="dbc-date-sep" />
                <div className="dbc-date-field">
                  <label>TRẢ PHÒNG</label>
                  <input type="date" value={checkout} min={checkin || today}
                    onChange={e => setCheckout(e.target.value)} />
                </div>
              </div>

              <div className="dbc-guests-field">
                <label>KHÁCH</label>
                <select value={`${adults}_${children}`}
                  onChange={e => {
                    const [a, c] = e.target.value.split('_')
                    setAdults(+a); setChildren(+c)
                  }}>
                  <option value="1_0">1 Người lớn, 0 Trẻ em</option>
                  <option value="2_0">2 Người lớn, 0 Trẻ em</option>
                  <option value="2_1">2 Người lớn, 1 Trẻ em</option>
                  <option value="2_2">2 Người lớn, 2 Trẻ em</option>
                  <option value="3_0">3 Người lớn, 0 Trẻ em</option>
                  <option value="4_0">4 Người lớn, 0 Trẻ em</option>
                </select>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {nights > 0 && (
                <div className="dbc-breakdown">
                  <div className="dbc-row">
                    <span>${r.price.toLocaleString()} × {nights} đêm</span>
                    <span>${roomTotal.toLocaleString()}</span>
                  </div>
                  <div className="dbc-row">
                    <span>Phí dịch vụ cao cấp</span>
                    <span>${r.serviceFee}</span>
                  </div>
                  <div className="dbc-row">
                    <span>Thuế lưu trú</span>
                    <span>${r.tax}</span>
                  </div>
                  <div className="dbc-total-row">
                    <span>Tổng cộng</span>
                    <strong>${grandTotal.toLocaleString()}</strong>
                  </div>
                </div>
              )}

              <button className="dbc-reserve-btn" onClick={() => openConfirm(r)}>
                ĐẶT PHÒNG NÀY
              </button>
              <p className="dbc-cancel-note">Hủy miễn phí trước 48h</p>

              <div className="dbc-member-deal">
                <div>
                  <div className="dbc-deal-label">ƯU ĐÃI THÀNH VIÊN</div>
                  <div className="dbc-deal-sub">Đăng nhập để tiết kiệm 15% cho phòng này.</div>
                </div>
              </div>
            </div>

            {/* Need assistance */}
            <div className="detail-assist-card">
              <span>Bạn cần hỗ trợ?</span>
              <button className="assist-chat-btn">Trò chuyện ngay</button>
            </div>
          </div>
        </div>

        <footer className="up-footer">
          <div className="up-footer-inner">
            <span className="up-logo" style={{ fontSize: 18 }}>LuxeManage</span>
            <div className="up-footer-links">
              {['Privacy Policy', 'Terms of Service', 'Contact Us', 'Careers', 'Press'].map(l => (
                <a key={l} href="#" className="up-footer-link">{l}</a>
              ))}
            </div>
            <span className="up-footer-copy">© 2024 LuxeManage Hospitality Group. All rights reserved.</span>
          </div>
        </footer>
      </div>
    )
  }

  /* ══════════════════════════════════════════════════════ */
  /*  CONFIRM STEP (Step 1 – Guest Info & Upsells)          */
  /* ══════════════════════════════════════════════════════ */
  if (step === 'confirm' && selectedRoom) {
    const r = selectedRoom
    return (
      <div className="up-page">
        <NavBar activeTab="My Bookings" />

        <div className="up-checkout-wrap">
          <StepIndicator current={1} />

          <div className="up-confirm-layout">
            <div className="up-confirm-left">
              <h1 className="confirm-title">Hoàn Tất Đặt Phòng</h1>

              {/* Guest info */}
              <div className="confirm-section-card">
                <div className="confirm-section-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  <h3 className="confirm-section-label">Thông Tin Khách Hàng</h3>
                </div>
                <div className="confirm-info-grid">
                  <div className="confirm-info-field">
                    <label>Họ và Tên</label>
                    <input type="text" defaultValue={user?.name} placeholder="Họ và Tên" />
                  </div>
                  <div className="confirm-info-field">
                    <label>Địa chỉ Email</label>
                    <input type="email" defaultValue={user?.email} placeholder="Địa chỉ Email" />
                  </div>
                </div>
                <div className="confirm-info-field" style={{ marginTop: 12 }}>
                  <label>Số điện thoại</label>
                  <input type="tel" placeholder="Số điện thoại" />
                </div>
                <div className="confirm-info-field" style={{ marginTop: 12 }}>
                  <label>Yêu cầu đặc biệt (Không bắt buộc)</label>
                  <textarea placeholder="VD: Nhận phòng sớm, trang trí kỷ niệm, yêu cầu ăn kiêng..." rows={3} />
                </div>
              </div>

              {/* Enhance Your Stay */}
              <div className="confirm-section-card">
                <div className="confirm-section-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <h3 className="confirm-section-label">Nâng Tầm Trải Nghiệm</h3>
                </div>
                <div className="upsell-grid">
                  {UPSELLS.map(u => (
                    <label key={u.id} className={`upsell-card ${selectedUpsells.includes(u.id) ? 'selected' : ''}`}>
                      <input type="checkbox" checked={selectedUpsells.includes(u.id)}
                        onChange={() => toggleUpsell(u.id)} />
                      <div className="upsell-icon">{u.icon}</div>
                      <div className="upsell-body">
                        <div className="upsell-title">{u.title}</div>
                        <div className="upsell-desc">{u.desc}</div>
                        <div className="upsell-price">+${u.price}.00</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="confirm-actions">
                <button className="confirm-cancel-btn" onClick={resetAll}>Hủy</button>
                <button className="confirm-proceed-btn" onClick={handleProceedPayment}>
                  Tiến Hành Thanh Toán
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>

            {/* RIGHT – Booking Summary */}
            <div className="up-confirm-right">
              <div className="confirm-summary-card">
                <div className="cs-room-preview-hero">
                  <img src={r.images[0]} alt={r.name} className="cs-room-img-hero" />
                  <div className="cs-room-overlay">
                    <div className="cs-room-name-hero">{r.name}</div>
                    <div className="cs-room-sub">{adults} Người lớn · {nights} Đêm</div>
                  </div>
                </div>

                <div className="cs-booking-dates">
                  <div className="cs-date-block">
                    <span className="cs-date-label">Nhận phòng</span>
                    <span className="cs-date-val">{checkin || '—'}</span>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                  <div className="cs-date-block">
                    <span className="cs-date-label">Trả phòng</span>
                    <span className="cs-date-val">{checkout || '—'}</span>
                  </div>
                </div>

                <div className="cs-divider" />
                <div className="cs-rows">
                  <div className="cs-row">
                    <span>Giá phòng ({nights} đêm)</span>
                    <span>${roomTotal.toLocaleString()}.00</span>
                  </div>
                  <div className="cs-row">
                    <span>Thuế &amp; Phí dịch vụ (12%)</span>
                    <span>${taxAmount.toLocaleString()}.00</span>
                  </div>
                  <div className="cs-row">
                    <span>Phí dịch vụ cao cấp</span>
                    <span>${resortFee}.00</span>
                  </div>
                  {selectedUpsells.length > 0 && UPSELLS.filter(u => selectedUpsells.includes(u.id)).map(u => (
                    <div key={u.id} className="cs-row upsell-row">
                      <span>+ {u.title}</span>
                      <span>${u.price}.00</span>
                    </div>
                  ))}
                </div>
                <div className="cs-divider" />
                <div className="cs-total-row">
                  <span>Tổng cộng</span>
                  <strong>${grandTotal.toLocaleString()}.00</strong>
                </div>
                <div className="cs-currency-note">Thanh toán bằng USD</div>

                <div className="cs-cancel-policy">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Hủy miễn phí trước 48h. Chưa cần thanh toán ngay đối với một số loại phòng.
                </div>

                <div className="cs-pay-icons">
                  <span title="Location">📍</span>
                  <span title="Email">✉️</span>
                  <span title="Print">🖨️</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ══════════════════════════════════════════════════════ */
  /*  PAYMENT STEP (Step 2)                                 */
  /* ══════════════════════════════════════════════════════ */
  if (step === 'payment' && selectedRoom) {
    const r = selectedRoom
    return (
      <div className="up-page">
        <NavBar activeTab="My Bookings" />

        <div className="up-checkout-wrap">
          <StepIndicator current={2} />

          <div className="up-confirm-layout">
            <div className="up-confirm-left">
              <h1 className="confirm-title">Chi Tiết Thanh Toán</h1>

              <div className="confirm-section-card">
                <div className="confirm-section-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  <h3 className="confirm-section-label">Phương Thức Thanh Toán</h3>
                </div>
                <div className="pay-methods">
                  {[
                    { id: 'card', icon: '💳', label: 'Thẻ Tín Dụng / Ghi Nợ', sub: 'Visa, Mastercard, Amex' },
                    { id: 'transfer', icon: '🏦', label: 'Chuyển Khoản Ngân Hàng', sub: 'Xử lý trong ngày' },
                    { id: 'cash', icon: '💵', label: 'Thanh Toán Tại Quầy', sub: 'Khi nhận phòng' },
                  ].map(m => (
                    <label key={m.id} className={`pay-method-opt ${payMethod === m.id ? 'selected' : ''}`}>
                      <input type="radio" name="pay" value={m.id} checked={payMethod === m.id}
                        onChange={() => setPayMethod(m.id)} />
                      <div className="pmo-icon">{m.icon}</div>
                      <div>
                        <div className="pmo-label">{m.label}</div>
                        <div className="pmo-sub">{m.sub}</div>
                      </div>
                    </label>
                  ))}
                </div>

                {payMethod === 'card' && (
                  <div className="card-fields">
                    <div className="confirm-info-field full-width">
                      <label>Số Thẻ</label>
                      <input type="text" placeholder="1234 5678 9012 3456" maxLength={19} />
                    </div>
                    <div className="confirm-info-field">
                      <label>Ngày hết hạn</label>
                      <input type="text" placeholder="MM / YY" maxLength={7} />
                    </div>
                    <div className="confirm-info-field">
                      <label>CVV</label>
                      <input type="text" placeholder="•••" maxLength={4} />
                    </div>
                    <div className="confirm-info-field full-width">
                      <label>Tên trên thẻ</label>
                      <input type="text" defaultValue={user?.name} />
                    </div>
                  </div>
                )}
              </div>

              <div className="confirm-actions">
                <button className="confirm-cancel-btn" onClick={() => setStep('confirm')} disabled={isProcessingPayment}>Quay Lại</button>
                <button className="confirm-proceed-btn" onClick={handleConfirm} disabled={isProcessingPayment} style={{ opacity: isProcessingPayment ? 0.7 : 1, cursor: isProcessingPayment ? 'wait' : 'pointer' }}>
                  {isProcessingPayment ? (
                    <>
                      Đang Xử Lý Thanh Toán...
                      <svg className="up-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                      </svg>
                    </>
                  ) : (
                    <>
                      Xác Nhận & Thanh Toán ${grandTotal.toLocaleString()}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* RIGHT – Summary (same card) */}
            <div className="up-confirm-right">
              <div className="confirm-summary-card">
                <div className="cs-room-preview-hero">
                  <img src={r.images[0]} alt={r.name} className="cs-room-img-hero" />
                  <div className="cs-room-overlay">
                    <div className="cs-room-name-hero">{r.name}</div>
                    <div className="cs-room-sub">{adults} Người lớn · {nights} Đêm</div>
                  </div>
                </div>
                <div className="cs-booking-dates">
                  <div className="cs-date-block">
                    <span className="cs-date-label">Nhận phòng</span>
                    <span className="cs-date-val">{checkin}</span>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                  <div className="cs-date-block">
                    <span className="cs-date-label">Trả phòng</span>
                    <span className="cs-date-val">{checkout}</span>
                  </div>
                </div>
                <div className="cs-divider" />
                <div className="cs-rows">
                  <div className="cs-row"><span>Giá phòng ({nights} đêm)</span><span>${roomTotal.toLocaleString()}.00</span></div>
                  <div className="cs-row"><span>Thuế &amp; Phí dịch vụ (12%)</span><span>${taxAmount}.00</span></div>
                  <div className="cs-row"><span>Phí dịch vụ cao cấp</span><span>${resortFee}.00</span></div>
                  {selectedUpsells.length > 0 && UPSELLS.filter(u => selectedUpsells.includes(u.id)).map(u => (
                    <div key={u.id} className="cs-row upsell-row"><span>+ {u.title}</span><span>${u.price}.00</span></div>
                  ))}
                </div>
                <div className="cs-divider" />
                <div className="cs-total-row"><span>Tổng cộng</span><strong>${grandTotal.toLocaleString()}.00</strong></div>
                <div className="cs-currency-note">Thanh toán bằng USD</div>
                <div className="cs-secure-note">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Mã hóa 256-bit SSL · Tuân thủ PCI DSS
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ══════════════════════════════════════════════════════ */
  /*  SUCCESS STEP                                          */
  /* ══════════════════════════════════════════════════════ */
  if (step === 'success' && selectedRoom) {
    const r = selectedRoom
    const payLabel = payMethod === 'card' ? 'Credit Card' : payMethod === 'transfer' ? 'Bank Transfer' : 'Pay at Front Desk'
    const cardLast = payMethod === 'card' ? '4242' : ''
    return (
      <div className="up-page">
        <NavBar activeTab="My Bookings" />
        <div className="up-success-outer">
          {/* Top – thank you */}
          <div className="success-top-banner">
            <div className="success-check-gold">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="success-title-vn">Cảm ơn bạn đã lựa chọn LuxeManage</h1>
            <p className="success-sub-vn">
              Yêu cầu đặt phòng của bạn đã được xác nhận thành công. Một bản tóm tắt chi tiết đã được gửi tới email của bạn.
            </p>
          </div>

          {/* Main grid */}
          <div className="success-main-grid">
            {/* LEFT */}
            <div className="success-left">
              {/* Booking ID card */}
              <div className="suc-card">
                <div className="suc-booking-id-row">
                  <div>
                    <div className="suc-booking-label">MÃ ĐẶT PHÒNG</div>
                    <div className="suc-booking-id">{bookingRef}</div>
                  </div>
                  <div className="suc-booking-actions">
                    <button className="suc-action-btn outline">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
                      </svg>
                      In Biên Lai
                    </button>
                    <button className="suc-action-btn gold">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Tải Voucher
                    </button>
                  </div>
                </div>

                <div className="suc-stay-row">
                  <div className="suc-stay-block">
                    <div className="suc-stay-label">Nhận phòng</div>
                    <div className="suc-stay-val">{checkin ? new Date(checkin + 'T00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}</div>
                    <div className="suc-stay-hint">Từ 14:00</div>
                  </div>
                  <div className="suc-stay-block">
                    <div className="suc-stay-label">Trả phòng</div>
                    <div className="suc-stay-val">{checkout ? new Date(checkout + 'T00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}</div>
                    <div className="suc-stay-hint">Trước 12:00</div>
                  </div>
                  <div className="suc-stay-block">
                    <div className="suc-stay-label">Tổng thời gian</div>
                    <div className="suc-stay-val">{nights} Đêm</div>
                    <div className="suc-stay-hint">{guestLabel}</div>
                  </div>
                </div>
              </div>

              {/* Room + Contact card */}
              <div className="suc-card suc-room-contact">
                <div className="suc-room-img-wrap">
                  <img src={r.images[0]} alt={r.name} className="suc-room-img" />
                  <div className="suc-room-name-over">{r.name}</div>
                  <div className="suc-room-facts-over">
                    <span>🏖 Biển cả</span>
                    <span>❄ Ăn sáng</span>
                    <span>🛎 Hồ bơi ngoài</span>
                  </div>
                  <button className="suc-room-view-btn">Xem thêm bản đồ →</button>
                </div>
                <div className="suc-contact">
                  <div className="suc-contact-title">Thông tin liên hệ</div>
                  <div className="suc-contact-row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                    LuxeManage Resort, 123 Bờ Biển Vàng, Đà Nẵng, Việt Nam
                  </div>
                  <div className="suc-contact-row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6 6l1.06-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    +84 (236) 555-8888
                  </div>
                  <div className="suc-contact-row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                    </svg>
                    concierge@luxemanage.com
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="success-right">
              {/* Payment summary */}
              <div className="suc-card suc-payment-card">
                <div className="suc-payment-title">Chi tiết thanh toán</div>
                <div className="suc-pay-row">
                  <span>Giá phòng ({nights} đêm)</span>
                  <span>{(roomTotal * 23000).toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="suc-pay-row">
                  <span>Thuế &amp; Phí dịch vụ (10%)</span>
                  <span>{Math.round(roomTotal * 23000 * 0.1).toLocaleString('vi-VN')}đ</span>
                </div>
                {selectedUpsells.length > 0 && UPSELLS.filter(u => selectedUpsells.includes(u.id)).map(u => (
                  <div key={u.id} className="suc-pay-row">
                    <span>{u.title}</span>
                    <span>{(u.price * 23000).toLocaleString('vi-VN')}đ</span>
                  </div>
                ))}
                <div className="suc-pay-total">
                  <span>Tổng cộng</span>
                  <strong>{(grandTotal * 23000).toLocaleString('vi-VN')}đ</strong>
                </div>
                <div className="suc-pay-method">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Đã thanh toán qua {payLabel}{cardLast ? ` **** ${cardLast}` : ''}
                </div>
              </div>

              {/* Actions */}
              <div className="suc-card suc-actions-card">
                <div className="suc-actions-title">BẠN CÓ MUỐN?</div>
                <button className="suc-action-full">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Thêm vào Lịch
                </button>
                <button className="suc-action-full">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  Yêu cầu đặc biệt
                </button>
                <button className="suc-action-full" onClick={resetAll}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  Quay về trang chủ
                </button>
              </div>

              {/* Insurance note */}
              <div className="suc-card suc-insurance">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <div>
                  <div className="suc-ins-title">Bảo vệ chuyến đi của bạn</div>
                  <div className="suc-ins-sub">Chính sách hoàn tiền linh hoạt hiện đang hoạt động được áp dụng cho chỗ đặt chỗ này.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="up-footer">
          <div className="up-footer-inner">
            <span className="up-logo" style={{ fontSize: 18 }}>LuxeManage</span>
            <span className="up-footer-copy">© 2024 LuxeManage Hospitality Group. All rights reserved.</span>
          </div>
        </footer>
      </div>
    )
  }

  return null
}
