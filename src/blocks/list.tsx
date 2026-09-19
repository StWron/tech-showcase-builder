import { List } from 'lucide-react';
import { ListBlock } from '@/types/page-builder';
import { ListBlockComponent } from '@/components/blocks/ListBlockComponent';
import { escapeHtml } from '@/lib/html-escape';
import { defineBlock } from './types';

export const listBlock = defineBlock<ListBlock>({
  type: 'list',
  label: '목록',
  icon: List,
  defaultSpan: 8,
  create: (seed) => ({
    ...seed,
    type: 'list',
    items: ['항목 1', '항목 2', '항목 3'],
    ordered: false,
  }),
  Editor: ListBlockComponent,
  emit: (block) => {
    const items = (block.items || [])
      .filter((item) => String(item ?? '').trim().length > 0)
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join('\n');
    if (!items) return '';

    const tag = block.ordered ? 'ol' : 'ul';
    return `<${tag} class="tsb-list">${items}</${tag}>`;
  },
});
