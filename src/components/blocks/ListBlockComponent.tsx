import { ListBlock } from '@/types/page-builder';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, X, List } from 'lucide-react';

interface ListBlockComponentProps {
  block: ListBlock;
  isEditMode: boolean;
  onUpdate: (updates: Partial<ListBlock>) => void;
}

export const ListBlockComponent = ({ block, isEditMode, onUpdate }: ListBlockComponentProps) => {
  const addItem = () => {
    onUpdate({ items: [...block.items, '새 항목'] });
  };

  const removeItem = (index: number) => {
    onUpdate({ items: block.items.filter((_, i) => i !== index) });
  };

  const updateItem = (index: number, value: string) => {
    const newItems = [...block.items];
    newItems[index] = value;
    onUpdate({ items: newItems });
  };

  if (isEditMode) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <List className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">목록</span>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="ordered" className="text-sm text-muted-foreground">번호 목록</Label>
            <Switch
              id="ordered"
              checked={block.ordered}
              onCheckedChange={(checked) => onUpdate({ ordered: checked })}
            />
          </div>
        </div>
        <div className="space-y-2">
          {block.items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-6 text-muted-foreground text-sm">
                {block.ordered ? `${index + 1}.` : '•'}
              </span>
              <Input
                value={item}
                onChange={(e) => updateItem(index, e.target.value)}
                className="flex-1 bg-secondary border-border"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(index)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={addItem}
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          항목 추가
        </Button>
      </div>
    );
  }

  const ListTag = block.ordered ? 'ol' : 'ul';

  return (
    <ListTag className={`space-y-2 ${block.ordered ? 'list-decimal' : 'list-disc'} list-inside`}>
      {block.items.map((item, index) => (
        <li key={index} className="text-foreground/90 leading-relaxed">
          {item}
        </li>
      ))}
    </ListTag>
  );
};
