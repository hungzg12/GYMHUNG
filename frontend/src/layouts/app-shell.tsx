'use client';
import { useState, useEffect, type ReactNode } from 'react';
import Link from '@/src/routes/link';
import { Search, Bell, ChevronRight, LogOut, ArrowUpRight, Sun, Moon } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useApp } from '@/src/app/provider';
import { can } from '@/src/app/permissions';
import { navigation, routeInfo } from '@/src/routes/navigation';
import { Brand } from '@/src/components/common';
import { isMock } from '@/src/api/service';
import { fold, initials } from '@/src/utils/format';
function Nav({ path }: { path: string }) {
  const { session, logout } = useApp();
  const { setOpenMobile } = useSidebar();
  const items = navigation.filter((x) => can(session, x.permission));
  const groups = [...new Set(items.map((x) => x.group))];
  return (
    <Sidebar collapsible="icon" className="gym-sidebar">
      <SidebarHeader>
        <Link
          href="/dashboard"
          aria-label="GYMHUNG - Trang tổng quan"
          className="brand-link"
        >
          <Brand />
        </Link>
        <div className="workspace-label">
          <span className="workspace-dot" />
          <span>Phòng gym của bạn</span>
          <ChevronRight size={14} />
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group}>
            <SidebarGroupLabel>{group}</SidebarGroupLabel>
            <SidebarMenu>
              {items
                .filter((x) => x.group === group)
                .map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      render={<Link href={item.path} />}
                      isActive={
                        path === item.path || path.startsWith(`${item.path}/`)
                      }
                      tooltip={item.title}
                      onClick={() => setOpenMobile(false)}
                    >
                      <item.icon size={18} />
                      <span>
                        {session?.role === 'Member' && item.path === '/dashboard'
                          ? 'Tổng quan của tôi'
                          : item.title}
                      </span>
                      {item.path === '/ai' && (
                        <small className="ai-label">AI</small>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <div className="sidebar-account">
          <Link href="/profile" className="account-link">
            <span className="avatar">{initials(session?.fullName ?? '')}</span>
            <span className="account-copy">
              <strong>{session?.fullName}</strong>
              <small>{session?.role}</small>
            </span>
          </Link>
          <button
            className="icon-button"
            aria-label="Đăng xuất"
            onClick={() => void logout()}
          >
            <LogOut size={17} />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
export function AppShell({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}) {
  const { session, data } = useApp();
  const [dark,setDark] = useState(() => localStorage.getItem('gymhung.theme') === 'dark');
  useEffect(()=>{document.documentElement.classList.toggle('dark',dark);localStorage.setItem('gymhung.theme',dark?'dark':'light');},[dark]);
  const [searchOpen, setSearchOpen] = useState(false),
    [search, setSearch] = useState('');
  const unread = data?.Notifications.filter((n) => !n.isRead).length ?? 0;
  const results = navigation.filter(
    (x) => can(session, x.permission) && fold(x.title).includes(fold(search)),
  );
  const members =
    can(session, 'members.read') && search
      ? (data?.Members.filter((m) => {
          const u = data.Users.find((u) => u.userId === m.userId);
          return fold(`${u?.fullName} ${u?.email} ${u?.phone}`).includes(
            fold(search),
          );
        }).slice(0, 5) ?? [])
      : [];
  return (
    <SidebarProvider className="gym-provider">
      <a className="skip-link" href="#main-content">
        Đến nội dung chính
      </a>
      <Nav path={path} />
      <SidebarInset className="gym-inset">
        <header className="topbar">
          <div className="breadcrumb">
            <SidebarTrigger aria-label="Đóng / mở menu" />
            <span className="breadcrumb-home">Không gian làm việc</span>
            <ChevronRight size={14} />
            <strong>{routeInfo(path)?.title ?? 'Trang hệ thống'}</strong>
          </div>
          <div className="topbar-actions"><button className="icon-button" aria-label={dark?'Bật giao diện sáng':'Bật giao diện tối'} onClick={()=>setDark(!dark)}>{dark?<Sun size={19}/>:<Moon size={19}/>}</button>
            <button
              className="global-search"
              aria-label="Tìm kiếm nhanh"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={17} />
              <span>Tìm kiếm nhanh…</span>
            </button>
            {isMock && <span className="demo-chip">DEMO</span>}
            <Link
              className="icon-button notification-button"
              href="/notifications"
              aria-label={`Thông báo, ${unread} chưa đọc`}
            >
              <Bell size={19} />
              {unread > 0 && <i />}
            </Link>
            <Link
              href="/profile"
              aria-label="Hồ sơ cá nhân"
              className="avatar small"
            >
              {initials(session?.fullName ?? '')}
            </Link>
          </div>
        </header>
        <div id="main-content" className="main-content">
          {children}
          <footer className="page-footer">
            <span>
              GYMHUNG <span className="muted">/</span> MANAGEMENT + AI
            </span>
            <span>
              {isMock
                ? 'Chế độ demo · Dữ liệu lưu tại trình duyệt'
                : 'React → ASP.NET Core API'}
            </span>
          </footer>
        </div>
      </SidebarInset>
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="gym-dialog search-dialog">
          <DialogTitle>Tìm kiếm nhanh</DialogTitle>
          <DialogDescription>
            Đi đến màn hình hoặc tìm hồ sơ hội viên.
          </DialogDescription>
          <Input
            aria-label="Tìm kiếm toàn hệ thống"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tên chức năng, hội viên, email…"
          />
          <div className="search-results">
            {results.map((item) => (
              <Link
                onClick={() => setSearchOpen(false)}
                key={item.path}
                href={item.path}
              >
                <item.icon size={18} />
                {item.title}
                <ArrowUpRight size={16} />
              </Link>
            ))}
            {members.map((member) => {
              const user = data!.Users.find((u) => u.userId === member.userId);
              return (
                <Link
                  key={member.memberId}
                  href={`/members/${member.memberId}`}
                  onClick={() => setSearchOpen(false)}
                >
                  <span className="avatar small">
                    {initials(user?.fullName ?? '')}
                  </span>
                  {user?.fullName}
                  <ArrowUpRight size={16} />
                </Link>
              );
            })}
            {!results.length && !members.length && (
              <p>Không tìm thấy kết quả phù hợp.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
