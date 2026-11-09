'use client';
import { useState } from 'react';
import Link from '@/src/routes/link';
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  CalendarDays,
  UserRound,
  Ruler,
  Weight,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/src/app/provider';
import { can, permission } from '@/src/app/permissions';
import { Badge, PageHeading, ErrorPage } from '@/src/components/common';
import { ModuleTabs } from '@/src/components/module-tabs';
import { EntityTable } from '@/src/features/resources/entity-table';
import { EntityEditor } from '@/src/features/resources/entity-form';
import { asRecord, type TableName } from '@/src/types/entities';
import { date, initials, localDate } from '@/src/utils/format';
import { statusLabels } from '@/src/features/resources/config';
export function Members() {
  const { data } = useApp();
  return (
    <>
      <PageHeading
        eyebrow="QUẢN LÝ PHÒNG TẬP"
        title="Hội viên"
        description="Mỗi hội viên, một hành trình. Đồng hành từ những bước đầu tiên."
      />
      <div className="summary-row">
        <div>
          <UserRound />
          <span>
            Tổng hội viên<strong>{data?.Members.length ?? 0}</strong>
          </span>
        </div>
        <div>
          <span className="status-dot" />
          <span>
            Đang hoạt động
            <strong>
              {data?.Members.filter((m) => m.status === 'Active').length ?? 0}
            </strong>
          </span>
        </div>
        <div>
          <CalendarDays />
          <span>
            Tham gia tháng này
            <strong>
              {data?.Members.filter(
                (m) =>
                  m.joinDate.slice(0, 7) ===
                  localDate().slice(0,7),
              ).length ?? 0}
            </strong>
          </span>
        </div>
      </div>
      <EntityTable table="Members" />
    </>
  );
}
export function MemberDetail({ id }: { id: string }) {
  const { data, session } = useApp();
  const [editing, setEditing] = useState(false);
  if (!data) return null;
  const member = data.Members.find((m) => m.memberId === id);
  if (!member) return <ErrorPage code="404" />;
  const user = data.Users.find((u) => u.userId === member.userId);
  const name = user?.fullName ?? 'Hội viên';
  const related: [TableName, string][] = [
    ['EmergencyContacts', 'Liên hệ khẩn cấp'],
    ['MemberTrainers', 'Huấn luyện viên'],
    ['MemberPackages', 'Gói tập'],
    ['Payments', 'Thanh toán'],
    ['Bookings', 'Lịch đặt'],
    ['CheckIns', 'Check-in'],
    ['WorkoutPlans', 'Giáo án'],
    ['WorkoutResults', 'Kết quả tập'],
    ['Progress', 'Tiến độ cơ thể'],
    ['AIRecommendations', 'Gợi ý AI'],
  ];
  const profile = (
    <section className="panel profile-panel">
      <div className="profile-identity">
        <span className="avatar profile-avatar">{initials(name)}</span>
        <h2>{name}</h2>
        <Badge value={member.status} />
        <div>
          <Mail size={15} />
          {user?.email ?? 'Chưa cập nhật'}
        </div>
        <div>
          <Phone size={15} />
          {user?.phone ?? 'Chưa cập nhật'}
        </div>
        <div>
          <CalendarDays size={15} />
          Tham gia {date(member.joinDate)}
        </div>
      </div>
      <div className="profile-info">
        <h2>Thông tin cá nhân</h2>
        <dl className="profile-grid">
          {[
            ['Ngày sinh', date(user?.dateOfBirth)],
            ['Giới tính', statusLabels[user?.gender ?? ''] ?? 'Chưa cập nhật'],
            [
              'Trình độ',
              statusLabels[member.fitnessLevel ?? ''] ?? 'Chưa cập nhật',
            ],
            ['Địa chỉ', member.address ?? 'Chưa cập nhật'],
            ['Mục tiêu', member.goal ?? 'Chưa cập nhật'],
            ['Ghi chú', member.notes ?? 'Chưa cập nhật'],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <div className="body-stats">
          <span>
            <Ruler />
            {member.height ?? '—'} <small>cm</small>
          </span>
          <span>
            <Weight />
            {member.weight ?? '—'} <small>kg</small>
          </span>
          <span>
            <Target />
            {statusLabels[member.fitnessLevel ?? ''] ?? '—'}
          </span>
        </div>
      </div>
    </section>
  );
  return (
    <>
      <Link className="text-link back-link" href="/members">
        <ArrowLeft size={16} />
        Danh sách hội viên
      </Link>
      <PageHeading
        title={name}
        description="Hồ sơ và hành trình tập luyện của hội viên"
      >
        {can(session, 'members.write') && (
          <Button onClick={() => setEditing(true)}>
            <Pencil size={16} />
            Chỉnh sửa hồ sơ
          </Button>
        )}
      </PageHeading>
      <ModuleTabs
        tabs={[
          { id: 'profile', title: 'Hồ sơ', content: profile },
          ...related
            .filter(([table]) => can(session, permission(table, 'read')))
            .map(([table, title]) => ({
              id: table,
              title,
              content: <EntityTable table={table} fixed={{ memberId: id }} />,
            })),
        ]}
      />
      {editing && (
        <EntityEditor
          table="Members"
          row={asRecord(member)}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}
