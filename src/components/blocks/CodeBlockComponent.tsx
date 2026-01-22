import { CodeBlock } from '@/types/page-builder';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Code2 } from 'lucide-react';

interface CodeBlockComponentProps {
  block: CodeBlock;
  isEditMode: boolean;
  onUpdate: (updates: Partial<CodeBlock>) => void;
}

export const CodeBlockComponent = ({ block, isEditMode, onUpdate }: CodeBlockComponentProps) => {
  if (isEditMode) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-primary" />
          <Input
            value={block.language}
            onChange={(e) => onUpdate({ language: e.target.value })}
            className="w-32 bg-secondary border-border text-sm"
            placeholder="javascript"
          />
        </div>
        <Textarea
          value={block.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          className="min-h-[200px] bg-secondary border-border font-mono text-sm resize-y"
          placeholder="// 코드를 입력하세요..."
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <div className="flex items-center justify-between px-4 py-2 bg-secondary/80 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-destructive/60" />
            <span className="w-3 h-3 rounded-full bg-warning/60" />
            <span className="w-3 h-3 rounded-full bg-success/60" />
          </div>
        </div>
        <span className="text-xs text-muted-foreground font-mono uppercase">{block.language}</span>
      </div>
      <pre className="p-4 bg-secondary/50 overflow-x-auto scrollbar-thin">
        <code className="text-sm font-mono text-foreground/90 whitespace-pre">
          {block.content}
        </code>
      </pre>
    </div>
  );
};
