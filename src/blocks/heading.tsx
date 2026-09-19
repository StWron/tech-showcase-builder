import { Type } from 'lucide-react';
import { HeadingBlock } from '@/types/page-builder';
import { HeadingBlockComponent } from '@/components/blocks/HeadingBlockComponent';
import { escapeHtml } from '@/lib/html-escape';
import { defineBlock } from './types';

export const headingBlock = defineBlock<HeadingBlock>({
  type: 'heading',
  label: '제목',
  icon: Type,
  defaultSpan: 12,
  create: (seed) => ({ ...seed, type: 'heading', content: '새 제목', level: 2 }),
  Editor: HeadingBlockComponent,
  emit: (block) => {
    const level = block.level === 1 || block.level === 3 ? block.level : 2;
    return `<h${level} class="tsb-heading tsb-h${level}">${escapeHtml(block.content)}</h${level}>`;
  },
});
