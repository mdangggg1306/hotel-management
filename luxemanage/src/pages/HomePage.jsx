import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './HomePage.css'

const NAV_LINKS = ['Phòng nghỉ', 'Ẩm thực', 'Spa', 'Đặt chỗ của tôi']

const ROOMS = [
  {
    name: 'Phòng Azure Suite',
    price: '$1,200',
    desc: 'Tầm nhìn toàn cảnh đại dương và hồ bơi sân thượng riêng biệt định nghĩa thiên đường tĩnh lặng này.',
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=800'
  },
  {
    name: 'Phòng Royal Penthouse',
    price: '$2,500',
    desc: 'Đỉnh cao của sự thanh lịch thành thị, nổi bật với tiện nghi đẳng cấp thế giới và tầm nhìn 360 độ thành phố.',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=800'
  },
  {
    name: 'Biệt thự Heritage',
    price: '$850',
    desc: 'Sự kết hợp hoàn hảo giữa kỹ nghệ truyền thống và sự sang trọng đương đại trong không gian vườn tươi mát.',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800'
  }
]

export default function HomePage() {
  const navigate = useNavigate()

  const handleRequireLogin = (e) => {
    e.preventDefault()
    navigate('/login', { state: { message: 'Vui lòng đăng nhập để trải nghiệm và đặt phòng.' } })
  }

  return (
    <div className="hotel-landing">
      {/* HEADER */}
      <header className="hl-header">
        <div className="hl-container hl-header-inner">
          <Link to="/" className="hl-logo">LuxeManage</Link>
          <nav className="hl-nav">
            {NAV_LINKS.map(link => (
              <a key={link} href="#" className="hl-nav-link">{link}</a>
            ))}
          </nav>
          <div className="hl-header-actions">
            <button className="hl-icon-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
            <button className="hl-btn-dark" onClick={handleRequireLogin}>ĐẶT PHÒNG NGAY</button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="hl-hero">
        <div className="hl-hero-bg" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&q=80&w=2000')` }}>
          <div className="hl-hero-overlay"></div>
        </div>
        <div className="hl-hero-content">
          <h1 className="hl-hero-title">
            Khám phá Nghệ thuật <span className="hl-cursive-gold">Sống Thượng lưu</span>
          </h1>
          <p className="hl-hero-subtitle">
            Trải nghiệm sự sang trọng vô song và dịch vụ cá nhân hóa tại những<br/>
            điểm đến ngoạn mục nhất thế giới.
          </p>
          <button className="hl-btn-gold" onClick={handleRequireLogin}>KHÁM PHÁ PHÒNG NGHỈ</button>
        </div>

        {/* BOOKING SEARCH BAR */}
        <div className="hl-booking-bar-wrapper">
          <div className="hl-booking-bar">
            <div className="hl-booking-field">
              <span className="hl-field-label">ĐIỂM ĐẾN</span>
              <div className="hl-field-value">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span>Bạn muốn đi đâu?</span>
              </div>
            </div>
            <div className="hl-booking-divider"></div>
            <div className="hl-booking-field">
              <span className="hl-field-label">NGÀY NHẬN PHÒNG</span>
              <div className="hl-field-value">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span>Chọn ngày</span>
              </div>
            </div>
            <div className="hl-booking-divider"></div>
            <div className="hl-booking-field">
              <span className="hl-field-label">NGÀY TRẢ PHÒNG</span>
              <div className="hl-field-value">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span>Chọn ngày</span>
              </div>
            </div>
            <div className="hl-booking-divider"></div>
            <div className="hl-booking-field">
              <span className="hl-field-label">SỐ KHÁCH</span>
              <div className="hl-field-value">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <span>Thêm khách</span>
              </div>
            </div>
            <button className="hl-btn-dark hl-btn-search" onClick={() => navigate('/portal')}>TÌM KIẾM</button>
          </div>
        </div>
      </section>

      {/* ROOMS COLLECTION */}
      <section className="hl-section hl-rooms-section">
        <div className="hl-container">
          <div className="hl-section-header">
            <span className="hl-eyebrow">NƠI LƯU TRÚ TINH TẾ</span>
            <h2 className="hl-section-title">Bộ sưu tập Phòng đặc quyền</h2>
            <div className="hl-title-underline"></div>
          </div>
          
          <div className="hl-rooms-grid">
            {ROOMS.map((room, idx) => (
              <div className="hl-room-card" key={idx}>
                <div className="hl-room-img-wrapper">
                  <img src={room.image} alt={room.name} className="hl-room-img" />
                  <div className="hl-room-price-badge">TỪ {room.price} / ĐÊM</div>
                </div>
                <div className="hl-room-info">
                  <h3 className="hl-room-name">{room.name}</h3>
                  <p className="hl-room-desc">{room.desc}</p>
                  <a href="#" className="hl-room-book-link" onClick={handleRequireLogin}>ĐẶT NGAY</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXPERIENCES SECTION */}
      <section className="hl-experiences-section">
        <div className="hl-container hl-experiences-inner">
          <div className="hl-exp-content">
            <span className="hl-eyebrow-gold">NHỮNG KHOẢNH KHẮC ĐẶC SẮC</span>
            <h2 className="hl-section-title-light">Trải nghiệm Sự khác biệt.</h2>
            
            <div className="hl-exp-list">
              <div className="hl-exp-item">
                <div className="hl-exp-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <div>
                  <h4 className="hl-exp-title">Hành trình Ẩm thực mỹ vị</h4>
                  <p className="hl-exp-desc">Thưởng thức những trải nghiệm ăn uống đạt sao Michelin được thiết kế riêng cho khẩu vị của bạn.</p>
                </div>
              </div>
              <div className="hl-exp-item">
                <div className="hl-exp-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                </div>
                <div>
                  <h4 className="hl-exp-title">Chăm sóc Sức khỏe Toàn diện</h4>
                  <p className="hl-exp-desc">Làm mới tâm hồn bạn trong những khu nghỉ dưỡng spa đẳng cấp thế giới và thánh đường nhiệt trị liệu.</p>
                </div>
              </div>
              <div className="hl-exp-item">
                <div className="hl-exp-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
                </div>
                <div>
                  <h4 className="hl-exp-title">Hành trình Khám phá Riêng tư</h4>
                  <p className="hl-exp-desc">Mở khóa quyền truy cập độc quyền vào những viên ngọc ẩn với các chuyên gia có hướng dẫn riêng.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="hl-exp-images">
            <img src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600" alt="Food" className="hl-exp-img img-1" />
            <img src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=600" alt="Spa" className="hl-exp-img img-2" />
          </div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section className="hl-services-section">
        <div className="hl-container hl-services-grid">
          <div className="hl-service-item">
            <div className="hl-service-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <h4 className="hl-service-title">Quản gia riêng 24/7</h4>
            <p className="hl-service-desc">Dịch vụ trực quan đáp ứng mọi mong muốn của bạn vào bất kỳ thời điểm nào.</p>
          </div>
          <div className="hl-service-item">
            <div className="hl-service-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <h4 className="hl-service-title">Dịch vụ Concierge cao cấp</h4>
            <p className="hl-service-desc">Đảm bảo những điều tưởng chừng không thể, từ hàng ghế đầu đến các phòng trưng bày riêng.</p>
          </div>
          <div className="hl-service-item">
            <div className="hl-service-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
            </div>
            <h4 className="hl-service-title">Đưa đón VIP</h4>
            <p className="hl-service-desc">Sự sang trọng có tài xế riêng ngay từ khoảnh khắc bạn hạ cánh.</p>
          </div>
          <div className="hl-service-item">
            <div className="hl-service-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
            <h4 className="hl-service-title">Sự riêng tư tuyệt đối</h4>
            <p className="hl-service-desc">Những thánh đường biệt lập được thiết kế cho sự an tâm tuyệt đối.</p>
          </div>
        </div>
      </section>

      {/* MEMBERSHIP SECTION */}
      <section className="hl-membership-section">
        <div className="hl-container hl-membership-inner">
          <div className="hl-badge-dark">HỘI VIÊN LUXEREWARDS</div>
          <h2 className="hl-membership-title">Nâng tầm mọi kỳ nghỉ</h2>
          <p className="hl-membership-desc">
            Tham gia chương trình khách hàng thân thiết độc quyền của chúng tôi để mở khóa thế giới quyền lợi Gold Elite, bao gồm nâng hạng phòng miễn phí, trả phòng muộn và các trải nghiệm dành riêng cho hội viên.
          </p>
          <button className="hl-btn-dark hl-btn-lg">TRỞ THÀNH HỘI VIÊN</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="hl-footer">
        <div className="hl-container hl-footer-grid">
          <div className="hl-footer-brand">
            <div className="hl-logo-gold">LuxeManage</div>
            <p className="hl-footer-tagline">Sáng tạo những kỳ nghỉ tinh tế<br/>nhất thế giới từ năm 1994.</p>
          </div>
          
          <div className="hl-footer-links-col">
            <h5 className="hl-footer-heading">LIÊN KẾT NHANH</h5>
            <ul className="hl-footer-list">
              <li><a href="#">Điểm đến</a></li>
              <li><a href="#">Trải nghiệm</a></li>
              <li><a href="#">LuxeRewards</a></li>
            </ul>
          </div>
          
          <div className="hl-footer-links-col">
            <h5 className="hl-footer-heading">HỖ TRỢ</h5>
            <ul className="hl-footer-list">
              <li><a href="#">Dịch vụ Concierge</a></li>
              <li><a href="#">Chính sách bảo mật</a></li>
              <li><a href="#">Liên hệ với chúng tôi</a></li>
            </ul>
          </div>
          
          <div className="hl-footer-links-col">
            <h5 className="hl-footer-heading">THEO DÕI CHÚNG TÔI</h5>
            <div className="hl-social-links">
              <a href="#" className="hl-social-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
              </a>
              <a href="#" className="hl-social-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"></circle><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"></path></svg>
              </a>
            </div>
          </div>
        </div>
        
        <div className="hl-container hl-footer-bottom">
          <p>© 2024 LuxeManage Hospitality. Bảo lưu mọi quyền. Một bất động sản trong Bộ sưu tập Cao cấp.</p>
        </div>
      </footer>
    </div>
  )
}
