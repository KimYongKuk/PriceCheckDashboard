import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Plus } from 'lucide-react';

interface AddProductDialogProps {
  onAdd: (product: { keyword: string; target_price: number | null; memo: string }) => void;
}

export function AddProductDialog({ onAdd }: AddProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [memo, setMemo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onAdd({
      keyword,
      target_price: targetPrice ? Number(targetPrice) : null,
      memo: memo || '',
    });

    // Reset form
    setKeyword('');
    setTargetPrice('');
    setMemo('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-[var(--color-purple)] to-[var(--color-pink)] hover:opacity-90">
          <Plus className="mr-2 h-4 w-4" />
          키워드 추가
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>새 키워드 추가</DialogTitle>
            <DialogDescription>
              모니터링할 상품의 키워드를 등록하세요
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="keyword">상품명 (키워드) *</Label>
              <Input
                id="keyword"
                placeholder="예: 빼빼로 오리지널 54g"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="target_price">목표가 (선택)</Label>
              <Input
                id="target_price"
                type="number"
                placeholder="예: 1200"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                이 가격 이하일 때 알림을 받습니다
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="memo">메모 (선택)</Label>
              <Textarea
                id="memo"
                placeholder="메모를 입력하세요"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button type="submit" disabled={!keyword}>
              등록
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
