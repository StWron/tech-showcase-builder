import { PageCapabilities, TechPage } from '@/types/page-builder';
import { Button } from '@/components/ui/button';
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
import { Save, Upload, Copy, FileJson, Rocket, ExternalLink } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { BakeSummary } from '@/lib/bake';

interface PageActionsProps {
  page: TechPage;
  capabilities: PageCapabilities;
  onSave: () => string;
  onExportSource: () => string;
  onImportSource: (raw: string) => boolean;
  onPublishHtml: () => string;
  onPublishSummary: () => BakeSummary;
  onDuplicate: () => TechPage;
}

const slug = (title: string) => title.trim().replace(/\s+/g, '-') || 'page';

const download = (contents: string, filename: string, mime: string) => {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const PageActions = ({
  page,
  capabilities,
  onSave,
  onExportSource,
  onImportSource,
  onPublishHtml,
  onPublishSummary,
  onDuplicate,
}: PageActionsProps) => {
  const [importText, setImportText] = useState('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const id = onSave();
    toast.success('페이지가 저장되었습니다', { description: `ID: ${id}` });
  };

  const describePublish = () => {
    const summary = onPublishSummary();
    const notes: string[] = [];
    if (summary.removedBlocks > 0) notes.push(`블록 ${summary.removedBlocks}개 제외됨`);
    if (!capabilities.editing) notes.push('편집 재개방 없음');
    return notes.length ? notes.join(' · ') : '모든 권한이 켜진 상태로 게시';
  };

  const handlePublish = () => {
    download(onPublishHtml(), `${slug(page.title)}.html`, 'text/html;charset=utf-8');
    toast.success('페이지가 게시되었습니다', { description: describePublish() });
  };

  const handlePreview = () => {
    const blob = new Blob([onPublishHtml()], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (!opened) {
      URL.revokeObjectURL(url);
      toast.error('팝업이 차단되어 미리보기를 열지 못했습니다');
      return;
    }
    // 새 탭이 문서를 읽어들일 시간을 준 뒤 해제
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const handleExportSource = () => {
    download(onExportSource(), `${slug(page.title)}.tsbproj`, 'application/json');
    toast.success('소스 파일을 저장했습니다', {
      description: '전체 블록과 권한이 담긴 원본입니다. 작성자만 보관하세요.',
    });
  };

  const applyImport = (raw: string) => {
    if (onImportSource(raw)) {
      toast.success('페이지를 가져왔습니다');
      setImportDialogOpen(false);
      setImportText('');
      return;
    }
    toast.error('읽을 수 없는 파일입니다', {
      description: '소스(.tsbproj) 또는 편집 재개방이 켜진 상태로 게시된 HTML만 가져올 수 있습니다.',
    });
  };

  const handleFilePick = async (file: File | undefined) => {
    if (!file) return;
    applyImport(await file.text());
  };

  const handleDuplicate = () => {
    const newPage = onDuplicate();
    const savedPages = JSON.parse(localStorage.getItem('techPages') || '{}');
    savedPages[newPage.id] = { version: 1, page: newPage, capabilities };
    localStorage.setItem('techPages', JSON.stringify(savedPages));
    toast.success('페이지가 복제되었습니다', { description: newPage.title });
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleSave} className="gap-2">
        <Save className="w-4 h-4" />
        저장
      </Button>

      <Button variant="ghost" size="sm" onClick={handlePreview} className="gap-2">
        <ExternalLink className="w-4 h-4" />
        게시 미리보기
      </Button>

      <Button size="sm" onClick={handlePublish} className="gap-2">
        <Rocket className="w-4 h-4" />
        게시
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
              소스 파일(.tsbproj)이나, 편집 재개방이 켜진 상태로 게시된 HTML을 넣으세요.
            </DialogDescription>
          </DialogHeader>

          <input
            ref={fileInputRef}
            type="file"
            accept=".tsbproj,.json,.html,text/html,application/json"
            className="hidden"
            onChange={(e) => {
              void handleFilePick(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            파일 선택
          </Button>

          <Textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            className="min-h-[180px] font-mono text-sm bg-secondary border-border"
            placeholder='{"version": 1, "page": { ... }, "capabilities": { ... }}'
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={() => applyImport(importText)}>가져오기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button variant="ghost" size="sm" onClick={handleExportSource} className="gap-2">
        <FileJson className="w-4 h-4" />
        소스 저장
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleDuplicate}
        className="gap-2 text-muted-foreground"
      >
        <Copy className="w-4 h-4" />
        복제
      </Button>
    </div>
  );
};
