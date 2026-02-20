import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../lib/utils';
import { usePriceHistory } from '../hooks/usePrices';
import { type ProductResponse } from '../services/productService';
import { motion } from 'motion/react';

type PeriodFilter = '7' | '30' | '90' | 'all';

const daysMap: Record<PeriodFilter, number> = {
  '7': 7,
  '30': 30,
  '90': 90,
  'all': 0,
};

interface PriceChartProps {
  products: ProductResponse[];
}

export function PriceChart({ products }: PriceChartProps) {
  const [selectedProduct, setSelectedProduct] = useState<number>(0);
  const [period, setPeriod] = useState<PeriodFilter>('7');

  useEffect(() => {
    if (products.length > 0 && selectedProduct === 0) {
      setSelectedProduct(products[0].id);
    }
  }, [products, selectedProduct]);

  const { data: priceData, isLoading } = usePriceHistory(selectedProduct, daysMap[period]);

  const chartData = (priceData ?? []).map(item => ({
    date: new Date(item.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
    price: item.min_price,
    shop: item.shop,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-background p-3 shadow-lg">
          <p className="text-sm font-medium">{payload[0].payload.date}</p>
          <p className="text-sm text-muted-foreground">{payload[0].payload.shop}</p>
          <p className="text-lg font-bold text-[var(--color-purple)]">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>가격 추이</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(Number(e.target.value))}
                className="rounded-lg border border-border bg-input-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.keyword}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Chart */}
            <div className="h-[300px] w-full">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  수집된 가격 데이터가 없습니다
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      className="text-xs text-muted-foreground"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      className="text-xs text-muted-foreground"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `₩${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="var(--color-purple)"
                      strokeWidth={2}
                      dot={{ fill: 'var(--color-purple)', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Period filters */}
            <div className="flex gap-2">
              {(['7', '30', '90', 'all'] as PeriodFilter[]).map((p) => (
                <Button
                  key={p}
                  variant={period === p ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPeriod(p)}
                >
                  {p === 'all' ? '전체' : `${p}일`}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
