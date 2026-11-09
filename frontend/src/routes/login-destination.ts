import type { Session } from '@/src/app/permissions';
import { routeInfo } from './navigation';

export function loginDestination(session: Session, returnTo: string | null): string {
  if (!returnTo?.startsWith('/') || returnTo.startsWith('//') || returnTo.includes('\\')) return '/dashboard';
  const path = returnTo.split(/[?#]/)[0];
  const info = routeInfo(path);
  return info && session.permissions.includes(info.permission) ? returnTo : '/dashboard';
}
