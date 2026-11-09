import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ApiError, request } from '@/src/api/client';
import { ErrorState } from '@/src/components/common';
describe('API errors and production isolation', () => {
  it.each([401, 403, 404, 422, 500])(
    'normalizes HTTP %i without exposing server body',
    async (status) => {
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValue(
            new Response(JSON.stringify({ message: 'sensitive server dump' }), {
              status,
              headers: { 'Content-Type': 'application/json' },
            }),
          ),
      );
      const failed = request('http://api.example.test', '/test');
      await expect(failed).rejects.toBeInstanceOf(ApiError);
      await expect(failed).rejects.not.toThrow('sensitive server dump');
    },
  );
  it('emits the shared unauthorized event on 401', async () => {
    const listener = vi.fn();
    window.addEventListener('gym:unauthorized', listener);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );
    await request('http://api.example.test', '/test').catch(() => {});
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener('gym:unauthorized', listener);
  });
  it('does not treat invalid login credentials as an expired session', async () => {
    const listener = vi.fn();
    window.addEventListener('gym:unauthorized', listener);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );
    await request('http://api.example.test', '/api/auth/login', {
      method: 'POST',
    }).catch(() => {});
    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener('gym:unauthorized', listener);
  });
  it('does not convert request cancellation into a generic failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError')),
    );
    await expect(
      request('http://api.example.test', '/test'),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
  it('renders a retry action for failed requests', () => {
    const retry = vi.fn();
    render(<ErrorState message="Không thể kết nối máy chủ" retry={retry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Không thể kết nối');
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(retry).toHaveBeenCalledOnce();
  });
  it('sends assistant messages through the dedicated AI endpoint', async () => {
    localStorage.setItem('gymhung.jwt', 'test-token');
    const fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ userMessage: {}, assistantMessage: {} }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetch);
    const { productionService } = await import('@/src/api/production');

    await productionService.sendMessage('12', 'Xem lịch tập của tôi');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/ai\/conversations\/12\/messages$/),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetch.mock.calls[0][1].body).toBe(
      JSON.stringify({ message: 'Xem lịch tập của tôi' }),
    );
    localStorage.removeItem('gymhung.jwt');
  });
  it('never falls back to fixtures or guesses business endpoints in production', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '');
    vi.resetModules();
    const { productionService } = await import('@/src/api/production');
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    expect(await productionService.session()).toBeNull();
    await expect(productionService.load()).rejects.toMatchObject({
      status: 0,
    });
    await expect(
      productionService.login('user', 'password'),
    ).rejects.toMatchObject({ status: 0 });
    expect(fetch).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
