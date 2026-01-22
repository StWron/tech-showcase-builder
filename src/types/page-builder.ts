export type BlockType = 'heading' | 'text' | 'image' | 'video' | 'code' | 'divider' | 'list';

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

export interface BaseBlock {
  id: string;
  type: BlockType;
  size: BlockSize;
  order: number;
  alignment?: BlockAlignment;
  style?: BlockStyle;
  locked?: boolean;
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

export type ContentBlock = 
  | HeadingBlock 
  | TextBlock 
  | ImageBlock 
  | VideoBlock 
  | CodeBlock 
  | DividerBlock 
  | ListBlock;

export interface TechPage {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  lastModified: string;
  blocks: ContentBlock[];
  layoutLocked?: boolean;
}

export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  blocks: Omit<ContentBlock, 'id'>[];
}
