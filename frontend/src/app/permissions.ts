import type { TableName } from '@/src/types/entities';
export type Role = 'Admin' | 'Staff' | 'Trainer' | 'Member';
export interface Session {
  userId: string;
  fullName: string;
  role: Role;
  permissions: string[];
  memberId?: string;
  trainerId?: string;
}
export const modules = {
  Users: 'system',
  Roles: 'system',
  Permissions: 'system',
  UserRoles: 'system',
  RolePermissions: 'system',
  Members: 'members',
  EmergencyContacts: 'members',
  MemberTrainers: 'members',
  Trainers: 'trainers',
  Staffs: 'staff',
  Packages: 'packages',
  MemberPackages: 'packages',
  Payments: 'payments',
  PaymentTransactions: 'payments',
  Rooms: 'schedules',
  TrainerSchedules: 'schedules',
  WorkoutSchedules: 'schedules',
  Bookings: 'bookings',
  Attendance: 'checkins',
  CheckIns: 'checkins',
  Exercises: 'workouts',
  WorkoutPlans: 'workouts',
  WorkoutPlanDetails: 'workouts',
  WorkoutResults: 'results',
  Progress: 'progress',
  EquipmentCategories: 'equipment',
  Equipment: 'equipment',
  MaintenanceRecords: 'equipment',
  Notifications: 'notifications',
  AIConversations: 'ai',
  AIConversationMessages: 'ai',
  AIRecommendations: 'ai',
  ChurnPredictions: 'churn',
  AuditLogs: 'audit',
} as const satisfies Record<TableName, string>;
export const permission = (table: TableName, action: 'read' | 'write') =>
  `${modules[table]}.${action}`;
export const can = (session: Session | null, code: string) =>
  Boolean(session?.permissions.includes(code));
// These are DEMO policies only. Production must receive permission codes from its verified auth adapter.
const demoRead: Record<Role, string[]> = {
  Admin: [...new Set(Object.values(modules)), 'dashboard', 'profile', 'reports'],
  Staff: [
    'reports',
    'dashboard',
    'members',
    'trainers',
    'packages',
    'payments',
    'schedules',
    'bookings',
    'checkins',
    'equipment',
    'notifications',
    'profile',
  ],
  Trainer: [
    'dashboard',
    'members',
    'trainers',
    'schedules',
    'bookings',
    'workouts',
    'results',
    'progress',
    'notifications',
    'profile',
  ],
  Member: [
    'members',
    'payments',
    'checkins',
    'dashboard',
    'packages',
    'schedules',
    'bookings',
    'workouts',
    'results',
    'progress',
    'ai',
    'notifications',
    'profile',
  ],
};
const demoWrite: Record<Role, string[]> = {
  Admin: demoRead.Admin,
  Staff: [
    'reports',
    'members',
    'packages',
    'payments',
    'schedules',
    'bookings',
    'checkins',
    'equipment',
    'notifications',
    'profile',
  ],
  Trainer: [
    'schedules',
    'workouts',
    'results',
    'progress',
    'notifications',
    'profile',
  ],
  Member: ['bookings', 'results', 'progress', 'ai', 'notifications', 'profile'],
};
export const demoPermissions = (role: Role) => [
  ...demoRead[role].map((x) => `${x}.read`),
  ...demoWrite[role].map((x) => `${x}.write`),
];
export function guardDecision(
  session: Session | null,
  required?: string,
): 'login' | 'forbidden' | 'allow' {
  return !session
    ? 'login'
    : required && !can(session, required)
      ? 'forbidden'
      : 'allow';
}
