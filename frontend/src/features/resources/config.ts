import type {
  TableName,
  EntityRecord,
  WorkspaceData,
} from '@/src/types/entities';
import { asRecord } from '@/src/types/entities';
import { schema } from '@/src/types/schema';
export interface ResourceConfig {
  title: string;
  singular: string;
  columns: string[];
  filters?: string[];
  readonly?: boolean;
}
export const resources: Record<TableName, ResourceConfig> = {
  Users: {
    title: 'Tài khoản',
    singular: 'tài khoản',
    columns: ['fullName', 'email', 'phone', 'status'],
    filters: ['status'],
  },
  Roles: {
    title: 'Vai trò',
    singular: 'vai trò',
    columns: ['roleName', 'description'],
  },
  Permissions: {
    title: 'Quyền truy cập',
    singular: 'quyền',
    columns: ['permissionName', 'permissionCode', 'description'],
  },
  UserRoles: {
    title: 'Vai trò tài khoản',
    singular: 'phân vai trò',
    columns: ['userId', 'roleId', 'assignedAt'],
    filters: ['userId', 'roleId'],
  },
  RolePermissions: {
    title: 'Quyền của vai trò',
    singular: 'phân quyền',
    columns: ['roleId', 'permissionId', 'assignedAt'],
    filters: ['roleId', 'permissionId'],
  },
  Members: {
    title: 'Hội viên',
    singular: 'hội viên',
    columns: ['userId', 'fitnessLevel', 'joinDate', 'goal', 'status'],
    filters: ['status', 'fitnessLevel'],
  },
  EmergencyContacts: {
    title: 'Liên hệ khẩn cấp',
    singular: 'liên hệ',
    columns: ['fullName', 'phone', 'relationship', 'memberId'],
  },
  Trainers: {
    title: 'Huấn luyện viên',
    singular: 'huấn luyện viên',
    columns: [
      'userId',
      'specialization',
      'experienceYears',
      'rating',
      'status',
    ],
    filters: ['status'],
  },
  Staffs: {
    title: 'Nhân viên',
    singular: 'nhân viên',
    columns: ['userId', 'position', 'hireDate', 'status'],
    filters: ['status', 'position'],
  },
  MemberTrainers: {
    title: 'Huấn luyện viên phụ trách',
    singular: 'phân công',
    columns: ['memberId', 'trainerId', 'startDate', 'endDate', 'status'],
    filters: ['status'],
  },
  Packages: {
    title: 'Gói tập',
    singular: 'gói tập',
    columns: [
      'packageName',
      'durationDays',
      'totalSessions',
      'price',
      'status',
    ],
    filters: ['status'],
  },
  MemberPackages: {
    title: 'Gói của hội viên',
    singular: 'gói hội viên',
    columns: [
      'memberId',
      'packageId',
      'remainingSessions',
      'endDate',
      'price',
      'status',
    ],
    filters: ['status'],
  },
  Payments: {
    title: 'Thanh toán',
    singular: 'thanh toán',
    columns: ['memberId', 'amount', 'paymentMethod', 'paidAt', 'status'],
    filters: ['paymentMethod', 'status'],
  },
  PaymentTransactions: {
    title: 'Chi tiết giao dịch',
    singular: 'giao dịch',
    columns: [
      'paymentId',
      'provider',
      'transactionCode',
      'amount',
      'transactionStatus',
      'createdAt',
    ],
    readonly: true,
  },
  Rooms: {
    title: 'Phòng tập',
    singular: 'phòng tập',
    columns: ['roomName', 'location', 'capacity', 'status'],
    filters: ['status'],
  },
  TrainerSchedules: {
    title: 'Lịch huấn luyện viên',
    singular: 'ca làm việc',
    columns: ['trainerId', 'workDate', 'startTime', 'endTime', 'isAvailable'],
    filters: ['trainerId', 'isAvailable'],
  },
  WorkoutSchedules: {
    title: 'Lịch tập',
    singular: 'lịch tập',
    columns: [
      'title',
      'trainerId',
      'roomId',
      'scheduleDate',
      'startTime',
      'capacity',
      'status',
    ],
    filters: ['trainerId', 'roomId', 'status'],
  },
  Bookings: {
    title: 'Lịch đặt',
    singular: 'đặt lịch',
    columns: ['memberId', 'workoutScheduleId', 'bookingTime', 'status'],
    filters: ['status'],
  },
  Attendance: {
    title: 'Điểm danh buổi tập',
    singular: 'điểm danh',
    columns: ['bookingId', 'checkInTime', 'checkOutTime', 'status'],
    filters: ['status'],
  },
  CheckIns: {
    title: 'Lịch sử ra vào',
    singular: 'check-in',
    columns: [
      'memberId',
      'checkInTime',
      'checkOutTime',
      'method',
      'sourceDevice',
      'status',
    ],
    filters: ['status', 'method'],
  },
  Exercises: {
    title: 'Thư viện bài tập',
    singular: 'bài tập',
    columns: ['exerciseName', 'muscleGroup', 'description', 'status'],
    filters: ['muscleGroup', 'status'],
  },
  WorkoutPlans: {
    title: 'Giáo án',
    singular: 'giáo án',
    columns: [
      'planName',
      'memberId',
      'trainerId',
      'goal',
      'startDate',
      'status',
    ],
    filters: ['status'],
  },
  WorkoutPlanDetails: {
    title: 'Bài tập trong giáo án',
    singular: 'bài tập trong giáo án',
    columns: ['exerciseId', 'sets', 'reps', 'weight', 'restTime', 'orderNo'],
  },
  WorkoutResults: {
    title: 'Kết quả tập luyện',
    singular: 'kết quả',
    columns: [
      'memberId',
      'exerciseId',
      'planId',
      'workoutDate',
      'sets',
      'reps',
      'weight',
    ],
  },
  Progress: {
    title: 'Lịch sử số đo',
    singular: 'lần đo',
    columns: [
      'memberId',
      'recordDate',
      'weight',
      'bodyFat',
      'muscleMass',
      'waist',
    ],
  },
  EquipmentCategories: {
    title: 'Danh mục thiết bị',
    singular: 'danh mục',
    columns: ['categoryName', 'description'],
  },
  Equipment: {
    title: 'Thiết bị',
    singular: 'thiết bị',
    columns: [
      'equipmentName',
      'brand',
      'serialNumber',
      'categoryId',
      'location',
      'status',
    ],
    filters: ['categoryId', 'location', 'status'],
  },
  MaintenanceRecords: {
    title: 'Bảo trì',
    singular: 'lần bảo trì',
    columns: [
      'equipmentId',
      'staffId',
      'maintenanceDate',
      'maintenanceType',
      'cost',
      'status',
    ],
    filters: ['status', 'staffId'],
  },
  Notifications: {
    title: 'Thông báo',
    singular: 'thông báo',
    columns: ['title', 'message', 'notificationType', 'isRead', 'createdAt'],
    readonly: true,
  },
  AIConversations: {
    title: 'Cuộc trò chuyện',
    singular: 'cuộc trò chuyện',
    columns: ['conversationTitle', 'startedAt', 'status'],
  },
  AIConversationMessages: {
    title: 'Tin nhắn',
    singular: 'tin nhắn',
    columns: ['senderType', 'message', 'createdAt'],
    readonly: true,
  },
  AIRecommendations: {
    title: 'Gợi ý AI',
    singular: 'gợi ý AI',
    columns: [
      'memberId',
      'recommendationType',
      'content',
      'isRead',
      'createdAt',
    ],
    readonly: true,
  },
  ChurnPredictions: {
    title: 'Nguy cơ rời bỏ',
    singular: 'dự đoán',
    columns: [
      'memberId',
      'riskScore',
      'riskLevel',
      'factors',
      'recommendedActions',
      'predictionDate',
    ],
    filters: ['riskLevel'],
    readonly: true,
  },
  AuditLogs: {
    title: 'Nhật ký hệ thống',
    singular: 'nhật ký',
    columns: ['userId', 'action', 'entityName', 'entityId', 'createdAt'],
    filters: ['userId', 'action', 'entityName'],
    readonly: true,
  },
};
export const labels: Record<string, string> = {
  userId: 'Họ và tên',
  memberId: 'Hội viên',
  trainerId: 'Huấn luyện viên',
  staffId: 'Nhân viên thực hiện',
  roleId: 'Vai trò',
  permissionId: 'Quyền truy cập',
  packageId: 'Gói tập',
  memberPackageId: 'Gói hội viên',
  roomId: 'Phòng tập',
  exerciseId: 'Bài tập',
  planId: 'Giáo án',
  equipmentId: 'Thiết bị',
  categoryId: 'Danh mục',
  paymentId: 'Thanh toán',
  bookingId: 'Lịch đặt',
  workoutScheduleId: 'Buổi tập',
  conversationId: 'Cuộc trò chuyện',
  username: 'Tên đăng nhập',
  fullName: 'Họ và tên',
  email: 'Email',
  phone: 'Số điện thoại',
  avatarUrl: 'Ảnh đại diện (URL)',
  gender: 'Giới tính',
  dateOfBirth: 'Ngày sinh',
  status: 'Trạng thái',
  createdAt: 'Ngày tạo',
  updatedAt: 'Cập nhật lần cuối',
  assignedAt: 'Ngày gán',
  lastLoginAt: 'Đăng nhập gần nhất',
  roleName: 'Tên vai trò',
  permissionName: 'Tên quyền',
  permissionCode: 'Mã quyền',
  description: 'Mô tả',
  height: 'Chiều cao (cm)',
  weight: 'Cân nặng / mức tạ (kg)',
  goal: 'Mục tiêu',
  fitnessLevel: 'Trình độ',
  address: 'Địa chỉ',
  joinDate: 'Ngày tham gia',
  notes: 'Ghi chú',
  note: 'Ghi chú',
  relationship: 'Mối quan hệ',
  specialization: 'Chuyên môn',
  experienceYears: 'Kinh nghiệm (năm)',
  bio: 'Giới thiệu',
  certificate: 'Chứng chỉ',
  rating: 'Đánh giá',
  position: 'Chức vụ',
  hireDate: 'Ngày vào làm',
  startDate: 'Ngày bắt đầu',
  endDate: 'Ngày kết thúc',
  packageName: 'Tên gói tập',
  durationDays: 'Thời hạn (ngày)',
  totalSessions: 'Tổng số buổi',
  price: 'Giá gói',
  benefits: 'Quyền lợi',
  remainingSessions: 'Số buổi còn lại',
  amount: 'Số tiền',
  paymentMethod: 'Phương thức',
  transactionCode: 'Mã giao dịch',
  paidAt: 'Ngày thanh toán',
  provider: 'Nhà cung cấp',
  transactionStatus: 'Trạng thái giao dịch',
  roomName: 'Tên phòng',
  location: 'Vị trí',
  capacity: 'Sức chứa',
  workDate: 'Ngày làm việc',
  startTime: 'Bắt đầu',
  endTime: 'Kết thúc',
  isAvailable: 'Sẵn sàng',
  title: 'Tiêu đề',
  scheduleDate: 'Ngày tập',
  currentParticipants: 'Đã đăng ký',
  bookingTime: 'Thời gian đặt',
  checkInTime: 'Giờ vào',
  checkOutTime: 'Giờ ra',
  method: 'Phương thức',
  sourceDevice: 'Thiết bị check-in',
  exerciseName: 'Tên bài tập',
  muscleGroup: 'Nhóm cơ',
  instructions: 'Hướng dẫn thực hiện',
  videoUrl: 'Video hướng dẫn (URL)',
  imageUrl: 'Hình ảnh (URL)',
  planName: 'Tên giáo án',
  sets: 'Số hiệp',
  reps: 'Số lần / hiệp',
  restTime: 'Nghỉ giữa hiệp (giây)',
  orderNo: 'Thứ tự',
  workoutDate: 'Ngày tập',
  durationMinutes: 'Thời lượng (phút)',
  recordDate: 'Ngày đo',
  bodyFat: 'Mỡ cơ thể (%)',
  muscleMass: 'Khối lượng cơ (kg)',
  chest: 'Vòng ngực (cm)',
  waist: 'Vòng eo (cm)',
  hip: 'Vòng hông (cm)',
  categoryName: 'Tên danh mục',
  equipmentName: 'Tên thiết bị',
  brand: 'Thương hiệu',
  serialNumber: 'Số serial',
  purchaseDate: 'Ngày mua',
  maintenanceDate: 'Ngày bảo trì',
  maintenanceType: 'Loại bảo trì',
  cost: 'Chi phí',
  message: 'Nội dung',
  notificationType: 'Loại thông báo',
  isRead: 'Đã đọc',
  sentAt: 'Ngày gửi',
  conversationTitle: 'Tên cuộc trò chuyện',
  startedAt: 'Ngày bắt đầu',
  senderType: 'Người gửi',
  recommendationType: 'Loại gợi ý',
  content: 'Nội dung',
  predictionDate: 'Ngày dự đoán',
  riskScore: 'Điểm rủi ro',
  riskLevel: 'Mức rủi ro',
  factors: 'Yếu tố ảnh hưởng',
  recommendedActions: 'Hành động đề xuất',
  modelVersion: 'Phiên bản mô hình',
  action: 'Hành động',
  entityName: 'Đối tượng',
  entityId: 'Mã đối tượng',
};
export const statusLabels: Record<string, string> = {
  Active: 'Hoạt động',
  Inactive: 'Ngừng hoạt động',
  Suspended: 'Tạm khóa',
  Expired: 'Hết hạn',
  Canceled: 'Đã hủy',
  Cancelled: 'Đã hủy',
  Available: 'Còn chỗ',
  Completed: 'Hoàn tất',
  Pending: 'Chờ xử lý',
  Failed: 'Thất bại',
  Confirmed: 'Đã xác nhận',
  Present: 'Có mặt',
  Absent: 'Vắng mặt',
  CheckedIn: 'Đang có mặt',
  CheckedOut: 'Đã ra về',
  Maintenance: 'Bảo trì',
  Broken: 'Cần sửa chữa',
  High: 'Cao',
  Medium: 'Trung bình',
  Low: 'Thấp',
  Cash: 'Tiền mặt',
  VNPay: 'VNPay (Mô phỏng)',
  Momo: 'MoMo (Mô phỏng)',
  Beginner: 'Mới bắt đầu',
  Intermediate: 'Trung cấp',
  Advanced: 'Nâng cao',
  Male: 'Nam',
  Female: 'Nữ',
  Other: 'Khác',
  Manual: 'Thủ công',
  QR: 'Mã QR',
  User: 'Bạn',
  Assistant: 'Trợ lý AI',
};
const commonStatus = ['Active', 'Inactive'];
export function choices(table: TableName, key: string): string[] | undefined {
  if (key === 'fitnessLevel') return ['Beginner', 'Intermediate', 'Advanced'];
  if (key === 'gender') return ['Male', 'Female', 'Other'];
  if (key === 'paymentMethod') return ['Cash', 'VNPay', 'Momo'];
  if (key === 'riskLevel') return ['Low', 'Medium', 'High'];
  if (key === 'method') return ['Manual', 'QR'];
  if (key === 'status')
    return (
      (
        {
          Users: ['Active', 'Inactive', 'Suspended'],
          Members: ['Active', 'Inactive', 'Suspended'],
          Payments: ['Pending', 'Completed', 'Failed'],
          MemberPackages: ['Active', 'Suspended', 'Expired', 'Canceled'],
          WorkoutSchedules: ['Available', 'Completed', 'Canceled'],
          Bookings: ['Confirmed', 'Canceled'],
          CheckIns: ['CheckedIn', 'CheckedOut'],
          Attendance: ['Present', 'Absent'],
          Equipment: ['Active', 'Maintenance', 'Broken', 'Inactive'],
          MaintenanceRecords: ['Pending', 'Completed'],
        } as Partial<Record<TableName, string[]>>
      )[table] ?? commonStatus
    );
  return undefined;
}
export const foreignTables: Record<string, TableName> = {
  userId: 'Users',
  roleId: 'Roles',
  permissionId: 'Permissions',
  memberId: 'Members',
  trainerId: 'Trainers',
  staffId: 'Staffs',
  packageId: 'Packages',
  memberPackageId: 'MemberPackages',
  paymentId: 'Payments',
  roomId: 'Rooms',
  workoutScheduleId: 'WorkoutSchedules',
  bookingId: 'Bookings',
  exerciseId: 'Exercises',
  planId: 'WorkoutPlans',
  categoryId: 'EquipmentCategories',
  equipmentId: 'Equipment',
  conversationId: 'AIConversations',
};
export function recordId(table: TableName, row: EntityRecord) {
  return table === 'UserRoles'
    ? `${row.userId}:${row.roleId}`
    : table === 'RolePermissions'
      ? `${row.roleId}:${row.permissionId}`
      : String(row[schema[table].key]);
}
export function entityName(
  table: TableName,
  row: EntityRecord,
  data: WorkspaceData,
): string {
  if (['Members', 'Trainers', 'Staffs'].includes(table))
    return (
      data.Users.find((u) => u.userId === row.userId)?.fullName ??
      'Chưa có hồ sơ'
    );
  if (table === 'MemberPackages')
    return `${lookup('memberId', row.memberId, data)} · ${lookup('packageId', row.packageId, data)}`;
  if (table === 'Bookings')
    return `${lookup('memberId', row.memberId, data)} · ${lookup('workoutScheduleId', row.workoutScheduleId, data)}`;
  if (table === 'Payments')
    return `${lookup('memberId', row.memberId, data)} · ${row.transactionCode ?? 'Thanh toán'}`;
  const key = [
    'fullName',
    'roleName',
    'permissionName',
    'packageName',
    'roomName',
    'title',
    'exerciseName',
    'planName',
    'categoryName',
    'equipmentName',
    'conversationTitle',
  ].find((k) => row[k]);
  return key ? String(row[key]) : resources[table].singular;
}
export function lookup(
  key: string,
  value: unknown,
  data: WorkspaceData,
): string {
  const table = foreignTables[key];
  if (!table || !value) return '—';
  const row = data[table].find((r) => asRecord(r)[schema[table].key] === value);
  return row
    ? entityName(table, asRecord(row), data)
    : 'Không có quyền xem / chưa có dữ liệu';
}
