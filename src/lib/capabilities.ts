import { BlockType, PageCapabilities } from '@/types/page-builder';

export type { PageCapabilities };

export const ALL_BLOCK_TYPES: BlockType[] = [
  'heading',
  'text',
  'image',
  'video',
  'code',
  'list',
  'divider',
];

export const defaultCapabilities = (): PageCapabilities => ({
  allowedBlockTypes: [...ALL_BLOCK_TYPES],
  editing: false,
  codeCopy: true,
  externalEmbeds: true,
  showMeta: true,
  showFooter: true,
  sourceDownload: false,
});

export interface CapabilityDescriptor {
  key: Exclude<keyof PageCapabilities, 'allowedBlockTypes'>;
  label: string;
  description: string;
}

/** 권한 패널에 노출할 기능 스위치 목록 */
export const FEATURE_CAPABILITIES: CapabilityDescriptor[] = [
  {
    key: 'editing',
    label: '편집 재개방',
    description: '산출물이 원본을 품어 에디터로 다시 열 수 있습니다. 끄면 산출물만으로는 편집 불가.',
  },
  {
    key: 'codeCopy',
    label: '코드 복사',
    description: '코드 블록의 복사 버튼과 관련 스크립트를 포함합니다.',
  },
  {
    key: 'externalEmbeds',
    label: '외부 임베드',
    description: 'YouTube/Vimeo iframe을 포함합니다. 끄면 링크만 남습니다.',
  },
  {
    key: 'showMeta',
    label: '메타 정보',
    description: '카테고리와 최종 수정일을 노출합니다.',
  },
  {
    key: 'showFooter',
    label: '푸터',
    description: '페이지 하단 푸터를 포함합니다.',
  },
  {
    key: 'sourceDownload',
    label: '원본 내려받기',
    description: '열람자가 페이지 JSON을 내려받을 수 있는 버튼을 포함합니다.',
  },
];

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  heading: '제목',
  text: '텍스트',
  image: '이미지',
  video: '동영상',
  code: '코드',
  list: '목록',
  divider: '구분선',
};

/**
 * 외부에서 읽어온 값(가져온 파일, localStorage)을 신뢰 가능한 형태로 정규화한다.
 * 모르는 키는 버리고, 빠진 키는 기본값(보수적으로 off)으로 채운다.
 */
export const normalizeCapabilities = (raw: unknown): PageCapabilities => {
  const base = defaultCapabilities();
  if (!raw || typeof raw !== 'object') return base;

  const input = raw as Partial<Record<keyof PageCapabilities, unknown>>;

  const allowed = Array.isArray(input.allowedBlockTypes)
    ? ALL_BLOCK_TYPES.filter((type) => (input.allowedBlockTypes as unknown[]).includes(type))
    : base.allowedBlockTypes;

  const bool = (key: CapabilityDescriptor['key']): boolean =>
    typeof input[key] === 'boolean' ? (input[key] as boolean) : base[key];

  return {
    allowedBlockTypes: allowed,
    editing: bool('editing'),
    codeCopy: bool('codeCopy'),
    externalEmbeds: bool('externalEmbeds'),
    showMeta: bool('showMeta'),
    showFooter: bool('showFooter'),
    sourceDownload: bool('sourceDownload'),
  };
};

export const toggleBlockType = (
  capabilities: PageCapabilities,
  type: BlockType,
  enabled: boolean
): PageCapabilities => ({
  ...capabilities,
  allowedBlockTypes: enabled
    ? ALL_BLOCK_TYPES.filter((t) => t === type || capabilities.allowedBlockTypes.includes(t))
    : capabilities.allowedBlockTypes.filter((t) => t !== type),
});
