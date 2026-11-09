'use client';
import { usePathname, useRouter } from '@/src/routes/router';
import { useEffect, lazy, Suspense } from 'react';
import { AppProvider, useApp } from './provider';
import {
  ProtectedContent,
  Loading,
  ErrorPage,
  ErrorState,
  PageHeading,
} from '@/src/components/common';
import { Login } from '@/src/features/auth/login';
import MarketingHome from '@/src/features/marketing/LocalizedHome';
import { AppShell } from '@/src/layouts/app-shell';
import { routeInfo } from '@/src/routes/navigation';
import { loginDestination } from '@/src/routes/login-destination';
const Dashboard = lazy(() =>
  import('@/src/screens/dashboard').then((m) => ({ default: m.Dashboard })),
);
import { EntityTable } from '@/src/features/resources/entity-table';
const Members = lazy(() =>
  import('@/src/screens/members').then((m) => ({ default: m.Members })),
);
const MemberDetail = lazy(() =>
  import('@/src/screens/members').then((m) => ({ default: m.MemberDetail })),
);
const Trainers = lazy(() =>
  import('@/src/screens/management').then((m) => ({ default: m.Trainers })),
);
const Packages = lazy(() =>
  import('@/src/screens/management').then((m) => ({ default: m.Packages })),
);
const Payments = lazy(() =>
  import('@/src/screens/management').then((m) => ({ default: m.Payments })),
);
const EquipmentPage = lazy(() =>
  import('@/src/screens/management').then((m) => ({
    default: m.EquipmentPage,
  })),
);
const SystemPage = lazy(() =>
  import('@/src/screens/management').then((m) => ({ default: m.SystemPage })),
);
const Schedules = lazy(() =>
  import('@/src/screens/schedules').then((m) => ({ default: m.Schedules })),
);
const CheckInsPage = lazy(() =>
  import('@/src/screens/checkins').then((m) => ({ default: m.CheckInsPage })),
);
const ProgressPage = lazy(() =>
  import('@/src/screens/progress').then((m) => ({ default: m.ProgressPage })),
);
const WorkoutsPage = lazy(() =>
  import('@/src/screens/workouts').then((m) => ({ default: m.WorkoutsPage })),
);
const PlanDetail = lazy(() =>
  import('@/src/screens/workouts').then((m) => ({ default: m.PlanDetail })),
);
const AiPage = lazy(() =>
  import('@/src/screens/ai').then((m) => ({ default: m.AiPage })),
);
const ChurnPage = lazy(() =>
  import('@/src/screens/ai').then((m) => ({ default: m.ChurnPage })),
);
const NotificationsPage = lazy(() =>
  import('@/src/screens/account').then((m) => ({
    default: m.NotificationsPage,
  })),
);
const ProfilePage = lazy(() =>
  import('@/src/screens/account').then((m) => ({ default: m.ProfilePage })),
);
const MemberPortal = lazy(() =>
  import('@/src/screens/account').then((m) => ({ default: m.MemberPortal })),
);
const Reports = lazy(()=>import('@/src/screens/reports').then(m=>({default:m.Reports})));
function Router() {
  const path = usePathname() ?? '/';
  const router = useRouter();
  const { session, checking, data, error, refresh } = useApp();
  useEffect(() => {
    if (!checking && !session && path !== '/login' && path !== '/')
      void router.replace(`/login?returnTo=${encodeURIComponent(path)}`);
    else if (!checking && session && path === '/login') {
      const back = new URLSearchParams(window.location.search).get('returnTo');
      void router.replace(loginDestination(session, back));
    }
  }, [session, checking, path, router]);
  if (path === '/')
    return (
      <MarketingHome
        onLogin={() => router.push('/login?returnTo=%2Fdashboard')}
      />
    );
  if (checking)
    return (
      <main className="boot-screen">
        <Loading />
      </main>
    );
  if (!session) return <Login />;
  const info = routeInfo(path);
  const pages: Record<string, React.ReactNode> = {
    '/reports': <Reports/>,
    '/dashboard': session.role === 'Member' ? <MemberPortal /> : <Dashboard />,
    '/members': <Members />,
    '/trainers': <Trainers />,
    '/equipment': <EquipmentPage />,
    '/packages': <Packages />,
    '/payments': <Payments />,
    '/schedules': <Schedules />,
    '/checkins': <CheckInsPage />,
    '/progress': <ProgressPage />,
    '/workouts': <WorkoutsPage />,
    '/ai': <AiPage />,
    '/churn': <ChurnPage />,
    '/notifications': <NotificationsPage />,
    '/system': <SystemPage />,
    '/profile': <ProfilePage />,
    '/staff': (
      <>
        <PageHeading
          eyebrow="ĐỘI NGŨ"
          title="Nhân viên"
          description="Hồ sơ và thông tin nhân sự phòng gym."
        />
        <EntityTable table="Staffs" />
      </>
    ),
    '/audit': (
      <>
        <PageHeading
          eyebrow="HỆ THỐNG"
          title="Nhật ký hoạt động"
          description="Lịch sử thao tác trong phạm vi bạn được cấp quyền."
        />
        <EntityTable table="AuditLogs" />
      </>
    ),
    '/403': <ErrorPage code="403" />,
    '/404': <ErrorPage code="404" />,
  };
  const memberMatch = path.match(/^\/members\/(\d+)$/),
    planMatch = path.match(/^\/workouts\/(\d+)$/);
  const page =
    pages[path] ??
    (memberMatch ? (
      <MemberDetail id={memberMatch[1]} />
    ) : planMatch ? (
      <PlanDetail id={planMatch[1]} />
    ) : (
      <ErrorPage code="404" />
    ));
  return (
    <AppShell path={path}>
      <ProtectedContent
        session={session}
        required={info?.permission}
        login={<Login />}
      >
        {error ? (
          <ErrorState
            message={error}
            retry={() => void refresh().catch(() => {})}
          />
        ) : !data ? (
          <Loading />
        ) : (
          <Suspense fallback={<Loading />}>
            <div key={path}>{page}</div>
          </Suspense>
        )}
      </ProtectedContent>
    </AppShell>
  );
}
export function GymApp() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}
