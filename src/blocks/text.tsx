import { FileText } from 'lucide-react';
import { TextBlock } from '@/types/page-builder';
import { TextBlockComponent } from '@/components/blocks/TextBlockComponent';
import { escapeHtml } from '@/lib/html-escape';
import { defineBlock } from './types';

const renderParagraphs = (content: string): string =>
  String(content ?? '')
    .split(/\n{2,}/)
    .filter((paragraph) => paragraph.trim().length > 0)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('\n');

export const textBlock = defineBlock<TextBlock>({
  type: 'text',
  label: '텍스트',
  icon: FileText,
  defaultSpan: 8,
  create: (seed) => ({ ...seed, type: 'text', content: '텍스트를 입력하세요...' }),
  Editor: TextBlockComponent,
  emit: (block) => {
    const body = renderParagraphs(block.content);
    return body ? `<div class="tsb-text">${body}</div>` : '';
  },
});
