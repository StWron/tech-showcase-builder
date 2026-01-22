import { TechPage } from '@/types/page-builder';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit2, Eye, Clock, Tag } from 'lucide-react';

interface PageHeaderProps {
  page: TechPage;
  isEditMode: boolean;
  onUpdateMeta: (updates: Partial<Pick<TechPage, 'title' | 'subtitle' | 'category'>>) => void;
}

export const PageHeader = ({ page, isEditMode, onUpdateMeta }: PageHeaderProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <header className="relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 tech-grid opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      
      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        {/* Category Badge */}
        <div className="flex items-center gap-3 mb-6">
          {isEditMode ? (
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              <Input
                value={page.category}
                onChange={(e) => onUpdateMeta({ category: e.target.value })}
                className="w-40 h-8 bg-secondary/50 border-border text-sm"
                placeholder="카테고리"
              />
            </div>
          ) : (
            <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10">
              {page.category}
            </Badge>
          )}
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {formatDate(page.lastModified)}
          </div>
        </div>

        {/* Title */}
        {isEditMode ? (
          <Input
            value={page.title}
            onChange={(e) => onUpdateMeta({ title: e.target.value })}
            className="text-4xl md:text-5xl font-bold bg-transparent border-none text-glow mb-4 h-auto p-0 focus-visible:ring-1 focus-visible:ring-primary"
            placeholder="페이지 제목"
          />
        ) : (
          <h1 className="text-4xl md:text-5xl font-bold text-glow mb-4">
            {page.title}
          </h1>
        )}

        {/* Subtitle */}
        {isEditMode ? (
          <Input
            value={page.subtitle}
            onChange={(e) => onUpdateMeta({ subtitle: e.target.value })}
            className="text-lg md:text-xl text-muted-foreground bg-transparent border-none h-auto p-0 focus-visible:ring-1 focus-visible:ring-primary max-w-2xl"
            placeholder="부제목 또는 설명"
          />
        ) : (
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
            {page.subtitle}
          </p>
        )}

        {/* Status Indicator */}
        <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/80 border border-border">
          {isEditMode ? (
            <>
              <Edit2 className="w-3 h-3 text-primary" />
              <span className="text-xs text-primary font-medium">편집 모드</span>
            </>
          ) : (
            <>
              <Eye className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">보기 모드</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
