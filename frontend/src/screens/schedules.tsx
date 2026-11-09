'use client';
import { useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Plus,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useApp } from '@/src/app/provider';
import { can } from '@/src/app/permissions';
import { PageHeading, Badge, EmptyState } from '@/src/components/common';
import { Confirm } from '@/src/components/confirm';
import { ModuleTabs } from '@/src/components/module-tabs';
import { EntityTable } from '@/src/features/resources/entity-table';
import { EntityEditor } from '@/src/features/resources/entity-form';
import { bookingError } from '@/src/features/resources/validation';
import { lookup } from '@/src/features/resources/config';
import { asRecord, type WorkoutSchedules } from '@/src/types/entities';
import { date, localDate, gymNow } from '@/src/utils/format';
import { errorText } from '@/src/api/client';
function dayOffset(day: string, amount: number) {
  const value = new Date(day + 'T12:00:00');
  value.setDate(value.getDate() + amount);
  return localDate(value);
}
export function Schedules() {
  const { data, session, mutate } = useApp();
  const [anchor, setAnchor] = useState(localDate()),
    [view, setView] = useState<'day' | 'week' | 'month' | 'list'>('week'),
    [trainer, setTrainer] = useState(''),
    [room, setRoom] = useState(''),
    [status, setStatus] = useState(''),
    [selected, setSelected] = useState<WorkoutSchedules | null>(null),
    [adding, setAdding] = useState(false),
    [bookingMember, setBookingMember] = useState(session?.memberId ?? ''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [cancel, setCancel] = useState<string | null>(null);
  if (!data) return null;
  const canBook = can(session, 'bookings.write');
  const chosen = selected
    ? data.WorkoutSchedules.find(
        (s) => s.workoutScheduleId === selected.workoutScheduleId,
      )
    : undefined;
  const roomCapacity=chosen ? data.Rooms.find(r=>r.roomId===chosen.roomId)?.capacity : null;
  const issues = chosen ? bookingError({...asRecord(chosen),capacity:chosen.capacity == null ? roomCapacity : roomCapacity == null ? chosen.capacity : Math.min(chosen.capacity,roomCapacity)}) : null;
  const activeBooking = chosen
    ? data.Bookings.find(
        (b) =>
          b.workoutScheduleId === chosen.workoutScheduleId &&
          b.memberId === bookingMember &&
          b.status === 'Confirmed',
      )
    : undefined;
  const reference = new Date(anchor + 'T12:00:00');
  const first = new Date(reference);
  if (view === 'month') first.setDate(1);
  if(view !== 'day')first.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  const days = Array.from({ length: view === 'month' ? 42 : view === 'day' ? 1 : 7 }, (_, i) =>
    dayOffset(localDate(first), i),
  );
  const collection = data.WorkoutSchedules.filter(
    (s) =>
      (!trainer || s.trainerId === trainer) &&
      (!room || s.roomId === room) &&
      (!status || s.status === status),
  );
  function move(direction: number) {
    if (view === 'month') {
      const d = new Date(anchor + 'T12:00:00');
      d.setMonth(d.getMonth() + direction, 1);
      setAnchor(localDate(d));
    } else setAnchor(dayOffset(anchor, direction * (view === 'day' ? 1 : 7)));
  }
  async function book() {
    if (!chosen) return;
    if (!bookingMember) {
      setError('Vui lòng chọn hội viên.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await mutate(
        (s) =>
          s.save('Bookings', null, {
            memberId: bookingMember,
            workoutScheduleId: chosen.workoutScheduleId,
            status: 'Confirmed',
            bookingTime: gymNow(),
          }),
        'Đã đặt lịch thành công',
      );
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  const calendar = (
    <section className="panel calendar-panel">
      <div className="calendar-toolbar">
        <div className="calendar-nav">
          <button
            className="icon-button"
            aria-label="Khoảng thời gian trước"
            onClick={() => move(-1)}
          >
            <ChevronLeft size={19} />
          </button>
          <h2>
            {view === 'month'
              ? new Intl.DateTimeFormat('vi-VN', {
                  month: 'long',
                  year: 'numeric',
                }).format(reference)
              : view === 'day' ? date(anchor) : `${date(days[0])} – ${date(days[6])}`}
          </h2>
          <button
            className="icon-button"
            aria-label="Khoảng thời gian sau"
            onClick={() => move(1)}
          >
            <ChevronRight size={19} />
          </button>
          <Button variant="outline" onClick={() => setAnchor(localDate())}>
            Hôm nay
          </Button>
        </div>
        <fieldset className="view-switch" aria-label="Chế độ xem lịch">
          {(['day', 'week', 'month', 'list'] as const).map((mode) => (
            <button
              aria-pressed={view === mode}
              key={mode}
              onClick={() => setView(mode)}
            >
              {mode === 'day' ? 'Ngày' : mode === 'week'
                ? 'Tuần'
                : mode === 'month'
                  ? 'Tháng'
                  : 'Danh sách'}
            </button>
          ))}
        </fieldset>
      </div>
      <div className="calendar-filters">
        <label htmlFor="calendar-anchor">
          <CalendarDays size={16} />
          <Input
            id="calendar-anchor"
            aria-label="Ngày xem lịch"
            type="date"
            value={anchor}
            onChange={(e) => e.target.value && setAnchor(e.target.value)}
          />
        </label>
        <NativeSelect
          aria-label="Lọc huấn luyện viên"
          value={trainer}
          onChange={(e) => setTrainer(e.target.value)}
        >
          <NativeSelectOption value="">
            Tất cả huấn luyện viên
          </NativeSelectOption>
          {data.Trainers.map((t) => (
            <NativeSelectOption key={t.trainerId} value={t.trainerId}>
              {lookup('trainerId', t.trainerId, data)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="Lọc phòng tập"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        >
          <NativeSelectOption value="">Tất cả phòng tập</NativeSelectOption>
          {data.Rooms.map((r) => (
            <NativeSelectOption key={r.roomId} value={r.roomId}>
              {r.roomName}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="Lọc trạng thái lịch"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <NativeSelectOption value="">Tất cả trạng thái</NativeSelectOption>
          <NativeSelectOption value="Available">Còn chỗ</NativeSelectOption>
          <NativeSelectOption value="Completed">Đã kết thúc</NativeSelectOption>
          <NativeSelectOption value="Canceled">Đã hủy</NativeSelectOption>
        </NativeSelect>
      </div>
      {view === 'list' ? (
        <div className="schedule-list">
          {collection.filter(
            (s) =>
              s.scheduleDate >= anchor &&
              s.scheduleDate <= dayOffset(anchor, 30),
          ).length ? (
            collection
              .filter(
                (s) =>
                  s.scheduleDate >= anchor &&
                  s.scheduleDate <= dayOffset(anchor, 30),
              )
              .toSorted((a, b) =>
                `${a.scheduleDate}${a.startTime}`.localeCompare(
                  `${b.scheduleDate}${b.startTime}`,
                ),
              )
              .map((s) => (
                <button
                  className="schedule-list-row"
                  key={s.workoutScheduleId}
                  onClick={() => {
                    setSelected(s);
                    setError('');
                  }}
                >
                  <span>
                    <strong>{date(s.scheduleDate)}</strong>
                    <small>
                      {s.startTime.slice(0, 5)} – {s.endTime.slice(0, 5)}
                    </small>
                  </span>
                  <span>
                    <strong>{s.title}</strong>
                    <small>
                      {lookup('trainerId', s.trainerId, data)} ·{' '}
                      {lookup('roomId', s.roomId, data)}
                    </small>
                  </span>
                  <span>
                    {s.currentParticipants}/{s.capacity} chỗ
                  </span>
                  <Badge value={s.status} />
                </button>
              ))
          ) : (
            <EmptyState title="Chưa có lịch phù hợp" />
          )}
        </div>
      ) : (
        <div className="calendar-scroll">
          <div className={`calendar-grid ${view}`}>
            {days.map((day, i) => {
              const daily = collection
                .filter((s) => s.scheduleDate === day)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
              return (
                <div
                  className={`calendar-day ${day === localDate() ? 'today' : ''} ${day.slice(0, 7) !== anchor.slice(0, 7) ? 'outside-month' : ''}`}
                  key={day}
                >
                  {(view === 'week' || i < 7) && (
                    <p className="calendar-weekday">
                      {
                        [
                          'THỨ HAI',
                          'THỨ BA',
                          'THỨ TƯ',
                          'THỨ NĂM',
                          'THỨ SÁU',
                          'THỨ BẢY',
                          'CHỦ NHẬT',
                        ][i % 7]
                      }
                    </p>
                  )}
                  <div className="day-number">
                    <span>{new Date(day + 'T12:00:00').getDate()}</span>
                    {day === localDate() && <small>Hôm nay</small>}
                  </div>
                  <div className="day-events">
                    {daily.map((s, n) => (
                      <button
                        className={`calendar-event event-${n % 3}`}
                        key={s.workoutScheduleId}
                        onClick={() => {
                          setSelected(s);
                          setError('');
                        }}
                      >
                        <small>
                          {s.startTime.slice(0, 5)} – {s.endTime.slice(0, 5)}
                        </small>
                        <strong>{s.title}</strong>
                        <span>{lookup('trainerId', s.trainerId, data)}</span>
                        <span>
                          <Users size={12} />
                          {s.currentParticipants}/{s.capacity} ·{' '}
                          {lookup('roomId', s.roomId, data)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
  return (
    <>
      <PageHeading
        eyebrow="LỊCH TẬP LUYỆN"
        title={
          session?.role === 'Member'
            ? 'Tìm buổi tập tiếp theo'
            : 'Lịch tập & đặt lịch'
        }
        description="Sắp xếp lịch trình, tìm lớp yêu thích và giữ chỗ cho buổi tập."
      >
        {can(session, 'schedules.write') && (
          <Button onClick={() => setAdding(true)}>
            <Plus size={16} />
            Tạo lịch tập
          </Button>
        )}
      </PageHeading>
      <ModuleTabs
        tabs={[
          { id: 'calendar', title: 'Lịch tập', content: calendar },
          {
            id: 'bookings',
            title:
              session?.role === 'Member' ? 'Lịch đã đặt' : 'Danh sách đặt lịch',
            content: <EntityTable table="Bookings" />,
          },
          ...(session?.role !== 'Member'
            ? [
                {
                  id: 'scheduleData',
                  title: 'Quản lý lịch',
                  content: <EntityTable table="WorkoutSchedules" />,
                },
                {
                  id: 'rooms',
                  title: 'Phòng tập',
                  content: <EntityTable table="Rooms" />,
                },
                {
                  id: 'trainers',
                  title: 'Lịch huấn luyện viên',
                  content: <EntityTable table="TrainerSchedules" />,
                },
              ]
            : []),
        ]}
      />
      {adding && (
        <EntityEditor
          table="WorkoutSchedules"
          onClose={() => setAdding(false)}
        />
      )}
      <Dialog
        open={Boolean(chosen)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="gym-dialog">
          <DialogTitle>{chosen?.title ?? 'Chi tiết buổi tập'}</DialogTitle>
          <DialogDescription>{date(chosen?.scheduleDate)}</DialogDescription>
          {chosen && (
            <>
              <div className="booking-details">
                <p>
                  <Clock3 size={17} />
                  {chosen.startTime.slice(0, 5)} – {chosen.endTime.slice(0, 5)}
                </p>
                <p>
                  <MapPin size={17} />
                  {lookup('roomId', chosen.roomId, data)}
                </p>
                <p>
                  <Users size={17} />
                  {lookup('trainerId', chosen.trainerId, data)}
                </p>
                <p>
                  <strong>
                    {Math.max(
                      0,
                      (chosen.capacity ?? 0) - chosen.currentParticipants,
                    )}
                  </strong>{' '}
                  chỗ còn lại / {chosen.capacity ?? 0}
                </p>
                <Badge value={chosen.status} />
              </div>
              {session?.role !== 'Member' && canBook && (
                <div className="field">
                  <label htmlFor="booking-member">Hội viên đặt lịch</label>
                  <NativeSelect
                    id="booking-member"
                    value={bookingMember}
                    onChange={(e) => setBookingMember(e.target.value)}
                  >
                    <NativeSelectOption value="">
                      Chọn hội viên
                    </NativeSelectOption>
                    {data.Members.map((m) => (
                      <NativeSelectOption key={m.memberId} value={m.memberId}>
                        {lookup('memberId', m.memberId, data)}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
              )}
              {issues && !activeBooking && (
                <p className="notice-box">{issues}</p>
              )}
              {error && (
                <p className="field-error" role="alert">
                  {error}
                </p>
              )}
              {canBook &&
                (activeBooking ? (
                  <Button
                    variant="outline"
                    onClick={() => setCancel(activeBooking.bookingId)}
                  >
                    Hủy lịch đã đặt
                  </Button>
                ) : (
                  <Button
                    disabled={Boolean(issues)}
                    loading={busy}
                    onClick={() => void book()}
                  >
                    {busy ? 'Đang đặt lịch…' : 'Xác nhận đặt lịch'}
                  </Button>
                ))}
            </>
          )}
        </DialogContent>
      </Dialog>
      {cancel && (
        <Confirm
          title="Hủy lịch đã đặt?"
          description="Chỗ của bạn sẽ được trả lại cho buổi tập. Bạn có thể đặt lại nếu lịch còn chỗ."
          onClose={() => setCancel(null)}
          onConfirm={() =>
            mutate(
              (s) => s.save('Bookings', cancel, { status: 'Canceled' }),
              'Đã hủy đặt lịch',
            )
          }
        />
      )}
    </>
  );
}
