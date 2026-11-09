// Generated from the checked-in SQL schema; sensitive columns are intentionally excluded.
export type Id = string;
export type DecimalValue = string | number;
export type Scalar = string | number | boolean | null | undefined;
export type EntityRecord = Record<string, Scalar>;
export interface Roles {
  roleId: Id;
  roleName: string;
  description?: string | null;
  createdAt: string;
}
export interface Permissions {
  permissionId: Id;
  permissionCode: string;
  permissionName: string;
  description?: string | null;
  createdAt: string;
}
export interface Users {
  userId: Id;
  username: string;
  email: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  status: string;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}
export interface UserRoles {
  userId: Id;
  roleId: Id;
  assignedAt: string;
}
export interface RolePermissions {
  roleId: Id;
  permissionId: Id;
  assignedAt: string;
}
export interface Members {
  memberId: Id;
  userId: Id;
  height?: number | null;
  weight?: number | null;
  goal?: string | null;
  fitnessLevel?: string | null;
  address?: string | null;
  joinDate: string;
  status: string;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}
export interface EmergencyContacts {
  contactId: Id;
  memberId: Id;
  fullName: string;
  phone: string;
  relationship?: string | null;
  notes?: string | null;
}
export interface Trainers {
  trainerId: Id;
  userId: Id;
  specialization?: string | null;
  experienceYears?: number | null;
  bio?: string | null;
  certificate?: string | null;
  rating?: number | null;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
}
export interface Staffs {
  staffId: Id;
  userId: Id;
  position?: string | null;
  hireDate?: string | null;
  notes?: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
}
export interface MemberTrainers {
  memberTrainerId: Id;
  memberId: Id;
  trainerId: Id;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  note?: string | null;
  createdAt: string;
}
export interface Packages {
  packageId: Id;
  packageName: string;
  description?: string | null;
  durationDays?: number | null;
  totalSessions?: number | null;
  price: DecimalValue;
  benefits?: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
}
export interface MemberPackages {
  memberPackageId: Id;
  memberId: Id;
  packageId: Id;
  startDate: string;
  endDate?: string | null;
  price: DecimalValue;
  remainingSessions?: number | null;
  status: string;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}
export interface Payments {
  paymentId: Id;
  memberPackageId: Id;
  memberId: Id;
  amount: DecimalValue;
  paymentMethod?: string | null;
  transactionCode?: string | null;
  paidAt?: string | null;
  status: string;
  provider?: string | null;
  notes?: string | null;
  createdAt: string;
}
export interface PaymentTransactions {
  paymentTransactionId: Id;
  paymentId: Id;
  provider: string;
  transactionCode?: string | null;
  amount?: DecimalValue | null;
  transactionStatus?: string | null;
  createdAt: string;
}
export interface Rooms {
  roomId: Id;
  roomName: string;
  location?: string | null;
  capacity?: number | null;
  status: string;
  description?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}
export interface TrainerSchedules {
  trainerScheduleId: Id;
  trainerId: Id;
  workDate: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  note?: string | null;
  createdAt: string;
}
export interface WorkoutSchedules {
  workoutScheduleId: Id;
  trainerId: Id;
  roomId?: Id | null;
  planId?: Id | null;
  title?: string | null;
  scheduleDate: string;
  startTime: string;
  endTime: string;
  capacity?: number | null;
  currentParticipants: number;
  location?: string | null;
  status: string;
  note?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}
export interface Bookings {
  bookingId: Id;
  memberId: Id;
  workoutScheduleId: Id;
  bookingTime: string;
  status: string;
  note?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}
export interface Attendance {
  attendanceId: Id;
  bookingId: Id;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  status: string;
  note?: string | null;
  createdAt: string;
}
export interface CheckIns {
  checkInId: Id;
  memberId: Id;
  checkInTime: string;
  checkOutTime?: string | null;
  method?: string | null;
  sourceDevice?: string | null;
  status: string;
  note?: string | null;
  createdAt: string;
}
export interface Exercises {
  exerciseId: Id;
  exerciseName: string;
  muscleGroup?: string | null;
  description?: string | null;
  instructions?: string | null;
  videoUrl?: string | null;
  imageUrl?: string | null;
  status: string;
  createdAt: string;
}
export interface WorkoutPlans {
  planId: Id;
  memberId: Id;
  trainerId?: Id | null;
  planName: string;
  goal?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  note?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}
