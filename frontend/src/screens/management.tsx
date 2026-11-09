'use client';
import { useState } from 'react';
import { Check, Package, Wrench, Star, Dumbbell, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/src/app/provider';
import { can } from '@/src/app/permissions';
import { Badge, PageHeading } from '@/src/components/common';
import { ModuleTabs } from '@/src/components/module-tabs';
import { EntityTable } from '@/src/features/resources/entity-table';
import { EntityEditor } from '@/src/features/resources/entity-form';
import type { EntityRecord } from '@/src/types/entities';
import { asRecord } from '@/src/types/entities';
import { date, initials, money, decimalSum, localDate } from '@/src/utils/format';
import { lookup } from '@/src/features/resources/config';
import { Confirm } from '@/src/components/confirm';
import { Receipts } from '@/src/features/resources/receipts';
import { Refunds } from '@/src/features/resources/refunds';
import { apiRequest } from '@/src/api/production';
import { isMock } from '@/src/api/service';
export function Packages() {
  const { data, session, mutate } = useApp();
  const [editor, setEditor] = useState<{
      table: 'Packages' | 'MemberPackages';
      row?: EntityRecord;
      fixed?: EntityRecord;
    } | null>(null),
    [remove, setRemove] = useState<string | null>(null);
  const [lifecycle, setLifecycle] = useState<{id:string;resume:boolean}|null>(null);
  const [freezeReason, setFreezeReason] = useState('');
  if (!data) return null;
  const member = session?.role === 'Member';
  const cards = (
    <div className="package-grid">
      {data.Packages.map((pkg, i) => (
        <article
          className={`package-card ${i === 1 ? 'popular' : ''}`}
          key={pkg.packageId}
        >
          <div className="package-top">
            <span className="package-icon">
              <Package size={23} />
            </span>
            <Badge value={pkg.status} />
          </div>
          <p className="eyebrow">{pkg.packageName}</p>
          <h2>{money(pkg.price)}</h2>
          <p className="muted">
            {pkg.durationDays ?? 'Linh hoạt'} ngày ·{' '}
            {pkg.totalSessions ?? 'Không giới hạn'} buổi tập
          </p>
          <p className="package-description">{pkg.description}</p>
          <ul>
            {pkg.benefits
              ?.split('\n')
              .filter(Boolean)
              .map((benefit) => (
                <li key={benefit}>
                  <Check size={15} />
                  {benefit}
                </li>
              ))}
          </ul>
          {can(session, 'packages.write') && (
            <div className="package-actions">
              <Button
                onClick={() =>
                  setEditor({
                    table: 'MemberPackages',
                    fixed: {
                      packageId: pkg.packageId,
                      price: pkg.price,
                      remainingSessions: pkg.totalSessions,
                    },
                  })
                }
                disabled={pkg.status !== 'Active'}
              >
                Gán cho hội viên
                <UserPlus size={16} />
              </Button>
              <div>
                <button
                  className="text-link"
                  onClick={() =>
                    setEditor({ table: 'Packages', row: asRecord(pkg) })
                  }
                >
                  Chỉnh sửa
                </button>
                <button
                  className="text-link"
                  onClick={() => setRemove(pkg.packageId)}
                >
                  Xóa gói
                </button>
              </div>
            </div>
          )}
        </article>
      ))}
    </div>
  );
  const own = (
    <div className="membership-grid">
      {data.MemberPackages.filter(
        (pkg) => !member || pkg.memberId === session.memberId,
      ).map((pkg) => (
        <article className="panel membership-card" key={pkg.memberPackageId}>
          <div className="membership-head">
            <Package />
            <Badge value={pkg.status} />
          </div>
          <h2>{lookup('packageId', pkg.packageId, data)}</h2>
          <p className="muted">{lookup('memberId', pkg.memberId, data)}</p>
          <div className="membership-remaining">
            <strong>{pkg.remainingSessions ?? '∞'}</strong>
            <span>buổi còn lại</span>
          </div>
          <div className="membership-date">
            <span>
              Ngày bắt đầu<strong>{date(pkg.startDate)}</strong>
            </span>
            <span>
              Ngày hết hạn<strong>{date(pkg.endDate)}</strong>
            </span>
          </div>
          {pkg.endDate && pkg.endDate < localDate() && (
            <p className="field-error">Gói tập đã hết hạn.</p>
          )}
          {can(session, 'packages.write') && <div className="package-actions">
            {!isMock && (pkg.status === 'Active' || pkg.status === 'Suspended') && <Button variant="outline" onClick={()=>{setFreezeReason('');setLifecycle({id:pkg.memberPackageId,resume:pkg.status==='Suspended'});}}>{pkg.status==='Suspended'?'Kết thúc bảo lưu':'Bảo lưu'}</Button>}
            <Button variant="outline" onClick={() => setEditor({table:'MemberPackages',fixed:{memberId:pkg.memberId,packageId:pkg.packageId,startDate:pkg.endDate && pkg.endDate >= localDate() ? new Date(Date.parse(pkg.endDate+'T00:00:00Z')+86400000).toISOString().slice(0,10) : localDate()}})}>Gia hạn</Button>
          </div>}
        </article>
      ))}
    </div>
  );
  return (
    <>
      <PageHeading
        eyebrow="GÓI TẬP & DỊCH VỤ"
        title={member ? 'Gói tập của tôi' : 'Gói tập'}
        description={
          member
            ? 'Theo dõi thời hạn và số buổi tập của bạn.'
            : 'Những lựa chọn phù hợp cho từng mục tiêu tập luyện.'
        }
      >
        {can(session, 'packages.write') && (
          <Button onClick={() => setEditor({ table: 'Packages' })}>
            Thêm gói tập
          </Button>
        )}
      </PageHeading>
      <ModuleTabs
        initial={member ? 'own' : 'catalog'}
        tabs={[
          { id: 'catalog', title: 'Danh mục gói tập', content: cards },
          {
            id: 'own',
            title: member ? 'Gói đang sử dụng' : 'Gói của hội viên',
            content: member ? own : <EntityTable table="MemberPackages" />,
          },
          ...(!member ? [{id:'renewals',title:'Theo dõi & gia hạn',content:own}] : []),
        ]}
      />
      {editor && (
        <EntityEditor
          table={editor.table}
          row={editor.row}
          fixed={editor.fixed}
          onClose={() => setEditor(null)}
        />
      )}{' '}
      {lifecycle && <>
        
        <Confirm title={lifecycle.resume?'Kết thúc bảo lưu?':'Bắt đầu bảo lưu?'} description={lifecycle.resume?'Cộng số ngày đã bảo lưu vào hạn gói và mở lại quyền tập.':'Gói sẽ tạm dừng ngay hôm nay. Nhập lý do trước khi xác nhận.'} onClose={()=>setLifecycle(null)} onConfirm={async()=>{await mutate(()=>apiRequest(`/api/memberships/${lifecycle.id}/${lifecycle.resume?'resume':'freeze'}`,{method:'POST',...(!lifecycle.resume?{body:JSON.stringify({reason:freezeReason})}:{})}),'Đã cập nhật bảo lưu');setLifecycle(null);}}>{!lifecycle.resume && <label>Lý do bảo lưu<input value={freezeReason} maxLength={500} onChange={event=>setFreezeReason(event.target.value)}/></label>}</Confirm>
      </>}
      {remove && (
        <Confirm
          title="Xóa gói tập?"
          description="Gói đã có hội viên sử dụng sẽ không thể xóa. Bạn có thể chuyển gói sang trạng thái ngừng hoạt động."
          onClose={() => setRemove(null)}
          onConfirm={() =>
            mutate((s) => s.remove('Packages', remove), 'Đã xóa gói tập')
          }
        />
      )}
    </>
  );
}
export function Payments() {
  const { data, session } = useApp();
  if (!data) return null;
  return (
    <>
      <PageHeading
        eyebrow="TÀI CHÍNH"
        title="Thanh toán"
        description="Theo dõi thu phí và trạng thái giao dịch của hội viên."
      />
      <div className="summary-row">
        <div>
          <span>
            Đã thu
            <strong>
              {money(
                decimalSum(data.Payments.filter((p) => p.status === 'Completed').map(p=>p.amount)),
              )}
            </strong>
          </span>
        </div>
        <div>
          <span>
            Chờ thanh toán
            <strong>
              {money(
                decimalSum(data.Payments.filter((p) => p.status === 'Pending').map(p=>p.amount)),
              )}
            </strong>
          </span>
        </div>
        <div>
          <span>
            Giao dịch hoàn tất
            <strong>
              {data.Payments.filter((p) => p.status === 'Completed').length}
            </strong>
          </span>
        </div>
      </div>
      <ModuleTabs
        tabs={[
          {
            id: 'payments',
            title: 'Tất cả thanh toán',
            content: <EntityTable table="Payments" />,
          },
          {
            id: 'transactions',
            title: 'Giao dịch nhà cung cấp',
            content: <EntityTable table="PaymentTransactions" />,
          },
          { id: 'receipts', title: 'Biên nhận', content: <Receipts /> },
          ...(!isMock && session?.role==='Admin' ? [{id:'refunds',title:'Hoàn tiền',content:<Refunds/>}] : []),
        ]}
      />
    </>
  );
}
export function Trainers() {
  const { data } = useApp();
  if (!data) return null;
  return (
    <>
      <PageHeading
        eyebrow="ĐỘI NGŨ"
        title="Huấn luyện viên"
        description="Chuyên môn vững vàng. Đồng hành cùng từng hội viên."
      />
      <div className="trainer-grid">
        {data.Trainers.map((trainer) => {
          const user = data.Users.find((u) => u.userId === trainer.userId);
          return (
            <article className="panel trainer-card" key={trainer.trainerId}>
              <span className="avatar trainer-avatar">
                {initials(user?.fullName ?? '')}
              </span>
              <h2>{user?.fullName}</h2>
              <p>{trainer.specialization}</p>
              <div className="trainer-meta">
                <span>
                  <Star size={14} />
                  {(trainer.rating != null ? Number(trainer.rating).toFixed(1) : undefined) ?? '—'}
                </span>
                <span>{trainer.experienceYears ?? 0} năm kinh nghiệm</span>
              </div>
              <div className="trainer-card-bottom">
                <span>
                  <Dumbbell size={16} />
                  {
                    data.MemberTrainers.filter(
                      (m) =>
                        m.trainerId === trainer.trainerId &&
                        m.status === 'Active',
                    ).length
                  }{' '}
                  hội viên
                </span>
                <Badge value={trainer.status} />
              </div>
            </article>
          );
        })}
      </div>
      <ModuleTabs
        tabs={[
          {
            id: 'trainers',
            title: 'Hồ sơ huấn luyện viên',
            content: <EntityTable table="Trainers" />,
          },
          {
            id: 'availability',
            title: 'Lịch làm việc',
            content: <EntityTable table="TrainerSchedules" />,
          },
          {
            id: 'assigned',
            title: 'Hội viên phụ trách',
            content: <EntityTable table="MemberTrainers" />,
          },
        ]}
      />
    </>
  );
}
export function EquipmentPage() {
  const { data } = useApp();
  if (!data) return null;
  return (
    <>
      <PageHeading
        eyebrow="VẬN HÀNH"
        title="Thiết bị & bảo trì"
        description="Giữ không gian tập luyện luôn sẵn sàng."
      />
      <div className="summary-row">
        <div>
          <Wrench />
          <span>
            Tổng thiết bị<strong>{data.Equipment.length}</strong>
          </span>
        </div>
        <div>
          <span>
            Cần bảo trì / sửa chữa
            <strong>
              {
                data.Equipment.filter((e) =>
                  ['Maintenance', 'Broken'].includes(e.status),
                ).length
              }
            </strong>
          </span>
        </div>
        <div>
          <span>
            Chi phí bảo trì
            <strong>
              {money(
                decimalSum(data.MaintenanceRecords.map(r=>r.cost)),
              )}
            </strong>
          </span>
        </div>
      </div>
      <ModuleTabs
        tabs={[
          {
            id: 'equipment',
            title: 'Thiết bị',
            content: <EntityTable table="Equipment" />,
          },
          {
            id: 'categories',
            title: 'Danh mục',
            content: <EntityTable table="EquipmentCategories" />,
          },
          {
            id: 'maintenance',
            title: 'Lịch sử bảo trì',
            content: <EntityTable table="MaintenanceRecords" />,
          },
        ]}
      />
    </>
  );
}
export function SystemPage() {
  return (
    <>
      <PageHeading
        eyebrow="QUẢN TRỊ"
        title="Tài khoản & phân quyền"
        description="Quản lý vai trò và phạm vi thao tác của từng tài khoản."
      />
      <ModuleTabs
        tabs={[
          {
            id: 'users',
            title: 'Tài khoản',
            content: <EntityTable table="Users" />,
          },
          {
            id: 'roles',
            title: 'Vai trò',
            content: <EntityTable table="Roles" />,
          },
          {
            id: 'permissions',
            title: 'Quyền truy cập',
            content: <EntityTable table="Permissions" />,
          },
          {
            id: 'userRoles',
            title: 'Gán vai trò',
            content: <EntityTable table="UserRoles" />,
          },
          {
            id: 'rolePermissions',
            title: 'Gán quyền cho vai trò',
            content: <EntityTable table="RolePermissions" />,
          },
        ]}
      />
    </>
  );
}
