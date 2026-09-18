import { BlockType, ContentBlock } from '@/types/page-builder';
import { AnyBlockDefinition } from './types';
import { headingBlock } from './heading';
import { textBlock } from './text';
import { imageBlock } from './image';
import { videoBlock } from './video';
import { codeBlock } from './code';
import { listBlock } from './list';
import { dividerBlock } from './divider';
import { commandBlock } from './command';

/**
 * 블록 레지스트리.
 *
 * 블록 타입을 하나 추가하려면 (1) `types/page-builder.ts` 에 인터페이스와
 * 유니온 항목, (2) `src/blocks/<이름>.tsx` 정의 파일, (3) 아래 목록에 한 줄.
 * 편집기·산출물·격자·권한 패널은 전부 이 목록을 읽으므로 손댈 곳이 없다.
 *
 * 목록 순서가 권한 패널과 블록 추가 메뉴의 표시 순서다.
 */
export const BLOCK_REGISTRY: AnyBlockDefinition[] = [
  headingBlock,
  textBlock,
  imageBlock,
  videoBlock,
  codeBlock,
  listBlock,
  dividerBlock,
  commandBlock,
];

const BY_TYPE = new Map<BlockType, AnyBlockDefinition>(
  BLOCK_REGISTRY.map((definition) => [definition.type, definition])
);

export const getBlockDefinition = (type: BlockType): AnyBlockDefinition | undefined =>
  BY_TYPE.get(type);

/** 레지스트리에 등록된 모든 타입. 표시 순서를 유지한다. */
export const ALL_BLOCK_TYPES: BlockType[] = BLOCK_REGISTRY.map((definition) => definition.type);

export const BLOCK_TYPE_LABELS = Object.fromEntries(
  BLOCK_REGISTRY.map((definition) => [definition.type, definition.label])
) as Record<BlockType, string>;

/** 레지스트리에 없는 타입의 블록은 어디에도 싣지 않는다 */
export const isKnownBlock = (block: ContentBlock): boolean => BY_TYPE.has(block.type);

export * from './types';
