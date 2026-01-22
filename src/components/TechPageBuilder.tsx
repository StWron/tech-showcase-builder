import { usePageBuilder } from '@/hooks/usePageBuilder';
import { PageHeader } from '@/components/PageHeader';
import { PageActions } from '@/components/PageActions';
import { BlockWrapper } from '@/components/blocks/BlockWrapper';
import { AddBlockButton } from '@/components/blocks/AddBlockButton';
import { Button } from '@/components/ui/button';
import { 
  Cpu, 
  Edit2, 
  Eye, 
  Layers,
  X
} from 'lucide-react';
import { TechPage } from '@/types/page-builder';
import { cn } from '@/lib/utils';

// Default template for tech introduction pages
const defaultTemplate: TechPage = {
  id: 'default',
  title: '기술 소개',
  subtitle: '직업훈련 부트캠프에서 활용되는 핵심 기술을 소개합니다',
  category: '범용 기술',
  lastModified: new Date().toISOString(),
  layoutLocked: false,
  blocks: [
    {
      id: 'intro-heading',
      type: 'heading',
      content: '개요',
      level: 2,
      size: 'full',
      order: 0,
    },
    {
      id: 'intro-text',
      type: 'text',
      content: '이 기술은 스마트 팩토리 및 자동화 시스템 구축에 핵심적인 역할을 합니다. 실제 산업 현장에서 활용되는 기술을 직접 경험하고 학습할 수 있습니다.\n\n주요 특징과 활용 분야를 아래에서 확인하세요.',
      size: 'full',
      order: 1,
    },
    {
      id: 'divider-1',
      type: 'divider',
      size: 'full',
      order: 2,
    },
    {
      id: 'features-heading',
      type: 'heading',
      content: '주요 기능',
      level: 2,
      size: 'full',
      order: 3,
    },
    {
      id: 'features-list',
      type: 'list',
      items: [
        '실시간 데이터 수집 및 처리',
        '시스템 간 통신 및 연동',
        '자동화된 제어 및 모니터링',
        '확장 가능한 아키텍처',
      ],
      ordered: false,
      size: 'large',
      order: 4,
    },
    {
      id: 'demo-heading',
      type: 'heading',
      content: '데모 영상',
      level: 2,
      size: 'full',
      order: 5,
    },
    {
      id: 'demo-video',
      type: 'video',
      src: '',
      title: '기술 데모 영상',
      size: 'large',
      order: 6,
    },
    {
      id: 'code-heading',
      type: 'heading',
      content: '샘플 코드',
      level: 2,
      size: 'full',
      order: 7,
    },
    {
      id: 'sample-code',
      type: 'code',
      content: '// 예시 코드\nconst initialize = async () => {\n  const connection = await connect();\n  console.log("시스템 연결 완료");\n  return connection;\n};',
      language: 'javascript',
      size: 'large',
      order: 8,
    },
    {
      id: 'reference-heading',
      type: 'heading',
      content: '참고 자료',
      level: 2,
      size: 'full',
      order: 9,
    },
    {
      id: 'reference-image',
      type: 'image',
      src: '',
      alt: '참고 다이어그램',
      caption: '시스템 아키텍처 다이어그램',
      size: 'large',
      order: 10,
    },
  ],
};

export const TechPageBuilder = () => {
  const {
    page,
    isEditMode,
    setIsEditMode,
    selectedBlockId,
    setSelectedBlockId,
    addBlock,
    updateBlock,
    deleteBlock,
    moveBlock,
    updatePageMeta,
    toggleLayoutLock,
    savePage,
    exportPage,
    importPage,
    duplicatePage,
  } = usePageBuilder(defaultTemplate);

  // 레이아웃 잠금 기능은 내부 코드로 유지 (추후 활용)
  const isLayoutLocked = false; // page.layoutLocked || false;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar - View Mode */}
      {!isEditMode && (
        <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-primary">
                <Cpu className="w-5 h-5" />
                <span className="font-semibold">Tech Page Builder</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Clear Edit Button */}
              <Button 
                onClick={() => setIsEditMode(true)}
                className="gap-2"
                size="lg"
              >
                <Edit2 className="w-4 h-4" />
                페이지 편집하기
              </Button>
            </div>
          </div>
        </nav>
      )}

      {/* Top Bar - Edit Mode */}
      {isEditMode && (
        <nav className="sticky top-0 z-50 bg-primary/10 backdrop-blur border-b border-primary/30">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-primary">
                <Edit2 className="w-5 h-5" />
                <span className="font-semibold">편집 모드</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Layers className="w-4 h-4" />
                <span>{page.blocks.length} 블록</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Page Actions */}
              <PageActions
                page={page}
                onSave={savePage}
                onExport={exportPage}
                onImport={importPage}
                onDuplicate={duplicatePage}
              />

              {/* Exit Edit Mode */}
              <Button 
                variant="outline"
                onClick={() => setIsEditMode(false)}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                미리보기
              </Button>
            </div>
          </div>
        </nav>
      )}

      {/* Page Header */}
      <PageHeader
        page={page}
        isEditMode={isEditMode && !isLayoutLocked}
        onUpdateMeta={updatePageMeta}
      />

      {/* Content Area */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="space-y-6">
          {page.blocks
            .sort((a, b) => a.order - b.order)
            .map((block) => (
              <BlockWrapper
                key={block.id}
                block={block}
                isEditMode={isEditMode}
                isLayoutLocked={isLayoutLocked}
                isSelected={selectedBlockId === block.id}
                onSelect={() => setSelectedBlockId(block.id)}
                onUpdate={(updates) => updateBlock(block.id, updates)}
                onDelete={() => deleteBlock(block.id)}
                onMoveUp={() => moveBlock(block.id, 'up')}
                onMoveDown={() => moveBlock(block.id, 'down')}
              />
            ))}

          {/* Add Block Button */}
          {isEditMode && !isLayoutLocked && (
            <div className="pt-8">
              <AddBlockButton onAddBlock={(type) => addBlock(type)} />
            </div>
          )}
        </div>

        {/* Empty State */}
        {page.blocks.length === 0 && !isEditMode && (
          <div className="text-center py-20">
            <Layers className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              콘텐츠가 없습니다
            </h3>
            <p className="text-sm text-muted-foreground/70 mb-4">
              편집 모드를 켜고 블록을 추가하세요
            </p>
            <Button onClick={() => setIsEditMode(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              편집 시작
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-12">
        <div className="max-w-5xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>Tech Page Builder • 직업훈련 부트캠프 기술 문서 시스템</p>
        </div>
      </footer>
    </div>
  );
};
