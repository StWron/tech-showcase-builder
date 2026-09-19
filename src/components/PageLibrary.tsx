import { useState } from 'react';
import { SavedPageSummary } from '@/lib/page-store';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FolderOpen, Trash2, FilePlus2, Layers, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';

interface PageLibraryProps {
  pages: SavedPageSummary[];
  currentPageId: string;
  onOpen: (id: string) => boolean;
  onDelete: (id: string) => boolean;
  onNew: () => void;
  onRefresh: () => void;
}

const formatDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) return '저장 시각 없음';
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const PageLibrary = ({
  pages,
  currentPageId,
  onOpen,
  onDelete,
  onNew,
  onRefresh,
}: PageLibraryProps) => {
  const [open, setOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<SavedPageSummary | null>(null);

  const handleOpenDialog = (next: boolean) => {
    if (next) onRefresh();
    setOpen(next);
  };

  const handleOpenPage = (page: SavedPageSummary) => {
    if (onOpen(page.id)) {
      toast.success('페이지를 열었습니다', { description: page.title });
      setOpen(false);
      return;
    }
    toast.error('페이지를 찾을 수 없습니다');
    onRefresh();
  };

  const handleConfirmDelete = () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);

    if (onDelete(target.id)) {
      toast.success('보관함에서 삭제했습니다', { description: target.title });
      return;
    }
    toast.error('삭제하지 못했습니다');
  };

  const handleNew = () => {
    onNew();
    setOpen(false);
    toast.success('새 페이지를 시작했습니다');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <FolderOpen className="w-4 h-4" />
            보관함
            {pages.length > 0 && (
              <span className="text-[10px] text-muted-foreground">{pages.length}</span>
            )}
          </Button>
        </DialogTrigger>

        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle>페이지 보관함</DialogTitle>
            <DialogDescription>
              이 브라우저에 저장된 페이지입니다. 권한 설정도 함께 보관됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[50vh] overflow-y-auto scrollbar-thin -mx-1 px-1">
            {pages.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">저장된 페이지가 없습니다</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {pages.map((page) => {
                  const isCurrent = page.id === currentPageId;

                  return (
                    <li
                      key={page.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/60 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{page.title}</span>
                          {isCurrent && (
                            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                              편집 중
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{page.category}</span>
                          <span>블록 {page.blockCount}</span>
                          {page.disabledCount > 0 && (
                            <span className="flex items-center gap-1 text-warning">
                              <ShieldOff className="w-3 h-3" />
                              권한 {page.disabledCount}개 off
                            </span>
                          )}
                          <span className="truncate">{formatDate(page.lastModified)}</span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenPage(page)}
                        disabled={isCurrent}
                      >
                        열기
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setPendingDelete(page)}
                        aria-label={`${page.title} 삭제`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <Button variant="outline" onClick={handleNew} className="gap-2 w-full">
            <FilePlus2 className="w-4 h-4" />
            새 페이지 시작
          </Button>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => !next && setPendingDelete(null)}
      >
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>이 페이지를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong className="text-foreground">{pendingDelete?.title}</strong> 을(를) 보관함에서
              지웁니다. 이 브라우저에만 저장돼 있으므로 되돌릴 수 없습니다. 남겨두려면 먼저 소스
              파일로 저장하세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
