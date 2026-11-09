'use client';
import {PasswordForm} from '@/src/features/auth/password-form';
import {apiRequest} from '@/src/api/production';
import {isMock} from '@/src/api/service';
import Image from '@/src/components/image';
import { useState, type SubmitEvent } from 'react';
import Link from '@/src/routes/link';
import {
  Bell,
  CheckCheck,
  CalendarDays,
  Dumbbell,
  ArrowUpRight,
  Sparkles,
  LogOut,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PageHeading,
  SectionHead,
  Badge,
  EmptyState,
} from '@/src/components/common';
import { useApp } from '@/src/app/provider';
import { FieldGrid } from '@/src/features/resources/entity-form';
import { validate } from '@/src/features/resources/validation';
import { asRecord, type EntityRecord } from '@/src/types/entities';
import { lookup } from '@/src/features/resources/config';
import { date, initials, localDate } from '@/src/utils/format';
import { ApiError, errorText } from '@/src/api/client';
import { can } from '@/src/app/permissions';
import { TrendChart } from '@/src/components/charts';
export function NotificationsPage() {
  const { data, mutate, session } = useApp();
  const [unreadOnly, setUnreadOnly] = useState(false),
    [busy, setBusy] = useState(false);
  if (!data) return null;
  const notifications = data.Notifications.filter(
    (n) => !unreadOnly || !n.isRead,
  ).toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));
  async function read(id?: string) {
    setBusy(true);
    try {
      await mutate(
        (s) => s.markRead('Notifications', id),
        'Đã đánh dấu đã đọc',
      );
    } catch {
      /* Toast handles errors. */
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="TRUNG TÂM THÔNG BÁO"
        title="Thông báo"
        description={`${data.Notifications.filter((n) => !n.isRead).length} thông báo chưa đọc`}
      >
        {can(session, 'notifications.write') && (
          <Button
            variant="outline"
            disabled={!data.Notifications.some((n) => !n.isRead)}
            loading={busy}
            onClick={() => void read()}
          >
            <CheckCheck size={16} />
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </PageHeading>
      <div className="view-switch notifications-switch">
        <button aria-pressed={!unreadOnly} onClick={() => setUnreadOnly(false)}>
          Tất cả
        </button>
        <button aria-pressed={unreadOnly} onClick={() => setUnreadOnly(true)}>
          Chưa đọc
        </button>
      </div>
      <section className="panel notification-list">
        {notifications.length ? (
          notifications.map((n) => (
            <article
              className={n.isRead ? '' : 'unread'}
              key={n.notificationId}
            >
              <span className="notification-icon">
                <Bell size={21} />
              </span>
              <div>
                <h2>
                  {n.title}
                  {!n.isRead && <i />}
                </h2>
                <p>{n.message}</p>
                <small>{date(n.createdAt, true)}</small>
              </div>
              {!n.isRead && can(session, 'notifications.write') && (
                <button
                  className="icon-button"
                  aria-label={`Đánh dấu đã đọc: ${n.title}`}
                  disabled={busy}
                  onClick={() => void read(n.notificationId)}
                >
                  <CheckCheck size={18} />
                </button>
              )}
            </article>
          ))
        ) : (
          <EmptyState
            title="Bạn đã cập nhật tất cả"
            description="Không có thông báo nào trong danh sách này."
          />
        )}
      </section>
    </>
  );
}
export function ProfilePage() {
  const { data, session, mutate, logout } = useApp();
  const user = data?.Users.find((u) => u.userId === session?.userId);
  const [draft, setDraft] = useState<EntityRecord>(() => asRecord(user ?? {})),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  if (!data || !session || !user) return null;
  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const issues = validate('Users', { ...asRecord(user!), ...draft });
    setErrors(issues);
    if (Object.keys(issues).length) return;
    setBusy(true);
    setError('');
    try {
      await mutate((s) => s.profile(draft), 'Đã cập nhật hồ sơ');
    } catch (e) {
      setError(errorText(e));
      if (e instanceof ApiError && e.fieldErrors) setErrors(e.fieldErrors);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="TÀI KHOẢN CỦA BẠN"
        title="Hồ sơ cá nhân"
        description="Cập nhật thông tin để phòng gym có thể hỗ trợ bạn tốt hơn."
      />
      <div className="profile-panel panel">
        <div className="profile-identity">
          <span className="avatar profile-avatar">
            {user.avatarUrl ? <Image src={user.avatarUrl.startsWith('/api/') ? `${import.meta.env.VITE_API_BASE_URL}${user.avatarUrl}` : user.avatarUrl} alt={user.fullName} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}}/> : initials(user.fullName)}
          </span>
          {!isMock && <label htmlFor="profile-photo">Tải ảnh đại diện
            <input id="profile-photo" type="file" accept="image/png,image/jpeg" disabled={busy||!can(session,'profile.write')} onChange={async event=>{
              const file=event.target.files?.[0];event.target.value='';if(!file)return;
              if(file.size>2*1024*1024){setError('Ảnh tối đa 2 MB.');return;}
              setBusy(true);setError('');try{const body=new FormData();body.append('file',file);let url='';await mutate(async()=>{const result=await apiRequest<{avatarUrl:string}>('/api/avatars',{method:'POST',body});url=result.avatarUrl;},'Đã tải ảnh đại diện');setDraft(previous=>({...previous,avatarUrl:url}));}catch(e){setError(errorText(e));}finally{setBusy(false);}
            }}/><small>PNG hoặc JPEG, tối đa 2 MB</small>
          </label>}
          <h2>{user.fullName}</h2>
          <Badge value={user.status} />
          <p>{session.role}</p>
          <p>{user.email}</p>
          <Button variant="outline" onClick={() => void logout()}>
            <LogOut size={16} />
            Đăng xuất
          </Button>
        </div>
        <form className="profile-info" onSubmit={save} noValidate>
          <h2>Thông tin của tôi</h2>
          <FieldGrid
            table="Users"
            data={data}
            draft={draft}
            setDraft={setDraft}
            errors={errors}
            only={['fullName', 'phone', 'gender', 'dateOfBirth']}
          />
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-footer">
            <Button
              type="submit"
              disabled={!can(session, 'profile.write')}
              loading={busy}
            >
              {busy ? 'Đang lưu…' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </div><PasswordForm/>
    </>
  );
}
export function MemberPortal() {
  const { data, session } = useApp();
  if (!data || !session) return null;
  const member = data.Members.find((m) => m.memberId === session.memberId);
  const today = localDate();
  const packs = data.MemberPackages.filter(
    (p) =>
      p.memberId === session.memberId &&
      p.status === 'Active' &&
      p.startDate <= today &&
      (p.remainingSessions == null || p.remainingSessions > 0) &&
      (!p.endDate || p.endDate >= today),
  );
  const upcoming = data.Bookings.filter(
    (b) => b.memberId === session.memberId && b.status === 'Confirmed',
  )
    .map((b) => ({
      booking: b,
      schedule: data.WorkoutSchedules.find(
        (s) => s.workoutScheduleId === b.workoutScheduleId,
      ),
    }))
    .filter(
      (x) =>
        x.schedule &&
        new Date(`${x.schedule.scheduleDate}T${x.schedule.endTime}`) >
          new Date(),
    )
    .sort((a, b) =>
      `${a.schedule!.scheduleDate}${a.schedule!.startTime}`.localeCompare(
        `${b.schedule!.scheduleDate}${b.schedule!.startTime}`,
      ),
    )
    .slice(0, 3);
  const plan = data.WorkoutPlans.find(
    (p) => p.memberId === session.memberId && p.status === 'Active',
  );
  const measurements = data.Progress.filter(
    (p) => p.memberId === session.memberId,
  ).sort((a, b) => a.recordDate.localeCompare(b.recordDate));
  return (
    <>
      <PageHeading
        eyebrow="HÀNH TRÌNH CỦA BẠN"
        title={`Chào ${session.fullName}, hôm nay tập gì?`}
        description={
          member?.goal ?? 'Bắt đầu từ một buổi tập, tiến gần hơn đến mục tiêu.'
        }
      >
        <Link href="/schedules" className="button-primary">
          <CalendarDays size={17} />
          Đặt lịch tập
        </Link>
      </PageHeading>
      <div className="member-hero-grid">
        <section className="member-membership">
          <div>
            <span className="eyebrow">GÓI TẬP ĐANG SỬ DỤNG</span>
            <Package size={25} />
          </div>
          <h2>
            {packs[0]
              ? lookup('packageId', packs[0].packageId, data)
              : 'Chưa có gói tập hiệu lực'}
          </h2>
          <strong>
            {packs[0] ? packs[0].remainingSessions ?? '∞' : '—'}
            <span>buổi còn lại</span>
          </strong>
          <footer>
            <span>Hết hạn: {date(packs[0]?.endDate)}</span>
            <Link href="/packages">
              Chi tiết gói
              <ArrowUpRight size={16} />
            </Link>
          </footer>
        </section>
        <section className="panel today-plan">
          <span className="ai-orb">
            <Dumbbell size={22} />
          </span>
          <p className="eyebrow">GIÁO ÁN CỦA BẠN</p>
          <h2>{plan?.planName ?? 'Chưa có giáo án'}</h2>
          <p>
            {plan?.goal ?? 'Trao đổi với huấn luyện viên để xây dựng lộ trình.'}
          </p>
          {plan && (
            <Link href={`/workouts/${plan.planId}`} className="button-primary">
              Bắt đầu buổi tập
              <ArrowUpRight size={17} />
            </Link>
          )}
        </section>
      </div>
      <div className="two-column-grid">
        <section className="panel">
          <SectionHead title="Lịch tập sắp tới" href="/schedules" />
          {upcoming.length ? (
            upcoming.map(({ booking, schedule }) => (
              <Link
                href="/schedules"
                className="portal-schedule"
                key={booking.bookingId}
              >
                <span className="class-icon">
                  <CalendarDays size={20} />
                </span>
                <div>
                  <h3>{schedule!.title}</h3>
                  <p>
                    {date(schedule!.scheduleDate)} ·{' '}
                    {schedule!.startTime.slice(0, 5)} –{' '}
                    {schedule!.endTime.slice(0, 5)}
                  </p>
                  <small>
                    {lookup('trainerId', schedule!.trainerId, data)}
                  </small>
                </div>
                <Badge value={booking.status} />
              </Link>
            ))
          ) : (
            <EmptyState
              title="Chưa có lịch tập sắp tới"
              action={
                <Link href="/schedules" className="text-link">
                  Khám phá lịch tập
                </Link>
              }
            />
          )}
        </section>
        <section className="panel">
          <SectionHead
            title="Tiến độ cân nặng"
            description="Đơn vị: kg"
            href="/progress"
          />
          {measurements.length ? (
            <TrendChart
              kind="line"
              data={measurements.map((p) => ({
                name: date(p.recordDate).slice(0, 5),
                value: p.weight ?? null,
              }))}
              label="Tiến độ cân nặng của tôi"
            />
          ) : (
            <EmptyState title="Chưa có số đo" />
          )}
        </section>
      </div>
      <Link className="ai-strip" href="/ai">
        <Sparkles size={25} />
        <div>
          <strong>Ghé thăm trợ lý tập luyện của bạn</strong>
          <span>
            Lịch sử trao đổi và các gợi ý dành riêng cho hành trình của bạn.
          </span>
        </div>
        <ArrowUpRight size={23} />
      </Link>
    </>
  );
}
