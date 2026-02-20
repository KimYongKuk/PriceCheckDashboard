import { useState } from 'react';
import { Input } from '../components/ui/input';
import { AddProductDialog } from '../components/AddProductDialog';
import { ProductCard } from '../components/ProductCard';
import { Skeleton } from '../components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { type ProductResponse } from '../services/productService';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '../hooks/useProducts';
import { ApiError } from '../services/api';
import { Search, Package } from 'lucide-react';
import { toast } from 'sonner';

export function Products() {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editProduct, setEditProduct] = useState<ProductResponse | null>(null);
  const [editTargetPrice, setEditTargetPrice] = useState('');
  const [editMemo, setEditMemo] = useState('');

  const { data: products, isLoading } = useProducts(searchQuery || undefined);
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const filteredProducts = products ?? [];

  const handleAdd = async (newProduct: { keyword: string; target_price: number | null; memo: string }) => {
    try {
      await createMutation.mutateAsync({
        keyword: newProduct.keyword,
        target_price: newProduct.target_price,
        memo: newProduct.memo || null,
      });
      toast.success('키워드가 추가되었습니다');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error('이미 등록된 키워드입니다');
      } else {
        toast.error('키워드 추가에 실패했습니다');
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      setDeleteId(null);
      toast.success('키워드가 삭제되었습니다');
    } catch {
      toast.error('키워드 삭제에 실패했습니다');
    }
  };

  const handleEdit = (product: ProductResponse) => {
    setEditProduct(product);
    setEditTargetPrice(product.target_price?.toString() || '');
    setEditMemo(product.memo || '');
  };

  const handleSaveEdit = async () => {
    if (!editProduct) return;

    try {
      await updateMutation.mutateAsync({
        id: editProduct.id,
        data: {
          target_price: editTargetPrice ? Number(editTargetPrice) : null,
          memo: editMemo || null,
        },
      });
      setEditProduct(null);
      toast.success('키워드가 수정되었습니다');
    } catch {
      toast.error('키워드 수정에 실패했습니다');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">키워드 관리</h1>
          <p className="text-muted-foreground mt-1">등록된 키워드를 관리하고 추가하세요</p>
        </div>
        <AddProductDialog onAdd={handleAdd} />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="키워드 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[320px] w-full rounded-lg" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium mb-2">
            {searchQuery ? '검색 결과가 없습니다' : '모니터링할 상품을 등록해보세요'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? '다른 키워드로 검색해보세요'
              : '키워드를 추가하여 가격 모니터링을 시작하세요'}
          </p>
          {!searchQuery && <AddProductDialog onAdd={handleAdd} />}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              onEdit={handleEdit}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>키워드 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 키워드를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={editProduct !== null} onOpenChange={() => setEditProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>키워드 수정</DialogTitle>
            <DialogDescription>
              {editProduct?.keyword}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-target-price">목표가</Label>
              <Input
                id="edit-target-price"
                type="number"
                placeholder="목표 가격을 입력하세요"
                value={editTargetPrice}
                onChange={(e) => setEditTargetPrice(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-memo">메모</Label>
              <Textarea
                id="edit-memo"
                placeholder="메모를 입력하세요"
                value={editMemo}
                onChange={(e) => setEditMemo(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProduct(null)}>
              취소
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
