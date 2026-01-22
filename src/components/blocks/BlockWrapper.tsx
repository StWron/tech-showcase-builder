import { ContentBlock, BlockSize, BlockType } from '@/types/page-builder';
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
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  GripVertical,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlockWrapperProps {
  block: ContentBlock;
  isEditMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<ContentBlock>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const sizeClasses: Record<BlockSize, string> = {
  small: 'max-w-sm',
  medium: 'max-w-xl',
  large: 'max-w-3xl',
  full: 'max-w-full',
};

export const BlockWrapper = ({
  block,
  isEditMode,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: BlockWrapperProps) => {
  const renderBlock = () => {
    switch (block.type) {
      case 'heading':
        return <HeadingBlockComponent block={block} isEditMode={isEditMode} onUpdate={onUpdate} />;
      case 'text':
        return <TextBlockComponent block={block} isEditMode={isEditMode} onUpdate={onUpdate} />;
      case 'image':
        return <ImageBlockComponent block={block} isEditMode={isEditMode} onUpdate={onUpdate} />;
      case 'video':
        return <VideoBlockComponent block={block} isEditMode={isEditMode} onUpdate={onUpdate} />;
      case 'code':
        return <CodeBlockComponent block={block} isEditMode={isEditMode} onUpdate={onUpdate} />;
      case 'list':
        return <ListBlockComponent block={block} isEditMode={isEditMode} onUpdate={onUpdate} />;
      case 'divider':
        return <DividerBlockComponent block={block} isEditMode={isEditMode} />;
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

  return (
    <div
      className={cn(
        'group relative transition-all duration-200 animate-fade-in',
        sizeClasses[block.size],
        isEditMode && 'cursor-pointer',
        isEditMode && !isSelected && 'hover:ring-1 hover:ring-primary/30 rounded-lg',
        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg'
      )}
      onClick={isEditMode ? onSelect : undefined}
    >
      {/* Edit Controls */}
      {isEditMode && isSelected && (
        <div className="absolute -top-12 left-0 flex items-center gap-1 p-1 bg-card border border-border rounded-lg shadow-lg z-10 animate-fade-in">
          <div className="flex items-center gap-1 px-2 border-r border-border">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{blockTypeNames[block.type]}</span>
          </div>
          
          <Select
            value={block.size}
            onValueChange={(value) => onUpdate({ size: value as BlockSize })}
          >
            <SelectTrigger className="w-20 h-7 text-xs bg-secondary border-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">소</SelectItem>
              <SelectItem value="medium">중</SelectItem>
              <SelectItem value="large">대</SelectItem>
              <SelectItem value="full">전체</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onMoveUp(); }}>
            <ChevronUp className="w-4 h-4" />
          </Button>
          
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onMoveDown(); }}>
            <ChevronDown className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Block Content */}
      <div className={cn(
        'p-4',
        isEditMode && isSelected && 'bg-secondary/30 rounded-lg'
      )}>
        {renderBlock()}
      </div>
    </div>
  );
};
