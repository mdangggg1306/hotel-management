/**
 * Test: PrivateRoute components — Bảo vệ route theo role
 * Mock AuthContext để kiểm tra hành vi redirect
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import {
  RequireAuth,
  RequireAdmin,
  RequireUser,
  RequireReceptionist,
} from '../components/PrivateRoute';

// ── Mock AuthContext ───────────────────────────────────────────────────────────
const mockAuthState = {
  isLoggedIn: false,
  isAdmin: false,
  isUser: false,
  isReceptionist: false,
  user: null,
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

// ── Helper: render component trong Router với các route kiểm tra ───────────────
function renderWithRouter(component, initialPath = '/test') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/test" element={component} />
        <Route path="/login" element={<div>Trang Đăng Nhập</div>} />
        <Route path="/portal" element={<div>Trang Portal</div>} />
        <Route path="/dashboard" element={<div>Trang Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// ── Tests: RequireAuth ────────────────────────────────────────────────────────
describe('RequireAuth', () => {
  it('chưa đăng nhập → redirect về /login', () => {
    mockAuthState.isLoggedIn = false;

    renderWithRouter(
      <RequireAuth>
        <div>Nội dung bảo mật</div>
      </RequireAuth>
    );

    expect(screen.getByText('Trang Đăng Nhập')).toBeInTheDocument();
    expect(screen.queryByText('Nội dung bảo mật')).not.toBeInTheDocument();
  });

  it('đã đăng nhập → render children bình thường', () => {
    mockAuthState.isLoggedIn = true;

    renderWithRouter(
      <RequireAuth>
        <div>Nội dung bảo mật</div>
      </RequireAuth>
    );

    expect(screen.getByText('Nội dung bảo mật')).toBeInTheDocument();
  });
});

// ── Tests: RequireAdmin ───────────────────────────────────────────────────────
describe('RequireAdmin', () => {
  it('chưa đăng nhập → redirect về /login', () => {
    mockAuthState.isLoggedIn = false;
    mockAuthState.isAdmin = false;

    renderWithRouter(
      <RequireAdmin>
        <div>Trang Admin</div>
      </RequireAdmin>
    );

    expect(screen.getByText('Trang Đăng Nhập')).toBeInTheDocument();
  });

  it('đăng nhập nhưng không phải Admin → redirect về /portal', () => {
    mockAuthState.isLoggedIn = true;
    mockAuthState.isAdmin = false;

    renderWithRouter(
      <RequireAdmin>
        <div>Trang Admin</div>
      </RequireAdmin>
    );

    expect(screen.getByText('Trang Portal')).toBeInTheDocument();
    expect(screen.queryByText('Trang Admin')).not.toBeInTheDocument();
  });

  it('là Admin → render children', () => {
    mockAuthState.isLoggedIn = true;
    mockAuthState.isAdmin = true;

    renderWithRouter(
      <RequireAdmin>
        <div>Trang Admin</div>
      </RequireAdmin>
    );

    expect(screen.getByText('Trang Admin')).toBeInTheDocument();
  });
});

// ── Tests: RequireReceptionist ────────────────────────────────────────────────
describe('RequireReceptionist', () => {
  it('chưa đăng nhập → redirect về /login', () => {
    mockAuthState.isLoggedIn = false;
    mockAuthState.isReceptionist = false;
    mockAuthState.isAdmin = false;

    renderWithRouter(
      <RequireReceptionist>
        <div>Trang Lễ Tân</div>
      </RequireReceptionist>
    );

    expect(screen.getByText('Trang Đăng Nhập')).toBeInTheDocument();
  });

  it('role GUEST → redirect về /portal', () => {
    mockAuthState.isLoggedIn = true;
    mockAuthState.isReceptionist = false;
    mockAuthState.isAdmin = false;

    renderWithRouter(
      <RequireReceptionist>
        <div>Trang Lễ Tân</div>
      </RequireReceptionist>
    );

    expect(screen.getByText('Trang Portal')).toBeInTheDocument();
  });

  it('role RECEPTIONIST → render children', () => {
    mockAuthState.isLoggedIn = true;
    mockAuthState.isReceptionist = true;
    mockAuthState.isAdmin = false;

    renderWithRouter(
      <RequireReceptionist>
        <div>Trang Lễ Tân</div>
      </RequireReceptionist>
    );

    expect(screen.getByText('Trang Lễ Tân')).toBeInTheDocument();
  });

  it('role ADMIN cũng được vào trang Receptionist', () => {
    mockAuthState.isLoggedIn = true;
    mockAuthState.isReceptionist = false;
    mockAuthState.isAdmin = true;

    renderWithRouter(
      <RequireReceptionist>
        <div>Trang Lễ Tân</div>
      </RequireReceptionist>
    );

    expect(screen.getByText('Trang Lễ Tân')).toBeInTheDocument();
  });
});
