'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageLoader } from '@/components/ui/page-loader';
import { GuildsDashboard } from '@/components/dashboard/guilds-dashboard';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';

export function DashboardHome() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('user');

  useEffect(() => {
    let cancelled = false;
    async function loadMe() {
      try {
        const res = await fetch('/auth/me', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!res.ok) {
          router.push('/login?next=/dashboard');
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (!cancelled) setRole(data?.user?.role || 'user');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadMe();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) return <PageLoader label="Loading dashboard" />;
  if (role === 'super_admin') return <AdminDashboard />;
  return <GuildsDashboard />;
}
