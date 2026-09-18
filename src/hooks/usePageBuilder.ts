import { useState, useCallback } from 'react';
import {
  ContentBlock,
  TechPage,
  BlockType,
  BlockSize,
  PageCapabilities,
  PageSource,
} from '@/types/page-builder';
import { defaultCapabilities, normalizeCapabilities } from '@/lib/capabilities';
import { emitHtml, extractEmbeddedSource } from '@/lib/emit-html';
import { summarizeBake } from '@/lib/bake';

const generateId = () => Math.random().toString(36).substring(2, 9);

const createDefaultBlock = (type: BlockType, order: number): ContentBlock => {
  const base = { id: generateId(), size: 'full' as BlockSize, order };
  
  switch (type) {
    case 'heading':
      return { ...base, type: 'heading', content: '새 제목', level: 2 };
    case 'text':
      return { ...base, type: 'text', content: '텍스트를 입력하세요...' };
    case 'image':
      return { ...base, type: 'image', src: '', alt: '이미지 설명', caption: '' };
    case 'video':
      return { ...base, type: 'video', src: '', title: '동영상 제목' };
    case 'code':
      return { ...base, type: 'code', content: '// 코드를 입력하세요', language: 'javascript' };
    case 'divider':
      return { ...base, type: 'divider' };
    case 'list':
      return { ...base, type: 'list', items: ['항목 1', '항목 2', '항목 3'], ordered: false };
    default:
      return { ...base, type: 'text', content: '' };
  }
};

