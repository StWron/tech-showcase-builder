import { ContentBlock, BlockSize, BlockType, BlockAlignment, BlockStyle, BlockColor } from '@/types/page-builder';
import { HeadingBlockComponent } from './HeadingBlockComponent';
import { TextBlockComponent } from './TextBlockComponent';
import { ImageBlockComponent } from './ImageBlockComponent';
import { VideoBlockComponent } from './VideoBlockComponent';
import { CodeBlockComponent } from './CodeBlockComponent';
import { ListBlockComponent } from './ListBlockComponent';
import { DividerBlockComponent } from './DividerBlockComponent';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  GripVertical,
  Palette,
  Lock,
  Unlock,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlockWrapperProps {
  block: ContentBlock;
  isEditMode: boolean;
  isSelected: boolean;
  isLayoutLocked: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<ContentBlock>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  // 격자 레이아웃용 props
  gridSpan?: number;
  onResizeGrid?: (newSpan: number) => void;
}

const sizeClasses: Record<BlockSize, string> = {
  small: 'max-w-sm',
  medium: 'max-w-xl',
  large: 'max-w-3xl',
  full: 'max-w-full',
};

const alignmentClasses: Record<BlockAlignment, string> = {
  left: 'mr-auto',
  center: 'mx-auto',
  right: 'ml-auto',
};

const colorClasses: Record<BlockColor, { bg: string; text: string; border: string }> = {
  default: { bg: 'bg-transparent', text: 'text-foreground', border: 'border-border' },
  primary: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/50' },
  secondary: { bg: 'bg-secondary', text: 'text-secondary-foreground', border: 'border-secondary' },
  accent: { bg: 'bg-accent/20', text: 'text-accent-foreground', border: 'border-accent' },
  muted: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted' },
  success: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/50' },
  warning: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/50' },
  destructive: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/50' },
};

const paddingClasses: Record<string, string> = {
  none: 'p-0',
  small: 'p-2',
  medium: 'p-4',
  large: 'p-6',
};

const colorOptions: { value: BlockColor; label: string; preview: string }[] = [
  { value: 'default', label: '기본', preview: 'bg-foreground' },
  { value: 'primary', label: '주요', preview: 'bg-primary' },
  { value: 'secondary', label: '보조', preview: 'bg-secondary-foreground' },
  { value: 'accent', label: '강조', preview: 'bg-accent' },
  { value: 'muted', label: '연함', preview: 'bg-muted-foreground' },
  { value: 'success', label: '성공', preview: 'bg-success' },
  { value: 'warning', label: '경고', preview: 'bg-warning' },
  { value: 'destructive', label: '위험', preview: 'bg-destructive' },
];

