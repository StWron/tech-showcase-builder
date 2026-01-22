import { VideoBlock } from '@/types/page-builder';
import { Input } from '@/components/ui/input';
import { Video } from 'lucide-react';

interface VideoBlockComponentProps {
  block: VideoBlock;
  isEditMode: boolean;
  onUpdate: (updates: Partial<VideoBlock>) => void;
}

const getEmbedUrl = (url: string): string | null => {
  // YouTube
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }
  
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  
  // Direct video URL
  if (url.match(/\.(mp4|webm|ogg)$/i)) {
    return url;
  }
  
  return null;
};

export const VideoBlockComponent = ({ block, isEditMode, onUpdate }: VideoBlockComponentProps) => {
  const embedUrl = getEmbedUrl(block.src);
  const isDirectVideo = block.src.match(/\.(mp4|webm|ogg)$/i);

  if (isEditMode) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">동영상 URL (YouTube, Vimeo, 직접 링크)</span>
        </div>
        <Input
          value={block.src}
          onChange={(e) => onUpdate({ src: e.target.value })}
          className="bg-secondary border-border"
          placeholder="https://youtube.com/watch?v=..."
        />
        <Input
          value={block.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="bg-secondary border-border"
          placeholder="동영상 제목 (선택사항)"
        />
        {embedUrl && (
          <div className="mt-4 aspect-video rounded-lg overflow-hidden border border-border">
            {isDirectVideo ? (
              <video src={embedUrl} controls className="w-full h-full" />
            ) : (
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        )}
      </div>
    );
  }

  if (!embedUrl) {
    return (
      <div className="flex items-center justify-center aspect-video bg-secondary/50 rounded-lg border border-dashed border-border">
        <div className="text-center text-muted-foreground">
          <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>동영상 URL을 입력하세요</p>
        </div>
      </div>
    );
  }

  return (
    <figure className="space-y-2">
      <div className="aspect-video rounded-lg overflow-hidden border border-border glow-border">
        {isDirectVideo ? (
          <video src={embedUrl} controls className="w-full h-full object-cover" />
        ) : (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
      {block.title && (
        <figcaption className="text-sm text-muted-foreground text-center">
          {block.title}
        </figcaption>
      )}
    </figure>
  );
};
