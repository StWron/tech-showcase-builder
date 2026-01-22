import { TextBlock } from '@/types/page-builder';
import { Textarea } from '@/components/ui/textarea';

interface TextBlockComponentProps {
  block: TextBlock;
  isEditMode: boolean;
  onUpdate: (updates: Partial<TextBlock>) => void;
}

export const TextBlockComponent = ({ block, isEditMode, onUpdate }: TextBlockComponentProps) => {
  if (isEditMode) {
    return (
      <Textarea
        value={block.content}
        onChange={(e) => onUpdate({ content: e.target.value })}
        className="min-h-[100px] bg-transparent border-border focus-visible:ring-1 focus-visible:ring-primary text-foreground/90 leading-relaxed resize-y"
        placeholder="텍스트를 입력하세요..."
      />
    );
  }

  return (
    <div className="prose prose-invert max-w-none">
      <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
        {block.content}
      </p>
    </div>
  );
};
