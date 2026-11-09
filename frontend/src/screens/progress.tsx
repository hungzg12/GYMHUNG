'use client';
import { useState } from 'react';
import { Plus, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { PageHeading, SectionHead, EmptyState } from '@/src/components/common';
import { TrendChart } from '@/src/components/charts';
import { useApp } from '@/src/app/provider';
import { can } from '@/src/app/permissions';
import { EntityTable } from '@/src/features/resources/entity-table';
import { EntityEditor } from '@/src/features/resources/entity-form';
import { lookup } from '@/src/features/resources/config';
import { date } from '@/src/utils/format';
export function ProgressPage({ fixedMemberId }: { fixedMemberId?: string }) {
  const { data, session } = useApp();
  const [member, setMember] = useState(
      fixedMemberId ?? session?.memberId ?? data?.Members[0]?.memberId ?? '',
    ),
    [adding, setAdding] = useState(false);
  if (!data) return null;
  const points = data.Progress.filter((p) => p.memberId === member).sort(
    (a, b) => a.recordDate.localeCompare(b.recordDate),
  );
  const first = points[0],
    last = points.at(-1);
  const charts = points.map((p) => ({
    name: date(p.recordDate).slice(0, 5),
    weight: p.weight ?? null,
    bodyFat: p.bodyFat ?? null,
    muscleMass: p.muscleMass ?? null,
    chest: p.chest ?? null,
    waist: p.waist ?? null,
    hip: p.hip ?? null,
  }));
  return (
    <>
      <PageHeading
        eyebrow="HÀNH TRÌNH THỂ CHẤT"
        title="Tiến độ tập luyện"
        description="Những thay đổi nhỏ, được ghi lại qua từng lần đo."
      >
        <div className="progress-select">
          {!fixedMemberId && session?.role !== 'Member' && (
            <NativeSelect
              aria-label="Chọn hội viên xem tiến độ"
              value={member}
              onChange={(e) => setMember(e.target.value)}
            >
              <NativeSelectOption value="">Chọn hội viên</NativeSelectOption>
              {data.Members.map((m) => (
                <NativeSelectOption key={m.memberId} value={m.memberId}>
                  {lookup('memberId', m.memberId, data)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          )}
        </div>
        {can(session, 'progress.write') && (
          <Button disabled={!member} onClick={() => setAdding(true)}>
            <Plus size={16} />
            Thêm lần đo
          </Button>
        )}
      </PageHeading>
      {points.length ? (
        <>
          <div className="stats-grid progress-stats">
            {[
              { key: 'weight', title: 'Cân nặng', unit: 'kg' },
              { key: 'bodyFat', title: 'Mỡ cơ thể', unit: '%' },
              { key: 'muscleMass', title: 'Khối lượng cơ', unit: 'kg' },
              { key: 'waist', title: 'Vòng eo', unit: 'cm' },
            ].map((stat) => {
              const key = stat.key as
                  | 'weight'
                  | 'bodyFat'
                  | 'muscleMass'
                  | 'waist',
                start = first?.[key],
                end = last?.[key];
              return (
                <div className="stat-card" key={key}>
                  <div className="stat-top">
                    <span>{stat.title}</span>
                    <Activity size={18} />
                  </div>
                  <strong>
                    {end ?? '—'}
                    <small> {stat.unit}</small>
                  </strong>
                  <p className="stat-foot">
                    {start != null && end != null
                      ? `${end - start > 0 ? '+' : ''}${(end - start).toFixed(1)} ${stat.unit} so với lần đầu`
                      : 'Chưa đủ dữ liệu so sánh'}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="two-column-grid">
            <section className="panel">
              <SectionHead title="Cân nặng" description="Đơn vị: kg" />
              <TrendChart
                kind="line"
                data={charts}
                series={[
                  { key: 'weight', name: 'Cân nặng (kg)', color: '#c4f574' },
                ]}
                label="Biểu đồ cân nặng"
              />
            </section>
            <section className="panel">
              <SectionHead
                title="Thành phần cơ thể"
                description="Mỡ (%) và khối lượng cơ (kg)"
              />
              <TrendChart
                kind="line"
                data={charts}
                series={[
                  { key: 'bodyFat', name: 'Mỡ (%)', color: '#e0bd78' },
                  { key: 'muscleMass', name: 'Cơ (kg)', color: '#90cece' },
                ]}
                label="Biểu đồ phần trăm mỡ và khối lượng cơ"
              />
            </section>
          </div>
          <section className="panel measurements-chart">
            <SectionHead
              title="Số đo cơ thể"
              description={`So sánh từ ${date(first?.recordDate)} đến ${date(last?.recordDate)} · Đơn vị: cm`}
            />
            <TrendChart
              kind="line"
              data={charts}
              series={[
                { key: 'chest', name: 'Ngực', color: '#c4f574' },
                { key: 'waist', name: 'Eo', color: '#e0bd78' },
                { key: 'hip', name: 'Hông', color: '#90cece' },
              ]}
              label="Biểu đồ số đo ngực, eo và hông"
            />
          </section>
        </>
      ) : (
        <section className="panel">
          <EmptyState
            title="Bắt đầu ghi lại hành trình"
            description="Chưa có số đo của hội viên này. Thêm lần đo đầu tiên để theo dõi thay đổi."
          />
        </section>
      )}
      <EntityTable key={member} table="Progress" fixed={{ memberId: member }} />
      {adding && (
        <EntityEditor
          table="Progress"
          fixed={{ memberId: member }}
          onClose={() => setAdding(false)}
        />
      )}
    </>
  );
}
