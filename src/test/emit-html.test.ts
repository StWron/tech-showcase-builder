import { describe, expect, it } from 'vitest';
import { TechPage } from '@/types/page-builder';
import { defaultCapabilities, normalizeCapabilities, toggleBlockType } from '@/lib/capabilities';
import { bake, summarizeBake } from '@/lib/bake';
import { emitHtml, extractEmbeddedSource, pruneCss, sanitizeUrl } from '@/lib/emit-html';

const SECRET_CODE = 'const apiKey = "내부-전용-코드-표식";';
const SECRET_TEXT = '내부 전용 문단 표식';

const makePage = (): TechPage => ({
  id: 'page-1',
  title: '기술 소개',
  subtitle: '부제목',
  category: '자동화',
  lastModified: '2026-01-02T03:04:05.000Z',
  blocks: [
    { id: 'h', type: 'heading', content: '개요', level: 2, size: 'full', order: 0 },
    { id: 't', type: 'text', content: SECRET_TEXT, size: 'full', order: 1 },
    { id: 'c', type: 'code', content: SECRET_CODE, language: 'javascript', size: 'large', order: 2 },
    {
      id: 'v',
      type: 'video',
      src: 'https://www.youtube.com/watch?v=aaaaaaaaaaa',
      title: '데모',
      size: 'large',
      order: 3,
    },
    { id: 'l', type: 'list', items: ['하나', '둘'], ordered: false, size: 'large', order: 4 },
  ],
});

describe('bake', () => {
  it('허용되지 않은 타입의 블록을 콘텐츠째 제거한다', () => {
    const capabilities = toggleBlockType(defaultCapabilities(), 'code', false);
    const baked = bake(makePage(), capabilities);

    expect(baked.blocks.map((block) => block.type)).not.toContain('code');
    expect(JSON.stringify(baked)).not.toContain(SECRET_CODE);
  });

  it('남은 블록의 order를 빈틈 없이 다시 매긴다', () => {
    const capabilities = toggleBlockType(defaultCapabilities(), 'code', false);
    const baked = bake(makePage(), capabilities);

    expect(baked.blocks.map((block) => block.order)).toEqual([0, 1, 2, 3]);
  });

  it('메타 정보가 꺼지면 카테고리와 수정일 자체가 없다', () => {
    const baked = bake(makePage(), { ...defaultCapabilities(), showMeta: false });

    expect(baked.category).toBeUndefined();
    expect(baked.lastModified).toBeUndefined();
    expect(JSON.stringify(baked)).not.toContain('자동화');
  });

  it('에디터 전용 필드(locked)를 털어낸다', () => {
    const page = makePage();
    page.blocks[0] = { ...page.blocks[0], locked: true };

    const baked = bake(page, defaultCapabilities());

    expect(baked.blocks[0]).not.toHaveProperty('locked');
  });

  it('무엇이 빠지는지 요약한다', () => {
    const capabilities = toggleBlockType(defaultCapabilities(), 'code', false);

    expect(summarizeBake(makePage(), capabilities)).toEqual({
      totalBlocks: 5,
      keptBlocks: 4,
      removedBlocks: 1,
      removedByType: { code: 1 },
    });
  });
});

describe('emitHtml — 꺼진 권한은 산출물에 존재하지 않는다', () => {
  it('허용된 블록은 마크업으로 나온다', () => {
    const html = emitHtml(makePage(), defaultCapabilities());

    expect(html).toContain(SECRET_TEXT);
    expect(html).toContain('내부-전용-코드-표식');
    expect(html).toContain('<h2');
  });

  it('블록 타입을 끄면 그 내용이 HTML 어디에도 없다', () => {
    const capabilities = toggleBlockType(defaultCapabilities(), 'code', false);
    const html = emitHtml(makePage(), capabilities);

    expect(html).not.toContain('내부-전용-코드-표식');
    expect(html).not.toContain('tsb-pre');
    expect(html).toContain(SECRET_TEXT); // 켜진 블록은 그대로
  });

  it('코드 복사를 끄면 버튼도 스크립트도 나오지 않는다', () => {
    const on = emitHtml(makePage(), defaultCapabilities());
    const off = emitHtml(makePage(), { ...defaultCapabilities(), codeCopy: false });

    expect(on).toContain('data-tsb-copy');
    expect(on).toContain('navigator.clipboard');
    expect(off).not.toContain('data-tsb-copy');
    expect(off).not.toContain('navigator.clipboard');
  });

  it('외부 임베드를 끄면 iframe 태그를 내보내지 않는다', () => {
    const on = emitHtml(makePage(), defaultCapabilities());
    const off = emitHtml(makePage(), { ...defaultCapabilities(), externalEmbeds: false });

    expect(on).toContain('<iframe');
    expect(off).not.toContain('<iframe');
    expect(off).toContain('tsb-external-link');
  });

  it('메타 정보를 끄면 카테고리와 수정일이 문서에 없다', () => {
    const html = emitHtml(makePage(), { ...defaultCapabilities(), showMeta: false });

    expect(html).not.toContain('자동화');
    expect(html).not.toContain('tsb-badge');
  });

  it('푸터를 끄면 푸터 마크업이 없다', () => {
    const html = emitHtml(makePage(), { ...defaultCapabilities(), showFooter: false });

    expect(html).not.toContain('tsb-footer');
  });

  it('편집 재개방과 원본 내려받기가 모두 꺼지면 원본을 심지 않는다', () => {
    const html = emitHtml(makePage(), defaultCapabilities());

    expect(html).not.toContain('tsb-source');
    expect(extractEmbeddedSource(html)).toBeNull();
  });

  it('편집 재개방을 켜면 원본이 심기고 에디터가 다시 읽을 수 있다', () => {
    const capabilities = { ...defaultCapabilities(), editing: true };
    const html = emitHtml(makePage(), capabilities);

    const embedded = extractEmbeddedSource(html);
    expect(embedded).not.toBeNull();
    expect(embedded?.page.title).toBe('기술 소개');
    expect(normalizeCapabilities(embedded?.capabilities).editing).toBe(true);
  });

  it('편집 재개방을 켜도 권한으로 제거된 콘텐츠는 심긴 원본에 없다', () => {
    const capabilities = toggleBlockType(
      { ...defaultCapabilities(), editing: true },
      'code',
      false
    );
    const html = emitHtml(makePage(), capabilities);

    // 심긴 것은 baked 모델이므로 꺼진 블록은 여기에도 없다 — 재개방이 유출 통로가 되지 않는다
    expect(html).not.toContain('내부-전용-코드-표식');
    const embedded = extractEmbeddedSource(html);
    expect(embedded?.page.blocks.map((block) => block.type)).not.toContain('code');
  });

  it('스크립트 태그를 조기 종료시키는 콘텐츠를 이스케이프한다', () => {
    const page = makePage();
    page.title = '</script><script>alert(1)</script>';
    const html = emitHtml(page, { ...defaultCapabilities(), editing: true });

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(extractEmbeddedSource(html)?.page.title).toBe('</script><script>alert(1)</script>');
  });

  it('블록 본문의 HTML을 이스케이프한다', () => {
    const page = makePage();
    page.blocks[1] = { ...page.blocks[1], type: 'text', content: '<img src=x onerror=alert(1)>' };
    const html = emitHtml(page, defaultCapabilities());

    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x');
  });
});

