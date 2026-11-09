import {z} from 'zod';
import { schema } from '@/src/types/schema';
import { ApiError, request } from './client';
import type { GymService } from './service';
import type { Session } from '@/src/app/permissions';
import type { Draft, EntityRecord, EntityMap, TableName, WorkspaceData } from '@/src/types/entities';

const api = import.meta.env.VITE_API_BASE_URL ?? '';
let accessToken: string | null = null;
// Remove obsolete persistent credentials from the prior adapter. Business demo data stays intact.
if(typeof localStorage!=='undefined'){localStorage.removeItem('gymhung.jwt');localStorage.removeItem('gymhung.session');}
const token = () => accessToken;
const auth = (): HeadersInit => {
  const value = token();
  return value ? { Authorization: `Bearer ${value}` } : {};
};
const sessionSchema = z.object({userId:z.string().regex(/^\d+$/),fullName:z.string(),role:z.enum(['Admin','Staff','Trainer','Member']),permissions:z.array(z.string()),memberId:z.string().nullish(),trainerId:z.string().nullish()});
type LoginResponse = Session & { token: string };
const verifiedSession = (value: unknown): Session => {const parsed=sessionSchema.parse(value);return {...parsed,memberId:parsed.memberId??undefined,trainerId:parsed.trainerId??undefined};};

// Form defaults and loaded rows include system fields. Only send editable SQL fields;
// composite user ownership is established by the backend, never an empty client FK.
function editableDraft(table: TableName, value: object, allowPassword = false): EntityRecord {
  const allowed = new Set(schema[table].fields.filter(field => !field.readonly).map(field => field.key));
  if (allowPassword) allowed.add('password');
  if (['Members', 'Trainers', 'Staffs'].includes(table)) allowed.delete('userId');
  if (table === 'WorkoutSchedules') allowed.delete('currentParticipants');
  return Object.fromEntries(Object.entries(value).filter(([key]) => allowed.has(key)));
}

export const productionService: GymService = {
  async session() {
    if (!accessToken) return null;
    return verifiedSession(await request<unknown>(api, '/api/auth/me', {}, auth()));
  },
  async login(username, password) {
    let result: LoginResponse;
    try {
      result = await request<LoginResponse>(api, '/api/auth/login', { method: 'POST', body: JSON.stringify({ username: username.trim(), password }) });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) throw new ApiError(401, 'Tên đăng nhập hoặc mật khẩu không đúng.');
      throw error;
    }
    accessToken = result.token;
    try {return verifiedSession(await request<unknown>(api,'/api/auth/me',{},auth()));} catch(error){accessToken=null;throw error;}
  },
  async register(input) {
    await request(api, '/api/auth/register-member', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return this.login(input.username, input.password);
  },
  async logout() {
    accessToken = null;
  },
  async load(signal) {
    const data = await request<WorkspaceData>(api, '/api/workspace', { signal }, auth());
    for(const [table,rows] of Object.entries(data)) for(const row of rows) for(const field of schema[table as TableName].fields) {
      if(field.type === 'number' && !['price','amount','cost'].includes(field.key) && typeof (row as unknown as EntityRecord)[field.key] === 'string') (row as unknown as EntityRecord)[field.key] = Number((row as unknown as EntityRecord)[field.key]);
    }
    return data;
  },
  async save<K extends TableName>(table: K, id: string | null, draft: Draft<K>, userDraft?: Draft<'Users'>): Promise<EntityMap[K]> {
    const payload = editableDraft(table, draft);
    const businessDraft = table === 'MemberPackages' && id
      ? Object.fromEntries(Object.entries(payload).filter(([key]) => ['status', 'notes'].includes(key)))
      : payload;
    return request<EntityMap[K]>(api, `/api/workspace/${table}${id ? `/${id}` : ''}`, { method: 'PUT', body: JSON.stringify({ draft: businessDraft, userDraft: userDraft ? editableDraft('Users', userDraft, !id) : undefined }) }, auth());
  },
  async remove(table, id) {
    await request<void>(api, `/api/workspace/${table}/${id}`, { method: 'DELETE' }, auth());
  },
  async markRead(table, id) {
    await request(api, `/api/workspace/${table}${id ? `/${id}` : ''}`, { method: 'PUT', body: JSON.stringify({ draft: { isRead: true } }) }, auth());
  },
  async sendMessage(conversationId, message) {
    await request(api, `/api/ai/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify({ message }) }, auth());
  },
  async profile(draft) {
    const current = await this.session();
    if (!current) throw new ApiError(401, 'Phiên đăng nhập đã hết hạn.');
    await request(api, '/api/auth/profile', { method: 'PUT', body: JSON.stringify(Object.fromEntries(['fullName','phone','gender','dateOfBirth','avatarUrl'].filter(key=>key in draft).map(key=>[key,(draft as unknown as EntityRecord)[key]]))) }, auth());
  },
  async reorderPlan(planId, detailIds) {
    await Promise.all(detailIds.map((detailId, index) => request(api, `/api/workspace/WorkoutPlanDetails/${detailId}`, { method: 'PUT', body: JSON.stringify({ draft: { orderNo: index + 1, planId } }) }, auth())));
  },
};

export const apiRequest = <T,>(path: string, init: RequestInit = {}) => request<T>(api, path, init, auth());
