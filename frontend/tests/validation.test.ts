import { describe, it, expect } from 'vitest';
import { validate, bookingError } from '@/src/features/resources/validation';
import { schema } from '@/src/types/schema';
describe('Vietnamese business validation', () => {
  it('requires both account identity and valid contact data', () => {
    const errors = validate('Users', {
      username: '',
      fullName: '',
      email: 'sai-email',
      phone: 'abc',
    });
    expect(errors.username).toContain('Vui lòng');
    expect(errors.fullName).toContain('Vui lòng');
    expect(errors.email).toContain('Email');
    expect(errors.phone).toContain('Số điện thoại');
  });
  it('rejects invalid schedule duration and capacity', () => {
    const errors = validate('WorkoutSchedules', {
      trainerId: '1',
      scheduleDate: '2026-09-08',
      startTime: '18:00',
      endTime: '17:00',
      capacity: 5,
      currentParticipants: 6,
    });
    expect(errors.endTime).toBeDefined();
    expect(errors.capacity).toBeDefined();
  });
  it('rejects decimals for session counts and negative prices', () => {
    const errors = validate('Packages', {
      packageName: 'Gói test',
      price: -10,
      totalSessions: 1.5,
      durationDays: 30,
    });
    expect(errors.price).toBeDefined();
    expect(errors.totalSessions).toBeDefined();
  });
  it('preserves BIGINT as strings, including values above Number.MAX_SAFE_INTEGER', () => {
    const good = validate('MemberTrainers', {
      memberId: '9223372036854775800',
      trainerId: '1',
    });
    expect(good.memberId).toBeUndefined();
    expect(
      validate('MemberTrainers', { memberId: 123, trainerId: '1' }).memberId,
    ).toBeDefined();
  });
  it('blocks ended or full classes', () => {
    const row = {
      status: 'Available',
      capacity: 5,
      currentParticipants: 5,
      scheduleDate: '2026-10-01',
      endTime: '19:00',
    };
    expect(bookingError(row, new Date('2026-09-01T12:00:00'))).toContain(
      'đủ chỗ',
    );
    expect(
      bookingError(
        { ...row, currentParticipants: 0 },
        new Date('2026-10-02T12:00:00'),
      ),
    ).toContain('kết thúc');
  });
  it('rejects script URLs and impossible date ranges', () => {
    expect(
      validate('Exercises', {
        exerciseName: 'Test',
        imageUrl: 'javascript:alert(1)',
      }).imageUrl,
    ).toBeDefined();
    expect(
      validate('MemberPackages', {
        memberId: '1',
        packageId: '1',
        startDate: '2026-10-10',
        endDate: '2026-10-01',
      }).endDate,
    ).toBeDefined();
  });
  it('covers all 34 tables without sensitive columns', () => {
    expect(Object.keys(schema)).toHaveLength(34);
    const fields = Object.values(schema).flatMap((s) =>
      s.fields.map((f) => f.key),
    );
    for (const key of [
      'passwordHash',
      'requestData',
      'responseData',
      'contextData',
      'oldData',
      'newData',
    ])
      expect(fields).not.toContain(key);
  });
});
