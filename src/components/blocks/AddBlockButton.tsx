import { BlockType } from '@/types/page-builder';
import { BLOCK_REGISTRY } from '@/blocks';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface AddBlockButtonProps {
  onAddBlock: (type: BlockType) => void;
  /** 게시 권한으로 허용된 타입. 지정하면 그 외 타입은 추가할 수 없다. */
  allowedTypes?: BlockType[];
}

export const AddBlockButton = ({ onAddBlock, allowedTypes }: AddBlockButtonProps) => {
  const [open, setOpen] = useState(false);

  const available = allowedTypes
    ? BLOCK_REGISTRY.filter(({ type }) => allowedTypes.includes(type))
    : BLOCK_REGISTRY;

  const handleAddBlock = (type: BlockType) => {
    onAddBlock(type);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          블록 추가
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2 bg-card border-border">
        <div className="grid grid-cols-2 gap-1">
          {available.map(({ type, icon: Icon, label }) => (
            <Button
              key={type}
              variant="ghost"
              className="justify-start gap-2 h-10 hover:bg-primary/10 hover:text-primary"
              onClick={() => handleAddBlock(type)}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Button>
          ))}
          {available.length === 0 && (
            <p className="col-span-2 p-3 text-xs text-muted-foreground text-center">
              권한에서 모든 블록 타입이 꺼져 있습니다.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
