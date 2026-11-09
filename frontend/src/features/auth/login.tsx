'use client';
import { useState, type SubmitEvent } from 'react';
import {
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Activity,
  Users,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DemoReset } from '@/src/components/demo-reset';
import { Brand } from '@/src/components/common';
import { useApp } from '@/src/app/provider';
import type { Role } from '@/src/app/permissions';
import { isMock } from '@/src/api/service';
import { errorText } from '@/src/api/client';
import { Recovery } from './recovery';
const roleLabels: Record<Role, string> = {
  Admin: 'Quản trị viên',
  Staff: 'Nhân viên',
  Trainer: 'Huấn luyện viên',
  Member: 'Hội viên',
};
export function Login() {
  const [recovering, setRecovering] = useState(() => new URLSearchParams(window.location.search).has('resetToken'));
  const { login, register, demoLogin } = useApp();
  const [visible, setVisible] = useState(false),
    [registering, setRegistering] = useState(() => new URLSearchParams(window.location.search).get('mode') === 'register'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      await login(
        typeof form.get('username') === 'string'
          ? (form.get('username') as string)
          : '',
        typeof form.get('password') === 'string'
          ? (form.get('password') as string)
          : '',
      );
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function submitRegistration(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => {
      const field = form.get(name);
      return typeof field === 'string' ? field : '';
    };
    const password = value('password');
    if (password !== value('confirmPassword')) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await register({
        fullName: value('fullName'),
        username: value('username'),
        email: value('email'),
        phone: value('phone'),
        password,
      });
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function demo(role: Role) {
    setBusy(true);
    setError('');
    try {
      await demoLogin(role);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-story">
        <Brand />
        <div>
          <p className="eyebrow">MỖI NGÀY, MẠNH MẼ HƠN.</p>
          <h1>
            Một nơi.
            <br />
            Mọi chuyển động<span className="text-lime">.</span>
          </h1>
          <p>
            Hội viên, lịch tập và vận hành phòng gym.
            <br />
            Kết nối trong một không gian làm việc.
          </p>
          <div className="login-features">
            <span>
              <Users />
              Quản lý hội viên
            </span>
            <span>
              <Activity />
              Theo dõi tiến độ
            </span>
            <span>
              <Sparkles />
              Hỗ trợ với AI
            </span>
          </div>
        </div>
          <small>GYMHUNG © {new Date().getFullYear()}</small>
      </section>
      <section className="login-form-panel">
        <div className="login-form">
          <span className="login-icon">
            {registering ? <UserPlus size={26} /> : <ShieldCheck size={26} />}
          </span>
          <h2>{registering ? 'Tạo tài khoản hội viên' : 'Chào mừng trở lại'}</h2>
          <p className="muted">
            {registering
              ? 'Bắt đầu hành trình tập luyện cùng GYMHUNG.'
              : 'Đăng nhập để bắt đầu ngày làm việc của bạn.'}
          </p>
          <div className="auth-mode" role="tablist" aria-label="Tài khoản">
            <button
              type="button"
              role="tab"
              aria-selected={!registering}
              className={!registering ? 'active' : ''}
              onClick={() => {
                setRegistering(false);
                setError('');
              }}
            >
              Có tài khoản
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={registering}
              className={registering ? 'active' : ''}
              onClick={() => {
                setRegistering(true);
                setError('');
              }}
            >
              Tạo tài khoản mới
            </button>
          </div>
          {recovering ? <Recovery onClose={() => { window.history.replaceState(null, '', '/login'); setRecovering(false); }} /> : <form onSubmit={registering ? submitRegistration : submit}>
            {registering && (
              <>
                <label htmlFor="fullName">Họ và tên</label>
                <Input
                  id="fullName"
                  name="fullName"
                  autoComplete="name"
                  placeholder="Nguyễn Văn An"
                  required
                  disabled={busy}
                />
              </>
            )}
            <label htmlFor="username">Tên đăng nhập hoặc email</label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              placeholder="Nhập tên đăng nhập"
              required
              disabled={busy}
            />
            {registering && (
              <div className="register-fields">
                <div>
                  <label htmlFor="email">Email</label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="ban@example.com"
                    required
                    disabled={busy}
                  />
                </div>
                <div>
                  <label htmlFor="phone">Số điện thoại</label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="0901234567"
                    disabled={busy}
                  />
                </div>
              </div>
            )}
            <label htmlFor="password">Mật khẩu</label>
            <div className="password-field">
              <Input
                id="password"
                name="password"
                autoComplete="current-password"
                type={visible ? 'text' : 'password'}
                placeholder="Nhập mật khẩu"
                required
                minLength={registering ? 8 : undefined}
                disabled={busy}
              />
              <button
                type="button"
                aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {registering && (
              <>
                <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  autoComplete="new-password"
                  type={visible ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu"
                  required
                  minLength={8}
                  disabled={busy}
                />
              </>
            )}
            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" loading={busy} className="login-submit">
              {busy
                ? 'Đang xử lý…'
                : registering
                  ? 'Tạo tài khoản'
                  : 'Đăng nhập'}
              <ArrowRight size={17} />
            </Button>
          </form>}
          {!registering && !recovering && !isMock && <button type="button" className="text-link" onClick={() => setRecovering(true)}>Quên mật khẩu?</button>}
          {!registering && isMock ? (
            <div className="demo-login">
              <span className="demo-chip">CHẾ ĐỘ DEMO</span>
              <div className="demo-role-grid">
                {(['Admin', 'Staff', 'Trainer', 'Member'] as Role[]).map(
                  (role) => (
                    <Button
                      key={role}
                      variant="outline"
                      disabled={busy}
                      onClick={() => demo(role)}
                    >
                      {roleLabels[role]}
                    </Button>
                  ),
                )}
              </div>
              <DemoReset />
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
