# 🏨 Luxury Hotel — Hotel Management System

Hệ thống quản lý khách sạn full-stack gồm **Backend** (Node.js + Express + Prisma + PostgreSQL) và **Frontend** (React + Vite).

---

## 📋 Yêu cầu môi trường

| Công cụ | Phiên bản tối thiểu | Link tải |
|---|---|---|
| **Node.js** | v18+ (khuyến nghị v22) | https://nodejs.org |
| **PostgreSQL** | v14+ | https://www.postgresql.org/download |
| **Git** | Bất kỳ | https://git-scm.com |

> **Kiểm tra phiên bản:** `node -v` và `psql --version`

---

## 🚀 Hướng dẫn setup từ đầu

### Bước 1 — Clone dự án

```bash
git clone <repository-url>
cd hotel-management
```

---

### Bước 2 — Tạo Database trong PostgreSQL

Mở **pgAdmin** hoặc chạy lệnh sau trong terminal:

```sql
psql -U postgres
CREATE DATABASE luxury_hotel_db;
\q
```

> Nếu PostgreSQL của bạn dùng user/password khác, thay `postgres` bằng username của bạn.

---

### Bước 3 — Cấu hình Backend

```bash
cd backend
npm install
```

Tạo file `.env` từ file mẫu:

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Mở file `backend/.env` và điền thông tin thật:

```env
# Đổi PASSWORD thành mật khẩu PostgreSQL của bạn
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/luxury_hotel_db?schema=public"

PORT=3000

# Có thể để nguyên hoặc đổi thành chuỗi bí mật bất kỳ
JWT_SECRET="luxury-hotel-super-secret-key-2024"

# Tuỳ chọn: dùng để gửi email (bỏ trống nếu không cần)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

---

### Bước 4 — Khởi tạo Database & Seed dữ liệu mẫu

```bash
# Tạo bảng trong PostgreSQL theo Prisma schema
npx prisma db push

# Nạp dữ liệu mẫu (phòng, loại phòng, tài khoản admin)
npx prisma db seed
```

Sau khi seed xong, hệ thống có sẵn tài khoản:

| Role | Email | Mật khẩu |
|---|---|---|
| **Admin** | `admin@luxuryhotel.com` | `123456` |

---

### Bước 5 — Chạy Backend

```bash
# Vẫn trong thư mục backend/
npm run dev
```

✅ Backend đang chạy tại: `http://localhost:3000`  
✅ Kiểm tra: mở trình duyệt vào `http://localhost:3000/api/health` — thấy `{"status":"ok"}` là thành công.

---

### Bước 6 — Cấu hình & Chạy Frontend

Mở **terminal mới** (giữ terminal backend đang chạy):

```bash
cd luxemanage
npm install
npm run dev
```

✅ Frontend đang chạy tại: `http://localhost:5173`

---

## 🗂️ Cấu trúc thư mục

```
hotel-management/
├── backend/              # API server (Express + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma # Định nghĩa database schema
│   │   └── seed.ts       # Dữ liệu mẫu
│   ├── src/
│   │   ├── index.ts      # Entry point + tất cả routes
│   │   └── services/
│   │       └── emailService.ts
│   └── .env.example      # Template biến môi trường
└── luxemanage/           # Frontend (React + Vite)
    └── src/
        ├── context/      # AuthContext (quản lý đăng nhập)
        ├── components/   # Layout, PrivateRoute, Toast
        └── pages/        # Các trang của ứng dụng
```

---

## 🔑 Tài khoản demo

| Role | Email | Mật khẩu | Quyền truy cập |
|---|---|---|---|
| Admin | `admin@luxuryhotel.com` | `123456` | Toàn bộ hệ thống |
| Guest | Tự đăng ký | Tự đặt | Cổng khách hàng `/portal` |

---

## ❓ Lỗi thường gặp

### `DATABASE_URL` connection error
- Kiểm tra PostgreSQL đang chạy: `pg_ctl status` hoặc mở Services
- Kiểm tra đúng username, password, tên database trong `.env`

### `Port 5173 is in use`
- Vite tự chuyển sang port 5174, 5175... — kiểm tra terminal để thấy URL đúng

### `prisma db push` thất bại
- Đảm bảo đã tạo database trước (`CREATE DATABASE luxury_hotel_db`)
- Đảm bảo thông tin trong `.env` đúng

### Frontend không gọi được API
- Đảm bảo backend đang chạy ở port **3000**
- Vite proxy đã được cấu hình sẵn — không cần đổi gì

---

## 📄 Giấy phép

MIT License — Tự do sử dụng cho mục đích học tập và phát triển.
