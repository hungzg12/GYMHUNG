import {gymNow} from '@/src/utils/format';
import type {
  Draft,
  EntityMap,
  EntityRecord,
  TableName,
  WorkspaceData,
} from '@/src/types/entities';
import { asRecord } from '@/src/types/entities';
import { schema } from '@/src/types/schema';
import {
  can,
  permission,
  type Role,
  type Session,
} from '@/src/app/permissions';
import { recordId, foreignTables } from '@/src/features/resources/config';
import { bookingError, validate } from '@/src/features/resources/validation';
import { localDate } from '@/src/utils/format';
import type { GymService } from '../service';
import { ApiError } from '../client';
import { createSeed, makeRow } from './seed';
import { answerFromDatabase } from '@/src/features/ai/database-assistant';
const STORAGE = 'gymhung.demo.data.v2';
const SESSION = 'gymhung.demo.session.v1';
const CREDENTIALS = 'gymhung.demo.credentials.v1';
let state: WorkspaceData | undefined;
let identity: Session | null = null;
function readStorage(key: string) {
  try {
    return typeof window === 'undefined'
      ? null
      : window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function database() {
  if (!state) {
    const raw = readStorage(STORAGE) ?? readStorage('gymhung.demo.data.v1');
    try {
      const parsed = raw ? (JSON.parse(raw) as WorkspaceData) : null;
      state =
        parsed &&
        Object.keys(schema).every((key) =>
          Array.isArray(parsed[key as TableName]),
        )
          ? parsed
          : createSeed();
    } catch {
      state = createSeed();
    }
  }
  return state;
}
function persist() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE, JSON.stringify(database()));
  } catch {
    throw new ApiError(
      0,
      'Không lưu được dữ liệu demo. Bộ nhớ trình duyệt có thể đã đầy hoặc bị chặn.',
    );
  }
}
async function passwordHash(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}
function credentials(): Record<string, string> {
  try {
    return JSON.parse(readStorage(CREDENTIALS) ?? '{}') as Record<
      string,
      string
    >;
  } catch {
    return {};
  }
}
function current() {
  if (!identity) throw new ApiError(401, 'Vui lòng đăng nhập để tiếp tục.');
  const data = database(),
    user = data.Users.find((u) => u.userId === identity!.userId);
  if (!user || user.status !== 'Active') {
    identity = null;
    throw new ApiError(401, 'Tài khoản không còn hoạt động.');
  }
  const roleIds = data.UserRoles.filter(
    (r) => r.userId === identity!.userId,
  ).map((r) => r.roleId);
  const permissionIds = data.RolePermissions.filter((p) =>
    roleIds.includes(p.roleId),
  ).map((p) => p.permissionId);
  identity = {
    ...identity,
    fullName: user.fullName,
    permissions: data.Permissions.filter((p) =>
      permissionIds.includes(p.permissionId),
    ).map((p) => p.permissionCode),
  };
  return identity;
}
function cleanDraft(table: TableName, draft: EntityRecord): EntityRecord {
  return Object.fromEntries(
    Object.entries(draft)
      .filter(([key]) =>
        schema[table].fields.some((f) => f.key === key && !f.readonly),
      )
      .map(([key, value]) => [
        key,
        typeof value === 'string' &&
        value.trim() === '' &&
        schema[table].fields.find((f) => f.key === key)?.nullable
          ? null
          : value,
      ]),
  );
}
function uniqueUser(user: EntityRecord, id?: string) {
  if (
    database().Users.some(
      (u) =>
        u.userId !== id &&
        (u.email.toLowerCase() === String(user.email).toLowerCase() ||
          u.username.toLowerCase() === String(user.username).toLowerCase()),
    )
  )
    throw new ApiError(422, 'Email hoặc tên đăng nhập đã được sử dụng.');
}

