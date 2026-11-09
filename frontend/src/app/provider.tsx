'use client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  getService,
  type GymService,
  type RegistrationInput,
} from '@/src/api/service';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorText } from '@/src/api/client';
import type { Session, Role } from './permissions';
import type { WorkspaceData } from '@/src/types/entities';
import { Toaster, toast } from '@/components/ui/toast';
interface AppState {
  session: Session | null;
  checking: boolean;
  data: WorkspaceData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  register: (input: RegistrationInput) => Promise<void>;
  demoLogin: (role: Role) => Promise<void>;
  logout: () => Promise<void>;
  mutate: <T>(
    action: (service: GymService) => Promise<T>,
    message?: string,
  ) => Promise<T>;
}
const Context = createContext<AppState | null>(null);
const queryClient = new QueryClient({defaultOptions:{queries:{retry:1,refetchOnWindowFocus:false}}});
export function AppProvider({children}:{children:ReactNode}) {return <QueryClientProvider client={queryClient}><AppStateProvider>{children}</AppStateProvider></QueryClientProvider>;}
function AppStateProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const [session, setSession] = useState<Session | null>(null),
    [checking, setChecking] = useState(true),
    [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    getService()
      .then((s) => s.session())
      .then((s) => {
        if (active) setSession(s);
      })
      .catch((e) => {
        if (active) setError(errorText(e));
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    const unauthorized = () => {
      setSession(null);
      client.clear();
      setError(null);
      void getService().then((service) => service.logout());
      toast.add({ title: 'Phiên đăng nhập hết hạn', type: 'warning' });
    };
    window.addEventListener('gym:unauthorized', unauthorized);
    return () => {
      active = false;
      window.removeEventListener('gym:unauthorized', unauthorized);
    };
  }, [client]);
  const workspace = useQuery({queryKey:['workspace', session?.userId, session?.role, session?.permissions.join('|')], enabled:!!session, queryFn:async ({signal}) => (await getService()).load(signal)});
  const data = workspace.data ?? null;
  const loading = workspace.isFetching;
  const refetchWorkspace = workspace.refetch;
  const refresh = useCallback(async () => {setError(null); const result = await refetchWorkspace(); if(result.error) throw result.error; await client.invalidateQueries({queryKey:['resources']}); await client.invalidateQueries({queryKey:['dashboard']}); await client.invalidateQueries({queryKey:['reports']});}, [refetchWorkspace, client]);
  const login = async (username: string, password: string) => {
    const nextSession = await (await getService()).login(username, password);
    client.clear();
    setError(null);
    setSession(nextSession);
  };
  const register = async (input: RegistrationInput) => {
    client.clear();
    setSession(await (await getService()).register(input));
  };
  const demoLogin = async (role: Role) => {
    const service = await getService();
    if (service.demoLogin) {
      client.clear();
      setSession(await service.demoLogin(role));
    }
  };
  const logout = async () => {
    await (await getService()).logout();
    setSession(null);
    client.clear();
  };
  async function mutate<T>(
    action: (service: GymService) => Promise<T>,
    message = 'Đã lưu thay đổi',
  ) {
    try {
      const service = await getService();
      const result = await action(service);
      const updated = await service.session();
      setSession((previous) =>
        JSON.stringify(previous) === JSON.stringify(updated)
          ? previous
          : updated,
      );
      await refresh();
      if (message) toast.add({ title: message, type: 'success' });
      return result;
    } catch (e) {
      toast.add({ title: errorText(e), type: 'error' });
      throw e;
    }
  }
  return (
    <Context.Provider
      value={{
        session,
        checking,
        data,
        loading,
        error: error ?? (workspace.error ? errorText(workspace.error) : null),
        refresh,
        login,
        register,
        demoLogin,
        logout,
        mutate,
      }}
    >
      <Toaster>{children}</Toaster>
    </Context.Provider>
  );
}
export function useApp() {
  const value = useContext(Context);
  if (!value) throw new Error('AppProvider is required');
  return value;
}
