import { ImageBlock } from '@/types/page-builder';
import { Input } from '@/components/ui/input';
import { ImageIcon } from 'lucide-react';

interface ImageBlockComponentProps {
  block: ImageBlock;
  isEditMode: boolean;
  onUpdate: (updates: Partial<ImageBlock>) => void;
}

export const ImageBlockComponent = ({ block, isEditMode, onUpdate }: ImageBlockComponentProps) => {
  if (isEditMode) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">이미지 URL</span>
        </div>
        <Input
          value={block.src}
          onChange={(e) => onUpdate({ src: e.target.value })}
          className="bg-secondary border-border"
          placeholder="https://example.com/image.jpg"
        />
        <Input
          value={block.alt}
          onChange={(e) => onUpdate({ alt: e.target.value })}
          className="bg-secondary border-border"
          placeholder="이미지 설명 (alt 텍스트)"
        />
        <Input
          value={block.caption || ''}
          onChange={(e) => onUpdate({ caption: e.target.value })}
          className="bg-secondary border-border"
          placeholder="캡션 (선택사항)"
        />
        {block.src && (
          <div className="mt-4 rounded-lg overflow-hidden border border-border">
            <img 
              src={block.src} 
              alt={block.alt} 
              className="w-full h-auto object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </div>
    );
  }

  if (!block.src) {
    return (
      <div className="flex items-center justify-center h-48 bg-secondary/50 rounded-lg border border-dashed border-border">
        <div className="text-center text-muted-foreground">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>이미지가 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <figure className="space-y-2">
      <div className="rounded-lg overflow-hidden border border-border glow-border">
        <img 
          src={block.src} 
          alt={block.alt} 
          className="w-full h-auto object-cover"
        />
      </div>
      {block.caption && (
        <figcaption className="text-sm text-muted-foreground text-center italic">
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
};
