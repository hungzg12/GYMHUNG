import { useLocation, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
export const usePathname = () => useLocation().pathname;
export const useSearchParams = () => new URLSearchParams(useLocation().search);
export function useRouter() { const navigate = useNavigate(); return useMemo(() => ({push: (to: string) => navigate(to), replace: (to: string) => navigate(to, {replace: true})}), [navigate]); }
