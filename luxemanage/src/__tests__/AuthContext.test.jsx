/**
 * Test: AuthContext — login, logout, trạng thái user, flags phân quyền
 * Dùng fetch mock → không cần server backend
 */
import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../context/AuthContext';

// ── Mock fetch toàn cục ────────────────────────────────────────────────────────
const mockFetch = vi.fn();
global.fetch = mockFetch;

// ── Helper: component để đọc giá trị từ context ───────────────────────────────
function AuthReader() {
  const { user, isLoggedIn, isAdmin, isReceptionist, isUser } = useAuth();
  return (
    <div>
      <span data-testid="is-logged-in">{String(isLoggedIn)}</span>
      <span data-testid="is-admin">{String(isAdmin)}</span>
      <span data-testid="is-receptionist">{String(isReceptionist)}</span>
      <span data-testid="is-user">{String(isUser)}</span>
      <span data-testid="user-email">{user?.email ?? 'none'}</span>
      <span data-testid="user-role">{user?.role ?? 'none'}</span>
    </div>
  );
}

function AuthActions() {
  const { login, logout } = useAuth();
  return (
    <div>
      <button onClick={() => login('test@test.com', 'pass123')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Mock /api/auth/me (gọi khi có token trong localStorage)
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  it('khởi đầu chưa đăng nhập', () => {
    render(
      <AuthProvider>
        <AuthReader />
      </AuthProvider>
    );
    expect(screen.getByTestId('is-logged-in').textContent).toBe('false');
    expect(screen.getByTestId('user-email').textContent).toBe('none');
  });

  it('login thành công → isLoggedIn = true, lưu token vào localStorage', async () => {
    const fakeUser = {
      id: 'u1', full_name: 'Nguyễn A', email: 'test@test.com',
      role: 'GUEST', membership_tier: 'Member', membership_points: 0,
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'fake-jwt-token', user: fakeUser }),
    });

    render(
      <AuthProvider>
        <AuthReader />
        <AuthActions />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-logged-in').textContent).toBe('true');
      expect(screen.getByTestId('user-email').textContent).toBe('test@test.com');
    });

    expect(localStorage.getItem('luxury_hotel_token')).toBe('fake-jwt-token');
    expect(localStorage.getItem('luxury_hotel_user')).toContain('test@test.com');
  });

  it('login thất bại → trả { success: false }', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Sai mật khẩu' }),
    });

    let result;
    function LoginTester() {
      const { login } = useAuth();
      return (
        <button onClick={async () => { result = await login('x@x.com', 'wrong'); }}>
          Login
        </button>
      );
    }

    render(
      <AuthProvider>
        <LoginTester />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Login').click();
    });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Sai mật khẩu/);
  });

  it('logout → isLoggedIn = false, xóa localStorage', async () => {
    // Giả sử đã login rồi
    localStorage.setItem('luxury_hotel_token', 'some-token');
    localStorage.setItem('luxury_hotel_user', JSON.stringify({
      id: 'u1', email: 'test@test.com', role: 'GUEST', name: 'Test',
    }));

    render(
      <AuthProvider>
        <AuthReader />
        <AuthActions />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Logout').click();
    });

    expect(screen.getByTestId('is-logged-in').textContent).toBe('false');
    expect(localStorage.getItem('luxury_hotel_token')).toBeNull();
    expect(localStorage.getItem('luxury_hotel_user')).toBeNull();
  });

  it('isAdmin = true khi role là ADMIN', async () => {
    const adminUser = {
      id: 'a1', full_name: 'Admin', email: 'admin@test.com', role: 'ADMIN',
      membership_tier: 'VIP', membership_points: 0,
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'admin-token', user: adminUser }),
    });

    render(
      <AuthProvider>
        <AuthReader />
        <AuthActions />
      </AuthProvider>
    );

    await act(async () => { screen.getByText('Login').click(); });

    await waitFor(() => {
      expect(screen.getByTestId('is-admin').textContent).toBe('true');
      expect(screen.getByTestId('is-user').textContent).toBe('false');
    });
  });

  it('isReceptionist = true khi role là RECEPTIONIST', async () => {
    const receptionistUser = {
      id: 'r1', full_name: 'Lễ Tân', email: 'r@test.com', role: 'RECEPTIONIST',
      membership_tier: 'Member', membership_points: 0,
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'r-token', user: receptionistUser }),
    });

    render(
      <AuthProvider>
        <AuthReader />
        <AuthActions />
      </AuthProvider>
    );

    await act(async () => { screen.getByText('Login').click(); });

    await waitFor(() => {
      expect(screen.getByTestId('is-receptionist').textContent).toBe('true');
      expect(screen.getByTestId('is-admin').textContent).toBe('false');
    });
  });
});
