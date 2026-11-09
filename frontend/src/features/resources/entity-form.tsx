'use client';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useApp } from '@/src/app/provider';
import {isMock} from '@/src/api/service';
import { ApiError, errorText } from '@/src/api/client';
import { schema, type SchemaField } from '@/src/types/schema';
import {
  asRecord,
  type EntityRecord,
  type TableName,
  type WorkspaceData,
} from '@/src/types/entities';
import {
  choices,
  entityName,
  foreignTables,
  labels,
  recordId,
  resources,
  statusLabels,
} from './config';
import { validate } from './validation';
import { Confirm } from '@/src/components/confirm';
import { localDate, gymNow } from '@/src/utils/format';
export function initialDraft(table: TableName): EntityRecord {
  return Object.fromEntries(
    schema[table].fields
      .filter((f) => !f.readonly)
      .map((f) => [
        f.key,
        choices(table, f.key)?.[0] ??
          (f.type === 'boolean'
            ? false
            : f.nullable
              ? null
              : f.type === 'date'
                ? localDate()
                : f.type === 'datetime2'
                  ? gymNow().slice(0, 16)
                  : f.type === 'time'
                    ? f.key === 'endTime'
                      ? '10:00'
                      : '09:00'
                    : f.key === 'currentParticipants'
                      ? 0
                      : ''),
      ]),
  );
}
export function packageDraft(
  draft: EntityRecord,
  data: WorkspaceData,
): EntityRecord {
  const pkg = data.Packages.find((p) => p.packageId === draft.packageId);
  if (!pkg) return draft;
  const end = new Date(String(draft.startDate) + 'T12:00:00');
  if (pkg.durationDays) end.setDate(end.getDate() + pkg.durationDays);
  return {
    ...draft,
    price: pkg.price,
    remainingSessions: pkg.totalSessions,
    endDate:
      pkg.durationDays && !Number.isNaN(end.getTime()) ? localDate(end) : null,
  };
}
export function FieldGrid({
  table,
  draft,
  setDraft,
  errors,
  data,
  only,
  exclude = [],
  locked = [],
}: {
  table: TableName;
  draft: EntityRecord;
  setDraft: (value: EntityRecord) => void;
  errors: Record<string, string>;
  data: WorkspaceData;
  only?: string[];
  exclude?: string[];
  locked?: string[];
}) {
  const fields = schema[table].fields.filter(
    (f) =>
      !f.readonly &&
      !exclude.includes(f.key) &&
      (!only || only.includes(f.key)),
  );
  return (
    <div className="form-grid">
      {fields.map((field) => (
        <Field
          key={field.key}
          table={table}
          field={field}
          value={draft[field.key]}
          data={data}
          draft={draft}
          error={errors[field.key]}
          disabled={locked.includes(field.key)}
          onChange={(value) => setDraft({ ...draft, [field.key]: value })}
        />
      ))}
    </div>
  );
}
function Field({
  table,
  field,
  value,
  data,
  draft,
  error,
  disabled,
  onChange,
}: {
  table: TableName;
  field: SchemaField;
  value: EntityRecord[string];
  data: WorkspaceData;
  draft: EntityRecord;
  error?: string;
  disabled: boolean;
  onChange: (value: EntityRecord[string]) => void;
}) {
  const id = `${table}-${field.key}`;
  const target = foreignTables[field.key];
  const options = choices(table, field.key)?.filter(option=>!(table==='Payments'&&field.key==='status'&&draft.paymentMethod!=='Cash'&&option==='Completed'));
  const long =
    (field.maxLength === undefined && field.type === 'text') ||
    [
      'description',
      'benefits',
      'instructions',
      'goal',
      'address',
      'certificate',
    ].includes(field.key);
  const shared = {
    id,
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? `${id}-error` : undefined,
    disabled,
  };
  let records = target ? data[target].map(asRecord) : [];
  if (target === 'MemberPackages' && draft.memberId)
    records = records.filter((r) => r.memberId === draft.memberId);
  if (target === 'WorkoutPlans' && draft.memberId)
    records = records.filter((r) => r.memberId === draft.memberId);
  if (target === 'Exercises' && table === 'WorkoutResults' && draft.planId)
    records = records.filter((r) =>
      data.WorkoutPlanDetails.some(
        (x) => x.planId === draft.planId && x.exerciseId === r.exerciseId,
      ),
    );
  return (
    <div className={`field ${long ? 'wide' : ''}`}>
      <label htmlFor={id}>
        {field.key==='weight'?['Members','Progress'].includes(table)?'Cân nặng cơ thể (kg)':'Mức tạ bài tập (kg)':(labels[field.key] ?? field.sql)}
        {field.required && <span className="required"> *</span>}
      </label>
      {target ? (
        <NativeSelect
          {...shared}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value || null)}
        >
          <NativeSelectOption value="">
            Chọn {labels[field.key]?.toLowerCase()}
          </NativeSelectOption>
          {records.map((row) => (
            <NativeSelectOption
              key={recordId(target, row)}
              value={String(row[schema[target].key])}
            >
              {entityName(target, row, data)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      ) : options ? (
        <NativeSelect
          {...shared}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((option) => (
            <NativeSelectOption key={option} value={option}>
              {statusLabels[option] ?? option}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      ) : field.type === 'boolean' ? (
        <NativeSelect
          {...shared}
          value={String(value ?? false)}
          onChange={(e) => onChange(e.target.value === 'true')}
        >
          <NativeSelectOption value="true">Có</NativeSelectOption>
          <NativeSelectOption value="false">Không</NativeSelectOption>
        </NativeSelect>
      ) : long ? (
        <Textarea
          {...shared}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          maxLength={field.maxLength}
          rows={3}
        />
      ) : (
        <Input
          {...shared}
          type={
            field.key === 'email'
              ? 'email'
              : field.key === 'phone'
                ? 'tel'
                : field.type === 'number'
                  ? 'number'
                  : field.type === 'date'
                    ? 'date'
                    : field.type === 'datetime2'
                      ? 'datetime-local'
                      : field.type === 'time'
                        ? 'time'
                        : 'text'
          }
          value={typeof value === 'boolean' ? '' : (value ?? '')}
          min={field.type === 'number' ? 0 : undefined}
          step={
            field.integer ? 1 : field.type === 'number' ? '0.01' : undefined
          }
          maxLength={field.maxLength}
          onChange={(e) =>
            onChange(
              field.type === 'number'
                ? e.target.value === ''
                  ? null
                  : ['price','amount','cost'].includes(field.key) ? e.target.value : Number(e.target.value)
                : e.target.value,
            )
          }
        />
      )}{' '}
      {error && (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
export function EntityEditor({
  table,
  row,
  fixed = {},
  onClose,
}: {
  table: TableName;
  row?: EntityRecord;
  fixed?: EntityRecord;
  onClose: () => void;
}) {
  const { data, session, mutate } = useApp();
  const composite = ['Members', 'Trainers', 'Staffs'].includes(table);
  const [initial] = useState<EntityRecord>(() => {
    const base = {
      ...initialDraft(table),
      ...(session?.role === 'Member' ? { memberId: session.memberId } : {}),
      ...(session?.role === 'Trainer' &&
      schema[table].fields.some((f) => f.key === 'trainerId')
        ? { trainerId: session.trainerId }
        : {}),
      ...row,
      ...fixed,
    };
    return table === 'MemberPackages' && !row && data
      ? packageDraft(base, data)
      : base;
  });
  const form = useForm<EntityRecord>({defaultValues:initial,resolver:zodResolver(z.record(z.string(),z.union([z.string(),z.number(),z.boolean(),z.null(),z.undefined()])).superRefine((values,ctx)=>{const skipped=[...Object.keys(fixed),...(composite?['userId']:[]),...(table==='WorkoutSchedules'?['currentParticipants']:[])]; for(const [key,message] of Object.entries(validate(table,values,skipped))) ctx.addIssue({code:'custom',path:[key],message});}))});
  const draft = form.watch();
  const setDraft = (value:EntityRecord) => form.reset(value);
  const [user, setUser] = useState<EntityRecord>(() => ({
    ...initialDraft('Users'),
    ...(row
      ? asRecord(data!.Users.find((u) => u.userId === row.userId) ?? {})
      : {}),
  }));
  const [errors, setErrors] = useState<Record<string, string>>({}),
    [userErrors, setUserErrors] = useState<Record<string, string>>({}),
    [failure, setFailure] = useState(''),
    [busy, setBusy] = useState(false),
    [confirm, setConfirm] = useState(false);
  if (!data) return null;
  const exclude = [
    ...(composite ? ['userId'] : []),
    ...(table === 'WorkoutSchedules' ? ['currentParticipants'] : []),
    ...Object.keys(fixed),
  ];
  const locked = [
    ...(row && table === 'MemberPackages' ? ['memberId', 'packageId', 'price', 'startDate', 'endDate', 'remainingSessions'] : []),
    ...(session?.role === 'Member' ? ['memberId'] : []),
    ...(session?.role === 'Trainer' ? ['trainerId'] : []),
    ...(row && table === 'Bookings' ? ['memberId', 'workoutScheduleId'] : []),
  ];
  async function submit() {
    const issues = validate(table, draft, exclude);
    const userIssues = composite ? validate('Users', user) : {};
    if(composite&&!row&&!isMock&&String(user.password??'').length<8)userIssues.password='Mật khẩu tối thiểu 8 ký tự.';
    setErrors(issues);
    setUserErrors(userIssues);
    setFailure('');
    if (Object.keys(issues).length || Object.keys(userIssues).length) {
      setFailure('Vui lòng kiểm tra các trường được đánh dấu.');
      return;
    }
    if (
      row &&
      ((draft.status !== row.status &&
        ['Inactive', 'Suspended', 'Canceled', 'Failed'].includes(
          String(draft.status),
        )) ||
        ['Roles', 'Permissions', 'UserRoles', 'RolePermissions'].includes(
          table,
        ))
    ) {
      setConfirm(true);
      return;
    }
    await save().catch(() => {});
  }
  async function save() {
    setBusy(true);
    try {
      await mutate(
        (s) =>
          s.save(
            table,
            row ? recordId(table, row) : null,
            draft,
            composite ? user : undefined,
          ),
        row ? 'Đã cập nhật thông tin' : `Đã thêm ${resources[table].singular}`,
      );
      onClose();
    } catch (e) {
      setFailure(errorText(e));
      if (e instanceof ApiError && e.fieldErrors) setErrors(e.fieldErrors);
      throw e;
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open && !busy) onClose();
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="gym-dialog form-dialog"
        >
          <DialogTitle>
            {row ? 'Chỉnh sửa' : 'Thêm'} {resources[table].singular}
          </DialogTitle>
          <DialogDescription>
            Các trường có dấu * là bắt buộc.
          </DialogDescription>
          <form onSubmit={form.handleSubmit(submit,(issues)=>{if(composite){const issues=validate('Users',user);if(!row&&!isMock&&String(user.password??'').length<8)issues.password='Mật khẩu tối thiểu 8 ký tự.';setUserErrors(issues);}setErrors(Object.fromEntries(Object.entries(issues).map(([key,issue])=>[key,String(issue?.message ?? 'Chưa hợp lệ')])));setFailure('Vui lòng kiểm tra các trường được đánh dấu.');})} noValidate>
            <div className="form-scroll">
              {composite && (
                <>
                  <h3 className="form-section-title">Thông tin tài khoản</h3>
                  <FieldGrid
                    table="Users"
                    draft={user}
                    setDraft={setUser}
                    errors={userErrors}
                    data={data}
                  />
                  {!row&&!isMock&&<label className="field">Mật khẩu tài khoản mới *<Input type="password" autoComplete="new-password" value={String(user.password??'')} onChange={e=>setUser({...user,password:e.target.value})} aria-invalid={!!userErrors.password}/>{userErrors.password&&<p className="field-error">{userErrors.password}</p>}<small className="muted">Được hash ở backend; không lưu trong trình duyệt.</small></label>}
                  <h3 className="form-section-title">
                    Thông tin {resources[table].singular}
                  </h3>
                </>
              )}
              {row && table === 'MemberPackages' && <p className="notice-box">Thông tin mua gói được giữ để bảo toàn lịch sử. Chỉ cập nhật trạng thái và ghi chú; gia hạn bằng một lượt đăng ký mới.</p>}
              <FieldGrid
                table={table}
                draft={draft}
                setDraft={(next) =>
                  setDraft(
                    table === 'MemberPackages' &&
                      !row &&
                      (next.packageId !== draft.packageId ||
                        next.startDate !== draft.startDate)
                      ? packageDraft(next, data)
                      : next,
                  )
                }
                errors={errors}
                data={data}
                exclude={exclude}
                locked={locked}
              />
              {failure && (
                <p className="form-alert" role="alert">
                  {failure}
                </p>
              )}
            </div>
            <div className="form-footer">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={busy}
              >
                Hủy
              </Button>
              <Button type="submit" loading={busy}>
                {busy ? 'Đang lưu…' : 'Lưu thông tin'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {confirm && (
        <Confirm
          title="Xác nhận thay đổi?"
          description="Thay đổi trạng thái hoặc phân quyền có thể ảnh hưởng đến quyền sử dụng và dữ liệu liên quan. Kiểm tra thông tin trước khi lưu."
          onConfirm={save}
          onClose={() => setConfirm(false)}
        />
      )}
    </>
  );
}
