import type { EntityRecord, TableName } from '@/src/types/entities';
import { schema } from '@/src/types/schema';
import { labels } from './config';
import Decimal from 'decimal.js';
import { localDate, safeUrl } from '@/src/utils/format';
export function validate(
  table: TableName,
  draft: EntityRecord,
  skip: string[] = [],
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of schema[table].fields) {
    if (field.readonly || skip.includes(field.key)) continue;
    const value = draft[field.key];
    const label = labels[field.key] ?? field.sql;
    if (
      field.required &&
      (value === undefined || value === null || String(value).trim() === '')
    )
      errors[field.key] = `Vui lòng nhập ${label.toLowerCase()}.`;
    if (value === null || value === undefined || value === '') continue;
    if (field.maxLength && String(value).length > field.maxLength)
      errors[field.key] = `Tối đa ${field.maxLength} ký tự.`;
    if (
      field.type === 'id' &&
      (typeof value !== 'string' || !/^\d+$/.test(value))
    )
      errors[field.key] = 'Vui lòng chọn một bản ghi hợp lệ.';
    if (
      field.type === 'number' &&
      (!/^(?:\d+)(?:\.\d+)?$/.test(String(value)) ||
        !new Decimal(String(value)).isFinite() ||
        new Decimal(String(value)).isNegative() ||
        (field.integer && !new Decimal(String(value)).isInteger()))
    )
      errors[field.key] = field.integer
        ? 'Nhập số nguyên không âm.'
        : 'Nhập số không âm hợp lệ.';
    if (
      ['date', 'datetime2'].includes(field.type) &&
      Number.isNaN(new Date(String(value)).getTime())
    )
      errors[field.key] = 'Ngày không hợp lệ.';
    if (field.type === 'time' && !/^\d{2}:\d{2}(:\d{2})?$/.test(String(value)))
      errors[field.key] = 'Giờ không hợp lệ.';
    if (field.key.endsWith('Url') && !safeUrl(value))
      errors[field.key] = 'Đường dẫn phải bắt đầu bằng https:// hoặc http://.';
  }
  if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(draft.email)))
    errors.email = 'Email không đúng định dạng.';
  if (draft.phone && !/^\+?[0-9 ()-]{9,20}$/.test(String(draft.phone)))
    errors.phone =
      'Số điện thoại cần 9–20 ký tự số, dấu +, dấu cách hoặc dấu gạch.';
  if (
    draft.startTime &&
    draft.endTime &&
    String(draft.startTime) >= String(draft.endTime)
  )
    errors.endTime = 'Giờ kết thúc phải sau giờ bắt đầu.';
  if (
    draft.startDate &&
    draft.endDate &&
    String(draft.startDate) > String(draft.endDate)
  )
    errors.endDate = 'Ngày kết thúc phải từ ngày bắt đầu trở đi.';
  if (draft.dateOfBirth && String(draft.dateOfBirth) > localDate())
    errors.dateOfBirth = 'Ngày sinh không được ở tương lai.';
  if (typeof draft.capacity === 'number' && draft.capacity < 1)
    errors.capacity = 'Sức chứa tối thiểu là 1.';
  if (
    typeof draft.capacity === 'number' &&
    Number(draft.currentParticipants ?? 0) > draft.capacity
  )
    errors.capacity = 'Sức chứa không được nhỏ hơn số người đã đăng ký.';
  for (const key of ['bodyFat', 'riskScore'])
    if (typeof draft[key] === 'number' && draft[key] > 100)
      errors[key] = 'Giá trị tối đa là 100.';
  if (typeof draft.rating === 'number' && draft.rating > 5)
    errors.rating = 'Đánh giá từ 0 đến 5.';
  for (const key of [
    'sets',
    'reps',
    'durationDays',
    'totalSessions',
    'orderNo',
  ])
    if (typeof draft[key] === 'number' && draft[key] < 1)
      errors[key] = 'Giá trị tối thiểu là 1.';
  return errors;
}
export function bookingError(
  schedule: EntityRecord,
  now = new Date(),
): string | null {
  if (schedule.status !== 'Available') return 'Buổi tập không nhận đặt lịch.';
  if (
    schedule.capacity != null &&
    Number(schedule.currentParticipants) >= Number(schedule.capacity)
  )
    return 'Buổi tập đã đủ chỗ.';
  if (new Date(`${schedule.scheduleDate}T${schedule.endTime}`) <= now)
    return 'Buổi tập đã kết thúc.';
  return null;
}
