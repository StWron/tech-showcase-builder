import { ContentBlock, GridPosition } from '@/types/page-builder';

export const GRID_COLUMNS = 12;
export const GRID_ROW_HEIGHT = 60; // px per grid row (에디터 캔버스 전용)

/** 블록 타입별 기본 그리드 스팬 */
export const getDefaultSpan = (type: ContentBlock['type']): number => {
  switch (type) {
    case 'heading':
    case 'divider':
      return 12;
    case 'text':
    case 'list':
      return 8;
    case 'image':
    case 'video':
      return 6;
    case 'code':
      return 10;
    default:
      return 6;
  }
};

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
