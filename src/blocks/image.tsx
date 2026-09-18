import { Image } from 'lucide-react';
import { ImageBlock } from '@/types/page-builder';
import { ImageBlockComponent } from '@/components/blocks/ImageBlockComponent';
import { escapeHtml, sanitizeUrl } from '@/lib/html-escape';
import { defineBlock } from './types';

export const imageBlock = defineBlock<ImageBlock>({
  type: 'image',
  label: '이미지',
  icon: Image,
  defaultSpan: 6,
  create: (seed) => ({ ...seed, type: 'image', src: '', alt: '이미지 설명', caption: '' }),
  Editor: ImageBlockComponent,
  emit: (block) => {
    const src = sanitizeUrl(block.src, { allowDataImage: true });
    if (!src) return '';

    const caption = String(block.caption ?? '').trim();
    return [
      '<figure class="tsb-figure">',
      `<img class="tsb-image" src="${escapeHtml(src)}" alt="${escapeHtml(block.alt)}" loading="lazy" />`,
      caption ? `<figcaption class="tsb-caption">${escapeHtml(caption)}</figcaption>` : '',
      '</figure>',
    ]
      .filter(Boolean)
      .join('\n');
  },
});
