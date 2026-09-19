import { ContentBlock, TechPage } from '@/types/page-builder';
import { PageCapabilities } from './capabilities';
import { isKnownBlock } from '@/blocks';

/**
 * 산출물에 실제로 실릴 페이지 모델.
 *
 * 권한이 꺼진 항목은 여기서 **값이 사라진다**. 숨김 처리가 아니라 제거이므로
 * 이 모델을 그대로 직렬화해 페이지에 심어도 꺼진 콘텐츠는 전달되지 않는다.
 */
export interface BakedPage {
  id: string;
  title: string;
  subtitle: string;
  category?: string;
  lastModified?: string;
  blocks: ContentBlock[];
}

/** 에디터 전용 필드를 털어낸다. 산출물에서는 의미가 없고 새어 나가면 힌트만 준다. */
const stripEditorFields = (block: ContentBlock, order: number): ContentBlock => {
  const { locked: _locked, ...rest } = block as ContentBlock & { locked?: boolean };
  return { ...rest, order } as ContentBlock;
};

/**
 * 권한 매니페스트를 적용해 페이지를 굽는다(bake).
 *
 * - 허용되지 않은 타입의 블록은 콘텐츠째 빠진다
 * - 메타 정보가 꺼져 있으면 카테고리/수정일 자체가 없다
 * - 남은 블록의 order는 빈틈 없이 다시 매겨 격자 자동 배치가 어긋나지 않게 한다
 */
export const bake = (page: TechPage, capabilities: PageCapabilities): BakedPage => {
  const allowed = new Set(capabilities.allowedBlockTypes);

  const blocks = [...page.blocks]
    // 레지스트리에 없는 타입은 렌더할 방법도 검증할 방법도 없으므로 버린다
    .filter((block) => isKnownBlock(block) && allowed.has(block.type))
    .sort((a, b) => a.order - b.order)
    .map(stripEditorFields);

  const baked: BakedPage = {
    id: page.id,
    title: page.title,
    subtitle: page.subtitle,
    blocks,
  };

  if (capabilities.showMeta) {
    baked.category = page.category;
    baked.lastModified = page.lastModified;
  }

  return baked;
};

/** 굽고 난 뒤 어떤 것이 빠졌는지 — 게시 전 확인용 요약 */
export interface BakeSummary {
  totalBlocks: number;
  keptBlocks: number;
  removedBlocks: number;
  removedByType: Partial<Record<ContentBlock['type'], number>>;
}

export const summarizeBake = (page: TechPage, capabilities: PageCapabilities): BakeSummary => {
  const allowed = new Set(capabilities.allowedBlockTypes);
  const removedByType: BakeSummary['removedByType'] = {};
  let keptBlocks = 0;

  for (const block of page.blocks) {
    if (allowed.has(block.type)) {
      keptBlocks++;
    } else {
      removedByType[block.type] = (removedByType[block.type] || 0) + 1;
    }
  }

  return {
    totalBlocks: page.blocks.length,
    keptBlocks,
    removedBlocks: page.blocks.length - keptBlocks,
    removedByType,
  };
};
