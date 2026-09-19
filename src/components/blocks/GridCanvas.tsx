import { useCallback, useMemo, useRef, useState } from 'react';
import { ContentBlock } from '@/types/page-builder';
import { BlockWrapper } from './BlockWrapper';
import { cn } from '@/lib/utils';
import {
  GRID_COLUMNS,
  calculateGridPositions,
  planDrop,
  resolveCellPlacement,
  sortByGrid,
  toGridStyle,
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

/** 행 하나가 캔버스에서 차지한 세로 구간 (컨테이너 기준) */
interface RowBand {
  top: number;
  bottom: number;
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
  const cellElements = useRef(new Map<string, HTMLElement>());
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<{
    column: number;
    row: number;
    insertAfter: boolean;
  } | null>(null);

  const gridPositions = useMemo(() => calculateGridPositions(blocks), [blocks]);
  const sortedBlocks = useMemo(
    () => sortByGrid(blocks, gridPositions),
    [blocks, gridPositions]
  );

  const placements = useMemo(
    () =>
      new Map(
        blocks.map((block) => [block.id, resolveCellPlacement(block, gridPositions.get(block.id))])
      ),
    [blocks, gridPositions]
  );

  const registerCell = useCallback((id: string, element: HTMLElement | null) => {
    if (element) cellElements.current.set(id, element);
    else cellElements.current.delete(id);
  }, []);

  /**
   * 행의 실제 높이를 DOM 에서 잰다.
   *
   * 격자 행은 내용에 따라 높이가 달라지므로 고정값으로 계산할 수 없다.
   * (예전에는 행당 60px 로 가정하고 절대 배치했는데, 내용이 그보다 길면
   * 아래 행을 덮어써서 글자가 겹쳤다.)
   */
  const measureRowBands = useCallback((): Map<number, RowBand> => {
    const bands = new Map<number, RowBand>();
    const container = containerRef.current;
    if (!container) return bands;

    const base = container.getBoundingClientRect().top;

    for (const [id, element] of cellElements.current) {
      const placement = placements.get(id);
      if (!placement) continue;

      const rect = element.getBoundingClientRect();
      const band = { top: rect.top - base, bottom: rect.bottom - base };
      const existing = bands.get(placement.row);

      bands.set(
        placement.row,
        existing
          ? { top: Math.min(existing.top, band.top), bottom: Math.max(existing.bottom, band.bottom) }
          : band
      );
    }

    return bands;
  }, [placements]);

  const rowAt = useCallback(
    (y: number, bands: Map<number, RowBand>): number => {
      const rows = [...bands.entries()].sort((a, b) => a[1].top - b[1].top);
      if (!rows.length) return 0;

      for (const [row, band] of rows) {
        if (y >= band.top && y <= band.bottom) return row;
      }

      const [firstRow, firstBand] = rows[0];
      if (y < firstBand.top) return firstRow;

      // 마지막 행보다 아래로 떨어뜨리면 새 행
      return Math.max(...rows.map(([row]) => row)) + 1;
    },
    []
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent, blockId: string) => {
      if (!isEditMode) return;
      e.dataTransfer.setData('blockId', blockId);
      e.dataTransfer.effectAllowed = 'move';
      setDraggingId(blockId);
    },
    [isEditMode]
  );

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDragOverPosition(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!isEditMode || !containerRef.current) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      const rect = containerRef.current.getBoundingClientRect();
      const columnWidth = rect.width / GRID_COLUMNS;
      const column = Math.max(
        1,
        Math.min(GRID_COLUMNS, Math.ceil((e.clientX - rect.left) / columnWidth))
      );

      const bands = measureRowBands();
      const y = e.clientY - rect.top;
      const row = rowAt(y, bands);
      const band = bands.get(row);

      setDragOverPosition({
        column,
        row,
        insertAfter: band ? y > (band.top + band.bottom) / 2 : false,
      });
    },
    [isEditMode, measureRowBands, rowAt]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (e.currentTarget === e.target) setDragOverPosition(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!dragOverPosition) return;

      const blockId = e.dataTransfer.getData('blockId');
      const plan = blockId ? planDrop(blocks, gridPositions, blockId, dragOverPosition) : null;

      setDraggingId(null);
      setDragOverPosition(null);
      if (!plan) return;

      // 자리가 차 있으면 새 행을 끼우고 아래쪽 블록을 한 칸씩 내린다
      if (plan.shiftRowsFrom !== null) {
        for (const block of blocks) {
          if (block.id === plan.blockId) continue;

          const placement = placements.get(block.id);
          if (!placement || placement.row < plan.shiftRowsFrom) continue;

          onUpdateBlock(block.id, {
            gridPosition: {
              column: placement.column,
              columnSpan: placement.span,
              row: placement.row + 1,
            },
          });
        }
      }

      onUpdateBlock(plan.blockId, { gridPosition: plan.position });
    },
    [dragOverPosition, blocks, gridPositions, placements, onUpdateBlock]
  );

  const handleResizeBlock = useCallback(
    (blockId: string, newSpan: number) => {
      const placement = placements.get(blockId);
      if (!placement) return;

      onUpdateBlock(blockId, {
        gridPosition: {
          column: placement.column,
          columnSpan: Math.min(newSpan, GRID_COLUMNS - placement.column + 1),
          row: placement.row,
        },
      });
    },
    [placements, onUpdateBlock]
  );

  const previewBand = dragOverPosition ? measureRowBands().get(dragOverPosition.row) : undefined;
  const previewSpan = draggingId ? placements.get(draggingId)?.span ?? 6 : 6;

  return (
    <div ref={containerRef} className={cn('relative w-full', isEditMode && 'min-h-[400px]')}>
      {/* 격자 가이드 (편집 모드에서만) */}
      {isEditMode && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="grid grid-cols-12 gap-4 h-full opacity-10">
            {Array.from({ length: GRID_COLUMNS }).map((_, i) => (
              <div key={i} className="h-full border-x border-primary/30" />
            ))}
          </div>
        </div>
      )}

      {/* 드롭 미리보기 — 실제로 잰 행 높이에 맞춘다 */}
      {isEditMode && dragOverPosition && draggingId && (
        <div
          className="absolute bg-primary/20 border-2 border-dashed border-primary rounded-lg pointer-events-none transition-all z-10"
          style={{
            left: `${((dragOverPosition.column - 1) / GRID_COLUMNS) * 100}%`,
            width: `${(Math.min(previewSpan, GRID_COLUMNS - dragOverPosition.column + 1) / GRID_COLUMNS) * 100}%`,
            top: previewBand ? `${previewBand.top}px` : undefined,
            bottom: previewBand ? undefined : 0,
            height: previewBand ? `${previewBand.bottom - previewBand.top}px` : '80px',
          }}
        />
      )}

      {/*
        블록들 — CSS Grid 로 배치한다.
        행 높이가 내용에 따라 늘어나므로 블록끼리 겹치지 않고,
        산출물 HTML 과 같은 규칙을 써서 미리보기가 결과물과 일치한다.
      */}
      <div
        className="grid grid-cols-12 gap-y-6 gap-x-4 items-start w-full"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {sortedBlocks.map((block) => {
          const placement = placements.get(block.id);
          if (!placement) return null;

          return (
            <div
              key={block.id}
              ref={(element) => registerCell(block.id, element)}
              className={cn('min-w-0 transition-opacity', draggingId === block.id && 'opacity-50')}
              style={toGridStyle(placement)}
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
                gridSpan={placement.span}
                onResizeGrid={(newSpan) => handleResizeBlock(block.id, newSpan)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
