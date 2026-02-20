import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { type ProductResponse } from '../services/productService';
import { formatCurrency, formatRelativeTime } from '../lib/utils';
import { Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { usePriceHistory } from '../hooks/usePrices';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: ProductResponse;
  index: number;
  onEdit: (product: ProductResponse) => void;
  onDelete: (id: number) => void;
}

export function ProductCard({ product, index, onEdit, onDelete }: ProductCardProps) {
  const { data: historyData, isLoading: historyLoading } = usePriceHistory(product.id, 7);

  const sparklineData = (historyData ?? []).map(item => ({
    price: item.min_price,
  }));

  const getStatusBadge = () => {
    if (product.status === 'goal_reached') {
      return <Badge variant="success">목표 도달</Badge>;
    } else if (product.status === 'monitoring') {
      return <Badge variant="warning">모니터링 중</Badge>;
    } else {
      return <Badge variant="outline">목표 미설정</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="h-full hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-lg leading-tight">{product.keyword}</h3>
                {getStatusBadge()}
              </div>
              {product.memo && (
                <p className="text-sm text-muted-foreground line-clamp-2">{product.memo}</p>
              )}
            </div>

            {/* Price info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">현재 최저가</p>
                <p className="text-lg font-bold text-[var(--color-purple)]">
                  {product.latest_price != null ? formatCurrency(product.latest_price) : '-'}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <p className="text-xs text-muted-foreground">{product.latest_shop ?? '-'}</p>
                  {product.price_change != null && product.price_change !== 0 && (
                    <span className={`flex items-center text-xs font-medium ${product.price_change < 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                      {product.price_change < 0 ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
                      {product.price_change_rate != null ? `${Math.abs(product.price_change_rate).toFixed(1)}%` : ''}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">목표가</p>
                <p className="text-lg font-bold">
                  {product.target_price ? formatCurrency(product.target_price) : '-'}
                </p>
              </div>
            </div>

            {/* Sparkline */}
            <div className="h-16">
              {historyLoading ? (
                <Skeleton className="h-full w-full" />
              ) : sparklineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparklineData}>
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="var(--color-purple)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  데이터 없음
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">최근 7일 가격 추이</p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(product.created_at)}
              </p>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => onEdit(product)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => onDelete(product.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
