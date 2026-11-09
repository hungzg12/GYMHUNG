import type {
  Draft,
  EntityMap,
  TableName,
  WorkspaceData,
  EntityRecord,
} from '@/src/types/entities';
import { schema } from '@/src/types/schema';
import { demoPermissions, type Role } from '@/src/app/permissions';
const seedLocalDate = (value = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(value);
const seedOffsetDate = (days: number) => seedLocalDate(new Date(Date.now() + days * 86400000));
// Synthetic fixtures, exclusively imported by the explicit demo adapter.
export function makeRow<K extends TableName>(
  table: K,
  id: string,
  values: Draft<K>,
): EntityMap[K] {
  const now = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date()).replace(' ', 'T');
  const row: EntityRecord = {};
  for (const field of schema[table].fields) {
    row[field.key] =
      field.readonly && field.type === 'id'
        ? id
        : field.nullable
          ? null
          : field.type === 'number'
            ? 0
            : field.type === 'boolean'
              ? false
              : field.type === 'date'
                ? seedLocalDate()
                : field.type === 'datetime2'
                  ? now
                  : field.type === 'time'
                    ? '09:00'
                    : ' ';
  }
  if ('status' in row) row.status = 'Active';
  return { ...row, ...values } as unknown as EntityMap[K];
}
export function createSeed(): WorkspaceData {
  const data = Object.fromEntries(
    Object.keys(schema).map((key) => [key, []]),
  ) as unknown as WorkspaceData;
  const add = <K extends TableName>(table: K, id: string, values: Draft<K>) => {
    const row = makeRow(table, id, values);
    (data[table] as EntityMap[K][]).push(row);
    return row;
  };
  const roles: Role[] = ['Admin', 'Staff', 'Trainer', 'Member'];
  roles.forEach((role, i) =>
    add('Roles', String(i + 1), {
      roleName: role,
      description: {
        Admin: 'Quản trị hệ thống',
        Staff: 'Vận hành phòng tập',
        Trainer: 'Huấn luyện viên cá nhân',
        Member: 'Hội viên',
      }[role],
    }),
  );
  const allPermissions = demoPermissions('Admin');
  allPermissions.forEach((code, i) =>
    add('Permissions', String(i + 1), {
      permissionCode: code,
      permissionName: code.endsWith('.read')
        ? `Xem ${code.split('.')[0]}`
        : `Thao tác ${code.split('.')[0]}`,
    }),
  );
  roles.forEach((role, i) =>
    demoPermissions(role).forEach((code) =>
      add('RolePermissions', '', {
        roleId: String(i + 1),
        permissionId: String(allPermissions.indexOf(code) + 1),
      }),
    ),
  );
  add('Users', '1', {
    username: 'demo.admin',
    fullName: 'Nguyễn Hoàng Hưng',
    email: 'admin@example.com',
    phone: '0901234567',
  });
  add('Users', '2', {
    username: 'demo.staff',
    fullName: 'Lê Thu Hà',
    email: 'staff@example.com',
    phone: '0902234567',
  });
  add('Staffs', '1', {
    userId: '2',
    position: 'Quản lý vận hành',
    hireDate: seedOffsetDate(-180),
  });
  add('UserRoles', '', { userId: '1', roleId: '1' });
  add('UserRoles', '', { userId: '2', roleId: '2' });
  ['Phạm Thị Hạnh', 'Võ Quốc Dũng'].forEach((fullName, i) => {
    const userId = String(8 + i);
    add('Users', userId, { username: `demo.staff${i + 2}`, fullName, email: `staff${i + 2}@example.com`, phone: `090223457${i}` });
    add('Staffs', String(i + 2), { userId, position: ['Lễ tân', 'Kỹ thuật viên'][i], hireDate: seedOffsetDate(-90) });
    add('UserRoles', '', { userId, roleId: '2' });
  });
  const trainerNames = [
    'Trần Minh Đức',
    'Nguyễn Khánh Linh',
    'Phạm Quốc Bảo',
    'Lê Ngọc Anh',
    'Võ Thành Phúc',
  ];
  trainerNames.forEach((fullName, i) => {
    add('Users', String(i + 3), {
      username: `demo.trainer${i}`,
      fullName,
      email: `trainer${i}@example.com`,
      phone: `090333440${i}`,
    });
    add('Trainers', String(i + 1), {
      userId: String(i + 3),
      specialization: [
        'Strength & Conditioning',
        'Yoga · Pilates',
        'Bodybuilding · Functional',
        'Cardio · Giảm mỡ',
        'Phục hồi · Linh hoạt',
      ][i],
      experienceYears: 4 + i,
      rating: 4.5 + i * 0.1,
      certificate: 'Chứng chỉ huấn luyện cá nhân (minh họa)',
      bio: 'Đồng hành cùng hội viên xây dựng thói quen vận động.',
    });
    add('UserRoles', '', { userId: String(i + 3), roleId: '3' });
  });
  const names = [
    'Nguyễn Minh Anh',
    'Trần Hoàng Nam',
    'Lê Bảo Ngọc',
    'Phạm Tuấn Kiệt',
    'Vũ Thu Hương',
    'Đỗ Thành Đạt',
    'Bùi Khánh Vy',
    'Ngô Minh Quân',
    'Đặng Ngọc Hà',
    'Hoàng Đức Anh',
    'Nguyễn Thảo My',
    'Trần Gia Huy',
    'Lê Phương Linh',
    'Phạm Hải Đăng',
    'Vũ Ngọc Mai',
    'Đỗ Quang Huy',
    'Bùi Thanh Tâm',
    'Ngô Việt Anh',
    'Đặng Minh Châu',
    'Hoàng Nhật Minh',
    'Nguyễn Thanh Trúc',
    'Trần Bảo Long',
    'Lê Hồng Nhung',
    'Phạm Anh Khoa',
    'Võ Minh Tâm',
    'Đinh Ngọc Lan',
    'Mai Quốc Việt',
    'Hồ Mỹ Duyên',
    'Trịnh Đức Hải',
    'Cao Thanh Hằng',
    'Nguyễn Hoài Nam',
    'Phan Gia Linh',
    'Lý Minh Khang',
    'Đoàn Thùy Trang',
    'Huỳnh Quốc Việt',
    'Tạ Ngọc Diệp',
  ];
  names.forEach((fullName, i) => {
    const id = String(i + 1),
      userId = String(i + 10);
    add('Users', userId, {
      username: `demo.member${i}`,
      fullName,
      email: `member${i + 1}@example.com`,
      phone: `090${String(1234500 + i)}`,
      gender: i % 2 ? 'Male' : 'Female',
      dateOfBirth: `${1992 + (i % 10)}-05-12`,
    });
    add('UserRoles', '', { userId, roleId: '4' });
    add('Members', id, {
      userId,
      height: 160 + (i % 22),
      weight: 55 + (i % 27),
      goal: [
        'Tăng cơ · Cải thiện sức bền',
        'Giảm mỡ · Duy trì vóc dáng',
        'Sức khỏe · Vận động đều đặn',
      ][i % 3],
      fitnessLevel: ['Beginner', 'Intermediate', 'Advanced'][i % 3],
      joinDate: seedOffsetDate(-i * 8),
      address: 'TP. Hồ Chí Minh',
      status:
        i === 7 || i === 17 ? 'Inactive' : i === 22 ? 'Suspended' : 'Active',
    });
    add('MemberTrainers', id, {
      memberId: id,
      trainerId: String((i % 5) + 1),
      startDate: seedOffsetDate(-30),
    });
  });
  add('EmergencyContacts', '1', {
    memberId: '1',
    fullName: 'Nguyễn Văn Minh',
    phone: '0905556677',
    relationship: 'Anh trai',
  });
  [
    [
      'GYM BASIC',
      30,
      20,
      590000,
      'Khu tập tự do\nTủ đồ cá nhân\nĐánh giá thể chất ban đầu',
    ],
    [
      'GYM PLUS',
      90,
      60,
      1590000,
      'Toàn bộ quyền lợi Basic\nLớp tập nhóm không giới hạn\n01 buổi tư vấn với PT',
    ],
    [
      'PERSONAL TRAINING',
      90,
      24,
      6990000,
      '24 buổi tập cùng PT\nGiáo án cá nhân\nTheo dõi tiến độ định kỳ',
    ],
    ['GYM YEAR', 365, null, 5490000, 'Tập tự do cả năm'],
    ['YOGA FLEX', null, 20, 1890000, '20 buổi Yoga; không giới hạn ngày'],
    ['DAY PASS', 1, 1, 99000, 'Một ngày trải nghiệm'],
  ].forEach(([packageName, durationDays, totalSessions, price, benefits], i) =>
    add('Packages', String(i + 1), {
      packageName: String(packageName),
      durationDays: durationDays === null ? null : Number(durationDays),
      totalSessions: totalSessions === null ? null : Number(totalSessions),
      price: Number(price),
      benefits: String(benefits),
      description: [
        'Khởi đầu thói quen khỏe mạnh',
        'Bền bỉ cùng mục tiêu của bạn',
        'Tập luyện theo lộ trình riêng',
      ][i % 3],
    }),
  );
  data.Members.forEach((member, i) => {
    const pkg = data.Packages[i % 6];
    const id = member.memberId;
    add('MemberPackages', id, {
      memberId: id,
      packageId: pkg.packageId,
      startDate: seedOffsetDate(pkg.durationDays === 1 ? 0 : -15),
      endDate: pkg.durationDays === null ? null : seedOffsetDate(i === 7 ? -2 : i % 5 === 0 ? 5 : pkg.durationDays === 1 ? 1 : Number(pkg.durationDays) - 15),
      price: pkg.price,
      remainingSessions: pkg.totalSessions === null ? null : i === 7 ? 0 : Math.max(0, Number(pkg.totalSessions) - 3),
      status: i === 7 ? 'Expired' : 'Active',
    });
    add('Payments', id, {
      memberId: id,
      memberPackageId: id,
      amount: pkg.price,
      paymentMethod: ['Cash', 'VNPay', 'Momo'][i % 3],
      transactionCode: `DEMO-${String(i + 1).padStart(5, '0')}`,
      paidAt: i % 6 === 0 ? null : `${seedOffsetDate(-i * 3)}T10:30:00`,
      status: i % 6 === 0 ? 'Pending' : 'Completed',
    });
  });
  // Historical records make charts aggregate actual fixture records rather than hard-coded chart totals.
  for (let i = 0; i < 42; i++)
    add('Payments', String(100 + i), {
      memberId: String((i % data.Members.length) + 1),
      memberPackageId: String((i % data.Members.length) + 1),
      amount: 590000 + (i % 5) * 500000,
      paymentMethod: ['Cash', 'VNPay', 'Momo'][i % 3],
      status: 'Completed',
      paidAt: `${seedOffsetDate(-i * 4)}T12:00:00`,
      transactionCode: `DEMO-H${i}`,
    });
  add('PaymentTransactions', '1', {
    paymentId: '2',
    provider: 'VNPay',
    transactionCode: 'DEMO-00002',
    amount: 1590000,
    transactionStatus: 'Completed',
  });
  ['Studio A', 'Strength Zone', 'Yoga Studio'].forEach((roomName, i) =>
    add('Rooms', String(i + 1), {
      roomName,
      location: `Tầng ${i + 1}`,
      capacity: 20 + i * 5,
    }),
  );
  const classes = [
    'Full Body Strength',
    'Yoga Flow',
    'HIIT & Core',
    'Upper Body Power',
    'Pilates Foundation',
    'Functional Training',
  ];
  for (let day = -2; day < 16; day++)
    for (let slot = 0; slot < 3; slot++) {
      const id = String((day + 2) * 3 + slot + 1);
      add('WorkoutSchedules', id, {
        title: classes[(day + 8 + slot) % 6],
        trainerId: String((slot % 5) + 1),
        roomId: String(slot + 1),
        scheduleDate: seedOffsetDate(day),
        startTime: ['07:00', '16:30', '18:00'][slot],
        endTime: ['08:00', '17:30', '19:00'][slot],
        capacity: 12,
        currentParticipants: 0,
        status: day < 0 ? 'Completed' : 'Available',
      });
    }
  data.WorkoutSchedules.forEach((schedule, i) => {
    for (let j = 0; j < (i % 9) + 2; j++) {
      add('Bookings', String(i * 12 + j + 1), {
        memberId: String(((i + j) % data.Members.length) + 1),
        workoutScheduleId: schedule.workoutScheduleId,
        status: 'Confirmed',
        bookingTime: `${seedOffsetDate(-3)}T06:00:00`,
      });
      schedule.currentParticipants++;
    }
  });
  for (let i = 0; i < 5; i++)
    for (let d = 0; d < 7; d++)
      add('TrainerSchedules', String(i * 7 + d + 1), {
        trainerId: String(i + 1),
        workDate: seedOffsetDate(d),
        startTime: '06:00',
        endTime: '20:00',
        isAvailable: true,
      });
  for (let i = 0; i < 80; i++)
    add('CheckIns', String(i + 1), {
      memberId: String((i % data.Members.length) + 1),
      checkInTime: `${seedOffsetDate(-Math.floor(i / 8))}T${String(7 + (i % 12)).padStart(2, '0')}:15:00`,
      checkOutTime:
        i < 5
          ? null
          : `${seedOffsetDate(-Math.floor(i / 8))}T${String(8 + (i % 12)).padStart(2, '0')}:30:00`,
      method: i % 2 ? 'QR' : 'Manual',
      sourceDevice: 'Lễ tân · Demo',
      status: i < 5 ? 'CheckedIn' : 'CheckedOut',
    });
  const exercises = [
    [
      'Barbell Squat',
      'Chân',
      'Giữ lưng trung lập, hạ người trong tầm kiểm soát.',
    ],
    ['Bench Press', 'Ngực', 'Ổn định vai và kiểm soát chuyển động.'],
    ['Lat Pulldown', 'Lưng', 'Kéo thanh về phía ngực trên, tránh giật người.'],
    ['Dumbbell Shoulder Press', 'Vai', 'Kiểm soát tạ trong toàn bộ biên độ.'],
    ['Plank', 'Core', 'Giữ thân người thẳng và thở đều.'],
    ['Romanian Deadlift', 'Chân', 'Gập tại hông, giữ tạ sát cơ thể.'],
    ...[['Leg Press', 'Chân'], ['Lunges', 'Chân'], ['Hip Thrust', 'Mông'], ['Calf Raise', 'Chân'], ['Seated Row', 'Lưng'], ['Pull Up', 'Lưng'], ['Chest Fly', 'Ngực'], ['Push Up', 'Ngực'], ['Lateral Raise', 'Vai'], ['Face Pull', 'Vai'], ['Biceps Curl', 'Tay'], ['Triceps Pushdown', 'Tay'], ['Dead Bug', 'Core'], ['Bird Dog', 'Core']].map(([name, group]) => [name, group, 'Thực hiện có kiểm soát, thở đều; điều chỉnh mức tạ cùng PT.']),
  ];
  exercises.forEach(([exerciseName, muscleGroup, instructions], i) =>
    add('Exercises', String(i + 1), {
      exerciseName,
      muscleGroup,
      instructions,
      description:
        'Tham khảo hướng dẫn và trao đổi với huấn luyện viên để điều chỉnh kỹ thuật.',
    }),
  );
  for (let i = 0; i < 6; i++) {
    add('WorkoutPlans', String(i + 1), {
      memberId: String(i + 1),
      trainerId: String((i % 5) + 1),
      planName: ['Xây nền thể lực', 'Tăng cơ toàn thân', 'Sức bền & linh hoạt'][
        i % 3
      ],
      goal: 'Tập đều đặn 3 buổi / tuần',
      startDate: seedOffsetDate(-14),
      endDate: seedOffsetDate(45),
    });
    for (let j = 0; j < 4; j++)
      add('WorkoutPlanDetails', String(i * 4 + j + 1), {
        planId: String(i + 1),
        exerciseId: String(j + 1),
        sets: 3,
        reps: 12,
        weight: j === 3 ? 8 : 20,
        restTime: 60,
        orderNo: j + 1,
      });
  }
  for (let i = 0; i < 6; i++) {
    add('WorkoutResults', String(i + 1), {
      memberId: '1',
      exerciseId: String((i % 5) + 1),
      planId: '1',
      workoutDate: seedOffsetDate(-i * 3),
      sets: 3,
      reps: 12,
      weight: 20,
      durationMinutes: 15,
    });
    add('Progress', String(i + 1), {
      memberId: '1',
      recordDate: seedOffsetDate(-35 + i * 7),
      weight: 63 - i * 0.4,
      bodyFat: 25 - i * 0.5,
      muscleMass: 26 + i * 0.2,
      chest: 86,
      waist: 73 - i * 0.5,
      hip: 93,
    });
  }
  ['Cardio', 'Sức mạnh', 'Phụ kiện'].forEach((categoryName, i) =>
    add('EquipmentCategories', String(i + 1), { categoryName }),
  );
  [
    'Máy chạy bộ T-01',
    'Máy chạy bộ T-02',
    'Giàn tập đa năng',
    'Máy đạp chân',
    'Bộ tạ đơn 2–30kg',
    'Xe đạp thể lực',
    'Máy kéo xô',
    'Ghế tập điều chỉnh',
  ].forEach((equipmentName, i) =>
    add('Equipment', String(i + 1), {
      equipmentName,
      categoryId: String((i % 3) + 1),
      brand: ['Technogym', 'Life Fitness', 'Impulse'][i % 3],
      serialNumber: `DEMO-EQ-${100 + i}`,
      location: i % 2 ? 'Tầng 2' : 'Tầng 1',
      purchaseDate: seedOffsetDate(-220),
      status: i === 1 ? 'Maintenance' : i === 5 ? 'Broken' : 'Active',
    }),
  );
  add('MaintenanceRecords', '1', {
    equipmentId: '2',
    staffId: '1',
    maintenanceDate: seedOffsetDate(-1),
    maintenanceType: 'Kiểm tra dây curoa',
    description: 'Bảo dưỡng theo lịch',
    cost: 450000,
    status: 'Pending',
  });
  add('MaintenanceRecords', '2', {
    equipmentId: '1',
    staffId: '1',
    maintenanceDate: seedOffsetDate(-30),
    maintenanceType: 'Bảo dưỡng định kỳ',
    cost: 300000,
    status: 'Completed',
  });
  const notices = [
    [
      'Chào mừng đến GymHưng',
      'Bắt đầu ngày mới bằng việc kiểm tra lịch tập hôm nay.',
      'System',
    ],
    [
      'Gói tập sắp hết hạn',
      'Kiểm tra danh sách gói tập và lên kế hoạch gia hạn.',
      'Package',
    ],
    [
      'Lịch bảo trì thiết bị',
      'Máy chạy bộ T-02 đang chờ bảo trì.',
      'Equipment',
    ],
  ];
  ['1', '2', '3', '10'].forEach((userId, n) =>
    notices.forEach(([title, message, notificationType], i) =>
      add('Notifications', String(n * 3 + i + 1), {
        userId,
        title,
        message,
        notificationType,
        isRead: i === 0,
        sentAt: `${seedLocalDate()}T09:00:00`,
      }),
    ),
  );
  add('AIConversations', '1', {
    memberId: '1',
    conversationTitle: 'Kế hoạch tập luyện của tôi',
  });
  add('AIConversationMessages', '1', {
    conversationId: '1',
    senderType: 'User',
    message: 'Tôi muốn xem gợi ý cho lịch tập tuần này.',
  });
  add('AIConversationMessages', '2', {
    conversationId: '1',
    senderType: 'Assistant',
    message:
      'Chào bạn! Tôi có thể đọc dữ liệu phòng gym để trả lời về lịch tập, PT phụ trách, gói tập, tiến độ, giáo án và dinh dưỡng. Bạn muốn kiểm tra nội dung nào?',
  });
  add('AIRecommendations', '1', {
    memberId: '1',
    recommendationType: 'Workout',
    content:
      'Bản ghi minh họa: thảo luận cùng huấn luyện viên về mục tiêu của tuần tới.',
    isRead: false,
  });
  [7, 17, 22].forEach((m, i) =>
    add('ChurnPredictions', String(i + 1), {
      memberId: String(m + 1),
      predictionDate: `${seedLocalDate()}T09:00:00`,
      riskScore: [82, 64, 91][i],
      riskLevel: i === 1 ? 'Medium' : 'High',
      factors:
        'Dữ liệu minh họa · Tần suất đến phòng tập giảm; gói tập gần hết hạn.',
      recommendedActions:
        'Trao đổi với hội viên để tìm hiểu nhu cầu và lịch tập phù hợp.',
      modelVersion: 'demo-rules-v1' ,
    }),
  );
  [
    'Thêm hội viên',
    'Cập nhật gói tập',
    'Tạo lịch tập',
    'Ghi nhận thanh toán',
    'Check-in',
  ].forEach((action, i) =>
    add('AuditLogs', String(i + 1), {
      userId: i % 2 ? '2' : '1',
      action,
      entityName: [
        'Members',
        'MemberPackages',
        'WorkoutSchedules',
        'Payments',
        'CheckIns',
      ][i],
      entityId: '1',
      createdAt: `${seedLocalDate()}T${String(8 + i).padStart(2, '0')}:30:00`,
    }),
  );
  data.Bookings.filter((b) => data.WorkoutSchedules.find((s) => s.workoutScheduleId === b.workoutScheduleId)?.status === 'Completed').forEach((booking, i) => {
    const schedule = data.WorkoutSchedules.find((s) => s.workoutScheduleId === booking.workoutScheduleId)!;
    add('Attendance', String(i + 1), { bookingId: booking.bookingId, checkInTime: `${schedule.scheduleDate}T${schedule.startTime}:00`, checkOutTime: `${schedule.scheduleDate}T${schedule.endTime}:00`, status: 'Present' });
  });
  return data;
}
