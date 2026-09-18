import { useState, useRef, useCallback } from 'react';
import { ContentBlock } from '@/types/page-builder';
import { BlockWrapper } from './BlockWrapper';
import { cn } from '@/lib/utils';
import {
  GRID_COLUMNS,
  GRID_ROW_HEIGHT,
  getDefaultSpan,
  calculateGridPositions,
  sortByGrid,
} from '@/lib/grid';

interface GridCanvasProps {
  blocks: ContentBlock[];
  isEditMode: boolean;
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onUpdateBlock: (id: string, updates: Partial<ContentBlock>) => void;
  onDeleteBlock: (id: string) => void;
  onMoveBlock: (id: string, direction: 'up' | 'down') => void;
}

export const GridCanvas = ({
  blocks,
  isEditMode,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlock,
  onDeleteBlock,
  onMoveBlock,
}: GridCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<{ column: number; row: number } | null>(null);

  const gridPositions = calculateGridPositions(blocks);

  // 드래그 시작
  const handleDragStart = useCallback((e: React.DragEvent, blockId: string) => {
    if (!isEditMode) return;
    e.dataTransfer.setData('blockId', blockId);
    setDraggingId(blockId);
  }, [isEditMode]);

  // 드래그 종료
  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDragOverPosition(null);
  }, []);

  // 그리드 영역 위로 드래그
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!containerRef.current || !isEditMode) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const columnWidth = rect.width / GRID_COLUMNS;
    const column = Math.max(1, Math.min(GRID_COLUMNS, Math.ceil(x / columnWidth)));
    const row = Math.floor(y / GRID_ROW_HEIGHT);

    setDragOverPosition({ column, row });
  }, [isEditMode]);

  // 드롭
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!dragOverPosition) return;

    const blockId = e.dataTransfer.getData('blockId');
    if (!blockId) return;

    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const currentPosition = gridPositions.get(blockId);
    const span = currentPosition?.columnSpan || getDefaultSpan(block.type);

    // 그리드 경계 내로 조정
    const adjustedColumn = Math.min(dragOverPosition.column, GRID_COLUMNS - span + 1);

    onUpdateBlock(blockId, {
      gridPosition: {
        column: adjustedColumn,
        columnSpan: span,
        row: dragOverPosition.row,
      },
    });

    setDraggingId(null);
    setDragOverPosition(null);
  }, [blocks, gridPositions, dragOverPosition, onUpdateBlock]);

  // 블록 크기 조절 (열 스팬)
  const handleResizeBlock = useCallback((blockId: string, newSpan: number) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const currentPosition = gridPositions.get(blockId) || {
      column: 1,
      columnSpan: getDefaultSpan(block.type),
      row: 0,
    };

    // 스팬이 그리드를 넘지 않도록 조정
    const maxSpan = GRID_COLUMNS - currentPosition.column + 1;
    const adjustedSpan = Math.min(newSpan, maxSpan);

    onUpdateBlock(blockId, {
      gridPosition: {
        ...currentPosition,
        columnSpan: adjustedSpan,
      },
    });
  }, [blocks, gridPositions, onUpdateBlock]);

  const sortedBlocks = sortByGrid(blocks, gridPositions);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full',
        isEditMode && 'min-h-[400px]'
      )}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* 격자 가이드 (편집 모드에서만) */}
      {isEditMode && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="grid grid-cols-12 gap-1 h-full opacity-10">
            {Array.from({ length: GRID_COLUMNS }).map((_, i) => (
              <div 
                key={i} 
                className="h-full border-x border-primary/30"
              />
            ))}
          </div>
        </div>
      )}

      {/* 드롭 미리보기 */}
      {isEditMode && dragOverPosition && draggingId && (
        <div
          className="absolute bg-primary/20 border-2 border-dashed border-primary rounded-lg pointer-events-none transition-all"
          style={{
            left: `${((dragOverPosition.column - 1) / GRID_COLUMNS) * 100}%`,
            top: `${dragOverPosition.row * GRID_ROW_HEIGHT}px`,
            width: `${((gridPositions.get(draggingId)?.columnSpan || 6) / GRID_COLUMNS) * 100}%`,
            height: `${GRID_ROW_HEIGHT * 2}px`,
          }}
        />
      )}

      {/* 블록들 - 절대 위치로 격자에 고정 */}
      <div 
        className="relative w-full"
        style={{
          minHeight: `${(Math.max(...Array.from(gridPositions.values()).map(p => p.row), 0) + 3) * GRID_ROW_HEIGHT}px`,
        }}
      >
        {sortedBlocks.map((block) => {
          const position = gridPositions.get(block.id);
          const span = position?.columnSpan || getDefaultSpan(block.type);
          const column = position?.column || 1;
          const row = position?.row || 0;

          return (
            <div
              key={block.id}
              className={cn(
                'absolute transition-all duration-200',
                draggingId === block.id && 'opacity-50',
              )}
              style={{
                left: `${((column - 1) / GRID_COLUMNS) * 100}%`,
                top: `${row * GRID_ROW_HEIGHT}px`,
                width: `${(span / GRID_COLUMNS) * 100}%`,
                padding: '0 8px',
              }}
              draggable={isEditMode}
              onDragStart={(e) => handleDragStart(e, block.id)}
              onDragEnd={handleDragEnd}
            >
              <BlockWrapper
                block={block}
                isEditMode={isEditMode}
                isLayoutLocked={false}
                isSelected={selectedBlockId === block.id}
                onSelect={() => onSelectBlock(block.id)}
                onUpdate={(updates) => onUpdateBlock(block.id, updates)}
                onDelete={() => onDeleteBlock(block.id)}
                onMoveUp={() => onMoveBlock(block.id, 'up')}
                onMoveDown={() => onMoveBlock(block.id, 'down')}
                gridSpan={span}
                onResizeGrid={(newSpan) => handleResizeBlock(block.id, newSpan)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};