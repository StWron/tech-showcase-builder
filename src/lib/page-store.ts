import { PageCapabilities, PageSource, TechPage } from '@/types/page-builder';
import { countDisabledCapabilities, normalizeCapabilities } from './capabilities';

const STORAGE_KEY = 'techPages';

export interface SavedPageEntry {
  id: string;
  page: TechPage;
  capabilities: PageCapabilities;
}

export interface SavedPageSummary {
  id: string;
  title: string;
  category: string;
  lastModified: string;
  blockCount: number;
  /** 꺼져 있는 권한 수 — 목록에서 배포 성격을 한눈에 보기 위한 값 */
  disabledCount: number;
}

/**
 * 보관함 한 칸을 해석한다.
 *
 * 권한 개념 이전에 저장된 순수 TechPage 도 받아준다. 저장된 값은 사용자가
 * 직접 고칠 수 있는 자리(localStorage)이므로 신뢰하지 않고 형태를 검사한다.
 */
const parseEntry = (id: string, raw: unknown): SavedPageEntry | null => {
  if (!raw || typeof raw !== 'object') return null;

  const wrapper = raw as Partial<PageSource> & Partial<TechPage>;
  const page = (wrapper.page ?? raw) as Partial<TechPage>;

  if (!page || typeof page !== 'object' || !Array.isArray(page.blocks)) return null;

  return {
    id,
    page: {
      id: typeof page.id === 'string' ? page.id : id,
      title: typeof page.title === 'string' ? page.title : '제목 없음',
      subtitle: typeof page.subtitle === 'string' ? page.subtitle : '',
      category: typeof page.category === 'string' ? page.category : '범용',
      lastModified:
        typeof page.lastModified === 'string' ? page.lastModified : new Date(0).toISOString(),
      blocks: page.blocks,
    },
    capabilities: normalizeCapabilities(wrapper.capabilities),
  };
};

const readRaw = (): Record<string, unknown> => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    // 손상된 값 하나 때문에 보관함 전체가 막히지 않게 한다
    return {};
  }
};

const writeRaw = (value: Record<string, unknown>): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    return true;
  } catch {
    // 용량 초과 / 시크릿 모드
    return false;
  }
};

/** 최근 수정순으로 정렬된 보관함 전체 */
export const readAllPages = (): SavedPageEntry[] =>
  Object.entries(readRaw())
    .map(([id, raw]) => parseEntry(id, raw))
    .filter((entry): entry is SavedPageEntry => entry !== null)
    .sort((a, b) => b.page.lastModified.localeCompare(a.page.lastModified));

export const readPage = (id: string): SavedPageEntry | null => parseEntry(id, readRaw()[id]);

export const writePage = (page: TechPage, capabilities: PageCapabilities): boolean => {
  const all = readRaw();
  all[page.id] = { version: 1, page, capabilities } satisfies PageSource;
  return writeRaw(all);
};

export const removePage = (id: string): boolean => {
  const all = readRaw();
  delete all[id];
  return writeRaw(all);
};

export const summarize = (entry: SavedPageEntry): SavedPageSummary => ({
  id: entry.id,
  title: entry.page.title,
  category: entry.page.category,
  lastModified: entry.page.lastModified,
  blockCount: entry.page.blocks.length,
  disabledCount: countDisabledCapabilities(entry.capabilities),
});
