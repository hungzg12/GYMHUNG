import type { Scalar } from '@/src/types/entities';
import Decimal from 'decimal.js';
export const decimalSum = (values: (string | number | null | undefined)[]) => values.reduce<Decimal>((sum,value)=>sum.plus(value ?? 0),new Decimal(0)).toFixed();
export const money = (value: string | number | Decimal) => `${new Decimal(value).toDecimalPlaces(0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g,'.')} ₫`;
export const compactMoney = (value: string | number) => new Decimal(value).gte(1000000) ? `${new Decimal(value).div(1000000).toDecimalPlaces(1).toFixed().replace('.',',')} tr ₫` : money(value);
export const number = (value: number) =>
  new Intl.NumberFormat('vi-VN').format(value);
/** SQL date/time values have gym-local wall time (Asia/Ho_Chi_Minh), no invented UTC suffix. */
export function date(value: Scalar, withTime=false) {
 if(typeof value !== 'string'||!value)return '—';
 const match=value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T| )(\d{2}):(\d{2})/);
 const day=value.match(/^(\d{4})-(\d{2})-(\d{2})/);
 if(day && !/[Zz]|[+-]\d{2}:?\d{2}$/.test(value)) return `${day[3]}/${day[2]}/${day[1]}${withTime&&match?` ${match[4]}:${match[5]}`:''}`;
 const parsed=new Date(value);return Number.isNaN(parsed.getTime())?value:new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',year:'numeric',...(withTime?{hour:'2-digit',minute:'2-digit',hourCycle:'h23' as const}:{})}).format(parsed);
}
export const localDate = (value = new Date()) => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(value);
export const gymNow = () => {const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Ho_Chi_Minh',hourCycle:'h23',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date());return `${localDate()}T${parts}`;};
export function offsetDate(days: number) {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return localDate(value);
}
export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
export const fold = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi');
export function safeUrl(value: Scalar) {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