export const usePageBuilder = (
  initialPage?: TechPage,
  initialCapabilities?: PageCapabilities
) => {
  const [page, setPage] = useState<TechPage>(
    initialPage || {
      id: generateId(),
      title: '기술 소개',
      subtitle: '기술 설명을 입력하세요',
      category: '범용',
      lastModified: new Date().toISOString(),
      blocks: [],
    }
  );
  
  const [capabilities, setCapabilities] = useState<PageCapabilities>(
    initialCapabilities || defaultCapabilities()
  );

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const addBlock = useCallback((type: BlockType, afterId?: string) => {
    setPage((prev) => {
      const newOrder = afterId 
        ? prev.blocks.find(b => b.id === afterId)?.order ?? prev.blocks.length
        : prev.blocks.length;
      
      const newBlock = createDefaultBlock(type, newOrder + 1);
      
      const updatedBlocks = afterId
        ? prev.blocks.map(b => b.order > newOrder ? { ...b, order: b.order + 1 } : b)
        : prev.blocks;
      
      return {
        ...prev,
        lastModified: new Date().toISOString(),
        blocks: [...updatedBlocks, newBlock].sort((a, b) => a.order - b.order),
      };
    });
  }, []);

  const updateBlock = useCallback((id: string, updates: Partial<ContentBlock>) => {
    setPage((prev) => ({
      ...prev,
      lastModified: new Date().toISOString(),
      blocks: prev.blocks.map((block) =>
        block.id === id ? { ...block, ...updates } : block
      ) as ContentBlock[],
    }));
  }, []);

  const deleteBlock = useCallback((id: string) => {
    setPage((prev) => ({
      ...prev,
      lastModified: new Date().toISOString(),
      blocks: prev.blocks.filter((block) => block.id !== id),
    }));
    setSelectedBlockId(null);
  }, []);

  const moveBlock = useCallback((id: string, direction: 'up' | 'down') => {
    setPage((prev) => {
      const blocks = [...prev.blocks].sort((a, b) => a.order - b.order);
      const index = blocks.findIndex(b => b.id === id);
      
      if (
        (direction === 'up' && index === 0) ||
        (direction === 'down' && index === blocks.length - 1)
      ) {
        return prev;
      }
      
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      const tempOrder = blocks[index].order;
      blocks[index].order = blocks[swapIndex].order;
      blocks[swapIndex].order = tempOrder;
      
      return {
        ...prev,
        lastModified: new Date().toISOString(),
        blocks: blocks.sort((a, b) => a.order - b.order),
      };
    });
  }, []);

  const updatePageMeta = useCallback((updates: Partial<Pick<TechPage, 'title' | 'subtitle' | 'category' | 'layoutLocked'>>) => {
    setPage((prev) => ({
      ...prev,
      ...updates,
      lastModified: new Date().toISOString(),
    }));
  }, []);

  const toggleLayoutLock = useCallback(() => {
    setPage((prev) => ({
      ...prev,
      layoutLocked: !prev.layoutLocked,
      lastModified: new Date().toISOString(),
    }));
  }, []);

  const updateCapabilities = useCallback((updates: Partial<PageCapabilities>) => {
    setCapabilities((prev) => ({ ...prev, ...updates }));
  }, []);

  const savePage = useCallback(() => {
    const savedPages = JSON.parse(localStorage.getItem('techPages') || '{}');
    savedPages[page.id] = { version: 1, page, capabilities } satisfies PageSource;
    localStorage.setItem('techPages', JSON.stringify(savedPages));
    return page.id;
  }, [page, capabilities]);

  const loadPage = useCallback((pageId: string) => {
    const savedPages = JSON.parse(localStorage.getItem('techPages') || '{}');
    const entry = savedPages[pageId];
    if (!entry) return false;

    // v1 소스 파일과, 권한 개념 이전에 저장된 순수 TechPage 모두 받아준다.
    const loadedPage: TechPage = entry.page ?? entry;
    setPage(loadedPage);
    setCapabilities(normalizeCapabilities(entry.capabilities));
    return true;
  }, []);

  /** 작성자가 보관하는 소스: 전체 블록 + 전체 권한 */
  const exportSource = useCallback((): string => {
    const source: PageSource = { version: 1, page, capabilities };
    return JSON.stringify(source, null, 2);
  }, [page, capabilities]);

  /** 소스(.tsbproj/JSON) 또는 게시된 HTML에서 페이지를 복원한다. */
  const importSource = useCallback((raw: string): boolean => {
    const text = raw.trim();
    if (!text) return false;

    const apply = (loaded: Partial<TechPage>, caps: unknown) => {
      setPage({
        id: generateId(),
        title: loaded.title ?? '제목 없음',
        subtitle: loaded.subtitle ?? '',
        category: loaded.category ?? '범용',
        lastModified: new Date().toISOString(),
        blocks: Array.isArray(loaded.blocks) ? loaded.blocks : [],
      });
      setCapabilities(normalizeCapabilities(caps));
    };

    // 게시된 HTML이면 심어둔 원본을 꺼낸다 (편집 재개방이 켜져 있던 경우에만 존재)
    if (text.startsWith('<')) {
      const embedded = extractEmbeddedSource(text);
      if (!embedded) return false;
      apply(embedded.page, embedded.capabilities);
      return true;
    }

    try {
      const parsed = JSON.parse(text) as PageSource | TechPage;
      const loaded = 'page' in parsed && parsed.page ? parsed.page : (parsed as TechPage);
      if (!loaded || typeof loaded !== 'object') return false;
      apply(loaded, 'capabilities' in parsed ? parsed.capabilities : undefined);
      return true;
    } catch {
      return false;
    }
  }, []);

  /** 권한을 적용해 구운 자기완결 HTML. 꺼진 기능은 결과물에 존재하지 않는다. */
  const publishHtml = useCallback(
    () => emitHtml(page, capabilities),
    [page, capabilities]
  );

  /** 게시 시 무엇이 빠지는지 미리 확인 */
  const publishSummary = useCallback(
    () => summarizeBake(page, capabilities),
    [page, capabilities]
  );

  const duplicatePage = useCallback(() => {
    const newPage: TechPage = {
      ...page,
      id: generateId(),
      title: `${page.title} (복사본)`,
      lastModified: new Date().toISOString(),
      blocks: page.blocks.map(block => ({ ...block, id: generateId() })),
    };
    return newPage;
  }, [page]);

  return {
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
    capabilities,
    setCapabilities,
    updateCapabilities,
    savePage,
    loadPage,
    exportSource,
    importSource,
    publishHtml,
    publishSummary,
    duplicatePage,
  };
};
