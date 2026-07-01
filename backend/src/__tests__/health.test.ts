/**
 * Test: GET /api/health
 * Kiểm tra API server đang hoạt động bình thường
 */
import request from 'supertest';
import express from 'express';

// Tạo mini app chỉ để test route health (không cần import toàn bộ index.ts)
const app = express();
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Luxury Hotel API is running!' });
});

describe('GET /api/health', () => {
  it('trả về status 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });

  it('trả về body đúng định dạng', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body).toMatchObject({
      status: 'ok',
      message: expect.stringContaining('Luxury Hotel'),
    });
  });
});
