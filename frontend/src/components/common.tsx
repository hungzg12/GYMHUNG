'use client';
import type { ReactNode } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  Inbox,
  RefreshCw,
  ShieldAlert,
  Dumbbell,
} from 'lucide-react';
import Link from '@/src/routes/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';
import { can, guardDecision, type Session } from '@/src/app/permissions';
import { statusLabels } from '@/src/features/resources/config';
export function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark">
        <Dumbbell size={23} strokeWidth={2.5} />
      </span>
      <span>
        GYM<span className="text-lime">HUNG</span>
        <small>MANAGEMENT + AI</small>
      </span>
    </span>
  );
}
export function Badge({
  value,
}: {
  value: string | number | boolean | null | undefined;
}) {
  const text = String(value ?? '');
  const tone = [
    'Active',
    'Available',
    'Completed',
    'Confirmed',
    'Present',
    'CheckedIn',
    'Low',
  ].includes(text)
    ? 'good'
    : ['Pending', 'Maintenance', 'Medium'].includes(text)
      ? 'warn'
      : ['Failed', 'Broken', 'High', 'Suspended'].includes(text)
        ? 'bad'
        : 'neutral';
  return (
    <span className={`status ${tone}`}>
      <span />
      {statusLabels[text] ?? text ?? '—'}
    </span>
  );
}
export function Loading() {
  return (
    <output className="loading-grid" aria-label="Đang tải dữ liệu">
      <Skeleton className="h-10 w-60" />
      <div className="stats-grid">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
      <span className="sr-only">Đang tải dữ liệu…</span>
    </output>
  );
}
export function EmptyState({
  title = 'Chưa có dữ liệu',
  description = 'Dữ liệu sẽ xuất hiện tại đây khi được thêm vào hệ thống.',
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Empty className="empty-state">
      <EmptyHeader>
        <Inbox size={32} />
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action}
    </Empty>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle size={32} />
      <h2>Không tải được dữ liệu</h2>
      <p>{message}</p>
      <Button variant="outline" onClick={retry}>
        <RefreshCw size={16} />
        Thử lại
      </Button>
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
export function SectionHead({
  title,
  description,
  href,
  children,
}: {
  title: string;
  description?: string;
  href?: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {href ? (
        <Link className="text-link" href={href}>
          Xem tất cả <ArrowUpRight size={15} />
        </Link>
      ) : (
        children
      )}
    </div>
  );
}
export function PermissionGuard({
  session,
  code,
  children,
}: {
  session: Session | null;
  code: string;
  children: ReactNode;
}) {
  return can(session, code) ? children : null;
}
export function ProtectedContent({
  session,
  required,
  children,
  login,
}: {
  session: Session | null;
  required?: string;
  children: ReactNode;
  login: ReactNode;
}) {
  const result = guardDecision(session, required);
  return result === 'login' ? (
    login
  ) : result === 'forbidden' ? (
    <ErrorPage code="403" />
  ) : (
    children
  );
}
export function ErrorPage({ code }: { code: '403' | '404' }) {
  return (
    <div className="error-page">
      <ShieldAlert size={44} />
      <p className="error-code">{code}</p>
      <h1>
        {code === '403' ? 'Bạn chưa có quyền truy cập' : 'Không tìm thấy trang'}
      </h1>
      <p className="muted">
        {code === '403'
          ? 'Liên hệ quản trị viên để được cấp quyền phù hợp.'
          : 'Đường dẫn có thể đã thay đổi hoặc không còn tồn tại.'}
      </p>
      <Link href="/dashboard" className="button-primary">
        Về trang tổng quan
      </Link>
    </div>
  );
}