export interface WorkoutPlanDetails {
  planDetailId: Id;
  planId: Id;
  exerciseId: Id;
  sets?: number | null;
  reps?: number | null;
  weight?: number | null;
  restTime?: number | null;
  orderNo?: number | null;
  note?: string | null;
  createdAt: string;
}
export interface WorkoutResults {
  resultId: Id;
  memberId: Id;
  exerciseId: Id;
  planId?: Id | null;
  workoutDate: string;
  sets?: number | null;
  reps?: number | null;
  weight?: number | null;
  durationMinutes?: number | null;
  note?: string | null;
  createdAt: string;
}
export interface Progress {
  progressId: Id;
  memberId: Id;
  recordDate: string;
  bodyFat?: number | null;
  weight?: number | null;
  muscleMass?: number | null;
  chest?: number | null;
  waist?: number | null;
  hip?: number | null;
  note?: string | null;
  createdAt: string;
}
export interface EquipmentCategories {
  categoryId: Id;
  categoryName: string;
  description?: string | null;
  createdAt: string;
}
export interface Equipment {
  equipmentId: Id;
  categoryId?: Id | null;
  equipmentName: string;
  brand?: string | null;
  serialNumber?: string | null;
  location?: string | null;
  purchaseDate?: string | null;
  status: string;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}
export interface MaintenanceRecords {
  maintenanceId: Id;
  equipmentId: Id;
  staffId?: Id | null;
  maintenanceDate: string;
  maintenanceType?: string | null;
  description?: string | null;
  cost?: DecimalValue | null;
  status: string;
  createdAt: string;
}
export interface Notifications {
  notificationId: Id;
  userId: Id;
  title: string;
  message: string;
  notificationType?: string | null;
  isRead: boolean;
  sentAt?: string | null;
  createdAt: string;
}
export interface AIConversations {
  conversationId: Id;
  memberId: Id;
  conversationTitle?: string | null;
  startedAt: string;
  updatedAt?: string | null;
  status: string;
}
export interface AIConversationMessages {
  messageId: Id;
  conversationId: Id;
  senderType: string;
  message: string;
  createdAt: string;
}
export interface AIRecommendations {
  recommendationId: Id;
  memberId: Id;
  recommendationType: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}
export interface ChurnPredictions {
  churnPredictionId: Id;
  memberId: Id;
  predictionDate: string;
  riskScore?: number | null;
  riskLevel?: string | null;
  factors?: string | null;
  recommendedActions?: string | null;
  modelVersion?: string | null;
  createdAt: string;
}
export interface AuditLogs {
  auditLogId: Id;
  userId?: Id | null;
  action: string;
  entityName?: string | null;
  entityId?: Id | null;
  createdAt: string;
}
export interface EntityMap {
  Roles: Roles;
  Permissions: Permissions;
  Users: Users;
  UserRoles: UserRoles;
  RolePermissions: RolePermissions;
  Members: Members;
  EmergencyContacts: EmergencyContacts;
  Trainers: Trainers;
  Staffs: Staffs;
  MemberTrainers: MemberTrainers;
  Packages: Packages;
  MemberPackages: MemberPackages;
  Payments: Payments;
  PaymentTransactions: PaymentTransactions;
  Rooms: Rooms;
  TrainerSchedules: TrainerSchedules;
  WorkoutSchedules: WorkoutSchedules;
  Bookings: Bookings;
  Attendance: Attendance;
  CheckIns: CheckIns;
  Exercises: Exercises;
  WorkoutPlans: WorkoutPlans;
  WorkoutPlanDetails: WorkoutPlanDetails;
  WorkoutResults: WorkoutResults;
  Progress: Progress;
  EquipmentCategories: EquipmentCategories;
  Equipment: Equipment;
  MaintenanceRecords: MaintenanceRecords;
  Notifications: Notifications;
  AIConversations: AIConversations;
  AIConversationMessages: AIConversationMessages;
  AIRecommendations: AIRecommendations;
  ChurnPredictions: ChurnPredictions;
  AuditLogs: AuditLogs;
}
export type TableName = keyof EntityMap;
export type WorkspaceData = { [K in TableName]: EntityMap[K][] };
/**
 * Forms represent cleared numeric fields as an empty string until the service
 * normalizes them to null. Keep persisted entity types strict while allowing
 * that temporary form value in drafts.
 */
type DraftValue<T> = T extends number | null | undefined ? T | '' : T;
export type Draft<K extends TableName> = Partial<{
  [P in keyof EntityMap[K]]: DraftValue<EntityMap[K][P]>;
}>;
export const asRecord = (value: object): EntityRecord => value as EntityRecord;
