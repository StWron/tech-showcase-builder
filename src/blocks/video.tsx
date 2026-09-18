import { Video } from 'lucide-react';
import { VideoBlock } from '@/types/page-builder';
import { VideoBlockComponent } from '@/components/blocks/VideoBlockComponent';
import { escapeHtml, sanitizeUrl } from '@/lib/html-escape';
import { defineBlock } from './types';

interface VideoTarget {
  kind: 'iframe' | 'file';
  url: string;
}

/** 편집기의 getEmbedUrl과 동일한 규칙 */
export const resolveVideo = (raw: string): VideoTarget | null => {
  const url = sanitizeUrl(raw);
  if (!url) return null;

  const youtube = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtube) return { kind: 'iframe', url: `https://www.youtube.com/embed/${youtube[1]}` };

  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return { kind: 'iframe', url: `https://player.vimeo.com/video/${vimeo[1]}` };

  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) return { kind: 'file', url };

  return null;
};

export const videoBlock = defineBlock<VideoBlock>({
  type: 'video',
  label: '동영상',
  icon: Video,
  defaultSpan: 6,
  create: (seed) => ({ ...seed, type: 'video', src: '', title: '동영상 제목' }),
  Editor: VideoBlockComponent,
  emit: (block, { capabilities }) => {
    const target = resolveVideo(block.src);
    if (!target) return '';

    const title = String(block.title ?? '').trim();
    const caption = title ? `<figcaption class="tsb-caption">${escapeHtml(title)}</figcaption>` : '';

    // 외부 임베드가 꺼져 있으면 iframe 태그를 아예 내보내지 않는다.
    if (target.kind === 'iframe' && !capabilities.externalEmbeds) {
      return [
        '<figure class="tsb-figure">',
        `<a class="tsb-external-link" href="${escapeHtml(target.url)}" target="_blank" rel="noopener noreferrer">`,
        `${escapeHtml(title || '외부 동영상 열기')}</a>`,
        '</figure>',
      ].join('\n');
    }

    const media =
      target.kind === 'file'
        ? `<video class="tsb-media" src="${escapeHtml(target.url)}" controls preload="metadata"></video>`
        : `<iframe class="tsb-media" src="${escapeHtml(target.url)}" title="${escapeHtml(title || '동영상')}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;

    return [
      '<figure class="tsb-figure">',
      `<div class="tsb-frame">${media}</div>`,
      caption,
      '</figure>',
    ]
      .filter(Boolean)
      .join('\n');
  },
});
