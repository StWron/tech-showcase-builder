import { ContentBlock, GridPosition } from '@/types/page-builder';
import { getBlockDefinition } from '@/blocks';

export const GRID_COLUMNS = 12;

/** 블록 타입별 기본 그리드 스팬 — 레지스트리의 정의를 따른다 */
export const getDefaultSpan = (type: ContentBlock['type']): number =>
  getBlockDefinition(type)?.defaultSpan ?? 6;

/** order 기반으로 자동 그리드 위치 계산 */
export const calculateGridPositions = (blocks: ContentBlock[]): Map<string, GridPosition> => {
  const positions = new Map<string, GridPosition>();

  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  let currentRow = 0;
  let currentColumn = 1;

  for (const block of sortedBlocks) {
    if (block.gridPosition) {
      // 사용자 지정 위치가 있으면 사용
      positions.set(block.id, block.gridPosition);
    } else {
      // 자동 계산
      const span = getDefaultSpan(block.type);

      // 현재 행에 맞지 않으면 다음 행으로
      if (currentColumn + span - 1 > GRID_COLUMNS) {
        currentRow++;
        currentColumn = 1;
      }

      positions.set(block.id, {
        column: currentColumn,
        columnSpan: span,
        row: currentRow,
      });

      currentColumn += span;

      // 전체 너비 블록 후 다음 행으로
      if (span === 12) {
        currentRow++;
        currentColumn = 1;
      }
    }
  }

  return positions;
};

/** 격자 위치 기준으로 블록을 읽기 순서(행 → 열)대로 정렬 */
export const sortByGrid = (
  blocks: ContentBlock[],
  positions: Map<string, GridPosition>
): ContentBlock[] =>
  [...blocks].sort((a, b) => {
    const posA = positions.get(a.id);
    const posB = positions.get(b.id);
    if (!posA || !posB) return a.order - b.order;
    if (posA.row !== posB.row) return posA.row - posB.row;
    return posA.column - posB.column;
  });

/** 격자에 실제로 놓이는 자리 (1-기준 열, 0-기준 행) */
export interface CellPlacement {
  column: number;
  span: number;
  row: number;
}

/**
 * 블록이 격자에서 차지할 자리를 확정한다.
 *
 * 에디터 캔버스와 산출물 생성기가 **같은 함수**를 쓴다. 배치 규칙이 갈라지면
 * 편집 화면과 실제 결과물이 달라지는데, 페이지 빌더에서 그건 버그다.
 */
export const resolveCellPlacement = (
  block: ContentBlock,
  position?: GridPosition
): CellPlacement => {
  const column = Math.min(GRID_COLUMNS, Math.max(1, position?.column || 1));
  const requested = Math.max(1, position?.columnSpan || getDefaultSpan(block.type));
  const span = Math.min(requested, GRID_COLUMNS - column + 1);
  const row = Math.max(0, position?.row ?? 0);

  return { column, span, row };
};

/** CSS Grid 배치 문자열. grid-row 는 1-기준이므로 한 칸 민다. */
export const toGridStyle = (placement: CellPlacement) => ({
  gridColumn: `${placement.column} / span ${placement.span}`,
  gridRow: `${placement.row + 1}`,
});

export interface DropTarget {
  column: number;
  row: number;
  /** 대상 행의 아래쪽 절반에 떨어뜨렸는지 — 새 행을 위/아래 어디에 끼울지 정한다 */
  insertAfter: boolean;
}

export interface DropPlan {
  blockId: string;
  position: GridPosition;
  /** 이 행 번호 이상인 다른 블록을 한 칸씩 내려야 하면 그 시작 행 */
  shiftRowsFrom: number | null;
}

const overlapsColumns = (a: CellPlacement, b: CellPlacement): boolean =>
  a.column <= b.column + b.span - 1 && b.column <= a.column + a.span - 1;

/**
 * 드롭 결과를 계산한다.
 *
 * 같은 행에 자리가 남아 있으면 나란히 놓고, 이미 차 있으면 새 행을 끼워 넣는다.
 * 블록이 서로 겹치는 일이 없어야 하므로 "그냥 그 자리에 얹기"는 하지 않는다.
 */
export const planDrop = (
  blocks: ContentBlock[],
  positions: Map<string, GridPosition>,
  draggedId: string,
  target: DropTarget
): DropPlan | null => {
  const dragged = blocks.find((block) => block.id === draggedId);
  if (!dragged) return null;

  const { span } = resolveCellPlacement(dragged, positions.get(draggedId));
  const column = Math.min(Math.max(1, target.column), GRID_COLUMNS - span + 1);
  const row = Math.max(0, target.row);
  const candidate: CellPlacement = { column, span, row };

  const collides = blocks.some((block) => {
    if (block.id === draggedId) return false;
    const other = resolveCellPlacement(block, positions.get(block.id));
    return other.row === row && overlapsColumns(candidate, other);
  });

  if (!collides) {
    return {
      blockId: draggedId,
      position: { column, columnSpan: span, row },
      shiftRowsFrom: null,
    };
  }

  const insertAt = target.insertAfter ? row + 1 : row;
  return {
    blockId: draggedId,
    position: { column, columnSpan: span, row: insertAt },
    shiftRowsFrom: insertAt,
  };
};
