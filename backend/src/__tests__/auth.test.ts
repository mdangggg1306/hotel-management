/**
 * Test: Auth Routes — Register & Login
 * Mock hoàn toàn Prisma và bcrypt → không cần database
 */
import request from 'supertest';
import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ── Mock Prisma (không cần DB) ─────────────────────────────────────────────────
const mockUser = {
  id: 'user-uuid-123',
  full_name: 'Nguyễn Văn A',
  email: 'test@example.com',
  password_hash: '$2a$10$hashedpassword',
  role: 'GUEST' as const,
  phone: null,
  id_card: null,
  dob: null,
  address: null,
  dietary_prefs: null,
  pillow_type: null,
  room_location_pref: null,
  payment_method_pref: null,
  membership_tier: 'Member',
  membership_points: 0,
  tier_points: 0,
  resetToken: null,
  resetTokenExpiry: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

// ── Import app sau khi mock ───────────────────────────────────────────────────
// Tạo app nhỏ thay vì import toàn bộ index.ts để tránh side-effects (listen, DB connect)
const JWT_SECRET = 'test_secret';
const app = express();
app.use(express.json());

// Register route
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { full_name, email, password } = req.body;
    const existingUser = await mockPrisma.user.findUnique({ where: { email } } as any);
    if (existingUser) {
      return res.status(400).json({ error: 'Email đã tồn tại' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const user = await mockPrisma.user.create({
      data: { full_name, email, password_hash },
    } as any);
    const { password_hash: _, ...userWithoutPassword } = user as any;
    res.status(201).json(userWithoutPassword);
  } catch {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Login route
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await mockPrisma.user.findUnique({ where: { email } } as any) as any;
    if (!user) return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    const token = jwt.sign({ userId: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const { password_hash: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ── Tests: Register ───────────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  beforeEach(() => jest.clearAllMocks());

  it('đăng ký thành công → 201 và không trả password_hash', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({ ...mockUser });

    const res = await request(app).post('/api/auth/register').send({
      full_name: 'Nguyễn Văn A',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body).not.toHaveProperty('password_hash');
    expect(res.body.email).toBe('test@example.com');
  });

  it('email đã tồn tại → 400', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const res = await request(app).post('/api/auth/register').send({
      full_name: 'Nguyễn Văn B',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Email đã tồn tại/);
  });
});

// ── Tests: Login ──────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('đăng nhập thành công → 200 với token và user (không có password_hash)', async () => {
    const realHash = await bcrypt.hash('password123', 10);
    mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, password_hash: realHash });

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).not.toHaveProperty('password_hash');
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('sai mật khẩu → 401', async () => {
    const realHash = await bcrypt.hash('correctpassword', 10);
    mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, password_hash: realHash });

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/không đúng/);
  });

  it('email không tồn tại → 401', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app).post('/api/auth/login').send({
      email: 'noone@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/không đúng/);
  });

  it('token trả về chứa đúng userId và role', async () => {
    const realHash = await bcrypt.hash('password123', 10);
    mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, password_hash: realHash });

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    });

    const decoded = jwt.verify(res.body.token, JWT_SECRET) as any;
    expect(decoded.userId).toBe(mockUser.id);
    expect(decoded.role).toBe(mockUser.role);
  });
});
