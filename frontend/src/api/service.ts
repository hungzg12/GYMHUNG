import type {
  Draft,
  EntityMap,
  TableName,
  WorkspaceData,
} from '@/src/types/entities';
import type { Role, Session } from '@/src/app/permissions';
export interface RegistrationInput {
  username: string;
  email: string;
  fullName: string;
  password: string;
  phone?: string;
}
export interface GymService {
  session(): Promise<Session | null>;
  login(username: string, password: string): Promise<Session>;
  register(input: RegistrationInput): Promise<Session>;
  demoLogin?(role: Role): Promise<Session>;
  resetDemo?(): Promise<void>;
  logout(): Promise<void>;
  load(signal?: AbortSignal): Promise<WorkspaceData>;
  save<K extends TableName>(
    table: K,
    id: string | null,
    draft: Draft<K>,
    userDraft?: Draft<'Users'>,
  ): Promise<EntityMap[K]>;
  remove(table: TableName, id: string): Promise<void>;
  markRead(
    table: 'Notifications' | 'AIRecommendations',
    id?: string,
  ): Promise<void>;
  sendMessage(conversationId: string, message: string): Promise<void>;
  profile(draft: Draft<'Users'>): Promise<void>;
  reorderPlan(planId: string, detailIds: string[]): Promise<void>;
}
export const isMock = import.meta.env.VITE_USE_MOCK === 'true';
export const getService = async (): Promise<GymService> =>
  isMock
    ? (await import('./mock/service')).mockService
    : (await import('./production')).productionService;
