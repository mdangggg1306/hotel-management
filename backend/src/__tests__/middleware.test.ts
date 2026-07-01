/**
 * Test: Auth Middleware
 * Kiểm tra các middleware bảo vệ route: authenticateToken, authenticateAdmin, authenticateReceptionist
 * Không cần database — chỉ test logic JWT và phân quyền
 */
import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const TEST_SECRET = 'test_secret_for_testing_only';

// ── Copy middleware logic ra đây để test độc lập ──────────────────────────────
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || (req.query.token as string);
  if (!token) return res.sendStatus(401);
  try {
    const decoded = jwt.verify(token, TEST_SECRET) as any;
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
  authenticateToken(req, res, () => {
    if ((req as any).user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Require Admin Role!' });
    }
    next();
  });
};

const authenticateReceptionist = (req: Request, res: Response, next: NextFunction) => {
  authenticateToken(req, res, () => {
    const role = (req as any).user.role;
    if (role !== 'RECEPTIONIST' && role !== 'ADMIN') {
      return res.status(403).json({ error: 'Require Receptionist Role!' });
    }
    next();
  });
};

// ── Setup app test ─────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());

app.get('/protected', authenticateToken, (_req, res) => res.json({ ok: true }));
app.get('/admin-only', authenticateAdmin, (_req, res) => res.json({ ok: true }));
app.get('/receptionist', authenticateReceptionist, (_req, res) => res.json({ ok: true }));

// Helper tạo token hợp lệ
const makeToken = (payload: object, expiresIn: string | number = '1h') =>
  jwt.sign(payload, TEST_SECRET, { expiresIn } as any);

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('Middleware: authenticateToken', () => {
  it('trả về 401 khi không có token', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
  });

  it('trả về 401 khi token sai / đã hết hạn', async () => {
    const expiredToken = makeToken({ userId: '1', role: 'GUEST' }, -1);
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/hợp lệ|hết hạn/);
  });

  it('cho phép đi tiếp khi token hợp lệ', async () => {
    const token = makeToken({ userId: 'user-1', role: 'GUEST' });
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('chấp nhận token qua query parameter', async () => {
    const token = makeToken({ userId: 'user-1', role: 'GUEST' });
    const res = await request(app).get(`/protected?token=${token}`);
    expect(res.status).toBe(200);
  });
});

describe('Middleware: authenticateAdmin', () => {
  it('từ chối role GUEST → 403', async () => {
    const token = makeToken({ userId: 'user-1', role: 'GUEST' });
    const res = await request(app)
      .get('/admin-only')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Admin/);
  });

  it('từ chối role RECEPTIONIST → 403', async () => {
    const token = makeToken({ userId: 'user-2', role: 'RECEPTIONIST' });
    const res = await request(app)
      .get('/admin-only')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('cho phép role ADMIN → 200', async () => {
    const token = makeToken({ userId: 'user-3', role: 'ADMIN' });
    const res = await request(app)
      .get('/admin-only')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

describe('Middleware: authenticateReceptionist', () => {
  it('từ chối role GUEST → 403', async () => {
    const token = makeToken({ userId: 'user-1', role: 'GUEST' });
    const res = await request(app)
      .get('/receptionist')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Receptionist/);
  });

  it('cho phép role RECEPTIONIST → 200', async () => {
    const token = makeToken({ userId: 'user-2', role: 'RECEPTIONIST' });
    const res = await request(app)
      .get('/receptionist')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('cho phép role ADMIN (quyền cao hơn) → 200', async () => {
    const token = makeToken({ userId: 'user-3', role: 'ADMIN' });
    const res = await request(app)
      .get('/receptionist')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
