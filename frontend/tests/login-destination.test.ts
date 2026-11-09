import {describe, expect, it} from 'vitest';
import {loginDestination} from '@/src/routes/login-destination';
import {demoPermissions, type Role} from '@/src/app/permissions';

describe('Login destination for all roles', () => {
  for (const role of ['Admin', 'Staff', 'Trainer', 'Member'] as Role[]) {
    const session = {userId:'1', fullName:'Test', role, permissions:demoPermissions(role)};
    it(`${role} reaches its dashboard and preserves an allowed destination`, () => {
      expect(loginDestination(session, null)).toBe('/dashboard');
      expect(loginDestination(session, '/profile')).toBe('/profile');
      expect(loginDestination(session, '/system')).toBe(role === 'Admin' ? '/system' : '/dashboard');
    });
    it(`${role} rejects external, login and unknown destinations`, () => {
      for (const path of ['//example.test', '/\\example.test', '/login', '/missing', 'https://example.test']) {
        expect(loginDestination(session, path)).toBe('/dashboard');
      }
    });
  }
});
