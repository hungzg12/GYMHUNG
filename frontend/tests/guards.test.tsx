import {MemoryRouter} from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProtectedContent, PermissionGuard } from '@/src/components/common';
import {
  demoPermissions,
  type Role,
  type Session,
} from '@/src/app/permissions';
import { routeInfo } from '@/src/routes/navigation';
const session = (role: Role): Session => ({
  userId: '10',
  fullName: 'Hội viên kiểm thử',
  role,
  permissions: demoPermissions(role),
});
describe('Protected route and permission guard', () => {
  it('keeps marketing public and maps the private dashboard to its permission', () => {
    expect(routeInfo('/')).toBeUndefined();
    expect(routeInfo('/dashboard')?.permission).toBe('dashboard.read');
  });
  it('does not render protected data before sign in', () => {
    render(
      <ProtectedContent session={null} login={<p>Vui lòng đăng nhập</p>}>
        <p>Dữ liệu riêng tư</p>
      </ProtectedContent>,
    );
    expect(screen.getByText('Vui lòng đăng nhập')).toBeVisible();
    expect(screen.queryByText('Dữ liệu riêng tư')).not.toBeInTheDocument();
  });
  it('returns 403 for a member entering a system route', () => {
    render(
      <MemoryRouter><ProtectedContent
        session={session('Member')}
        required="system.read"
        login={null}
      >
        <p>Quản lý quyền</p>
      </ProtectedContent></MemoryRouter>,
    );
    expect(screen.getByText('403')).toBeVisible();
    expect(screen.queryByText('Quản lý quyền')).not.toBeInTheDocument();
  });
  it('uses explicit permission codes and does not bypass them for the Admin label', () => {
    render(
      <PermissionGuard
        session={{ ...session('Admin'), permissions: [] }}
        code="members.write"
      >
        <button>Thêm hội viên</button>
      </PermissionGuard>,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
  it('allows a trainer to manage plans but not payments', () => {
    render(
      <>
        <PermissionGuard session={session('Trainer')} code="workouts.write">
          <button>Sửa giáo án</button>
        </PermissionGuard>
        <PermissionGuard session={session('Trainer')} code="payments.write">
          <button>Thu tiền</button>
        </PermissionGuard>
      </>,
    );
    expect(screen.getByText('Sửa giáo án')).toBeVisible();
    expect(screen.queryByText('Thu tiền')).not.toBeInTheDocument();
  });
});
