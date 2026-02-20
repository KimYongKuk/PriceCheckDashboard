import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { type ProductResponse } from '../services/productService';
import { formatCurrency } from '../lib/utils';
import { ExternalLink, Package } from 'lucide-react';
import { motion } from 'motion/react';

interface AlertsListProps {
  products: ProductResponse[];
}

export function AlertsList({ products }: AlertsListProps) {
  if (products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>최저가 알림</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Package className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                아직 목표가에 도달한 상품이 없습니다
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>최저가 알림</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                className="flex items-start justify-between rounded-lg border border-border p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{product.keyword}</h4>
                    <Badge variant="success">목표 도달</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">현재가: </span>
                      <span className="font-bold text-[var(--color-success)]">
                        {product.latest_price != null ? formatCurrency(product.latest_price) : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">목표가: </span>
                      <span className="font-medium">
                        {product.target_price ? formatCurrency(product.target_price) : '-'}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{product.latest_shop ?? '-'}</p>
                </div>
                <Button size="sm" variant="outline" className="ml-4" asChild>
                  <a
                    href={product.latest_url ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    구매하기
                  </a>
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
