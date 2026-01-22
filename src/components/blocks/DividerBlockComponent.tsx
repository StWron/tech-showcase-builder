import { DividerBlock } from '@/types/page-builder';

interface DividerBlockComponentProps {
  block: DividerBlock;
  isEditMode: boolean;
}

export const DividerBlockComponent = ({ isEditMode }: DividerBlockComponentProps) => {
  return (
    <div className={`py-4 ${isEditMode ? 'bg-secondary/20 rounded' : ''}`}>
      <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    </div>
  );
};
