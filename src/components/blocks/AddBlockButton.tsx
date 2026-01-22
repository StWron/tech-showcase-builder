import { BlockType } from '@/types/page-builder';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Plus, 
  Type, 
  FileText, 
  Image, 
  Video, 
  Code2, 
  List, 
  Minus 
} from 'lucide-react';
import { useState } from 'react';

interface AddBlockButtonProps {
  onAddBlock: (type: BlockType) => void;
}

const blockTypes: { type: BlockType; icon: React.ReactNode; label: string }[] = [
  { type: 'heading', icon: <Type className="w-4 h-4" />, label: '제목' },
  { type: 'text', icon: <FileText className="w-4 h-4" />, label: '텍스트' },
  { type: 'image', icon: <Image className="w-4 h-4" />, label: '이미지' },
  { type: 'video', icon: <Video className="w-4 h-4" />, label: '동영상' },
  { type: 'code', icon: <Code2 className="w-4 h-4" />, label: '코드' },
  { type: 'list', icon: <List className="w-4 h-4" />, label: '목록' },
  { type: 'divider', icon: <Minus className="w-4 h-4" />, label: '구분선' },
];

export const AddBlockButton = ({ onAddBlock }: AddBlockButtonProps) => {
  const [open, setOpen] = useState(false);

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
          {blockTypes.map(({ type, icon, label }) => (
            <Button
              key={type}
              variant="ghost"
              className="justify-start gap-2 h-10 hover:bg-primary/10 hover:text-primary"
              onClick={() => handleAddBlock(type)}
            >
              {icon}
              {label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
