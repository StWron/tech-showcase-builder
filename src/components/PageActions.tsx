import { TechPage } from '@/types/page-builder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Save, 
  Download, 
  Upload, 
  Copy,
  FolderOpen 
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface PageActionsProps {
  page: TechPage;
  onSave: () => string;
  onExport: () => string;
  onImport: (json: string) => boolean;
  onDuplicate: () => TechPage;
}

export const PageActions = ({ 
  page, 
  onSave, 
  onExport, 
  onImport,
  onDuplicate 
}: PageActionsProps) => {
  const [importJson, setImportJson] = useState('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const handleSave = () => {
    const id = onSave();
    toast.success('페이지가 저장되었습니다', {
      description: `ID: ${id}`,
    });
  };

  const handleExport = () => {
    const json = onExport();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${page.title.replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('페이지가 내보내기 되었습니다');
  };

  const handleImport = () => {
    const success = onImport(importJson);
    if (success) {
      toast.success('페이지를 가져왔습니다');
      setImportDialogOpen(false);
      setImportJson('');
    } else {
      toast.error('유효하지 않은 JSON 형식입니다');
    }
  };

  const handleDuplicate = () => {
    const newPage = onDuplicate();
    // Save the duplicated page
    const savedPages = JSON.parse(localStorage.getItem('techPages') || '{}');
    savedPages[newPage.id] = newPage;
    localStorage.setItem('techPages', JSON.stringify(savedPages));
    toast.success('페이지가 복제되었습니다', {
      description: newPage.title,
    });
  };

  const handleCopyJson = () => {
    const json = onExport();
    navigator.clipboard.writeText(json);
    toast.success('JSON이 클립보드에 복사되었습니다');
  };

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleSave}
        className="gap-2"
      >
        <Save className="w-4 h-4" />
        저장
      </Button>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleExport}
        className="gap-2"
      >
        <Download className="w-4 h-4" />
        내보내기
      </Button>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="w-4 h-4" />
            가져오기
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>페이지 가져오기</DialogTitle>
            <DialogDescription>
              내보낸 JSON 파일의 내용을 붙여넣으세요.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            className="min-h-[200px] font-mono text-sm bg-secondary border-border"
            placeholder='{"id": "...", "title": "...", ...}'
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleImport}>
              가져오기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleDuplicate}
        className="gap-2"
      >
        <Copy className="w-4 h-4" />
        복제
      </Button>

      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleCopyJson}
        className="gap-2 text-muted-foreground"
      >
        <FolderOpen className="w-4 h-4" />
        JSON 복사
      </Button>
    </div>
  );
};
