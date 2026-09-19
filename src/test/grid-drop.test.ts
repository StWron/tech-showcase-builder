import { describe, expect, it } from 'vitest';
import { ContentBlock, GridPosition } from '@/types/page-builder';
import { planDrop, resolveCellPlacement } from '@/lib/grid';

const block = (id: string, span: number, column: number, row: number) => ({
  content: { id, type: 'text', content: id, size: 'full', order: 0 } as ContentBlock,
  position: { column, columnSpan: span, row } as GridPosition,
});

const scene = (...entries: ReturnType<typeof block>[]) => ({
  blocks: entries.map((entry) => entry.content),
  positions: new Map(entries.map((entry) => [entry.content.id, entry.position])),
});

describe('planDrop', () => {
  it('빈 자리에는 나란히 놓는다', () => {
    const { blocks, positions } = scene(block('a', 6, 1, 0), block('b', 6, 1, 1));

    expect(planDrop(blocks, positions, 'b', { column: 7, row: 0, insertAfter: false })).toEqual({
      blockId: 'b',
      position: { column: 7, columnSpan: 6, row: 0 },
      shiftRowsFrom: null,
    });
  });

  it('차 있는 자리에 떨어뜨리면 겹치지 않게 새 행을 끼운다', () => {
    const { blocks, positions } = scene(block('a', 12, 1, 0), block('b', 8, 1, 1));

    const plan = planDrop(blocks, positions, 'b', { column: 5, row: 0, insertAfter: false });

    expect(plan?.position.row).toBe(0);
    expect(plan?.shiftRowsFrom).toBe(0); // a 는 1행으로 밀린다
  });

  it('행의 아래쪽 절반에 떨어뜨리면 그 아래에 끼운다', () => {
    const { blocks, positions } = scene(block('a', 12, 1, 0), block('b', 8, 1, 1));

    const plan = planDrop(blocks, positions, 'b', { column: 5, row: 0, insertAfter: true });

    expect(plan?.position.row).toBe(1);
    expect(plan?.shiftRowsFrom).toBe(1);
  });

  it('열이 겹치지 않으면 같은 행에 그대로 둔다', () => {
    const { blocks, positions } = scene(block('a', 4, 1, 0), block('b', 4, 1, 1));

    const plan = planDrop(blocks, positions, 'b', { column: 9, row: 0, insertAfter: false });

    expect(plan?.position).toEqual({ column: 9, columnSpan: 4, row: 0 });
    expect(plan?.shiftRowsFrom).toBeNull();
  });

  it('격자 밖으로 나가지 않게 시작 열을 당긴다', () => {
    const { blocks, positions } = scene(block('a', 8, 1, 0));

    const plan = planDrop(blocks, positions, 'a', { column: 11, row: 3, insertAfter: false });

    expect(plan?.position.column).toBe(5); // 5 + 8 - 1 = 12
  });

  it('자기 자신과는 충돌로 치지 않는다', () => {
    const { blocks, positions } = scene(block('a', 6, 1, 0));

    expect(planDrop(blocks, positions, 'a', { column: 3, row: 0, insertAfter: false })?.shiftRowsFrom).toBeNull();
  });

  it('없는 블록은 계획하지 않는다', () => {
    const { blocks, positions } = scene(block('a', 6, 1, 0));

    expect(planDrop(blocks, positions, '없음', { column: 1, row: 0, insertAfter: false })).toBeNull();
  });

  it('계획대로 옮기면 어떤 두 블록도 겹치지 않는다', () => {
    const { blocks, positions } = scene(block('a', 12, 1, 0), block('b', 6, 1, 1), block('c', 6, 7, 1));

    const plan = planDrop(blocks, positions, 'c', { column: 1, row: 0, insertAfter: false })!;

    const after = new Map(positions);
    if (plan.shiftRowsFrom !== null) {
      for (const item of blocks) {
        if (item.id === plan.blockId) continue;
        const placement = resolveCellPlacement(item, after.get(item.id));
        if (placement.row >= plan.shiftRowsFrom) {
          after.set(item.id, {
            column: placement.column,
            columnSpan: placement.span,
            row: placement.row + 1,
          });
        }
      }
    }
    after.set(plan.blockId, plan.position);

    const cells = blocks.map((item) => resolveCellPlacement(item, after.get(item.id)));
    for (let i = 0; i < cells.length; i++) {
      for (let j = i + 1; j < cells.length; j++) {
        const overlapping =
          cells[i].row === cells[j].row &&
          cells[i].column <= cells[j].column + cells[j].span - 1 &&
          cells[j].column <= cells[i].column + cells[i].span - 1;
        expect(overlapping, `${blocks[i].id} 와 ${blocks[j].id} 가 겹칩니다`).toBe(false);
      }
    }
  });
});
