'use client';
import { useState } from 'react';
import Link from '@/src/routes/link';
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Dumbbell,
  Play,
  Plus,
  Search,
  Clock3,
  Trash2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import {
  PageHeading,
  Badge,
  ErrorPage,
  EmptyState,
} from '@/src/components/common';
import { ModuleTabs } from '@/src/components/module-tabs';
import { EntityTable } from '@/src/features/resources/entity-table';
import { EntityEditor } from '@/src/features/resources/entity-form';
import { lookup } from '@/src/features/resources/config';
import { fold, safeUrl, date } from '@/src/utils/format';
import type { Exercises } from '@/src/types/entities';
import Image from '@/src/components/image';
import { Confirm } from '@/src/components/confirm';
export function WorkoutsPage() {
  const { data, session } = useApp();
  const [query, setQuery] = useState(''),
    [muscle, setMuscle] = useState(''),
    [selected, setSelected] = useState<Exercises | null>(null);
  if (!data) return null;
  const exercises = data.Exercises.filter(
    (e) =>
      e.status === 'Active' &&
      fold(`${e.exerciseName} ${e.description}`).includes(fold(query)) &&
      (!muscle || e.muscleGroup === muscle),
  );
  const library = (
    <>
      <div className="exercise-toolbar">
        <div className="table-search">
          <Search size={17} />
          <Input
            aria-label="Tìm bài tập"
            placeholder="Tìm bài tập…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <NativeSelect
          aria-label="Nhóm cơ"
          value={muscle}
          onChange={(e) => setMuscle(e.target.value)}
        >
          <NativeSelectOption value="">Tất cả nhóm cơ</NativeSelectOption>
          {[...new Set(data.Exercises.map((e) => e.muscleGroup))]
            .filter(Boolean)
            .map((g) => (
              <NativeSelectOption key={g} value={g!}>
                {g}
              </NativeSelectOption>
            ))}
        </NativeSelect>
      </div>
      <div className="exercise-grid">
        {exercises.map((exercise, i) => {
          const image = safeUrl(exercise.imageUrl);
          return (
            <button
              className="exercise-card panel"
              key={exercise.exerciseId}
              onClick={() => setSelected(exercise)}
            >
              <div className={`exercise-visual exercise-color-${i % 3}`}>
                {image ? (
                  <Image
                    src={image}
                    alt={exercise.exerciseName}
                    width={640}
                    height={320}
                    unoptimized
                    loading="lazy"
                  />
                ) : (
                  <Dumbbell size={42} strokeWidth={1.3} />
                )}
                <span>{exercise.muscleGroup}</span>
              </div>
              <div className="exercise-copy">
                <h2>{exercise.exerciseName}</h2>
                <p>{exercise.description}</p>
                <span>
                  Hướng dẫn bài tập
                  <Play size={14} />
                </span>
              </div>
            </button>
          );
        })}
      </div>
      {!exercises.length && <EmptyState title="Không tìm thấy bài tập" />}
    </>
  );
  return (
    <>
      <PageHeading
        eyebrow="TẬP LUYỆN"
        title="Bài tập & giáo án"
        description="Từ kỹ thuật cơ bản đến lộ trình dành riêng cho từng hội viên."
      />
      <ModuleTabs
        tabs={[
          {
            id: 'plans',
            title: session?.role === 'Member' ? 'Giáo án của tôi' : 'Giáo án',
            content: <EntityTable table="WorkoutPlans" />,
          },
          { id: 'library', title: 'Thư viện bài tập', content: library },
          ...(can(session, 'workouts.write')
            ? [
                {
                  id: 'exercises',
                  title: 'Quản lý bài tập',
                  content: <EntityTable table="Exercises" />,
                },
              ]
            : []),
          {
            id: 'results',
            title: 'Kết quả tập luyện',
            content: <EntityTable table="WorkoutResults" />,
          },
        ]}
      />
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="gym-dialog">
          <DialogTitle>{selected?.exerciseName}</DialogTitle>
          <DialogDescription>{selected?.muscleGroup}</DialogDescription>
          {selected && (
            <>
              <p className="exercise-instructions">
                {selected.instructions ?? 'Chưa có hướng dẫn cho bài tập này.'}
              </p>
              {safeUrl(selected.videoUrl) && (
                <a
                  className="button-primary"
                  href={safeUrl(selected.videoUrl)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Play size={16} />
                  Xem video hướng dẫn
                </a>
              )}
              <p className="muted small-copy">
                Điều chỉnh mức độ phù hợp với thể trạng và trao đổi cùng huấn
                luyện viên.
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
export function PlanDetail({ id }: { id: string }) {
  const { data, session, mutate } = useApp();
  const [adding, setAdding] = useState(false),
    [resultExercise, setResultExercise] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [remove, setRemove] = useState<string | null>(null);
  if (!data) return null;
  const plan = data.WorkoutPlans.find((p) => p.planId === id);
  if (!plan) return <ErrorPage code="404" />;
  const details = data.WorkoutPlanDetails.filter((d) => d.planId === id).sort(
    (a, b) => (a.orderNo ?? 0) - (b.orderNo ?? 0),
  );
  async function move(index: number, direction: number) {
    const ordered = details.map((d) => d.planDetailId);
    const dest = index + direction;
    if (dest < 0 || dest >= ordered.length) return;
    [ordered[index], ordered[dest]] = [ordered[dest], ordered[index]];
    setBusy(true);
    try {
      await mutate((s) => s.reorderPlan(id, ordered), 'Đã sắp xếp bài tập');
    } catch {
      /* Error toast is shown by provider. */
    } finally {
      setBusy(false);
    }
  }
  const workout = (
    <div className="workout-steps">
      {details.map((detail, i) => (
        <article className="panel workout-step" key={detail.planDetailId}>
          <span className="step-number">{String(i + 1).padStart(2, '0')}</span>
          <div className="step-copy">
            <h2>{lookup('exerciseId', detail.exerciseId, data)}</h2>
            <p>
              {detail.sets ?? '—'} hiệp × {detail.reps ?? '—'} lần ·{' '}
              {detail.weight ?? '—'} kg
              <span>
                <Clock3 size={13} />
                Nghỉ {detail.restTime ?? '—'} giây
              </span>
            </p>
          </div>
          {can(session, 'workouts.write') && (
            <div className="order-buttons">
              <button
                aria-label={`Đưa ${lookup('exerciseId', detail.exerciseId, data)} lên`}
                className="icon-button"
                disabled={i === 0 || busy}
                onClick={() => void move(i, -1)}
              >
                <ArrowUp size={16} />
              </button>
              <button
                aria-label={`Đưa ${lookup('exerciseId', detail.exerciseId, data)} xuống`}
                className="icon-button"
                disabled={i === details.length - 1 || busy}
                onClick={() => void move(i, 1)}
              >
                <ArrowDown size={16} />
              </button>
              <button
                aria-label={`Xóa ${lookup('exerciseId', detail.exerciseId, data)} khỏi giáo án`}
                className="icon-button"
                onClick={() => setRemove(detail.planDetailId)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}
          {can(session, 'results.write') && (
            <Button
              variant="outline"
              onClick={() => setResultExercise(detail.exerciseId)}
            >
              Ghi kết quả
            </Button>
          )}
        </article>
      ))}
      {!details.length && <EmptyState title="Giáo án chưa có bài tập" />}
    </div>
  );
  return (
    <>
      <Link className="text-link back-link" href="/workouts">
        <ArrowLeft size={16} />
        Bài tập & giáo án
      </Link>
      <PageHeading
        title={plan.planName}
        description={`${lookup('memberId', plan.memberId, data)} · ${lookup('trainerId', plan.trainerId, data)}`}
      >
        {can(session, 'workouts.write') && (
          <Button onClick={() => setAdding(true)}>
            <Plus size={16} />
            Thêm bài tập
          </Button>
        )}
      </PageHeading>
      <div className="plan-summary">
        <Badge value={plan.status} />
        <span>
          {date(plan.startDate)} – {date(plan.endDate)}
        </span>
        <strong>{plan.goal}</strong>
      </div>
      <ModuleTabs
        tabs={[
          { id: 'session', title: 'Buổi tập', content: workout },
          {
            id: 'edit',
            title: 'Chi tiết bài tập',
            content: (
              <EntityTable table="WorkoutPlanDetails" fixed={{ planId: id }} />
            ),
          },
          {
            id: 'results',
            title: 'Kết quả',
            content: (
              <EntityTable
                table="WorkoutResults"
                fixed={{ planId: id, memberId: plan.memberId }}
              />
            ),
          },
        ]}
      />
      {adding && (
        <EntityEditor
          table="WorkoutPlanDetails"
          fixed={{ planId: id }}
          onClose={() => setAdding(false)}
        />
      )}{' '}
      {resultExercise && (
        <EntityEditor
          table="WorkoutResults"
          fixed={{
            planId: id,
            memberId: plan.memberId,
            exerciseId: resultExercise,
          }}
          onClose={() => setResultExercise(null)}
        />
      )}{' '}
      {remove && (
        <Confirm
          title="Xóa bài tập khỏi giáo án?"
          description="Bài tập sẽ được bỏ khỏi danh sách của giáo án này. Thư viện bài tập vẫn được giữ nguyên."
          onClose={() => setRemove(null)}
          onConfirm={() =>
            mutate(
              (s) => s.remove('WorkoutPlanDetails', remove),
              'Đã xóa bài tập khỏi giáo án',
            )
          }
        />
      )}
    </>
  );
}
