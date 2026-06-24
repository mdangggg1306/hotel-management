# LuxeManage - Hotel Management System

Dự án Hệ thống quản lý khách sạn (Hotel Management System) bao gồm 2 phần chính: **Backend** (Node.js/Express + Prisma + PostgreSQL) và **Frontend** (React + Vite).

Dưới đây là hướng dẫn chi tiết để setup và chạy dự án này trên máy local.

## Yêu cầu môi trường (Prerequisites)
- [Node.js](https://nodejs.org/en/) (phiên bản v18 trở lên)
- [PostgreSQL](https://www.postgresql.org/) (đã được cài đặt và đang chạy)

---

## 1. Cài đặt & Khởi chạy Backend (API)

**Bước 1:** Di chuyển vào thư mục backend
```bash
cd backend
```

**Bước 2:** Cài đặt các thư viện (dependencies)
```bash
npm install
```

**Bước 3:** Cấu hình biến môi trường
Tạo một file `.env` ở thư mục `backend` (nếu chưa có) và điền các thông tin sau:
```env
# Chuỗi kết nối đến PostgreSQL của bạn. Đổi user, password, port, db_name cho phù hợp
DATABASE_URL="postgresql://postgres:password123@localhost:5432/luxemanage_db"
JWT_SECRET="super_secret_jwt_key"
```

**Bước 4:** Khởi tạo Database Schema
Lệnh này sẽ tạo các bảng (tables) trong PostgreSQL dựa trên schema Prisma.
```bash
npx prisma db push
```

**Bước 5:** Đẩy dữ liệu mẫu (Import / Seeding Database)
Đây là bước **ĐẶC BIỆT QUAN TRỌNG** để hệ thống có sẵn danh sách Phòng, Loại Phòng và tài khoản Admin. Chạy lệnh:
```bash
npx prisma db seed
```
Lệnh này sẽ tự động tạo một tài khoản Admin mặc định:
- **Email:** `admin@luxemanage.com`
- **Password:** `123456`

**Bước 6:** Chạy server Backend
```bash
npm run dev
```
Backend sẽ khởi chạy và lắng nghe tại `http://localhost:3000`.

---

## 2. Cài đặt & Khởi chạy Frontend (Giao diện)

Mở một cửa sổ Terminal/Command Line mới để chạy phần Frontend (đảm bảo Backend vẫn đang chạy song song).

**Bước 1:** Di chuyển vào thư mục Frontend
```bash
cd luxemanage
```

**Bước 2:** Cài đặt các thư viện (dependencies)
```bash
npm install
```

**Bước 3:** Chạy Frontend
```bash
npm run dev
```

Sau khi chạy xong, Vite sẽ cung cấp một đường link (thường là `http://localhost:5173`). Bạn click vào đường link đó để mở trang web.

---

## 3. Tài khoản đăng nhập hệ thống Admin

Truy cập vào trang đăng nhập và sử dụng tài khoản đã được tạo ra từ lệnh `seed` ở bước 5:

- **Email:** `admin@luxemanage.com`
- **Mật khẩu:** `123456`