describe('sanitizeUrl', () => {
  it('http/https와 상대 경로를 통과시킨다', () => {
    expect(sanitizeUrl('https://example.com/a.png')).toBe('https://example.com/a.png');
    expect(sanitizeUrl('/assets/a.png')).toBe('/assets/a.png');
  });

  it('스크립트 실행 가능한 스킴을 막는다', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
    expect(sanitizeUrl('JaVaScRiPt:alert(1)')).toBe('');
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
  });

  it('이미지에 한해 base64 데이터 URI를 허용하되 svg는 막는다', () => {
    const png = 'data:image/png;base64,iVBORw0KGgo=';
    expect(sanitizeUrl(png, { allowDataImage: true })).toBe(png);
    expect(sanitizeUrl('data:image/svg+xml;base64,PHN2Zz4=', { allowDataImage: true })).toBe('');
  });

  it('위험한 이미지 URL은 img 태그로 나가지 않는다', () => {
    const page = makePage();
    page.blocks.push({
      id: 'i',
      type: 'image',
      src: 'javascript:alert(1)',
      alt: '위험',
      size: 'large',
      order: 5,
    });

    const html = emitHtml(page, defaultCapabilities());
    expect(html).not.toContain('javascript:alert(1)');
  });
});

describe('normalizeCapabilities', () => {
  it('모르는 값을 버리고 기본값으로 채운다', () => {
    const normalized = normalizeCapabilities({
      allowedBlockTypes: ['text', '악성타입'],
      editing: 'yes',
      codeCopy: false,
    });

    expect(normalized.allowedBlockTypes).toEqual(['text']);
    expect(normalized.editing).toBe(false); // 문자열은 무시하고 기본값
    expect(normalized.codeCopy).toBe(false);
  });

  it('객체가 아니면 전부 기본값', () => {
    expect(normalizeCapabilities(null)).toEqual(defaultCapabilities());
    expect(normalizeCapabilities('nope')).toEqual(defaultCapabilities());
  });
});

describe('pruneCss', () => {
  it('쓰이지 않은 tsb 클래스 규칙을 버린다', () => {
    const css = '.tsb-a{color:red}\n.tsb-b{color:blue}';

    expect(pruneCss(css, new Set(['tsb-a']))).toBe('.tsb-a{color:red}');
  });

  it('tsb 클래스가 없는 기본 규칙은 남긴다', () => {
    const css = ':root{--x:1}\nbody{margin:0}';

    expect(pruneCss(css, new Set())).toBe(':root{--x:1}\nbody{margin:0}');
  });

  it('여러 셀렉터 중 쓰인 것만 남긴다', () => {
    const css = '.tsb-a,.tsb-b{color:red}';

    expect(pruneCss(css, new Set(['tsb-b']))).toBe('.tsb-b{color:red}');
  });

  it('@media 안쪽을 가지치고, 비면 통째로 버린다', () => {
    const css = '@media print{.tsb-a{display:none}}';

    expect(pruneCss(css, new Set(['tsb-a']))).toBe('@media print{.tsb-a{display:none}}');
    expect(pruneCss(css, new Set())).toBe('');
  });

  it('스타일시트가 꺼진 기능의 존재를 흘리지 않는다', () => {
    const capabilities = toggleBlockType(defaultCapabilities(), 'code', false);
    const html = emitHtml(makePage(), capabilities);

    // 코드 블록 관련 규칙이 통째로 빠져, CSS만 봐도 그런 기능이 있었는지 알 수 없다
    expect(html).not.toContain('.tsb-code');
    expect(html).not.toContain('.tsb-lang');
  });
});
