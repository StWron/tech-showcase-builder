import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TechPage } from '@/types/page-builder';
import {
  CAPABILITY_PRESETS,
  countDisabledCapabilities,
  defaultCapabilities,
  matchPreset,
  toggleBlockType,
} from '@/lib/capabilities';
import { readAllPages, readPage, removePage, summarize, writePage } from '@/lib/page-store';

const makePage = (overrides: Partial<TechPage> = {}): TechPage => ({
  id: 'p1',
  title: '페이지',
  subtitle: '설명',
  category: '자동화',
  lastModified: '2026-01-01T00:00:00.000Z',
  blocks: [{ id: 'h', type: 'heading', content: '제목', level: 2, size: 'full', order: 0 }],
  ...overrides,
});

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('page-store', () => {
  it('저장한 페이지를 권한까지 그대로 되읽는다', () => {
    const capabilities = toggleBlockType(defaultCapabilities(), 'code', false);
    expect(writePage(makePage(), capabilities)).toBe(true);

    const entry = readPage('p1');
    expect(entry?.page.title).toBe('페이지');
    expect(entry?.capabilities.allowedBlockTypes).not.toContain('code');
  });

  it('없는 id는 null', () => {
    expect(readPage('없음')).toBeNull();
  });

  it('최근 수정순으로 정렬한다', () => {
    writePage(makePage({ id: 'old', lastModified: '2026-01-01T00:00:00.000Z' }), defaultCapabilities());
    writePage(makePage({ id: 'new', lastModified: '2026-06-01T00:00:00.000Z' }), defaultCapabilities());

    expect(readAllPages().map((entry) => entry.id)).toEqual(['new', 'old']);
  });

  it('삭제하면 목록에서 빠진다', () => {
    writePage(makePage(), defaultCapabilities());
    expect(removePage('p1')).toBe(true);
    expect(readAllPages()).toEqual([]);
  });

  it('권한 개념 이전에 저장된 순수 TechPage도 읽어낸다', () => {
    localStorage.setItem('techPages', JSON.stringify({ legacy: makePage({ id: 'legacy' }) }));

    const entry = readPage('legacy');
    expect(entry?.page.title).toBe('페이지');
    expect(entry?.capabilities).toEqual(defaultCapabilities());
  });

  it('손상된 칸 하나 때문에 보관함 전체가 막히지 않는다', () => {
    localStorage.setItem(
      'techPages',
      JSON.stringify({ broken: { nope: true }, alsoBroken: null, good: { version: 1, page: makePage({ id: 'good' }) } })
    );

    expect(readAllPages().map((entry) => entry.id)).toEqual(['good']);
  });

  it('저장소 자체가 깨져 있으면 빈 보관함으로 취급한다', () => {
    localStorage.setItem('techPages', '{이건 JSON이 아님');

    expect(readAllPages()).toEqual([]);
  });

  it('저장 실패(용량 초과 등)를 false로 알린다', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(writePage(makePage(), defaultCapabilities())).toBe(false);
  });

  it('요약에 블록 수와 꺼진 권한 수를 담는다', () => {
    const capabilities = toggleBlockType(
      { ...defaultCapabilities(), showFooter: false },
      'code',
      false
    );
    writePage(makePage(), capabilities);

    expect(summarize(readAllPages()[0])).toMatchObject({
      id: 'p1',
      title: '페이지',
      blockCount: 1,
      // 기본값에서 꺼져 있는 2개(편집 재개방, 원본 내려받기) + 푸터 + code 타입
      disabledCount: 4,
    });
  });
});

describe('capability presets', () => {
  it('기본 권한은 편집 재개방과 원본 내려받기만 꺼져 있다', () => {
    // 배포물에 편집 경로와 원본을 심는 것은 명시적으로 켜야 하는 선택이다
    expect(countDisabledCapabilities(defaultCapabilities())).toBe(2);
  });

  it('스위치를 끌 때마다 개수가 늘어난다', () => {
    const base = countDisabledCapabilities(defaultCapabilities());

    expect(countDisabledCapabilities({ ...defaultCapabilities(), showFooter: false })).toBe(base + 1);
    expect(countDisabledCapabilities(toggleBlockType(defaultCapabilities(), 'code', false))).toBe(
      base + 1
    );
  });

  it('프리셋을 적용하면 그 프리셋으로 인식된다', () => {
    for (const preset of CAPABILITY_PRESETS) {
      expect(matchPreset(preset.capabilities)).toBe(preset.id);
    }
  });

  it('프리셋에서 한 칸이라도 달라지면 더 이상 일치하지 않는다', () => {
    const preset = CAPABILITY_PRESETS[0];

    expect(matchPreset({ ...preset.capabilities, showFooter: !preset.capabilities.showFooter })).toBeNull();
  });

  it('블록 타입 순서가 달라도 같은 집합이면 일치로 본다', () => {
    const preset = CAPABILITY_PRESETS[0];
    const shuffled = [...preset.capabilities.allowedBlockTypes].reverse();

    expect(matchPreset({ ...preset.capabilities, allowedBlockTypes: shuffled })).toBe(preset.id);
  });

  it('인쇄용 유인물 프리셋은 코드와 동영상을 뺀다', () => {
    const handout = CAPABILITY_PRESETS.find((preset) => preset.id === 'handout');

    expect(handout?.capabilities.allowedBlockTypes).not.toContain('code');
    expect(handout?.capabilities.allowedBlockTypes).not.toContain('video');
  });
});
