import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { formatCurrency, formatRelativeTime, calculatePriceChange } from '../lib/utils';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { useRecentCollections } from '../hooks/usePrices';
import { motion } from 'motion/react';

export function RecentCollectionsTable() {
  const { data: collections, isLoading } = useRecentCollections(10);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>최근 수집</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !collections || collections.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              수집된 데이터가 없습니다
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-3 text-left text-sm font-medium text-muted-foreground">상품명</th>
                      <th className="pb-3 text-left text-sm font-medium text-muted-foreground">쇼핑몰</th>
                      <th className="pb-3 text-right text-sm font-medium text-muted-foreground">가격</th>
                      <th className="pb-3 text-right text-sm font-medium text-muted-foreground">변동</th>
                      <th className="pb-3 text-right text-sm font-medium text-muted-foreground">수집 시간</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collections.map((item, index) => {
                      const change = calculatePriceChange(item.price, item.previous_price);

                      return (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.7 + index * 0.05 }}
                          className="border-b border-border last:border-0"
                        >
                          <td className="py-3 text-sm">{item.product_name}</td>
                          <td className="py-3 text-sm text-muted-foreground">{item.shop}</td>
                          <td className="py-3 text-right text-sm font-medium">
                            {formatCurrency(item.price)}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {change.direction === 'down' && (
                                <>
                                  <ArrowDown className="h-4 w-4 text-[var(--color-success)]" />
                                  <span className="text-sm font-medium text-[var(--color-success)]">
                                    {change.percentage.toFixed(1)}%
                                  </span>
                                </>
                              )}
                              {change.direction === 'up' && (
                                <>
                                  <ArrowUp className="h-4 w-4 text-[var(--color-danger)]" />
                                  <span className="text-sm font-medium text-[var(--color-danger)]">
                                    {change.percentage.toFixed(1)}%
                                  </span>
                                </>
                              )}
                              {change.direction === 'same' && (
                                <Minus className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-right text-sm text-muted-foreground">
                            {formatRelativeTime(item.collected_at)}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
