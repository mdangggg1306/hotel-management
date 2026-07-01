import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { sendPasswordResetEmail, sendBookingConfirmationEmail } from './services/emailService';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Luxury Hotel API is running!' });
});

// ─── Auth Middleware (FIXED: jwt.verify instead of jwt.decode) ───────────────
export const authenticateToken = (req: Request, res: Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || (req.query.token as string);
  
  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

export const authenticateAdmin = (req: Request, res: Response, next: express.NextFunction) => {
  authenticateToken(req, res, () => {
    if ((req as any).user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Require Admin Role!' });
    }
    next();
  });
};

// Cho phép cả RECEPTIONIST lẫn ADMIN
export const authenticateReceptionist = (req: Request, res: Response, next: express.NextFunction) => {
  authenticateToken(req, res, () => {
    const role = (req as any).user.role;
    if (role !== 'RECEPTIONIST' && role !== 'ADMIN') {
      return res.status(403).json({ error: 'Require Receptionist Role!' });
    }
    next();
  });
};

// ─── Auth Routes ──────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { full_name, email, password } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email đã tồn tại' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { full_name, email, password_hash }
    });
    
    const { password_hash: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    // FIXED: payload dùng userId nhất quán
    const token = jwt.sign({ userId: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const { password_hash: _, ...userWithoutPassword } = user;

    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) return res.sendStatus(404);

    const { password_hash: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ error: 'Tài khoản không tồn tại trong hệ thống.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { resetToken, resetTokenExpiry }
    });

    await sendPasswordResetEmail(email, resetToken);
    res.json({ message: 'Link khôi phục mật khẩu đã được gửi đến email của bạn.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server khi gửi email' });
  }
});

app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash, resetToken: null, resetTokenExpiry: null }
    });

    res.json({ message: 'Mật khẩu đã được cập nhật thành công.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

app.put('/api/auth/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { full_name, phone, id_card, dob, address, dietary_prefs, pillow_type, room_location_pref, payment_method_pref } = req.body;
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        full_name,
        phone,
        id_card,
        dob: dob ? new Date(dob) : null,
        address,
        dietary_prefs,
        pillow_type,
        room_location_pref,
        payment_method_pref
      }
    });

    const { password_hash: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi cập nhật hồ sơ' });
  }
});

app.put('/api/auth/change-password', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { oldPassword, newPassword } = req.body;
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Mật khẩu hiện tại không chính xác' });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password_hash }
    });

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi đổi mật khẩu' });
  }
});

