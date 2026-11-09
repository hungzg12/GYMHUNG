import {
  LayoutDashboard,
  Users,
  Dumbbell,
  ContactRound,
  CreditCard,
  CalendarDays,
  ScanLine,
  ClipboardList,
  ChartNoAxesCombined,
  Wrench,
  Sparkles,
  ShieldCheck,
  Bell,
  UserRound,
  HeartPulse,
  Package,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
export interface NavItem {
  path: string;
  title: string;
  icon: LucideIcon;
  permission: string;
  group: string;
}
export const navigation: NavItem[] = [
  {
    path: '/dashboard',
    title: 'Tổng quan',
    icon: LayoutDashboard,
    permission: 'dashboard.read',
    group: 'KHÔNG GIAN LÀM VIỆC',
  },
  {
    path: '/members',
    title: 'Hội viên',
    icon: Users,
    permission: 'members.read',
    group: 'QUẢN LÝ PHÒNG TẬP',
  },
  {
    path: '/trainers',
    title: 'Huấn luyện viên',
    icon: Dumbbell,
    permission: 'trainers.read',
    group: 'QUẢN LÝ PHÒNG TẬP',
  },
  {
    path: '/staff',
    title: 'Nhân viên',
    icon: ContactRound,
    permission: 'staff.read',
    group: 'QUẢN LÝ PHÒNG TẬP',
  },
  {
    path: '/packages',
    title: 'Gói tập',
    icon: Package,
    permission: 'packages.read',
    group: 'QUẢN LÝ PHÒNG TẬP',
  },
  {
    path: '/payments',
    title: 'Thanh toán',
    icon: CreditCard,
    permission: 'payments.read',
    group: 'QUẢN LÝ PHÒNG TẬP',
  },
  {
    path: '/schedules',
    title: 'Lịch tập & đặt lịch',
    icon: CalendarDays,
    permission: 'schedules.read',
    group: 'TẬP LUYỆN & VẬN HÀNH',
  },
  {
    path: '/checkins',
    title: 'Check-in & điểm danh',
    icon: ScanLine,
    permission: 'checkins.read',
    group: 'TẬP LUYỆN & VẬN HÀNH',
  },
  {
    path: '/workouts',
    title: 'Bài tập & giáo án',
    icon: ClipboardList,
    permission: 'workouts.read',
    group: 'TẬP LUYỆN & VẬN HÀNH',
  },
  {
    path: '/progress',
    title: 'Tiến độ thể chất',
    icon: ChartNoAxesCombined,
    permission: 'progress.read',
    group: 'TẬP LUYỆN & VẬN HÀNH',
  },
  {
    path: '/equipment',
    title: 'Thiết bị & bảo trì',
    icon: Wrench,
    permission: 'equipment.read',
    group: 'TẬP LUYỆN & VẬN HÀNH',
  },
  {
    path: '/ai',
    title: 'Trợ lý AI',
    icon: Sparkles,
    permission: 'ai.read',
    group: 'THÔNG MINH & HỆ THỐNG',
  },
  {
    path: '/churn',
    title: 'Dự đoán rời bỏ',
    icon: HeartPulse,
    permission: 'churn.read',
    group: 'THÔNG MINH & HỆ THỐNG',
  },
  {
    path: '/reports', title:'Báo cáo',icon:ChartNoAxesCombined,permission:'dashboard.read',group:'THÔNG MINH & HỆ THỐNG'
  },
  {
    path: '/notifications',
    title: 'Thông báo',
    icon: Bell,
    permission: 'notifications.read',
    group: 'THÔNG MINH & HỆ THỐNG',
  },
  {
    path: '/system',
    title: 'Tài khoản & phân quyền',
    icon: ShieldCheck,
    permission: 'system.read',
    group: 'THÔNG MINH & HỆ THỐNG',
  },
  {
    path: '/audit',
    title: 'Nhật ký hệ thống',
    icon: ClipboardList,
    permission: 'audit.read',
    group: 'THÔNG MINH & HỆ THỐNG',
  },
  {
    path: '/profile',
    title: 'Hồ sơ cá nhân',
    icon: UserRound,
    permission: 'profile.read',
    group: 'TÀI KHOẢN',
  },
];
export function routeInfo(path: string) {
  return navigation.find((x) =>
    x.path === '/'
      ? path === '/'
      : path === x.path || path.startsWith(x.path + '/'),
  );
}
