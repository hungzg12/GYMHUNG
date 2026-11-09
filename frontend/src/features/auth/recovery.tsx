import { useState, type SubmitEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/src/api/production';
import { errorText } from '@/src/api/client';

export function Recovery({ onClose }: { onClose: () => void }) {
  const token = new URLSearchParams(window.location.search).get('resetToken');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [done, setDone] = useState(false);
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = form.get('email');
    const password = form.get('password');
    if (token && password !== form.get('confirm')) { setNotice('Mật khẩu xác nhận không khớp.'); return; }
    setBusy(true);
    setNotice('');
    try {
      if (token) {
        await apiRequest('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({token,newPassword:password}) });
        window.history.replaceState(null, '', '/login');
        setNotice('Đã đặt lại mật khẩu. Bạn có thể đăng nhập bằng mật khẩu mới.');
      } else {
        const response = await apiRequest<{message:string}>('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({email}) });
        setNotice(response.message);
      }
      setDone(true);
    } catch (error) { setNotice(errorText(error)); }
    finally { setBusy(false); }
  }
  return <section aria-label="Khôi phục mật khẩu">
    <h2>{token ? 'Đặt lại mật khẩu' : 'Quên mật khẩu'}</h2>
    {!done && <form onSubmit={submit}>
      {token ? <>
        <label htmlFor="recovery-password">Mật khẩu mới</label>
        <Input id="recovery-password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required disabled={busy}/>
        <label htmlFor="recovery-confirm">Xác nhận mật khẩu</label>
        <Input id="recovery-confirm" name="confirm" type="password" autoComplete="new-password" required disabled={busy}/>
      </> : <>
        <label htmlFor="recovery-email">Email tài khoản</label>
        <Input id="recovery-email" name="email" type="email" autoComplete="email" required disabled={busy}/>
      </>}
      <Button type="submit" loading={busy} className="login-submit">{token ? 'Lưu mật khẩu mới' : 'Gửi liên kết'}</Button>
    </form>}
    {notice && <output aria-live="polite">{notice}</output>}
    <Button type="button" variant="outline" disabled={busy} onClick={onClose}>Quay lại đăng nhập</Button>
  </section>;
}