function allowed(table: TableName, action: 'read' | 'write') {
  if (!can(current(), permission(table, action)))
    throw new ApiError(403, 'Bạn không có quyền thực hiện thao tác này.');
}
function rows(table: TableName) {
  return database()[table] as unknown as EntityRecord[];
}
function find(table: TableName, id: string) {
  const row = rows(table).find((row) => recordId(table, row) === id);
  if (!row) throw new ApiError(404, 'Bản ghi không còn tồn tại.');
  return row;
}
function nextId(table: TableName) {
  return String(
    rows(table).reduce((max, row) => {
      const value = row[schema[table].key];
      return typeof value === 'string' &&
        /^\d+$/.test(value) &&
        BigInt(value) > max
        ? BigInt(value)
        : max;
    }, 0n) + 1n,
  );
}
function memberIds(session: Session) {
  return session.role === 'Member'
    ? [session.memberId!]
    : session.role === 'Trainer'
      ? database()
          .MemberTrainers.filter(
            (x) => x.trainerId === session.trainerId && x.status === 'Active',
          )
          .map((x) => x.memberId)
      : database().Members.map((x) => x.memberId);
}
function enforceScope(table: TableName, row: EntityRecord) {
  const session = current();
  if (session.role === 'Admin' || session.role === 'Staff') return;
  if (row.memberId && !memberIds(session).includes(String(row.memberId)))
    throw new ApiError(403, 'Hội viên này không thuộc phạm vi của bạn.');
  if (
    table === 'WorkoutPlans' &&
    session.role === 'Trainer' &&
    row.trainerId !== session.trainerId
  )
    throw new ApiError(403, 'Giáo án không thuộc huấn luyện viên này.');
  if (table === 'Attendance')
    enforceScope('Bookings', find('Bookings', String(row.bookingId)));
  if (table === 'TrainerSchedules' && row.trainerId !== session.trainerId)
    throw new ApiError(403, 'Chỉ được sửa lịch làm việc của bạn.');
  if (table === 'WorkoutSchedules' && row.trainerId !== session.trainerId)
    throw new ApiError(403, 'Chỉ được sửa buổi tập của bạn.');
  if (table === 'Notifications' && row.userId !== session.userId)
    throw new ApiError(403, 'Thông báo không thuộc tài khoản này.');
  if (table === 'WorkoutPlanDetails') {
    const plan = find('WorkoutPlans', String(row.planId));
    enforceScope('WorkoutPlans', plan);
    if (session.role === 'Trainer' && plan.trainerId !== session.trainerId)
      throw new ApiError(403, 'Giáo án không thuộc huấn luyện viên này.');
  }
  if (table === 'AIConversationMessages')
    enforceScope(
      'AIConversations',
      find('AIConversations', String(row.conversationId)),
    );
}
function log(table: TableName, action: string, id: string) {
  database().AuditLogs.unshift(
    makeRow('AuditLogs', nextId('AuditLogs'), {
      userId: current().userId,
      action,
      entityName: table,
      entityId: /^\d+$/.test(id) ? id : null,
    }),
  );
}
function scopeData(): WorkspaceData {
  const session = current(),
    data = structuredClone(database());
  const ids = memberIds(session);
  for (const table of Object.keys(data) as TableName[]) {
    if (
      !can(session, permission(table, 'read')) &&
      !['Users', 'Members', 'Trainers', 'MemberTrainers'].includes(table)
    )
      (data[table] as unknown[]) = [];
  }
  if (session.role === 'Member' || session.role === 'Trainer') {
    for (const table of Object.keys(data) as TableName[]) {
      const collection = data[table] as unknown as EntityRecord[];
      (data[table] as unknown[]) = collection.filter(
        (row) => !row.memberId || ids.includes(String(row.memberId)),
      );
    }
    data.MemberTrainers = data.MemberTrainers.filter((x) =>
      ids.includes(x.memberId),
    );
    data.Users = data.Users.filter(
      (u) =>
        u.userId === session.userId ||
        data.Members.some((m) => m.userId === u.userId) ||
        data.Trainers.some((t) => t.userId === u.userId),
    );
    data.TrainerSchedules = data.TrainerSchedules.filter(
      (x) => session.role === 'Member' || x.trainerId === session.trainerId,
    );
  }
  data.Notifications = data.Notifications.filter(
    (x) => x.userId === session.userId,
  );
  data.WorkoutPlanDetails = data.WorkoutPlanDetails.filter((x) =>
    data.WorkoutPlans.some((p) => p.planId === x.planId),
  );
  data.AIConversationMessages = data.AIConversationMessages.filter((x) =>
    data.AIConversations.some((c) => c.conversationId === x.conversationId),
  );
  data.Attendance = data.Attendance.filter((x) =>
    data.Bookings.some((b) => b.bookingId === x.bookingId),
  );
  return data;
}
async function save<K extends TableName>(
  table: K,
  id: string | null,
  draft: Draft<K>,
  userDraft?: Draft<'Users'>,
): Promise<EntityMap[K]> {
  allowed(table, 'write');
  const before = structuredClone(database());
  try {
    const existing = id ? find(table, id) : undefined;
    if (existing) enforceScope(table, existing);
    const clean = cleanDraft(table, draft as EntityRecord);
    if (table === 'WorkoutSchedules') {
      delete clean.currentParticipants;
    }
    const merged: EntityRecord = {
      ...(existing ?? asRecord(makeRow(table, nextId(table), {}))),
      ...clean,
    };
    if (userDraft && ['Members', 'Trainers', 'Staffs'].includes(table)) {
      const userId = existing ? String(existing.userId) : nextId('Users');
      const user = {
        ...(existing
          ? find('Users', userId)
          : asRecord(makeRow('Users', userId, {}))),
        ...cleanDraft('Users', userDraft as EntityRecord),
      };
      const errors = validate('Users', user);
      if (Object.keys(errors).length)
        throw new ApiError(422, 'Kiểm tra lại thông tin tài khoản.', errors);
      uniqueUser(user, userId);
      if (existing) Object.assign(find('Users', userId), user);
      else {
        database().Users.push(user as unknown as EntityMap['Users']);
        database().UserRoles.push(
          makeRow('UserRoles', '', {
            userId,
            roleId:
              table === 'Members' ? '4' : table === 'Trainers' ? '3' : '2',
          }),
        );
      }
      merged.userId = userId;
    }
    enforceScope(table, merged);
    if (table === 'Users') uniqueUser(merged, id ?? undefined);
    const errors = validate(table, merged);
    if (Object.keys(errors).length)
      throw new ApiError(422, 'Vui lòng kiểm tra dữ liệu.', errors);
    for (const field of schema[table].fields) {
      const target = foreignTables[field.key];
      if (
        target &&
        (field.key !== schema[table].key ||
          ['UserRoles', 'RolePermissions'].includes(table)) &&
        merged[field.key] &&
        !rows(target).some(
          (row) => row[schema[target].key] === merged[field.key],
        )
      )
        throw new ApiError(422, 'Dữ liệu liên kết không còn tồn tại.');
    }
    if (
      ['UserRoles', 'RolePermissions'].includes(table) &&
      rows(table).some(
        (r) =>
          recordId(table, r) === recordId(table, merged) &&
          recordId(table, r) !== id,
      )
    )
      throw new ApiError(422, 'Phân quyền này đã tồn tại.');
    if (table === 'Bookings') {
      if (
        existing &&
        (existing.memberId !== merged.memberId ||
          existing.workoutScheduleId !== merged.workoutScheduleId)
      )
        throw new ApiError(
          422,
          'Hãy hủy và đặt lại để đổi hội viên hoặc buổi tập.',
        );
      const schedule = find(
        'WorkoutSchedules',
        String(merged.workoutScheduleId),
      );
      if (merged.status === 'Confirmed' && existing?.status !== 'Confirmed') {
        const issue = bookingError(schedule);
        if (issue) throw new ApiError(422, issue);
        if (
          rows('Bookings').some(
            (x) =>
              x.memberId === merged.memberId &&
              x.workoutScheduleId === merged.workoutScheduleId &&
              x.status === 'Confirmed',
          )
        )
          throw new ApiError(422, 'Hội viên đã đặt buổi tập này.');
        schedule.currentParticipants = Number(schedule.currentParticipants) + 1;
      } else if (
        existing?.status === 'Confirmed' &&
        merged.status === 'Canceled'
      )
        schedule.currentParticipants = Math.max(
          0,
          Number(schedule.currentParticipants) - 1,
        );
    }
    if (table === 'CheckIns' && !id) {
      if (
        rows('CheckIns').some(
          (x) => x.memberId === merged.memberId && x.status === 'CheckedIn',
        )
      )
        throw new ApiError(422, 'Hội viên đang có mặt tại phòng gym.');
      if (
        !database().MemberPackages.some(
          (x) =>
            x.memberId === merged.memberId &&
            x.status === 'Active' &&
            x.startDate <= localDate() &&
            (!x.endDate || x.endDate >= localDate()) &&
            (x.remainingSessions == null || x.remainingSessions > 0),
        )
      )
        throw new ApiError(
          422,
          'Hội viên chưa có gói tập còn hiệu lực. Vui lòng kiểm tra gói trước khi check-in.',
        );
      if (find('Members', String(merged.memberId)).status !== 'Active')
        throw new ApiError(422, 'Hội viên không ở trạng thái hoạt động.');
      merged.checkInTime = gymNow();
      merged.status = 'CheckedIn';
    }
    if (
      table === 'CheckIns' &&
      id &&
      existing?.status === 'CheckedIn' &&
      merged.status === 'CheckedOut'
    )
      merged.checkOutTime = gymNow();
    if (
      table === 'Attendance' &&
      rows('Attendance').some(
        (x) => x.bookingId === merged.bookingId && recordId(table, x) !== id,
      )
    )
      throw new ApiError(422, 'Lịch đặt này đã có bản ghi điểm danh.');
    if (table === 'Payments') {
      const pkg = find('MemberPackages', String(merged.memberPackageId));
      if (pkg.memberId !== merged.memberId)
        throw new ApiError(422, 'Gói tập không thuộc hội viên đã chọn.');
    }
    if (table === 'WorkoutResults' && merged.planId) {
      const plan = find('WorkoutPlans', String(merged.planId));
      if (plan.memberId !== merged.memberId)
        throw new ApiError(422, 'Giáo án không thuộc hội viên đã chọn.');
      if (
        !database().WorkoutPlanDetails.some(
          (x) =>
            x.planId === merged.planId && x.exerciseId === merged.exerciseId,
        )
      )
        throw new ApiError(422, 'Bài tập không có trong giáo án đã chọn.');
    }
    if (id) {
      Object.assign(existing!, merged);
      if (schema[table].fields.some((f) => f.key === 'updatedAt'))
        existing!.updatedAt = gymNow();
    } else rows(table).unshift(merged);
    log(table, id ? 'Cập nhật' : 'Thêm mới', recordId(table, merged));
    persist();
    return merged as unknown as EntityMap[K];
  } catch (error) {
    state = before;
    throw error;
  }
}
export const mockService: GymService = {
  async resetDemo() {
    state = createSeed();
    persist();
    if (typeof window !== 'undefined')
      window.localStorage.removeItem(CREDENTIALS);
    await this.logout();
  },
  async reorderPlan(planId, detailIds) {
    allowed('WorkoutPlanDetails', 'write');
    const plan = find('WorkoutPlans', planId);
    enforceScope('WorkoutPlans', plan);
    const details = database().WorkoutPlanDetails.filter(
      (d) => d.planId === planId,
    );
    if (
      new Set(detailIds).size !== details.length ||
      detailIds.length !== details.length ||
      details.some((d) => !detailIds.includes(d.planDetailId))
    )
      throw new ApiError(422, 'Danh sách sắp xếp không hợp lệ.');
    const before = structuredClone(database());
    try {
      details.forEach((d) => {
        d.orderNo = detailIds.indexOf(d.planDetailId) + 1;
      });
      log('WorkoutPlanDetails', 'Sắp xếp bài tập', planId);
      persist();
    } catch (error) {
      state = before;
      throw error;
    }
  },
  async session() {
    const raw = readStorage(SESSION);
    if (raw) {
      try {
        const saved = JSON.parse(raw) as Role | Session;
        if (
          typeof saved === 'string' &&
          ['Admin', 'Staff', 'Trainer', 'Member'].includes(saved)
        )
          return await this.demoLogin!(saved);
        if (typeof saved === 'object' && saved?.role === 'Member') {
          identity = saved;
          return current();
        }
      } catch {
        /* Invalid demo preference never grants a session. */
      }
    }
    return identity;
  },
  async login(username, password) {
    const identifier = username.trim().toLowerCase();
    const user = database().Users.find(
      (item) => item.username.toLowerCase() === identifier || item.email.toLowerCase() === identifier,
    );
    const saved = user ? credentials()[user.username.toLowerCase()] : undefined;
    if (!user || !saved || saved !== (await passwordHash(password)))
      throw new ApiError(401, 'Tên đăng nhập hoặc mật khẩu không đúng.');
    if (user.status !== 'Active')
      throw new ApiError(403, 'Tài khoản không còn hoạt động.');
    const member = database().Members.find(
      (item) => item.userId === user.userId,
    );
    if (!member) throw new ApiError(403, 'Tài khoản chưa có hồ sơ hội viên.');
    identity = {
      userId: user.userId,
      fullName: user.fullName,
      role: 'Member',
      permissions: [],
      memberId: member.memberId,
    };
    if (typeof window !== 'undefined')
      window.localStorage.setItem(SESSION, JSON.stringify(identity));
    return current();
  },
  async register(input) {
    const username = input.username.trim().toLowerCase();
    const fullName = input.fullName.trim();
    const email = input.email.trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,40}$/.test(username))
      throw new ApiError(
        422,
        'Tên đăng nhập cần 3–40 ký tự chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.',
      );
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new ApiError(422, 'Email không đúng định dạng.');
    if (fullName.length < 2)
      throw new ApiError(422, 'Vui lòng nhập họ và tên.');
    if (input.password.length < 8)
      throw new ApiError(422, 'Mật khẩu cần ít nhất 8 ký tự.');
    uniqueUser({ username, email });
    const userId = nextId('Users');
    const memberId = nextId('Members');
    database().Users.push(
      makeRow('Users', userId, {
        username,
        email,
        fullName,
        phone: input.phone?.trim() || null,
        status: 'Active',
      }),
    );
    database().Members.push(
      makeRow('Members', memberId, {
        userId,
        joinDate: localDate(),
        status: 'Active',
      }),
    );
    database().UserRoles.push(
      makeRow('UserRoles', '', { userId, roleId: '4' }),
    );
    const saved = credentials();
    saved[username] = await passwordHash(input.password);
    if (typeof window !== 'undefined')
      window.localStorage.setItem(CREDENTIALS, JSON.stringify(saved));
    persist();
    identity = {
      userId,
      fullName,
      role: 'Member',
      permissions: [],
      memberId,
    };
    if (typeof window !== 'undefined')
      window.localStorage.setItem(SESSION, JSON.stringify(identity));
    return current();
  },
  async demoLogin(role) {
    const userId = { Admin: '1', Staff: '2', Trainer: '3', Member: '10' }[role];
    const user = database().Users.find((x) => x.userId === userId)!;
    identity = {
      userId,
      fullName: user.fullName,
      role,
      permissions: [],
      ...(role === 'Member' ? { memberId: '1' } : {}),
      ...(role === 'Trainer' ? { trainerId: '1' } : {}),
    };
    if (typeof window !== 'undefined')
      window.localStorage.setItem(SESSION, JSON.stringify(role));
    return current();
  },
  async logout() {
    identity = null;
    if (typeof window !== 'undefined') window.localStorage.removeItem(SESSION);
  },
  async load(signal) {
    current();
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    return scopeData();
  },
  save,
  async remove(table, id) {
    allowed(table, 'write');
    if (
      ![
        'Packages',
        'WorkoutPlans',
        'WorkoutPlanDetails',
        'UserRoles',
        'RolePermissions',
      ].includes(table)
    )
      throw new ApiError(
        403,
        'Không hỗ trợ xóa bản ghi này. Hãy cập nhật trạng thái.',
      );
    const target = find(table, id);
    enforceScope(table, target);
    for (const [key, child] of Object.entries(foreignTables)) {
      if (
        !['UserRoles', 'RolePermissions'].includes(table) &&
        child === table &&
        Object.keys(schema).some(
          (t) =>
            t !== table &&
            rows(t as TableName).some(
              (r) => r[key] === target[schema[table].key],
            ),
        )
      )
        throw new ApiError(
          422,
          'Bản ghi đang được sử dụng. Hãy ngừng hoạt động thay vì xóa.',
        );
    }
    const before = structuredClone(database());
    try {
      (database()[table] as unknown[]) = rows(table).filter(
        (x) => recordId(table, x) !== id,
      );
      log(table, 'Xóa', id);
      persist();
    } catch (error) {
      state = before;
      throw error;
    }
  },
  async markRead(table, id) {
    allowed(table, 'write');
    const session = current();
    rows(table)
      .filter(
        (row) =>
          (!id || recordId(table, row) === id) &&
          (table === 'Notifications'
            ? row.userId === session.userId
            : session.role === 'Admin' || row.memberId === session.memberId),
      )
      .forEach((row) => {
        row.isRead = true;
      });
    persist();
  },
  async sendMessage(conversationId, message) {
    allowed('AIConversationMessages', 'write');
    const conversation = find('AIConversations', conversationId);
    enforceScope('AIConversations', conversation);
    if (!message.trim()) throw new ApiError(422, 'Vui lòng nhập tin nhắn.');
    const text = message.trim();
    database().AIConversationMessages.push(
      makeRow('AIConversationMessages', nextId('AIConversationMessages'), {
        conversationId,
        senderType: 'User',
        message: text,
      }),
    );
    const answer = answerFromDatabase(
      database(),
      String(conversation.memberId),
      text,
    );
    database().AIConversationMessages.push(
      makeRow('AIConversationMessages', nextId('AIConversationMessages'), {
        conversationId,
        senderType: 'Assistant',
        message: answer,
      }),
    );
    if (!conversation.conversationTitle)
      conversation.conversationTitle =
        text.length <= 60 ? text : `${text.slice(0, 57)}...`;
    conversation.updatedAt = gymNow();
    persist();
  },
  async profile(draft) {
    const session = current();
    const user = find('Users', session.userId);
    const safe = Object.fromEntries(
      Object.entries(draft).filter(([key]) =>
        ['fullName', 'phone', 'gender', 'dateOfBirth', 'avatarUrl'].includes(
          key,
        ),
      ),
    );
    const merged = { ...user, ...cleanDraft('Users', safe) };
    const errors = validate('Users', merged);
    if (Object.keys(errors).length)
      throw new ApiError(422, 'Kiểm tra thông tin hồ sơ.', errors);
    Object.assign(user, merged);
    identity = { ...session, fullName: String(user.fullName) };
    persist();
  },
};
