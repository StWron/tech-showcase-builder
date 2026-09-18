import { useState, useCallback, useEffect } from 'react';
import {
  ContentBlock,
  TechPage,
  BlockType,
  BlockSize,
  PageCapabilities,
  PageSource,
} from '@/types/page-builder';
import { defaultCapabilities, normalizeCapabilities } from '@/lib/capabilities';
import { getBlockDefinition } from '@/blocks';
import {
  SavedPageSummary,
  readAllPages,
  readPage,
  removePage,
  summarize,
  writePage,
} from '@/lib/page-store';
import { emitHtml, extractEmbeddedSource } from '@/lib/emit-html';
import { summarizeBake } from '@/lib/bake';

const generateId = () => Math.random().toString(36).substring(2, 9);

const createDefaultBlock = (type: BlockType, order: number): ContentBlock | null => {
  const definition = getBlockDefinition(type);
  if (!definition) return null;

  return definition.create({ id: generateId(), size: 'full' as BlockSize, order });
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

  const [savedPages, setSavedPages] = useState<SavedPageSummary[]>([]);

  const refreshSavedPages = useCallback(() => {
    setSavedPages(readAllPages().map(summarize));
  }, []);

  // 보관함은 마운트 시 한 번 읽고, 이후 저장/삭제할 때 갱신한다
  useEffect(() => {
    refreshSavedPages();
  }, [refreshSavedPages]);

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const addBlock = useCallback((type: BlockType, afterId?: string) => {
    setPage((prev) => {
      const newOrder = afterId 
        ? prev.blocks.find(b => b.id === afterId)?.order ?? prev.blocks.length
        : prev.blocks.length;
      
      const newBlock = createDefaultBlock(type, newOrder + 1);
      if (!newBlock) return prev;
      
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
    const ok = writePage(page, capabilities);
    refreshSavedPages();
    return ok ? page.id : null;
  }, [page, capabilities, refreshSavedPages]);

  const loadPage = useCallback((pageId: string) => {
    const entry = readPage(pageId);
    if (!entry) return false;

    setPage(entry.page);
    setCapabilities(entry.capabilities);
    setSelectedBlockId(null);
    return true;
  }, []);

  const deletePage = useCallback(
    (pageId: string) => {
      const ok = removePage(pageId);
      refreshSavedPages();
      return ok;
    },
    [refreshSavedPages]
  );

  /** 빈 페이지에서 새로 시작한다. 권한은 기본값으로 되돌린다. */
  const newPage = useCallback(() => {
    setPage({
      id: generateId(),
      title: '새 기술 페이지',
      subtitle: '설명을 입력하세요',
      category: '범용',
      lastModified: new Date().toISOString(),
      blocks: [],
    });
    setCapabilities(defaultCapabilities());
    setSelectedBlockId(null);
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

  /** 사본을 만들어 보관함에 저장하고, 편집 대상을 그 사본으로 옮긴다. */
  const duplicatePage = useCallback(() => {
    const copy: TechPage = {
      ...page,
      id: generateId(),
      title: `${page.title} (복사본)`,
      lastModified: new Date().toISOString(),
      blocks: page.blocks.map((block) => ({ ...block, id: generateId() })),
    };

    writePage(copy, capabilities);
    refreshSavedPages();
    setPage(copy);
    setSelectedBlockId(null);
    return copy;
  }, [page, capabilities, refreshSavedPages]);

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
    savedPages,
    refreshSavedPages,
    savePage,
    loadPage,
    deletePage,
    newPage,
    exportSource,
    importSource,
    publishHtml,
    publishSummary,
    duplicatePage,
  };
};