// ─── Rooms ────────────────────────────────────────────────────────────────────
app.get('/api/rooms/search', async (req: Request, res: Response) => {
  try {
    const { checkin, checkout } = req.query;

    const roomTypes = await prisma.roomType.findMany({
      include: { rooms: true }
    });

    let overlappingBookings: any[] = [];
    
    if (checkin && checkout) {
       const ci = new Date(checkin as string);
       const co = new Date(checkout as string);
       
       overlappingBookings = await prisma.booking.findMany({
          where: {
             status: { not: 'CANCELLED' },
             check_in: { lt: co },
             check_out: { gt: ci }
          }
       });
    }

    const mappedRoomTypes = roomTypes.map(rt => {
      let available_count = rt.rooms.length;
      
      if (checkin && checkout) {
          const bookedCount = overlappingBookings.filter(b => b.room_type_id === rt.id).length;
          available_count = Math.max(0, available_count - bookedCount);
      }

      return {
        ...rt,
        price: rt.base_price,
        desc: rt.description,
        available_count
      };
    });

    res.json(mappedRoomTypes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// ─── User Bookings ────────────────────────────────────────────────────────────
app.get('/api/user/bookings', authenticateToken, async (req: Request, res: Response) => {
  const guest_id = (req as any).user.userId;
  try {
    const bookings = await prisma.booking.findMany({
      where: { guest_id },
      include: { roomType: true, upsells: true, payments: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch user bookings' });
  }
});

app.post('/api/bookings', authenticateToken, async (req: Request, res: Response) => {
  const { room_type_id, check_in, check_out, total_amount, special_request, upsells, redeem_points } = req.body;
  const guest_id = (req as any).user.userId;
  
  try {
    if (redeem_points && redeem_points > 0) {
      const user = await prisma.user.findUnique({ where: { id: guest_id } });
      if (!user || user.membership_points < redeem_points) {
        return res.status(400).json({ error: 'Không đủ điểm thưởng' });
      }
      
      await prisma.user.update({
        where: { id: guest_id },
        data: { membership_points: user.membership_points - redeem_points }
      });
      
      await prisma.pointTransaction.create({
        data: {
          user_id: guest_id,
          amount: -redeem_points,
          type: 'REDEEM_PAYMENT',
          description: `Sử dụng điểm cho đặt phòng`
        }
      });
    }

    const booking = await prisma.booking.create({
      data: {
        booking_code: `LX-${Math.floor(1000 + Math.random() * 9000)}-2024`,
        guest_id,
        room_type_id,
        check_in: new Date(check_in),
        check_out: new Date(check_out),
        total_amount,
        special_request,
        upsells: {
          create: upsells?.map((u: any) => ({ service_name: u.service_name, price: u.price })) || []
        }
      }
    });
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// ─── Payments (User checkout) ─────────────────────────────────────────────────
app.post('/api/payments/checkout', authenticateToken, async (req: Request, res: Response) => {
  const { booking_id, amount, payment_method } = req.body;
  
  let mappedMethod: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'PAY_AT_DESK' = 'CREDIT_CARD';
  if (payment_method === 'transfer') mappedMethod = 'BANK_TRANSFER';
  if (payment_method === 'cash') mappedMethod = 'PAY_AT_DESK';

  try {
    const payment = await prisma.payment.create({
      data: { booking_id, amount, payment_method: mappedMethod }
    });
    const booking = await prisma.booking.update({
      where: { id: booking_id },
      data: { status: 'CONFIRMED' },
      include: { guest: true, roomType: true }
    });

    try {
      await sendBookingConfirmationEmail(booking.guest.email, {
        guestName: booking.guest.full_name,
        booking_code: booking.booking_code,
        roomTypeName: booking.roomType.name,
        check_in: booking.check_in,
        check_out: booking.check_out,
        total_amount: booking.total_amount
      });
    } catch (emailError) {
      console.error('Không thể gửi email xác nhận:', emailError);
    }

    broadcastNotification({
      type: 'new_booking',
      title: '🛎️ Đặt phòng mới!',
      message: `${booking.guest.full_name} · ${booking.roomType.name} · ${booking.booking_code}`,
      bookingId: booking.id,
      timestamp: new Date().toISOString()
    });

    res.json({ payment, booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// ─── SSE: Real-time Notifications ────────────────────────────────────────────
const sseClients = new Set<Response>();
const userSseClients = new Map<string, Response[]>();

app.get('/api/admin/notifications/stream', authenticateAdmin, (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Đã kết nối thông báo realtime' })}\n\n`);

  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 30000);

  sseClients.add(res);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

function broadcastNotification(notification: object) {
  const data = `data: ${JSON.stringify(notification)}\n\n`;
  sseClients.forEach(client => {
    try { client.write(data); } catch {}
  });
}

app.get('/api/user/notifications/stream', authenticateToken, (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const userId = (req as any).user.userId;
  if (!userSseClients.has(userId)) {
    userSseClients.set(userId, []);
  }
  userSseClients.get(userId)?.push(res);

  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to user notifications' })}\n\n`);

  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    const clients = userSseClients.get(userId) || [];
    userSseClients.set(userId, clients.filter(c => c !== res));
  });
});

// User: Lấy danh sách thông báo
app.get('/api/user/notifications', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const notifications = await prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { createdAt: 'desc' },
      take: 30
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// User: Đánh dấu đã đọc
app.put('/api/user/notifications/:id/read', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const notif = await prisma.notification.findUnique({ where: { id: req.params.id as string } });
    if (!notif || notif.user_id !== userId) return res.status(404).json({ error: 'Not found' });
    const updated = await prisma.notification.update({
      where: { id: req.params.id as string },
      data: { is_read: true }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// User: Đánh dấu tất cả đã đọc
app.put('/api/user/notifications/read-all', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    await prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

function broadcastUserNotification(userId: string, dataObj: object) {
  const clients = userSseClients.get(userId) || [];
  const dataString = `data: ${JSON.stringify(dataObj)}\n\n`;
  clients.forEach(client => {
    try { client.write(dataString); } catch {}
  });
}

// ─── Admin: Stats ─────────────────────────────────────────────────────────────
app.get('/api/admin/stats', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const bookingsToday = await prisma.booking.count({
      where: { createdAt: { gte: today } }
    });

    const bookingsYesterday = await prisma.booking.count({
      where: { createdAt: { gte: yesterday, lt: today } }
    });

    const checkInsToday = await prisma.booking.count({
      where: {
        check_in: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    const checkInsYesterday = await prisma.booking.count({
      where: {
        check_in: {
          gte: yesterday,
          lt: today
        }
      }
    });

    const totalRooms = await prisma.room.count();
    const activeBookings = await prisma.booking.count({
      where: { status: { in: ['CONFIRMED', 'CHECKED_IN'] } }
    });
    const occupancyRate = totalRooms > 0 ? (activeBookings / totalRooms) * 100 : 0;

    const payments = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'SUCCESS' }
    });

    const todayPayments = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'SUCCESS', transaction_date: { gte: today } }
    });

    const yesterdayPayments = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'SUCCESS', transaction_date: { gte: yesterday, lt: today } }
    });

    const roomsCleaning = await prisma.room.count({
      where: { status: 'CLEANING' }
    });

    const breakfastUpsells = await prisma.upsell.count({
      where: { 
        service_name: { contains: 'breakfast', mode: 'insensitive' },
        booking: { status: { in: ['CHECKED_IN', 'CONFIRMED'] } } 
      }
    });

    const spaUpsells = await prisma.upsell.count({
      where: {
        service_name: { contains: 'spa', mode: 'insensitive' },
        booking: { status: { in: ['CHECKED_IN', 'CONFIRMED'] } }
      }
    });

    // Tính % tăng trưởng thật
    const todayRev = todayPayments._sum.amount || 0;
    const yestRev = yesterdayPayments._sum.amount || 0;
    const revenueGrowth = yestRev > 0 ? ((todayRev - yestRev) / yestRev) * 100 : 0;

    const checkInGrowth = checkInsYesterday > 0 
      ? ((checkInsToday - checkInsYesterday) / checkInsYesterday) * 100 
      : 0;

    const bookingGrowth = bookingsYesterday > 0
      ? ((bookingsToday - bookingsYesterday) / bookingsYesterday) * 100
      : 0;

    res.json({
      checkInsToday,
      checkInGrowth: checkInGrowth.toFixed(1),
      bookingsToday,
      bookingGrowth: bookingGrowth.toFixed(1),
      occupancyRate: occupancyRate.toFixed(1),
      totalRevenue: payments._sum.amount || 0,
      todayRevenue: todayRev,
      revenueGrowth: revenueGrowth.toFixed(1),
      roomsCleaning,
      breakfastServed: breakfastUpsells,
      spaBooked: spaUpsells,
      totalRooms
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ─── Admin: Revenue Chart ─────────────────────────────────────────────────────
app.get('/api/admin/revenue-chart', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const payments = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'SUCCESS', transaction_date: { gte: date, lt: nextDate } }
      });
      const bookings = await prisma.booking.count({
        where: { createdAt: { gte: date, lt: nextDate } }
      });

      result.push({
        day: date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' }),
        revenue: payments._sum.amount || 0,
        bookings
      });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch revenue chart' });
  }
});

// ─── Admin: Recent Activity (thật, từ DB) ────────────────────────────────────
app.get('/api/admin/recent-activity', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const recentBookings = await prisma.booking.findMany({
      take: 10,
      orderBy: { updatedAt: 'desc' },
      include: {
        guest: { select: { full_name: true } },
        roomType: { select: { name: true } }
      }
    });

    const activity = recentBookings.map(b => {
      const statusEmoji: Record<string, string> = {
        PENDING: '🕐',
        CONFIRMED: '✅',
        CHECKED_IN: '🏨',
        CHECKED_OUT: '🚪',
        CANCELLED: '❌'
      };
      const statusLabel: Record<string, string> = {
        PENDING: 'Chờ xác nhận',
        CONFIRMED: 'Đã xác nhận',
        CHECKED_IN: 'Check-in',
        CHECKED_OUT: 'Check-out',
        CANCELLED: 'Đã hủy'
      };
      return {
        id: b.id,
        icon: statusEmoji[b.status] || '📋',
        title: `${b.guest.full_name} · ${b.roomType.name}`,
        sub: `${b.booking_code} · ${statusLabel[b.status] || b.status}`,
        timestamp: b.updatedAt,
        status: b.status
      };
    });

    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

// ─── Admin: Customers ─────────────────────────────────────────────────────────
app.get('/api/admin/customers', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { search, page, limit } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = { role: 'GUEST' };
    if (search) {
      where.OR = [
        { full_name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { bookings: true },
        skip,
        take: limitNum
      }),
      prisma.user.count({ where })
    ]);

    res.json({ data: users, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Admin: Create Customer
app.post('/api/admin/customers', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { full_name, email, phone, password } = req.body;
    if (!full_name || !email) {
      return res.status(400).json({ error: 'Tên và email là bắt buộc' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email đã tồn tại' });

    const password_hash = await bcrypt.hash(password || 'Luxe@2024', 10);
    const user = await prisma.user.create({
      data: { full_name, email, phone, password_hash, role: 'GUEST' }
    });

    const { password_hash: _, ...safe } = user;
    res.status(201).json(safe);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Admin: Update Customer
app.put('/api/admin/customers/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { full_name, phone, address, id_card, membership_tier, membership_points } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params['id'] as string },
      data: { full_name, phone, address, id_card, membership_tier, membership_points: membership_points ? parseInt(membership_points) : undefined }
    });
    const { password_hash: _, ...safe } = user;
    res.json(safe);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Admin: Delete Customer
app.delete('/api/admin/customers/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const customerId = req.params['id'] as string;
    // Kiểm tra có booking đang active không
    const activeBookings = await prisma.booking.count({
      where: {
        guest_id: customerId,
        status: { in: ['CONFIRMED' as any, 'CHECKED_IN' as any, 'PENDING' as any] }
      }
    });

    if (activeBookings > 0) {
      return res.status(400).json({ 
        error: `Không thể xóa khách hàng đang có ${activeBookings} booking active` 
      });
    }

    await prisma.user.delete({ where: { id: customerId } });
    res.json({ message: 'Đã xóa khách hàng thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// Admin: Customer Detail
app.get('/api/admin/customers/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const customer = await prisma.user.findUnique({
      where: { id: req.params.id as string },
      include: {
        bookings: {
          include: { roomType: true, payments: true, upsells: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    const { password_hash, ...safe } = customer;
    res.json(safe);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer detail' });
  }
});

// ─── Admin: Rooms Matrix ──────────────────────────────────────────────────────
app.get('/api/admin/rooms-matrix', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const rooms = await prisma.room.findMany({
      include: { roomType: true },
      orderBy: { room_number: 'asc' }
    });

    const activeBookings = await prisma.booking.findMany({
      where: { status: { in: ['PENDING', 'CHECKED_IN', 'CONFIRMED'] } },
      include: { guest: true },
      orderBy: { createdAt: 'asc' }
    });

    const roomAssignments = new Map();
    activeBookings.forEach(b => {
       const availableRoom = rooms.find(r => r.room_type_id === b.room_type_id && !roomAssignments.has(r.id));
       if (availableRoom) {
          roomAssignments.set(availableRoom.id, b);
       }
    });

    const roomsWithBookings = rooms.map(r => {
       const b = roomAssignments.get(r.id);
       return { ...r, bookings: b ? [b] : [] };
    });

    res.json(roomsWithBookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rooms matrix' });
  }
});

// Admin: Update Room Status (NEW)
app.put('/api/admin/rooms/:id/status', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'CLEANING'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }

    const room = await prisma.room.update({
      where: { id: req.params['id'] as string },
      data: { status: status as any },
      include: { roomType: true }
    });

    broadcastNotification({
      type: 'room_status',
      title: `🏠 Trạng thái phòng thay đổi`,
      message: `Phòng ${room.room_number} → ${status}`,
      timestamp: new Date().toISOString()
    });

    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update room status' });
  }
});

// ─── Admin: Reservations ──────────────────────────────────────────────────────
app.get('/api/admin/bookings', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { search, status, page, limit, date_from, date_to } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status && status !== 'all') where.status = (status as string).toUpperCase();
    if (search) {
      where.OR = [
        { booking_code: { contains: search as string, mode: 'insensitive' } },
        { guest: { full_name: { contains: search as string, mode: 'insensitive' } } },
        { guest: { email: { contains: search as string, mode: 'insensitive' } } },
      ];
    }
    if (date_from || date_to) {
      where.check_in = {};
      if (date_from) where.check_in.gte = new Date(date_from as string);
      if (date_to) where.check_in.lte = new Date(date_to as string);
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          guest: { select: { full_name: true, email: true, phone: true } },
          roomType: true,
          upsells: true,
          payments: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.booking.count({ where })
    ]);

    res.json({ data: bookings, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Admin: Create Manual Booking
app.post('/api/admin/bookings', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { guest_email, room_type_id, check_in, check_out, total_amount, special_request } = req.body;

    if (!guest_email || !room_type_id || !check_in || !check_out) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }

    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);
    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ error: 'Ngày trả phòng phải sau ngày nhận phòng' });
    }

    const guest = await prisma.user.findUnique({ where: { email: guest_email } });
    if (!guest) return res.status(404).json({ error: 'Không tìm thấy khách hàng với email này.' });

    const roomType = await prisma.roomType.findUnique({ where: { id: room_type_id } });
    if (!roomType) return res.status(404).json({ error: 'Loại phòng không tồn tại' });

    const nights = Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 86400000));
    const computedTotal = total_amount || roomType.base_price * nights;

    const booking = await prisma.booking.create({
      data: {
        booking_code: `LX-${Math.floor(1000 + Math.random() * 9000)}-ADM`,
        guest_id: guest.id,
        room_type_id,
        check_in: checkInDate,
        check_out: checkOutDate,
        total_amount: computedTotal,
        special_request,
        status: 'CONFIRMED'
      },
      include: { guest: true, roomType: true }
    });

    broadcastNotification({
      type: 'new_booking',
      title: '📋 Đặt phòng mới (Admin)',
      message: `${booking.guest.full_name} · ${booking.roomType.name} · ${booking.booking_code}`,
      bookingId: booking.id,
      timestamp: new Date().toISOString()
    });

    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Admin: Update Booking Status
app.put('/api/admin/bookings/:id/status', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    
    const prevBooking = await prisma.booking.findUnique({
      where: { id: req.params.id as string },
      include: { guest: true }
    });
    
    if (!prevBooking) return res.status(404).json({ error: 'Booking not found' });

    const booking = await prisma.booking.update({
      where: { id: req.params.id as string },
      data: { status },
      include: { guest: true, roomType: { select: { name: true } } }
    });

    if (status === 'CHECKED_OUT' && prevBooking.status !== 'CHECKED_OUT') {
      const earnedPoints = Math.floor(booking.total_amount / 100000);
          
          broadcastUserNotification(booking.guest_id, {
            type: 'checkout_success',
            title: '🎉 Hoàn tất lưu trú',
            message: `Cảm ơn bạn đã lưu trú! Bạn vừa nhận được ${earnedPoints} điểm thưởng.`,
            earnedPoints,
            newTier: null // (we could add this)
          });
      if (earnedPoints > 0) {
        const newTierPoints = (booking.guest.tier_points || 0) + earnedPoints;
        const newMembershipPoints = (booking.guest.membership_points || 0) + earnedPoints;
        
        let newTier = booking.guest.membership_tier;
        if (newTierPoints >= 3000) newTier = 'VIP';
        else if (newTierPoints >= 1500) newTier = 'Platinum';
        else if (newTierPoints >= 500) newTier = 'Gold';
        else if (newTierPoints >= 100) newTier = 'Silver';
        
        await prisma.user.update({
          where: { id: booking.guest_id },
          data: {
            tier_points: newTierPoints,
            membership_points: newMembershipPoints,
            membership_tier: newTier
          }
        });
        
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 24);

        await prisma.pointTransaction.create({
          data: {
            user_id: booking.guest_id,
            amount: earnedPoints,
            type: 'EARN_BOOKING',
            description: `Tích điểm từ mã đặt phòng ${booking.booking_code}`,
            expiresAt
          }
        });
      }
    }

    const statusLabels: Record<string, string> = {
      CONFIRMED: '✅ Đã xác nhận',
      CHECKED_IN: '🏨 Check-in',
      CHECKED_OUT: '🚪 Check-out',
      CANCELLED: '❌ Đã hủy'
    };

    broadcastNotification({
      type: 'status_change',
      title: statusLabels[status] || status,
      message: `${booking.guest.full_name} · ${booking.roomType.name} · ${booking.booking_code}`,
      bookingId: booking.id,
      timestamp: new Date().toISOString()
    });

    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// ─── Admin: Billing ───────────────────────────────────────────────────────────
app.get('/api/admin/billing', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { search, payment_method, status, date_from, date_to, page, limit } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (payment_method && payment_method !== 'all') where.payment_method = payment_method;
    if (status && status !== 'all') where.status = status;
    if (date_from || date_to) {
      where.transaction_date = {};
      if (date_from) where.transaction_date.gte = new Date(date_from as string);
      if (date_to) {
        const toDate = new Date(date_to as string);
        toDate.setHours(23, 59, 59, 999);
        where.transaction_date.lte = toDate;
      }
    }

    if (search) {
      where.booking = {
        OR: [
          { booking_code: { contains: search as string, mode: 'insensitive' } },
          { guest: { full_name: { contains: search as string, mode: 'insensitive' } } }
        ]
      };
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          booking: {
            include: {
              guest: { select: { full_name: true, email: true } },
              roomType: { select: { name: true, base_price: true } },
              upsells: true
            }
          }
        },
        orderBy: { transaction_date: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.payment.count({ where })
    ]);

    res.json({ data: payments, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch billing data' });
  }
});

// Admin: Billing Stats
app.get('/api/admin/billing/stats', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const total = await prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'SUCCESS' } });
    const today = new Date(); today.setHours(0,0,0,0);
    const todayRevenue = await prisma.payment.aggregate({
      _sum: { amount: true }, where: { status: 'SUCCESS', transaction_date: { gte: today } }
    });
    const pending = await prisma.booking.count({ where: { status: 'PENDING' } });
    const confirmed = await prisma.booking.count({ where: { status: { in: ['CONFIRMED','CHECKED_IN'] } } });
    const refunded = await prisma.payment.aggregate({
      _sum: { amount: true }, where: { status: 'REFUNDED' }
    });

    // Revenue by payment method
    const byMethod = await prisma.payment.groupBy({
      by: ['payment_method'],
      where: { status: 'SUCCESS' },
      _sum: { amount: true },
      _count: { id: true }
    });

    res.json({
      totalRevenue: total._sum.amount || 0,
      todayRevenue: todayRevenue._sum.amount || 0,
      pendingPayments: pending,
      activeBookings: confirmed,
      totalRefunded: refunded._sum.amount || 0,
      byMethod
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch billing stats' });
  }
});

// Admin: Refund Payment (NEW)
app.put('/api/admin/payments/:id/refund', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const paymentId = req.params['id'] as string;
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: { include: { guest: true, roomType: true } } }
    }) as any;

    if (!payment) return res.status(404).json({ error: 'Giao dịch không tồn tại' });
    if (payment.status === 'REFUNDED') return res.status(400).json({ error: 'Giao dịch đã được hoàn tiền rồi' });
    if (payment.status !== 'SUCCESS') return res.status(400).json({ error: 'Chỉ có thể hoàn tiền giao dịch thành công' });

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'REFUNDED' }
    });

    // Cập nhật booking về CANCELLED
    await prisma.booking.update({
      where: { id: payment.booking_id },
      data: { status: 'CANCELLED' as any }
    });

    broadcastNotification({
      type: 'refund',
      title: '💸 Hoàn tiền',
      message: `${payment.booking?.guest?.full_name || 'Guest'} · ${payment.booking?.booking_code || ''} · ${payment.amount}`,
      timestamp: new Date().toISOString()
    });

    res.json({ payment: updatedPayment, message: 'Hoàn tiền thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// Admin: Record Manual Payment (PAY_AT_DESK)
app.post('/api/admin/payments', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { booking_id, amount, payment_method } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: booking_id },
      include: { guest: true, roomType: true }
    });
    if (!booking) return res.status(404).json({ error: 'Booking không tồn tại' });

    const payment = await prisma.payment.create({
      data: {
        booking_id,
        amount,
        payment_method: payment_method || 'PAY_AT_DESK',
        status: 'SUCCESS'
      }
    });

    await prisma.booking.update({
      where: { id: booking_id },
      data: { status: 'CONFIRMED' }
    });

    broadcastNotification({
      type: 'new_payment',
      title: '💵 Thanh toán tại quầy',
      message: `${booking.guest.full_name} · ${booking.booking_code} · $${amount}`,
      timestamp: new Date().toISOString()
    });

    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// ─── Admin: Export CSV ────────────────────────────────────────────────────────
app.get('/api/admin/export/bookings', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { status, date_from, date_to } = req.query;
    const where: any = {};
    if (status && status !== 'all') where.status = (status as string).toUpperCase();
    if (date_from || date_to) {
      where.check_in = {};
      if (date_from) where.check_in.gte = new Date(date_from as string);
      if (date_to) where.check_in.lte = new Date(date_to as string);
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        guest: { select: { full_name: true, email: true, phone: true } },
        roomType: { select: { name: true } },
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const csvLines = [
      'Mã Booking,Khách Hàng,Email,SĐT,Loại Phòng,Ngày Nhận,Ngày Trả,Tổng Tiền,Trạng Thái,Ngày Tạo',
      ...bookings.map(b => [
        b.booking_code,
        `"${b.guest.full_name}"`,
        b.guest.email,
        b.guest.phone || '',
        `"${b.roomType.name}"`,
        new Date(b.check_in).toLocaleDateString('vi-VN'),
        new Date(b.check_out).toLocaleDateString('vi-VN'),
        b.total_amount,
        b.status,
        new Date(b.createdAt).toLocaleDateString('vi-VN')
      ].join(','))
    ];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="bookings-${Date.now()}.csv"`);
    res.send('\ufeff' + csvLines.join('\n')); // BOM for UTF-8 Excel
  } catch (error) {
    res.status(500).json({ error: 'Failed to export' });
  }
});

app.get('/api/admin/export/customers', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: 'GUEST' },
      include: { bookings: { include: { payments: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const csvLines = [
      'Họ Tên,Email,SĐT,Hạng Thành Viên,Điểm,Số Booking,Tổng Chi Tiêu,Ngày Đăng Ký',
      ...customers.map(c => {
        const totalSpent = c.bookings.reduce((acc, b) => acc + b.total_amount, 0);
        return [
          `"${c.full_name}"`,
          c.email,
          c.phone || '',
          c.membership_tier,
          c.membership_points,
          c.bookings.length,
          totalSpent.toFixed(0),
          new Date(c.createdAt).toLocaleDateString('vi-VN')
        ].join(',');
      })
    ];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="customers-${Date.now()}.csv"`);
    res.send('\ufeff' + csvLines.join('\n'));
  } catch (error) {
    res.status(500).json({ error: 'Failed to export' });
  }
});

app.get('/api/admin/export/billing', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { date_from, date_to } = req.query;
    const where: any = {};
    if (date_from || date_to) {
      where.transaction_date = {};
      if (date_from) where.transaction_date.gte = new Date(date_from as string);
      if (date_to) where.transaction_date.lte = new Date(date_to as string);
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        booking: {
          include: {
            guest: { select: { full_name: true, email: true } },
            roomType: { select: { name: true } }
          }
        }
      },
      orderBy: { transaction_date: 'desc' }
    });

    const csvLines = [
      'Khách Hàng,Email,Mã Booking,Loại Phòng,Phương Thức,Số Tiền,Trạng Thái,Ngày GD',
      ...payments.map(p => [
        `"${p.booking.guest.full_name}"`,
        p.booking.guest.email,
        p.booking.booking_code,
        `"${p.booking.roomType.name}"`,
        p.payment_method,
        p.amount.toFixed(0),
        p.status,
        new Date(p.transaction_date).toLocaleDateString('vi-VN')
      ].join(','))
    ];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="billing-${Date.now()}.csv"`);
    res.send('\ufeff' + csvLines.join('\n'));
  } catch (error) {
    res.status(500).json({ error: 'Failed to export' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── RECEPTIONIST ROUTES ─────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// Receptionist: Dashboard Stats
app.get('/api/receptionist/dashboard', authenticateReceptionist, async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    // Khách check-in hôm nay
    const checkInsToday = await prisma.booking.findMany({
      where: {
        check_in: { gte: today, lt: todayEnd },
        status: { in: ['CONFIRMED', 'CHECKED_IN'] }
      },
      include: {
        guest: { select: { full_name: true, email: true, phone: true, membership_tier: true } },
        roomType: { select: { name: true } },
        room: { select: { room_number: true, floor: true } }
      },
      orderBy: { check_in: 'asc' }
    });

    // Khách check-out hôm nay
    const checkOutsToday = await prisma.booking.count({
      where: {
        check_out: { gte: today, lt: todayEnd },
        status: 'CHECKED_IN'
      }
    });

    // Phòng trống hiện tại
    const availableRooms = await prisma.room.count({
      where: { status: 'AVAILABLE' }
    });

    // Yêu cầu dịch vụ đang chờ
    const pendingRequests = await prisma.serviceRequest.count({
      where: { status: { in: ['PENDING', 'IN_PROGRESS'] } }
    });

    // Occupancy %
    const totalRooms = await prisma.room.count();
    const occupiedRooms = await prisma.room.count({ where: { status: 'OCCUPIED' } });
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    // Khách đang lưu trú hiện tại
    const currentGuests = await prisma.booking.count({
      where: { status: 'CHECKED_IN' }
    });

    res.json({
      checkInsToday: checkInsToday.length,
      checkInsDetails: checkInsToday,
      checkOutsToday,
      availableRooms,
      pendingRequests,
      occupancyRate,
      currentGuests,
      totalRooms
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch receptionist dashboard' });
  }
});

// Receptionist: Danh sách booking
app.get('/api/receptionist/bookings', authenticateReceptionist, async (req: Request, res: Response) => {
  try {
    const { search, status, page, limit } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status && status !== 'all') where.status = (status as string).toUpperCase();
    if (search) {
      where.OR = [
        { booking_code: { contains: search as string, mode: 'insensitive' } },
        { guest: { full_name: { contains: search as string, mode: 'insensitive' } } },
        { guest: { phone: { contains: search as string } } },
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          guest: { select: { full_name: true, email: true, phone: true, membership_tier: true, id_card: true, dob: true, address: true } },
          roomType: true,
          room: { select: { room_number: true, floor: true } },
          upsells: true,
          payments: true,
          serviceRequests: true
        },
        orderBy: { check_in: 'asc' },
        skip,
        take: limitNum
      }),
      prisma.booking.count({ where })
    ]);

    res.json({ data: bookings, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Receptionist: Lấy 1 booking theo ID
app.get('/api/receptionist/bookings/:id', authenticateReceptionist, async (req: Request, res: Response) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id as string },
      include: {
        guest: { select: { full_name: true, email: true, phone: true, membership_tier: true, membership_points: true, id_card: true, dob: true, address: true } },
        roomType: true,
        room: { select: { id: true, room_number: true, floor: true } },
        upsells: true,
        payments: true,
        serviceRequests: { orderBy: { createdAt: 'desc' }, take: 5 }
      }
    });
    if (!booking) return res.status(404).json({ error: 'Booking không tồn tại' });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// Receptionist: Tạo booking walk-in tại quầy
app.post('/api/receptionist/bookings', authenticateReceptionist, async (req: Request, res: Response) => {
  try {
    const { guest_id, room_type_id, room_id, check_in, check_out, special_request, adults } = req.body;
    if (!guest_id || !room_type_id || !check_in || !check_out) {
      return res.status(400).json({ error: 'guest_id, room_type_id, check_in, check_out là bắt buộc' });
    }

    // Tính số đêm & tổng tiền
    const roomType = await prisma.roomType.findUnique({ where: { id: room_type_id } });
    if (!roomType) return res.status(404).json({ error: 'Loại phòng không tồn tại' });

    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);
    const nights = Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 86400000));
    const total_amount = roomType.base_price * nights + roomType.serviceFee + roomType.tax;

    // Tạo mã booking
    const booking_code = `WLK-${Date.now().toString(36).toUpperCase()}`;

    const booking = await prisma.booking.create({
      data: {
        booking_code,
        guest_id,
        room_type_id,
        room_id: room_id || null,
        check_in: checkInDate,
        check_out: checkOutDate,
        total_amount,
        special_request: special_request || null,
        status: 'CONFIRMED'
      },
      include: {
        guest: { select: { full_name: true, email: true, phone: true } },
        roomType: true,
        room: true
      }
    });

    // Nếu đã chọn phòng cụ thể, đổi trạng thái phòng
    if (room_id) {
      await prisma.room.update({ where: { id: room_id }, data: { status: 'OCCUPIED' } });
    }

    broadcastNotification({
      type: 'new_booking',
      title: '📋 Booking Walk-in mới',
      message: `${booking.guest.full_name} · ${booking.roomType.name} · ${booking_code}`,
      bookingId: booking.id,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create walk-in booking' });
  }
});

// Receptionist: Cập nhật trạng thái phòng (CLEANING → AVAILABLE, v.v.)
app.put('/api/receptionist/rooms/:id/status', authenticateReceptionist, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['AVAILABLE', 'CLEANING', 'MAINTENANCE'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ. Cho phép: AVAILABLE, CLEANING, MAINTENANCE' });
    }
    // Không cho phép đổi phòng đang OCCUPIED thành AVAILABLE
    const room = await prisma.room.findUnique({ where: { id: req.params.id as string } });
    if (!room) return res.status(404).json({ error: 'Phòng không tồn tại' });
    if (room.status === 'OCCUPIED' && status !== 'CLEANING') {
      return res.status(400).json({ error: 'Phòng đang có khách không thể chuyển trạng thái này' });
    }
    const updated = await prisma.room.update({
      where: { id: req.params.id as string },
      data: { status },
      include: { roomType: { select: { name: true } } }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update room status' });
  }
});

// Receptionist: Danh sách khách check-out hôm nay
app.get('/api/receptionist/checkouts-today', authenticateReceptionist, async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const checkouts = await prisma.booking.findMany({
      where: {
        check_out: { gte: today, lt: todayEnd },
        status: 'CHECKED_IN'
      },
      include: {
        guest: { select: { full_name: true, email: true, phone: true, membership_tier: true } },
        roomType: { select: { name: true } },
        room: { select: { room_number: true } },
        payments: true,
        upsells: true
      },
      orderBy: { check_out: 'asc' }
    });

    res.json(checkouts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch checkout list' });
  }
});

// Receptionist: Tìm kiếm khách hàng để tạo walk-in
app.get('/api/receptionist/guests', authenticateReceptionist, async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const where: any = { role: 'GUEST' };
    if (search) {
      where.OR = [
        { full_name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string } }
      ];
    }
    const guests = await prisma.user.findMany({
      where,
      select: { id: true, full_name: true, email: true, phone: true, membership_tier: true },
      take: 10,
      orderBy: { full_name: 'asc' }
    });
    res.json(guests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search guests' });
  }
});

// Receptionist: Lấy tất cả loại phòng
app.get('/api/receptionist/room-types', authenticateReceptionist, async (req: Request, res: Response) => {
  try {
    const roomTypes = await prisma.roomType.findMany({
      select: { id: true, name: true, base_price: true, max_adults: true, max_children: true, area: true, view: true },
      orderBy: { base_price: 'asc' }
    });
    res.json(roomTypes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch room types' });
  }
});

// Receptionist: Check-in (CONFIRMED → CHECKED_IN + gán phòng)
app.post('/api/receptionist/bookings/:id/checkin', authenticateReceptionist, async (req: Request, res: Response) => {
  try {
    const { room_id } = req.body;
    const bookingId = req.params.id as string;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { guest: true, roomType: true }
    });

    if (!booking) return res.status(404).json({ error: 'Booking không tồn tại' });
    if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') {
      return res.status(400).json({ error: 'Booking phải ở trạng thái CONFIRMED hoặc PENDING để check-in' });
    }

    // Cập nhật trạng thái booking và gán phòng
    const updateData: any = { status: 'CHECKED_IN' };
    if (room_id) updateData.room_id = room_id;

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        guest: { select: { full_name: true, email: true, phone: true } },
        roomType: true,
        room: true
      }
    });

    // Nếu gán phòng cụ thể, cập nhật trạng thái phòng thành OCCUPIED
    if (room_id) {
      await prisma.room.update({
        where: { id: room_id },
        data: { status: 'OCCUPIED' }
      });
    }

    broadcastNotification({
      type: 'checkin',
      title: '🏨 Khách Check-in',
      message: `${booking.guest.full_name} · ${booking.roomType.name} · ${booking.booking_code}`,
      bookingId: booking.id,
      timestamp: new Date().toISOString()
    });

    res.json(updatedBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to check-in' });
  }
});

// Receptionist: Check-out (CHECKED_IN → CHECKED_OUT)
app.post('/api/receptionist/bookings/:id/checkout', authenticateReceptionist, async (req: Request, res: Response) => {
  try {
    const { payment_method } = req.body;
    const bookingId = req.params.id as string;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { guest: true, roomType: true, room: true }
    });

    if (!booking) return res.status(404).json({ error: 'Booking không tồn tại' });
    if (booking.status !== 'CHECKED_IN') {
      return res.status(400).json({ error: 'Booking phải ở trạng thái CHECKED_IN để check-out' });
    }

    // Tạo payment nếu có
    if (payment_method) {
      let mappedMethod: any = 'PAY_AT_DESK';
      if (payment_method === 'CREDIT_CARD') mappedMethod = 'CREDIT_CARD';
      if (payment_method === 'BANK_TRANSFER') mappedMethod = 'BANK_TRANSFER';
      await prisma.payment.create({
        data: { booking_id: bookingId, amount: booking.total_amount, payment_method: mappedMethod }
      });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CHECKED_OUT' },
      include: { guest: true, roomType: true }
    });

    // Giải phóng phòng
    if (booking.room_id) {
      await prisma.room.update({
        where: { id: booking.room_id },
        data: { status: 'CLEANING' }
      });
    }

    // Tích điểm
    const earnedPoints = Math.floor(booking.total_amount / 100000);
    let newTier = booking.guest.membership_tier;
    if (earnedPoints > 0) {
      const guest = await prisma.user.findUnique({ where: { id: booking.guest_id } });
      if (guest) {
        const newTierPoints = (guest.tier_points || 0) + earnedPoints;
        if (newTierPoints >= 3000) newTier = 'VIP';
        else if (newTierPoints >= 1500) newTier = 'Platinum';
        else if (newTierPoints >= 500) newTier = 'Gold';
        else if (newTierPoints >= 100) newTier = 'Silver';
        await prisma.user.update({
          where: { id: booking.guest_id },
          data: { tier_points: newTierPoints, membership_points: (guest.membership_points || 0) + earnedPoints, membership_tier: newTier }
        });
      }
    }

    // Lưu thông báo vào DB và broadcast real-time cho user
    const pointMsg = earnedPoints > 0
      ? `Bạn đã tích lũy được +${earnedPoints} điểm thưởng. Rank hiện tại: ${newTier}.`
      : 'Cảm ơn bạn đã lưu trú!';
    const nights = Math.max(1, Math.round((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / 86400000));
    const notifTitle = '🎉 Kỳ nghỉ đã hoàn thành!';
    const notifMessage = `Đã check-out thành công ${nights} đêm tại ${updatedBooking.roomType?.name || 'khách sạn'}. ${pointMsg}`;

    await prisma.notification.create({
      data: {
        user_id: booking.guest_id,
        type: 'checkout_success',
        title: notifTitle,
        message: notifMessage
      }
    });

    broadcastUserNotification(booking.guest_id, {
      type: 'checkout_success',
      title: notifTitle,
      message: notifMessage,
      earnedPoints,
      newTier,
      bookingCode: booking.booking_code,
      nights,
      timestamp: new Date().toISOString()
    });

    broadcastNotification({
      type: 'checkout',
      title: '🚪 Khách Check-out',
      message: `${booking.guest.full_name} · ${booking.booking_code}`,
      bookingId: booking.id,
      timestamp: new Date().toISOString()
    });

    res.json(updatedBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to check-out' });
  }
});

// Receptionist: Danh sách phòng (status + availability)
app.get('/api/receptionist/rooms', authenticateReceptionist, async (req: Request, res: Response) => {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        roomType: { select: { name: true, base_price: true } },
        bookings: {
          where: { status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
          include: { guest: { select: { full_name: true } } },
          orderBy: { check_in: 'asc' },
          take: 1
        }
      },
      orderBy: [{ floor: 'asc' }, { room_number: 'asc' }]
    });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Receptionist: Available rooms cho 1 room_type
app.get('/api/receptionist/rooms/available', authenticateReceptionist, async (req: Request, res: Response) => {
  try {
    const { room_type_id } = req.query;
    const where: any = { status: 'AVAILABLE' };
    if (room_type_id) where.room_type_id = room_type_id;

    const rooms = await prisma.room.findMany({
      where,
      include: { roomType: { select: { name: true } } },
      orderBy: [{ floor: 'asc' }, { room_number: 'asc' }]
    });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch available rooms' });
  }
});

// Receptionist: Service Requests — list
app.get('/api/receptionist/service-requests', authenticateReceptionist, async (req: Request, res: Response) => {
  try {
    const { category, status, page, limit } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (category && category !== 'ALL') where.category = category;
    if (status && status !== 'ALL') where.status = status;

    const [requests, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        include: {
          booking: {
            include: {
              guest: { select: { full_name: true, membership_tier: true } },
              room: { select: { room_number: true } },
              roomType: { select: { name: true } }
            }
          }
        },
        orderBy: [
          { priority: 'asc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limitNum
      }),
      prisma.serviceRequest.count({ where })
    ]);

    // Stats
    const stats = await prisma.serviceRequest.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    const avgTime = 18; // phút (có thể tính từ completedAt - createdAt sau)
    const inProgress = stats.find(s => s.status === 'IN_PROGRESS')?._count?.status || 0;
    const completed = stats.find(s => s.status === 'COMPLETED')?._count?.status || 0;

    res.json({
      data: requests,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      stats: { avgTime, inProgress, completed }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch service requests' });
  }
});

// Receptionist: Create Service Request
app.post('/api/receptionist/service-requests', authenticateReceptionist, async (req: Request, res: Response) => {
  try {
    const { booking_id, category, title, description, priority } = req.body;
    if (!booking_id || !category || !title) {
      return res.status(400).json({ error: 'booking_id, category, title là bắt buộc' });
    }
    const sr = await prisma.serviceRequest.create({
      data: { booking_id, category, title, description, priority: priority || 'NORMAL' },
      include: {
        booking: {
          include: {
            guest: { select: { full_name: true } },
            room: { select: { room_number: true } }
          }
        }
      }
    });
    res.status(201).json(sr);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create service request' });
  }
});

// Receptionist: Update Service Request status
app.put('/api/receptionist/service-requests/:id', authenticateReceptionist, async (req: Request, res: Response) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }
    const updateData: any = { status, notes };
    if (status === 'COMPLETED') updateData.completedAt = new Date();

    const sr = await prisma.serviceRequest.update({
      where: { id: req.params.id as string },
      data: updateData,
      include: {
        booking: {
          include: {
            guest: { select: { full_name: true } },
            room: { select: { room_number: true } }
          }
        }
      }
    });
    res.json(sr);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update service request' });
  }
});

// Admin: Create Receptionist account
app.post('/api/admin/staff', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { full_name, email, phone, password, role } = req.body;
    if (!full_name || !email) return res.status(400).json({ error: 'Tên và email là bắt buộc' });
    const validRoles = ['RECEPTIONIST', 'ADMIN'];
    if (role && !validRoles.includes(role)) return res.status(400).json({ error: 'Role không hợp lệ' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email đã tồn tại' });

    const password_hash = await bcrypt.hash(password || 'Luxe@2024', 10);
    const user = await prisma.user.create({
      data: { full_name, email, phone, password_hash, role: role || 'RECEPTIONIST' }
    });
    const { password_hash: _, ...safe } = user;
    res.status(201).json(safe);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create staff account' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

