import { describe, expect, it } from 'vitest';
import { CommandBlock, TechPage } from '@/types/page-builder';
import { BLOCK_REGISTRY, ALL_BLOCK_TYPES, getBlockDefinition } from '@/blocks';
import { CAPABILITY_PRESETS, defaultCapabilities, toggleBlockType } from '@/lib/capabilities';
import { getDefaultSpan } from '@/lib/grid';
import { bake } from '@/lib/bake';
import { emitHtml } from '@/lib/emit-html';

const ENDPOINT = 'https://tb.example.com/api/plugins/rpc/oneway/DEVICE-7';

const commandBlockOf = (overrides: Partial<CommandBlock> = {}): CommandBlock => ({
  id: 'cmd',
  type: 'command',
  size: 'full',
  order: 1,
  label: '펌프 기동',
  endpoint: ENDPOINT,
  payload: '{"method":"setState","params":true}',
  confirm: true,
  ...overrides,
});

const makePage = (overrides: Partial<TechPage> = {}): TechPage => ({
  id: 'p',
  title: '펌프 제어반',
  subtitle: '3라인 가압 펌프',
  category: '설비',
  lastModified: '2026-09-18T00:00:00.000Z',
  blocks: [
    { id: 'h', type: 'heading', content: '상태', level: 2, size: 'full', order: 0 },
    commandBlockOf(),
  ],
  ...overrides,
});

describe('블록 레지스트리', () => {
  it('타입이 중복되지 않는다', () => {
    expect(new Set(ALL_BLOCK_TYPES).size).toBe(BLOCK_REGISTRY.length);
  });

  it('모든 정의가 필수 항목을 갖춘다', () => {
    for (const definition of BLOCK_REGISTRY) {
      expect(definition.label, `${definition.type} 라벨`).toBeTruthy();
      expect(definition.icon, `${definition.type} 아이콘`).toBeTruthy();
      expect(definition.Editor, `${definition.type} 편집기`).toBeTruthy();
      expect(typeof definition.create).toBe('function');
      expect(typeof definition.emit).toBe('function');
      expect(definition.defaultSpan).toBeGreaterThanOrEqual(1);
      expect(definition.defaultSpan).toBeLessThanOrEqual(12);
    }
  });

  it('create 가 자기 타입의 블록을 만든다', () => {
    for (const definition of BLOCK_REGISTRY) {
      const block = definition.create({ id: 'x', order: 0, size: 'full' });
      expect(block.type).toBe(definition.type);
      expect(block.id).toBe('x');
    }
  });

  it('격자 기본 스팬이 레지스트리 정의를 따른다', () => {
    for (const definition of BLOCK_REGISTRY) {
      expect(getDefaultSpan(definition.type)).toBe(definition.defaultSpan);
    }
  });

  it('레지스트리에 없는 타입은 구울 때 버려진다', () => {
    const page = makePage({
      blocks: [
        { id: 'h', type: 'heading', content: '상태', level: 2, size: 'full', order: 0 },
        { id: 'x', type: 'gauge', size: 'full', order: 1 } as never,
      ],
    });

    expect(bake(page, defaultCapabilities()).blocks.map((block) => block.id)).toEqual(['h']);
  });
});

