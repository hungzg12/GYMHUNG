'use client';
import Decimal from 'decimal.js';
import {useQuery} from '@tanstack/react-query';
import {isMock} from '@/src/api/service';
import {apiRequest} from '@/src/api/production';
import {errorText} from '@/src/api/client';
import { useState } from 'react';
import { useSearchParams } from '@/src/routes/router';
import Link from '@/src/routes/link';
import {
  Plus,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Eye,
  Pencil,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
} from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useApp } from '@/src/app/provider';
import { can, permission } from '@/src/app/permissions';
import { schema } from '@/src/types/schema';
import {
  asRecord,
  type EntityRecord,
  type TableName,
} from '@/src/types/entities';
import { Badge, EmptyState } from '@/src/components/common';
import { Confirm } from '@/src/components/confirm';
import { EntityEditor } from './entity-form';
import {
  entityName,
  foreignTables,
  labels,
  lookup,
  recordId,
  resources,
  statusLabels,
} from './config';
import { date, fold, initials, money, safeUrl } from '@/src/utils/format';
export function EntityTable({
  table,
  fixed = {},
  title,
  compact = false,
  allowWrite = true,
}: {
  table: TableName;
  fixed?: EntityRecord;
  title?: string;
  compact?: boolean;
  allowWrite?: boolean;
}) {
  const { data, session, mutate } = useApp();
  const params = useSearchParams();
  const [query, setQuery] = useState(''),
    [filters, setFilters] = useState<Record<string, string>>({}),
    [sort, setSort] = useState({ key: resources[table].columns[0], dir: 1 }),
    [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(8),
    [dateFrom, setDateFrom] = useState(''),
    [dateTo, setDateTo] = useState(''),
    [editor, setEditor] = useState<EntityRecord | null | false>(() =>
      params?.get('new') === '1' && table === 'Members' ? null : false,
    ),
    [detail, setDetail] = useState<EntityRecord | null>(null),
    [remove, setRemove] = useState<EntityRecord | null>(null);
  const server = useQuery({queryKey:['resources',session?.userId,session?.role,session?.permissions.join('|'),table,query,filters,fixed,sort,page,pageSize,dateFrom,dateTo],enabled:!isMock && !!data,queryFn:({signal})=>{
    const params=new URLSearchParams({page:String(page),pageSize:String(pageSize),search:query,sort:sort.key,direction:sort.dir===1?'asc':'desc',dateFrom,dateTo});
    for(const [key,value] of Object.entries({...filters,...fixed})) if(value != null && value !== '') params.set(key,String(value));
    return apiRequest<{items:EntityRecord[];page:number;pageSize:number;totalCount:number}>(`/api/resources/${table}?${params}`,{signal});
  }});
  if (!data) return null;
  const config = resources[table],
    write =
      allowWrite &&
      !config.readonly &&
      can(session, permission(table, 'write'));
  const all = data[table]
    .map(asRecord)
    .filter((row) =>
      Object.entries(fixed).every(([key, value]) => row[key] === value),
    );
  const dateKey = schema[table].fields.find((f) =>
    [
      'joinDate',
      'hireDate',
      'scheduleDate',
      'recordDate',
      'workoutDate',
      'workDate',
      'maintenanceDate',
      'paidAt',
      'checkInTime',
      'createdAt',
    ].includes(f.key),
  )?.key;
  const display = (row: EntityRecord, key: string): string =>
    foreignTables[key] ? lookup(key, row[key], data) : String(row[key] ?? '');
  const filtered = all
    .filter((row) => {
      const user =
        table === 'Members' || table === 'Trainers' || table === 'Staffs'
          ? data.Users.find((u) => u.userId === row.userId)
          : undefined;
      const text = [
        ...config.columns.map((key) => display(row, key)),
        user?.email,
        user?.phone,
      ].join(' ');
      return (
        fold(text).includes(fold(query)) &&
        Object.entries(filters).every(
          ([key, value]) => !value || String(row[key]) === value,
        ) &&
        (!dateFrom ||
          !dateKey ||
          String(row[dateKey] ?? '').slice(0, 10) >= dateFrom) &&
        (!dateTo ||
          !dateKey ||
          String(row[dateKey] ?? '').slice(0, 10) <= dateTo)
      );
    })
    .sort((a, b) =>
      ['price','amount','cost'].includes(sort.key) && a[sort.key]!=null&&b[sort.key]!=null
        ? new Decimal(String(a[sort.key])).comparedTo(String(b[sort.key])) * sort.dir
        : typeof a[sort.key] === 'number' && typeof b[sort.key] === 'number'
        ? (Number(a[sort.key]) - Number(b[sort.key])) * sort.dir
        : display(a, sort.key).localeCompare(display(b, sort.key), 'vi', {
            numeric: true,
          }) * sort.dir,
    );
  const total = isMock ? filtered.length : (server.data?.totalCount ?? 0);
  const pages = Math.max(1, Math.ceil(total / pageSize)),
    currentPage = Math.min(page, pages),
    visible = isMock ? filtered.slice((currentPage-1)*pageSize,currentPage*pageSize) : (server.data?.items ?? []);
  function cell(row: EntityRecord, key: string) {
    const value = row[key];
    if (
      key === 'userId' &&
      ['Members', 'Trainers', 'Staffs', 'Users'].includes(table)
    ) {
      const user = data!.Users.find((u) => u.userId === value);
      return (
        <span className="table-person">
          <span className="avatar small">{initials(user?.fullName ?? '')}</span>
          <span>
            <strong>{user?.fullName ?? 'Chưa có hồ sơ'}</strong>
            <small>{user?.email}</small>
          </span>
        </span>
      );
    }
    if (['status', 'riskLevel', 'transactionStatus'].includes(key))
      return <Badge value={value} />;
    if (foreignTables[key]) return lookup(key, value, data!);
    if (['amount', 'price', 'cost'].includes(key))
      return <strong className="money">{money(String(value ?? 0))}</strong>;
    if (typeof value === 'boolean') return value ? 'Có' : 'Không';
    const type = schema[table].fields.find((f) => f.key === key)?.type;
    if (type === 'date' || type === 'datetime2')
      return date(value, type === 'datetime2');
    return statusLabels[String(value)] ?? String(value ?? '—');
  }
  return (
    <section className={`panel entity-panel ${compact ? 'compact' : ''}`}>
      <div className="table-title">
        <div>
          <h2>{title ?? config.title}</h2>
          <span className="count-chip">{all.length}</span>
        </div>
        {write && (
          <Button onClick={() => setEditor(null)}>
            <Plus size={16} />
            Thêm {config.singular}
          </Button>
        )}
      </div>
      <div className="table-toolbar">
        <div className="table-search">
          <Search size={17} />
          <Input
            aria-label={`Tìm ${config.title.toLowerCase()}`}
            placeholder={
              table === 'Members'
                ? 'Tìm tên, email, số điện thoại…'
                : `Tìm kiếm ${config.title.toLowerCase()}…`
            }
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {config.filters
          ?.filter((key) => !Object.hasOwn(fixed, key))
          .map((key) => (
            <NativeSelect
              key={key}
              aria-label={`Lọc ${labels[key]?.toLowerCase()}`}
              value={filters[key] ?? ''}
              onChange={(e) => {
                setFilters({ ...filters, [key]: e.target.value });
                setPage(1);
              }}
            >
              <NativeSelectOption value="">
                Tất cả {labels[key]?.toLowerCase()}
              </NativeSelectOption>
              {[...new Set(all.map((row) => String(row[key] ?? '')))]
                .filter(Boolean)
                .map((value) => (
                  <NativeSelectOption key={value} value={value}>
                    {foreignTables[key]
                      ? lookup(key, value, data)
                      : (statusLabels[value] ??
                        (value === 'true'
                          ? 'Có'
                          : value === 'false'
                            ? 'Không'
                            : value))}
                  </NativeSelectOption>
                ))}
            </NativeSelect>
          ))}
        <span className="filter-symbol" title="Tìm kiếm và bộ lọc">
          <SlidersHorizontal size={16} />
        </span>
      </div>
      {dateKey && (
        <div className="date-filters">
          <label htmlFor={`${table}-from`}>
            Từ ngày
            <Input
              id={`${table}-from`}
              aria-label="Từ ngày"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <label htmlFor={`${table}-to`}>
            Đến ngày
            <Input
              id={`${table}-to`}
              aria-label="Đến ngày"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
            />
          </label>
          {(query ||
            dateFrom ||
            dateTo ||
            Object.values(filters).some(Boolean)) && (
            <button
              className="text-link"
              onClick={() => {
                setQuery('');
                setFilters({});
                setDateFrom('');
                setDateTo('');
                setPage(1);
              }}
            >
              <X size={14} />
              Xóa bộ lọc
            </button>
          )}
        </div>
      )}
      {server.isFetching && !isMock && <output className="inline-empty">Đang tải dữ liệu…</output>}
      {server.error && !isMock && <p className="form-alert" role="alert">{errorText(server.error)} <button onClick={()=>void server.refetch()}>Thử lại</button></p>}
      {visible.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              {config.columns
                .filter((k) => !Object.hasOwn(fixed, k))
                .map((key) => (
                  <TableHead
                    key={key}
                    aria-sort={
                      sort.key === key
                        ? sort.dir === 1
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <button
                      className="column-sort"
                      onClick={() =>
                        setSort({ key, dir: sort.key === key ? -sort.dir : 1 })
                      }
                    >
                      {labels[key] ?? key}
                      <ArrowUpDown size={12} />
                    </button>
                  </TableHead>
                ))}
              <TableHead className="actions-head">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row) => (
              <TableRow key={recordId(table, row)}>
                {config.columns
                  .filter((k) => !Object.hasOwn(fixed, k))
                  .map((key) => (
                    <TableCell key={key}>
                      <span
                        className={
                          key === 'description' ||
                          key === 'goal' ||
                          key === 'factors' ||
                          key === 'content' ||
                          key === 'message' ||
                          key === 'recommendedActions'
                            ? 'cell-truncate'
                            : ''
                        }
                      >
                        {cell(row, key)}
                      </span>
                    </TableCell>
                  ))}
                <TableCell>
                  <div className="row-actions">
                    {table === 'Members' ? (
                      <Link
                        className="icon-button"
                        href={`/members/${recordId(table, row)}`}
                        aria-label={`Xem ${entityName(table, row, data)}`}
                      >
                        <Eye size={16} />
                      </Link>
                    ) : table === 'WorkoutPlans' ? (
                      <Link
                        className="icon-button"
                        href={`/workouts/${recordId(table, row)}`}
                        aria-label={`Xem ${entityName(table, row, data)}`}
                      >
                        <Eye size={16} />
                      </Link>
                    ) : (
                      <button
                        className="icon-button"
                        aria-label={`Xem ${entityName(table, row, data)}`}
                        onClick={() => setDetail(row)}
                      >
                        <Eye size={16} />
                      </button>
                    )}
                    {write && !(table === 'Payments' && row.status === 'Completed') && (
                      <button
                        className="icon-button"
                        aria-label={`Sửa ${entityName(table, row, data)}`}
                        onClick={() => setEditor(row)}
                      >
                        <Pencil size={15} />
                      </button>
                    )}
                    {write &&
                      [
                        'Packages',
                        'WorkoutPlans',
                        'WorkoutPlanDetails',
                        'UserRoles',
                        'RolePermissions',
                      ].includes(table) && (
                        <button
                          className="icon-button"
                          aria-label={`Xóa ${entityName(table, row, data)}`}
                          onClick={() => setRemove(row)}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState
          title={all.length ? 'Không tìm thấy kết quả' : 'Chưa có dữ liệu'}
          description={
            all.length
              ? 'Thử thay đổi từ khóa hoặc bộ lọc.'
              : `Thêm ${config.singular} để bắt đầu.`
          }
        />
      )}
      <div className="table-pagination">
        <span>
          Hiển thị {total ? (currentPage - 1) * pageSize + 1 : 0}–
          {Math.min(currentPage * pageSize, total)} /{' '}
          {total} kết quả
        </span>
        <div>
          <NativeSelect
            aria-label="Số dòng mỗi trang"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[8, 16, 32].map((n) => (
              <NativeSelectOption key={n} value={n}>
                {n} dòng
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <button
            className="icon-button"
            aria-label="Trang trước"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span>
            {currentPage} / {pages}
          </span>
          <button
            className="icon-button"
            aria-label="Trang sau"
            disabled={currentPage === pages}
            onClick={() => setPage(currentPage + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      {editor !== false && (
        <EntityEditor
          key={editor ? recordId(table, editor) : 'new'}
          table={table}
          row={editor ?? undefined}
          fixed={fixed}
          onClose={() => setEditor(false)}
        />
      )}
      <Sheet
        open={Boolean(detail)}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      >
        <SheetContent className="detail-sheet">
          <SheetTitle>
            {detail ? entityName(table, detail, data) : config.title}
          </SheetTitle>
          <SheetDescription>Thông tin {config.singular}</SheetDescription>
          {detail && (
            <dl className="definition-list">
              {schema[table].fields
                .filter(
                  (f) => f.key !== schema[table].key && detail[f.key] != null,
                )
                .map((f) => (
                  <div key={f.key}>
                    <dt>{labels[f.key] ?? f.sql}</dt>
                    <dd>
                      {f.key.endsWith('Url') && safeUrl(detail[f.key]) ? (
                        <a
                          href={safeUrl(detail[f.key])}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Mở liên kết
                        </a>
                      ) : (
                        cell(detail, f.key)
                      )}
                    </dd>
                  </div>
                ))}
            </dl>
          )}
        </SheetContent>
      </Sheet>
      {remove && (
        <Confirm
          title="Xóa bản ghi?"
          description="Bản ghi đang được sử dụng sẽ không thể xóa. Việc thu hồi vai trò hoặc quyền sẽ áp dụng ngay cho phiên demo."
          onClose={() => setRemove(null)}
          onConfirm={() =>
            mutate(
              (s) => s.remove(table, recordId(table, remove)),
              'Đã xóa bản ghi',
            )
          }
        />
      )}
    </section>
  );
}
