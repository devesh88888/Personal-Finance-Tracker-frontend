'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAnalytics } from './dashboardService';
import AnalyticsCards from './AnalyticsCards';
import Charts, { type Analytics } from './Charts';

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    const load = async () => {
      if (token) {
        const data = await fetchAnalytics(token);
        setAnalytics(data);
      }
    };
    load();
  }, [token]);

  if (!analytics) {
    return <p className="text-gray-500">Loading analytics...</p>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <AnalyticsCards analytics={analytics} />
      <Charts analytics={analytics} role={user?.role ?? 'guest'} />
    </div>
  );
}
