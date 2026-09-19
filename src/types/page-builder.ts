export type BlockType =
  | 'heading'
  | 'text'
  | 'image'
  | 'video'
  | 'code'
  | 'divider'
  | 'list'
  | 'command';

export type BlockSize = 'small' | 'medium' | 'large' | 'full';

export type BlockAlignment = 'left' | 'center' | 'right';

export type BlockColor = 
  | 'default' 
  | 'primary' 
  | 'secondary' 
  | 'accent' 
  | 'muted'
  | 'success'
  | 'warning'
  | 'destructive';

export interface BlockStyle {
  backgroundColor?: BlockColor;
  textColor?: BlockColor;
  borderColor?: BlockColor;
  hasBorder?: boolean;
  hasShadow?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
}

// 격자 배치를 위한 그리드 위치 정보
export interface GridPosition {
  column: number;     // 1-12 (12열 그리드)
  columnSpan: number; // 블록이 차지하는 열 수 (1-12)
  row: number;        // 행 위치 (자동 계산 가능)
}

export interface BaseBlock {
  id: string;
  type: BlockType;
  size: BlockSize;
  order: number;
  alignment?: BlockAlignment;
  style?: BlockStyle;
  locked?: boolean;
  gridPosition?: GridPosition; // 격자 위치 (선택적)
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  content: string;
  level: 1 | 2 | 3;
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  content: string;
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  src: string;
  alt: string;
  caption?: string;
}

export interface VideoBlock extends BaseBlock {
  type: 'video';
  src: string;
  title?: string;
}

export interface CodeBlock extends BaseBlock {
  type: 'code';
  content: string;
  language: string;
}

export interface DividerBlock extends BaseBlock {
  type: 'divider';
}

export interface ListBlock extends BaseBlock {
  type: 'list';
  items: string[];
  ordered: boolean;
}

/**
 * 장비에 명령을 보내는 블록.
 *
 * 이 타입을 권한에서 끄면 산출물에 버튼도 스크립트도, **엔드포인트 주소조차**
 * 들어가지 않는다. 모니터링 전용 배포물은 어디를 호출해야 하는지도 알 수 없다.
 *
 * 다만 이것은 서버 인가를 대신하지 않는다. 버튼을 지우는 것은 수단을 지우는
 * 것이지 권한을 지우는 것이 아니므로, 제어 엔드포인트는 서버에서 계정별로
 * 막혀 있어야 한다.
 */
export interface CommandBlock extends BaseBlock {
  type: 'command';
  /** 버튼 문구 */
  label: string;
  /** POST 대상. http/https 절대 URL만 산출물에 실린다. */
  endpoint: string;
  /** 요청 본문 (JSON 문자열) */
  payload: string;
  /** 실행 전 확인을 받을지 */
  confirm: boolean;
}

export type ContentBlock = 
  | HeadingBlock 
  | TextBlock 
  | ImageBlock 
  | VideoBlock 
  | CodeBlock 
  | DividerBlock 
  | ListBlock
  | CommandBlock;

export interface TechPage {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  lastModified: string;
  blocks: ContentBlock[];
  layoutLocked?: boolean;
}

/**
 * 페이지 권한 매니페스트.
 *
 * 런타임 검사 플래그가 아니라 **생성 시점의 스위치**다.
 * 꺼진 항목은 산출물에 마크업도 스크립트도 데이터도 들어가지 않는다.
 * 헬퍼(기본값 / 정규화 / 라벨)는 `@/lib/capabilities` 에 있다.
 */
export interface PageCapabilities {
  /** 산출물에 남길 블록 타입. 빠진 타입의 블록은 콘텐츠째 제거된다. */
  allowedBlockTypes: BlockType[];
  /** 산출물이 자기 원본(baked 모델)을 품어서 에디터로 다시 열 수 있는지 */
  editing: boolean;
  /** 코드 블록 복사 버튼 (끄면 관련 JS 자체가 없음) */
  codeCopy: boolean;
  /** 외부 iframe 임베드 (끄면 iframe 태그를 내보내지 않음) */
  externalEmbeds: boolean;
  /** 카테고리 / 최종 수정일 노출 */
  showMeta: boolean;
  /** 푸터 노출 */
  showFooter: boolean;
  /** 페이지 원본 JSON 내려받기 버튼 */
  sourceDownload: boolean;
}

/** 작성자가 보관하는 소스 파일(.tsbproj)의 형식. 전체 모델 + 전체 권한. */
export interface PageSource {
  version: 1;
  page: TechPage;
  capabilities: PageCapabilities;
}

export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  blocks: Omit<ContentBlock, 'id'>[];
}
