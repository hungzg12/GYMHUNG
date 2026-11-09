'use client';
import { useState } from 'react';
import { Search, ScanLine, LogOut, Users, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useApp } from '@/src/app/provider';
import { can } from '@/src/app/permissions';
import { PageHeading, SectionHead, EmptyState } from '@/src/components/common';
import { ModuleTabs } from '@/src/components/module-tabs';
import { EntityTable } from '@/src/features/resources/entity-table';
import { fold, initials, localDate, date, gymNow } from '@/src/utils/format';
import { lookup } from '@/src/features/resources/config';
export function CheckInsPage() {
  const { data, session, mutate } = useApp();
  const [query, setQuery] = useState(''),
    [busy, setBusy] = useState<string | null>(null);
  if (!data) return null;
  const present = data.CheckIns.filter((c) => c.status === 'CheckedIn');
  const members = query
    ? data.Members.filter((m) => {
        const u = data.Users.find((u) => u.userId === m.userId);
        return fold(`${u?.fullName} ${u?.email} ${u?.phone}`).includes(
          fold(query),
        );
      }).slice(0, 6)
    : [];
  async function check(memberId: string, id?: string) {
    setBusy(memberId);
    try {
      await mutate(
        (s) =>
          s.save(
            'CheckIns',
            id ?? null,
            id
              ? { status: 'CheckedOut' }
              : {
                  memberId,
                  method: 'Manual',
                  sourceDevice: 'Quầy lễ tân',
                  status: 'CheckedIn',
                  checkInTime: gymNow(),
                },
          ),
        id ? 'Đã check-out' : 'Check-in thành công',
      );
    } catch {
      /* Toast displays the validation error. */
    } finally {
      setBusy(null);
    }
  }
  const live = (
    <div className="checkin-grid">
      <section className="panel">
        <SectionHead
          title="Check-in nhanh"
          description="Tìm theo tên, số điện thoại hoặc email."
        />
        <div className="checkin-search">
          <Search size={18} />
          <Input
            aria-label="Tìm hội viên check-in"
            placeholder="Nhập tên, email hoặc số điện thoại…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="checkin-results">
          {query ? (
            members.length ? (
              members.map((m) => {
                const user = data.Users.find((u) => u.userId === m.userId),
                  inside = present.find((c) => c.memberId === m.memberId),
                  valid = data.MemberPackages.some(
                    (p) =>
                      p.memberId === m.memberId &&
                      p.status === 'Active' &&
                      p.startDate <= localDate() &&
                      (!p.endDate || p.endDate >= localDate()) &&
                      (p.remainingSessions == null || p.remainingSessions > 0),
                  );
                return (
                  <div key={m.memberId} className="checkin-result">
                    <div className="person-row">
                      <span className="avatar">
                        {initials(user?.fullName ?? '')}
                      </span>
                      <span className="person-name">
                        <strong>{user?.fullName}</strong>
                        <small>{user?.phone}</small>
                      </span>
                      {can(session, 'checkins.write') && (
                        <Button
                          size="sm"
                          disabled={
                            busy === m.memberId ||
                            (!inside && (!valid || m.status !== 'Active'))
                          }
                          onClick={() =>
                            void check(m.memberId, inside?.checkInId)
                          }
                        >
                          {inside ? 'Check-out' : 'Check-in'}
                        </Button>
                      )}
                    </div>
                    {!valid && (
                      <p className="field-error">
                        <ShieldAlert size={14} />
                        Chưa có gói tập còn hiệu lực.
                      </p>
                    )}
                    {m.status !== 'Active' && (
                      <p className="field-error">
                        Hội viên đang ngừng hoạt động hoặc tạm khóa.
                      </p>
                    )}
                  </div>
                );
              })
            ) : (
              <EmptyState title="Không tìm thấy hội viên" />
            )
          ) : (
            <div className="checkin-ready">
              <ScanLine size={56} />
              <h3>Sẵn sàng đón hội viên</h3>
              <p>Nhập thông tin hội viên để ghi nhận lượt vào phòng tập.</p>
            </div>
          )}
        </div>
      </section>
      <section className="panel">
        <SectionHead
          title="Đang có mặt tại phòng tập"
          description={`${present.length} hội viên hiện tại`}
        />
        {present.length ? (
          present.map((c) => (
            <div className="person-row" key={c.checkInId}>
              <span className="avatar">
                {initials(lookup('memberId', c.memberId, data))}
              </span>
              <span className="person-name">
                <strong>{lookup('memberId', c.memberId, data)}</strong>
                <small>Vào lúc {date(c.checkInTime, true)}</small>
              </span>
              {can(session, 'checkins.write') && (
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={`Check-out ${lookup('memberId', c.memberId, data)}`}
                  disabled={busy === c.memberId}
                  onClick={() => void check(c.memberId, c.checkInId)}
                >
                  <LogOut size={15} />
                </Button>
              )}
            </div>
          ))
        ) : (
          <EmptyState title="Chưa có hội viên tại phòng tập" />
        )}
      </section>
    </div>
  );
  return (
    <>
      <PageHeading
        eyebrow="VẬN HÀNH TRỰC TIẾP"
        title="Check-in & điểm danh"
        description="Ghi nhận mỗi lượt đến. Theo dõi phòng tập trong ngày."
      />
      <div className="summary-row">
        <div>
          <Users />
          <span>
            Đang có mặt<strong>{present.length}</strong>
          </span>
        </div>
        <div>
          <ScanLine />
          <span>
            Check-in hôm nay
            <strong>
              {
                data.CheckIns.filter((c) =>
                  c.checkInTime.startsWith(localDate()),
                ).length
              }
            </strong>
          </span>
        </div>
      </div>
      <ModuleTabs
        tabs={[
          { id: 'live', title: 'Quầy check-in', content: live },
          {
            id: 'history',
            title: 'Lịch sử ra vào',
            content: <EntityTable table="CheckIns" />,
          },
          {
            id: 'attendance',
            title: 'Điểm danh theo booking',
            content: <EntityTable table="Attendance" />,
          },
        ]}
      />
    </>
  );
}
