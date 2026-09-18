import { ComponentType } from 'react';
import { LucideIcon } from 'lucide-react';
import { BlockSize, BlockType, ContentBlock, PageCapabilities } from '@/types/page-builder';

/** 새 블록을 만들 때 공통으로 주어지는 값 */
export interface BlockSeed {
  id: string;
  order: number;
  size: BlockSize;
}

export interface EmitContext {
  capabilities: PageCapabilities;
}

/** 이 블록 타입이 산출물에서 필요로 하는 런타임 조각 */
export interface BlockAssets {
  css?: string;
  script?: string;
}

export interface BlockEditorProps<B extends ContentBlock> {
  block: B;
  isEditMode: boolean;
  onUpdate: (updates: Partial<B>) => void;
}

/**
 * 블록 타입 하나의 전부.
 *
 * 이 프로젝트에서 고정된 것은 산출물/편집기 **구조**뿐이고, 블록은 전부
 * 갈아끼울 수 있어야 한다. 그래서 한 타입에 필요한 모든 것 — 라벨, 아이콘,
 * 기본 크기, 생성, 편집 UI, 산출물 마크업, 런타임 조각 — 을 한곳에 모은다.
 */
export interface BlockDefinition<B extends ContentBlock = ContentBlock> {
  type: B['type'];
  label: string;
  icon: LucideIcon;
  /** 12열 격자에서 차지할 기본 열 수 */
  defaultSpan: number;
  create: (seed: BlockSeed) => B;
  Editor: ComponentType<BlockEditorProps<B>>;
  /**
   * 산출물 마크업. 빈 문자열을 돌려주면 그 블록은 통째로 실리지 않는다
   * (값이 비었거나 안전하지 않은 경우 — fail closed).
   */
  emit: (block: B, context: EmitContext) => string;
  /** 이 타입의 블록이 하나라도 실릴 때만 포함되는 스크립트/CSS */
  assets?: (blocks: B[], context: EmitContext) => BlockAssets;
  /** 편집기에서 보여줄 주의 문구 (제어처럼 서버 인가가 따로 필요한 블록) */
  caution?: string;
}

export type AnyBlockDefinition = BlockDefinition<ContentBlock>;

/**
 * 타입별 정의를 레지스트리에 담을 수 있는 형태로 지운다.
 * 캐스팅은 이 한 곳에만 둔다.
 */
export const defineBlock = <B extends ContentBlock>(
  definition: BlockDefinition<B>
): AnyBlockDefinition => definition as unknown as AnyBlockDefinition;

export type { BlockType };
