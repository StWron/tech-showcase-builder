import { useState, useCallback } from 'react';
import { ContentBlock, TechPage, BlockType, BlockSize } from '@/types/page-builder';

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

export const usePageBuilder = (initialPage?: TechPage) => {
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

  const savePage = useCallback(() => {
    const savedPages = JSON.parse(localStorage.getItem('techPages') || '{}');
    savedPages[page.id] = page;
    localStorage.setItem('techPages', JSON.stringify(savedPages));
    return page.id;
  }, [page]);

  const loadPage = useCallback((pageId: string) => {
    const savedPages = JSON.parse(localStorage.getItem('techPages') || '{}');
    if (savedPages[pageId]) {
      setPage(savedPages[pageId]);
      return true;
    }
    return false;
  }, []);

  const exportPage = useCallback(() => {
    return JSON.stringify(page, null, 2);
  }, [page]);

  const importPage = useCallback((jsonString: string) => {
    try {
      const imported = JSON.parse(jsonString) as TechPage;
      setPage({
        ...imported,
        id: generateId(),
        lastModified: new Date().toISOString(),
      });
      return true;
    } catch {
      return false;
    }
  }, []);

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
    savePage,
    loadPage,
    exportPage,
    importPage,
    duplicatePage,
  };
};