describe('모니터링 / 제어 분리', () => {
  const monitoring = CAPABILITY_PRESETS.find((preset) => preset.id === 'monitoring')!;
  const control = CAPABILITY_PRESETS.find((preset) => preset.id === 'control')!;

  it('제어 포함 산출물에는 버튼과 전송 스크립트가 있다', () => {
    const html = emitHtml(makePage(), control.capabilities);

    expect(html).toContain('data-tsb-command');
    expect(html).toContain(ENDPOINT);
    expect(html).toContain('펌프 기동');
    expect(html).toContain("credentials: 'include'");
  });

  it('모니터링 산출물에는 엔드포인트 주소조차 없다', () => {
    const html = emitHtml(makePage(), monitoring.capabilities);

    expect(html).not.toContain(ENDPOINT);
    expect(html).not.toContain('tb.example.com');
    expect(html).not.toContain('data-tsb-command');
    expect(html).not.toContain('펌프 기동');
    expect(html).not.toContain('fetch(');
    expect(html).not.toContain('setState');
    // 껍데기 CSS 조차 남기지 않는다 — 클래스 이름으로도 제어 기능의 존재가 드러나면 안 된다
    expect(html).not.toContain('tsb-command');
    // 모니터링 쪽 내용은 그대로
    expect(html).toContain('상태');
  });

  it('산출물에 자격증명이 담기지 않는다', () => {
    const html = emitHtml(makePage(), control.capabilities);

    expect(html).not.toMatch(/Authorization|Bearer|X-Authorization/i);
  });

  it('제어 프리셋만 command 를 허용한다', () => {
    expect(control.capabilities.allowedBlockTypes).toContain('command');

    for (const preset of CAPABILITY_PRESETS) {
      if (preset.id === 'control' || preset.id === 'handoff') continue;
      expect(preset.capabilities.allowedBlockTypes, preset.name).not.toContain('command');
    }
  });
});

describe('제어 블록은 대상이 분명할 때만 실린다 (fail closed)', () => {
  const withEndpoint = (endpoint: string) =>
    emitHtml(
      makePage({ blocks: [commandBlockOf({ endpoint })] }),
      CAPABILITY_PRESETS.find((preset) => preset.id === 'control')!.capabilities
    );

  it('엔드포인트가 비면 블록도 스크립트도 없다', () => {
    const html = withEndpoint('');

    expect(html).not.toContain('data-tsb-command');
    expect(html).not.toContain('fetch(');
  });

  it('상대 경로는 거부한다 — 대상이 모호한 제어는 싣지 않는다', () => {
    expect(withEndpoint('/api/rpc')).not.toContain('data-tsb-command');
  });

  it('javascript: 스킴을 거부한다', () => {
    const html = withEndpoint('javascript:alert(1)');

    expect(html).not.toContain('javascript:alert(1)');
    expect(html).not.toContain('data-tsb-command');
  });

  it('라벨과 페이로드를 이스케이프한다', () => {
    const html = emitHtml(
      makePage({
        blocks: [commandBlockOf({ label: '" onclick="alert(1)', payload: '{"a":"<script>"}' })],
      }),
      CAPABILITY_PRESETS.find((preset) => preset.id === 'control')!.capabilities
    );

    expect(html).not.toContain('onclick="alert(1)');
    expect(html).not.toContain('<script>"}');
  });
});

describe('런타임 조각은 실제로 실린 블록에만 따라간다', () => {
  it('코드 블록이 없으면 복사 스크립트도 없다', () => {
    const page = makePage({
      blocks: [{ id: 'h', type: 'heading', content: '상태', level: 2, size: 'full', order: 0 }],
    });

    expect(emitHtml(page, defaultCapabilities())).not.toContain('navigator.clipboard');
  });

  it('블록이 남아 있어도 내용이 비어 실리지 않으면 스크립트도 빠진다', () => {
    const page = makePage({ blocks: [commandBlockOf({ endpoint: '' })] });
    const control = CAPABILITY_PRESETS.find((preset) => preset.id === 'control')!;

    expect(emitHtml(page, control.capabilities)).not.toContain('fetch(');
  });

  it('제어 블록을 권한에서 끄면 CSS 조각도 따라 빠진다', () => {
    const capabilities = toggleBlockType(defaultCapabilities(), 'command', false);

    expect(emitHtml(makePage(), capabilities)).not.toContain('tsb-command-button');
  });
});

describe('getBlockDefinition', () => {
  it('등록된 타입을 찾는다', () => {
    expect(getBlockDefinition('command')?.label).toBe('제어');
  });

  it('없는 타입은 undefined', () => {
    expect(getBlockDefinition('gauge' as never)).toBeUndefined();
  });
});
