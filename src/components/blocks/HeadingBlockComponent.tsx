import { HeadingBlock } from '@/types/page-builder';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HeadingBlockComponentProps {
  block: HeadingBlock;
  isEditMode: boolean;
  onUpdate: (updates: Partial<HeadingBlock>) => void;
}

export const HeadingBlockComponent = ({ block, isEditMode, onUpdate }: HeadingBlockComponentProps) => {
  const HeadingTag = `h${block.level}` as keyof JSX.IntrinsicElements;
  
  const headingStyles = {
    1: 'text-4xl md:text-5xl font-bold text-glow mb-4',
    2: 'text-2xl md:text-3xl font-semibold mb-3',
    3: 'text-xl md:text-2xl font-medium mb-2',
  };

  if (isEditMode) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Select
            value={String(block.level)}
            onValueChange={(value) => onUpdate({ level: Number(value) as 1 | 2 | 3 })}
          >
            <SelectTrigger className="w-24 bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">H1</SelectItem>
              <SelectItem value="2">H2</SelectItem>
              <SelectItem value="3">H3</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input
          value={block.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          className={`bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary ${headingStyles[block.level]}`}
          placeholder="제목을 입력하세요..."
        />
      </div>
    );
  }

  return (
    <HeadingTag className={headingStyles[block.level]}>
      {block.content}
    </HeadingTag>
  );
};