export const BlockWrapper = ({
  block,
  isEditMode,
  isSelected,
  isLayoutLocked,
  onSelect,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  gridSpan,
  onResizeGrid,
}: BlockWrapperProps) => {
  const style = block.style || {};
  const alignment = block.alignment || 'left';
  const isLocked = block.locked || false;
  const canEdit = isEditMode && !isLayoutLocked && !isLocked;

  const renderBlock = () => {
    switch (block.type) {
      case 'heading':
        return <HeadingBlockComponent block={block} isEditMode={canEdit && isSelected} onUpdate={onUpdate} />;
      case 'text':
        return <TextBlockComponent block={block} isEditMode={canEdit && isSelected} onUpdate={onUpdate} />;
      case 'image':
        return <ImageBlockComponent block={block} isEditMode={canEdit && isSelected} onUpdate={onUpdate} />;
      case 'video':
        return <VideoBlockComponent block={block} isEditMode={canEdit && isSelected} onUpdate={onUpdate} />;
      case 'code':
        return <CodeBlockComponent block={block} isEditMode={canEdit && isSelected} onUpdate={onUpdate} />;
      case 'list':
        return <ListBlockComponent block={block} isEditMode={canEdit && isSelected} onUpdate={onUpdate} />;
      case 'divider':
        return <DividerBlockComponent block={block} isEditMode={canEdit && isSelected} />;
      default:
        return <div>Unknown block type</div>;
    }
  };

  const blockTypeNames: Record<BlockType, string> = {
    heading: '제목',
    text: '텍스트',
    image: '이미지',
    video: '동영상',
    code: '코드',
    list: '목록',
    divider: '구분선',
  };

  const updateStyle = (styleUpdates: Partial<BlockStyle>) => {
    onUpdate({ style: { ...style, ...styleUpdates } });
  };

  const bgClass = style.backgroundColor ? colorClasses[style.backgroundColor].bg : '';
  const textClass = style.textColor ? colorClasses[style.textColor].text : '';
  const borderClass = style.borderColor ? colorClasses[style.borderColor].border : 'border-border';
  const paddingClass = paddingClasses[style.padding || 'medium'];

  // 격자 모드일 때는 sizeClasses 대신 그리드 스팬으로 크기 제어
  const useGridMode = !!onResizeGrid;

  return (
    <div
      className={cn(
        'group relative transition-all duration-200 animate-fade-in w-full',
        !useGridMode && sizeClasses[block.size],
        !useGridMode && alignmentClasses[alignment],
        isEditMode && !isLocked && 'cursor-pointer',
        isEditMode && !isSelected && !isLocked && 'hover:ring-1 hover:ring-primary/30 rounded-lg',
        isSelected && !isLayoutLocked && 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg',
        isLocked && isEditMode && 'opacity-70'
      )}
      onClick={isEditMode && !isLayoutLocked ? onSelect : undefined}
    >
      {/* Lock Indicator - 내부 코드로만 유지 (UI 숨김) */}
      {/* {isEditMode && isLocked && (
        <div className="absolute -top-2 -right-2 z-20 p-1 bg-warning/20 border border-warning/50 rounded-full">
          <Lock className="w-3 h-3 text-warning" />
        </div>
      )} */}

      {/* Edit Controls */}
      {isEditMode && isSelected && !isLayoutLocked && (
        <div className="absolute -top-14 left-0 flex items-center gap-1 p-1 bg-card border border-border rounded-lg shadow-lg z-10 animate-fade-in flex-wrap">
          {/* Block Type & Grip */}
          <div className="flex items-center gap-1 px-2 border-r border-border">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{blockTypeNames[block.type]}</span>
          </div>
          
          {/* Grid Span Control (격자 너비) */}
          {onResizeGrid && (
            <Select
              value={String(gridSpan || 6)}
              onValueChange={(value) => onResizeGrid(Number(value))}
              disabled={isLocked}
            >
              <SelectTrigger className="w-20 h-7 text-xs bg-secondary border-none">
                <SelectValue placeholder="너비" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3열</SelectItem>
                <SelectItem value="4">4열</SelectItem>
                <SelectItem value="6">6열</SelectItem>
                <SelectItem value="8">8열</SelectItem>
                <SelectItem value="10">10열</SelectItem>
                <SelectItem value="12">전체</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          {/* Legacy Size Control (격자 없을 때) */}
          {!onResizeGrid && (
            <Select
              value={block.size}
              onValueChange={(value) => onUpdate({ size: value as BlockSize })}
              disabled={isLocked}
            >
              <SelectTrigger className="w-16 h-7 text-xs bg-secondary border-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">소</SelectItem>
                <SelectItem value="medium">중</SelectItem>
                <SelectItem value="large">대</SelectItem>
                <SelectItem value="full">전체</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Alignment Controls */}
          <div className="flex items-center border-l border-r border-border px-1">
            <Button 
              variant={alignment === 'left' ? 'secondary' : 'ghost'} 
              size="icon" 
              className="h-7 w-7" 
              onClick={(e) => { e.stopPropagation(); onUpdate({ alignment: 'left' }); }}
              disabled={isLocked}
            >
              <AlignLeft className="w-3 h-3" />
            </Button>
            <Button 
              variant={alignment === 'center' ? 'secondary' : 'ghost'} 
              size="icon" 
              className="h-7 w-7" 
              onClick={(e) => { e.stopPropagation(); onUpdate({ alignment: 'center' }); }}
              disabled={isLocked}
            >
              <AlignCenter className="w-3 h-3" />
            </Button>
            <Button 
              variant={alignment === 'right' ? 'secondary' : 'ghost'} 
              size="icon" 
              className="h-7 w-7" 
              onClick={(e) => { e.stopPropagation(); onUpdate({ alignment: 'right' }); }}
              disabled={isLocked}
            >
              <AlignRight className="w-3 h-3" />
            </Button>
          </div>

          {/* Style Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={isLocked}>
                <Palette className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 bg-card border-border" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-4">
                <h4 className="font-medium text-sm">블록 스타일</h4>
                
                {/* Background Color */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">배경색</Label>
                  <div className="flex flex-wrap gap-1">
                    {colorOptions.map(({ value, label, preview }) => (
                      <button
                        key={value}
                        className={cn(
                          'w-6 h-6 rounded border-2 transition-all',
                          preview,
                          style.backgroundColor === value ? 'border-primary scale-110' : 'border-transparent hover:border-primary/50'
                        )}
                        onClick={() => updateStyle({ backgroundColor: value })}
                        title={label}
                      />
                    ))}
                  </div>
                </div>

                {/* Text Color */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">텍스트 색상</Label>
                  <div className="flex flex-wrap gap-1">
                    {colorOptions.map(({ value, label, preview }) => (
                      <button
                        key={value}
                        className={cn(
                          'w-6 h-6 rounded border-2 transition-all',
                          preview,
                          style.textColor === value ? 'border-primary scale-110' : 'border-transparent hover:border-primary/50'
                        )}
                        onClick={() => updateStyle({ textColor: value })}
                        title={label}
                      />
                    ))}
                  </div>
                </div>

                {/* Border & Shadow */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs">테두리</Label>
                  <Switch
                    checked={style.hasBorder || false}
                    onCheckedChange={(checked) => updateStyle({ hasBorder: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-xs">그림자</Label>
                  <Switch
                    checked={style.hasShadow || false}
                    onCheckedChange={(checked) => updateStyle({ hasShadow: checked })}
                  />
                </div>

                {/* Padding */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">여백</Label>
                  <Select
                    value={style.padding || 'medium'}
                    onValueChange={(value) => updateStyle({ padding: value as BlockStyle['padding'] })}
                  >
                    <SelectTrigger className="h-8 bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">없음</SelectItem>
                      <SelectItem value="small">좁게</SelectItem>
                      <SelectItem value="medium">보통</SelectItem>
                      <SelectItem value="large">넓게</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Move Controls */}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onMoveUp(); }} disabled={isLocked}>
            <ChevronUp className="w-4 h-4" />
          </Button>
          
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onMoveDown(); }} disabled={isLocked}>
            <ChevronDown className="w-4 h-4" />
          </Button>

          {/* Lock Toggle - 내부 코드로만 유지 (UI 숨김) */}
          {/* <Button 
            variant="ghost" 
            size="icon" 
            className={cn("h-7 w-7", isLocked && "text-warning")}
            onClick={(e) => { e.stopPropagation(); onUpdate({ locked: !isLocked }); }}
          >
            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </Button> */}
          
          {/* Delete */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            disabled={isLocked}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Block Content */}
      <div className={cn(
        'rounded-lg transition-all',
        paddingClass,
        bgClass,
        textClass,
        style.hasBorder && `border ${borderClass}`,
        style.hasShadow && 'shadow-lg shadow-primary/10',
        isEditMode && isSelected && !isLayoutLocked && 'ring-1 ring-primary/20'
      )}>
        {renderBlock()}
      </div>
    </div>
  );
};
