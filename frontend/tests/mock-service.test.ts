import { beforeEach, describe, it, expect, vi } from 'vitest';
import type { GymService } from '@/src/api/service';
import { localDate, offsetDate } from '@/src/utils/format';
let service: GymService;
beforeEach(async () => {
  window.localStorage.clear();
  vi.resetModules();
  service = (await import('@/src/api/mock/service')).mockService;
  await service.demoLogin!('Admin');
});
describe('Demo workflow invariants', () => {
  it('registers a member account and allows signing in again', async () => {
    const registered = await service.register({
      username: 'new.member',
      fullName: 'Hội viên mới',
      email: 'new.member@example.com',
      phone: '0901234567',
      password: 'Member@123',
    });
    expect(registered.role).toBe('Member');
    expect(registered.memberId).toBeDefined();
    await service.logout();
    const signedIn = await service.login('new.member', 'Member@123');
    expect(signedIn.userId).toBe(registered.userId);
    await service.logout();
    const emailSession = await service.login(' NEW.MEMBER@example.com ', 'Member@123');
    expect(emailSession.userId).toBe(registered.userId);
  });
  it('creates the user/member records atomically and keeps the string FK', async () => {
    const member = await service.save(
      'Members',
      null,
      { joinDate: localDate(), fitnessLevel: 'Beginner', status: 'Active' },
      {
        username: 'test.member',
        fullName: 'Hội viên kiểm thử',
        email: 'new@example.com',
        phone: '0901234567',
      },
    );
    const data = await service.load();
    expect(typeof member.memberId).toBe('string');
    expect(data.Users.find((u) => u.userId === member.userId)?.fullName).toBe(
      'Hội viên kiểm thử',
    );
  });
  it('rolls back a duplicate identity without inserting half a profile', async () => {
    const before = await service.load();
    await expect(
      service.save(
        'Members',
        null,
        { joinDate: localDate() },
        {
          username: 'test.member',
          fullName: 'Test',
          email: 'member1@example.com',
        },
      ),
    ).rejects.toMatchObject({ status: 422 });
    const after = await service.load();
    expect(after.Users).toHaveLength(before.Users.length);
    expect(after.Members).toHaveLength(before.Members.length);
  });
  it('cannot overbook and cancellation releases a place exactly once', async () => {
    const schedule = await service.save('WorkoutSchedules', null, {
      trainerId: '1',
      roomId: '1',
      title: 'Test giới hạn',
      scheduleDate: offsetDate(2),
      startTime: '17:00',
      endTime: '18:00',
      capacity: 1,
      status: 'Available',
    });
    const booking = await service.save('Bookings', null, {
      memberId: '1',
      workoutScheduleId: schedule.workoutScheduleId,
      status: 'Confirmed',
    });
    await expect(
      service.save('Bookings', null, {
        memberId: '2',
        workoutScheduleId: schedule.workoutScheduleId,
        status: 'Confirmed',
      }),
    ).rejects.toMatchObject({ status: 422 });
    await service.save('Bookings', booking.bookingId, { status: 'Canceled' });
    await service.save('Bookings', booking.bookingId, { status: 'Canceled' });
    expect(
      (await service.load()).WorkoutSchedules.find(
        (s) => s.workoutScheduleId === schedule.workoutScheduleId,
      )?.currentParticipants,
    ).toBe(0);
  });
  it('blocks check-in without a valid package and duplicate visits', async () => {
    await expect(
      service.save('CheckIns', null, { memberId: '8', status: 'CheckedIn' }),
    ).rejects.toThrow('gói tập');
    await expect(
      service.save('CheckIns', null, { memberId: '1', status: 'CheckedIn' }),
    ).rejects.toThrow('đang có mặt');
  });
  it('rejects a payment whose package belongs to a different member', async () => {
    await expect(
      service.save('Payments', null, {
        memberId: '2',
        memberPackageId: '1',
        amount: 590000,
        status: 'Pending',
      }),
    ).rejects.toThrow('không thuộc hội viên');
  });
  it('scopes member reads and rejects cross-member writes', async () => {
    await service.demoLogin!('Member');
    const data = await service.load();
    expect(data.Members.map((m) => m.memberId)).toEqual(['1']);
    expect(data.Payments.length).toBeGreaterThan(0);
    expect(data.Payments.every((payment) => payment.memberId === '1')).toBe(true);
    expect(data.AuditLogs).toHaveLength(0);
    await expect(
      service.save('Progress', null, {
        memberId: '2',
        recordDate: localDate(),
        weight: 60,
      }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      service.save('Packages', null, { packageName: 'Forbidden', price: 1 }),
    ).rejects.toMatchObject({ status: 403 });
  });
  it('updates only current user notifications', async () => {
    await service.demoLogin!('Member');
    await service.markRead('Notifications');
    expect((await service.load()).Notifications.every((n) => n.isRead)).toBe(
      true,
    );
    await service.demoLogin!('Admin');
    expect((await service.load()).Notifications.some((n) => !n.isRead)).toBe(
      true,
    );
  });
  it('stores a user message and a personalized assistant response', async () => {
    await service.demoLogin!('Member');
    const before = (await service.load()).AIConversationMessages;
    await service.sendMessage('1', 'Tin nhắn kiểm thử');
    const after = (await service.load()).AIConversationMessages;
    expect(after).toHaveLength(before.length + 2);
    expect(after.at(-2)?.senderType).toBe('User');
    expect(after.at(-1)?.senderType).toBe('Assistant');
    expect(after.at(-1)?.message).toContain('Mục tiêu hiện tại');
  });
  it('reorders the full plan atomically and rejects duplicate details', async () => {
    const data = await service.load();
    const ids = data.WorkoutPlanDetails.filter((d) => d.planId === '1')
      .map((d) => d.planDetailId)
      .reverse();
    await service.reorderPlan('1', ids);
    expect(
      (await service.load()).WorkoutPlanDetails.find(
        (d) => d.planDetailId === ids[0],
      )?.orderNo,
    ).toBe(1);
    await expect(
      service.reorderPlan('1', [ids[0], ids[0]]),
    ).rejects.toMatchObject({ status: 422 });
  });

  it('normalizes optional empty fields to null', async () => {
    const member = await service.save(
      'Members',
      null,
      { joinDate: localDate(), weight: '', height: '', status: 'Active' },
      {
        username: 'blank.member',
        fullName: 'Blank Member',
        email: 'blank@example.com',
        dateOfBirth: '',
      },
    );
    expect(member.weight).toBeNull();
    expect(
      (await service.load()).Users.find((u) => u.userId === member.userId)
        ?.dateOfBirth,
    ).toBeNull();
  });
  it('applies permission revocation to the next read and write', async () => {
    const data = await service.load();
    const write = data.Permissions.find(
        (p) => p.permissionCode === 'payments.write',
      )!,
      read = data.Permissions.find(
        (p) => p.permissionCode === 'payments.read',
      )!;
    await service.remove('RolePermissions', '1:' + write.permissionId);
    await service.remove('RolePermissions', '1:' + read.permissionId);
    expect((await service.session())?.permissions).not.toContain(
      'payments.write',
    );
    expect((await service.load()).Payments).toHaveLength(0);
    await expect(
      service.save('Payments', '1', { status: 'Completed' }),
    ).rejects.toMatchObject({ status: 403 });
  });
  it('validates both keys of role assignments', async () => {
    await expect(
      service.save('UserRoles', null, { userId: '999999', roleId: '1' }),
    ).rejects.toMatchObject({ status: 422 });
  });
  it('blocks trainer writes to another trainer plan', async () => {
    await service.demoLogin!('Trainer');
    await expect(
      service.save('WorkoutPlans', '1', { trainerId: '2' }),
    ).rejects.toMatchObject({ status: 403 });
  });
  it('resets only demo state and removes its session', async () => {
    await service.profile({ fullName: 'Changed' });
    await service.resetDemo!();
    expect(await service.session()).toBeNull();
    await service.demoLogin!('Admin');
    expect((await service.session())?.fullName).toBe('Nguyễn Hoàng Hưng');
  });
});

