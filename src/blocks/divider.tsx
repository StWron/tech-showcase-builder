import { Minus } from 'lucide-react';
import { DividerBlock } from '@/types/page-builder';
import { DividerBlockComponent } from '@/components/blocks/DividerBlockComponent';
import { defineBlock } from './types';

export const dividerBlock = defineBlock<DividerBlock>({
  type: 'divider',
  label: '구분선',
  icon: Minus,
  defaultSpan: 12,
  create: (seed) => ({ ...seed, type: 'divider' }),
  Editor: DividerBlockComponent,
  emit: () => '<hr class="tsb-divider" />',
});
