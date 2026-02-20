import { Package, Bell, Database, TrendingDown } from 'lucide-react';
import { StatsCard } from '../components/StatsCard';
import { PriceChart } from '../components/PriceChart';
import { AlertsList } from '../components/AlertsList';
import { RecentCollectionsTable } from '../components/RecentCollectionsTable';
import { useDashboardSummary } from '../hooks/useDashboard';
import { useProducts } from '../hooks/useProducts';
import { Skeleton } from '../components/ui/skeleton';

export function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: products, isLoading: productsLoading } = useProducts();

  const goalReachedProducts = (products ?? []).filter(p => p.status === 'goal_reached');

  const stats = [
    {
      title: '모니터링 중',
      value: summaryLoading ? '-' : (summary?.total_products ?? 0),
      icon: Package,
      color: 'var(--color-purple)',
    },
    {
      title: '최저가 알림',
      value: summaryLoading ? '-' : (summary?.goal_reached_count ?? 0),
      icon: Bell,
      color: 'var(--color-success)',
    },
    {
      title: '오늘 수집',
      value: summaryLoading ? '-' : (summary?.today_collected_count ?? 0),
      icon: Database,
      color: 'var(--color-info)',
    },
    {
      title: '평균 절감율',
      value: summaryLoading ? '-' : `${(summary?.avg_saving_rate ?? 0).toFixed(1)}%`,
      icon: TrendingDown,
      color: 'var(--color-warning)',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">대시보드</h1>
        <p className="text-muted-foreground mt-1">상품 가격 추이를 한눈에 확인하세요</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatsCard key={stat.title} {...stat} index={index} />
        ))}
      </div>

      {/* Price Chart */}
      {productsLoading ? (
        <Skeleton className="h-[400px] w-full rounded-lg" />
      ) : (
        <PriceChart products={products ?? []} />
      )}

      {/* Alerts List */}
      <AlertsList products={goalReachedProducts} />

      {/* Recent Collections */}
      <RecentCollectionsTable />
    </div>
  );
}
