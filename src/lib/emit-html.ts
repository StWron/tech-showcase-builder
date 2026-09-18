import { BlockColor, ContentBlock, TechPage } from '@/types/page-builder';
import { PageCapabilities } from './capabilities';
import { BakedPage, bake } from './bake';
import { GRID_COLUMNS, calculateGridPositions, getDefaultSpan, sortByGrid } from './grid';
import { BlockAssets, EmitContext, getBlockDefinition } from '@/blocks';
import { escapeHtml, escapeJsonForScript, sanitizeUrl } from './html-escape';

export { escapeHtml, escapeJsonForScript, sanitizeUrl };

/* ------------------------------------------------------------------ *
 * 블록 스타일
 * ------------------------------------------------------------------ */

const COLOR_VALUES: Record<BlockColor, { bg: string; text: string; border: string }> = {
  default: { bg: 'transparent', text: 'var(--fg)', border: 'var(--border)' },
  primary: { bg: 'hsl(174 72% 50% / 0.1)', text: 'var(--primary)', border: 'hsl(174 72% 50% / 0.5)' },
  secondary: { bg: 'var(--secondary)', text: 'var(--secondary-fg)', border: 'var(--secondary)' },
  accent: { bg: 'hsl(174 72% 50% / 0.2)', text: 'var(--primary)', border: 'var(--primary)' },
  muted: { bg: 'var(--muted)', text: 'var(--muted-fg)', border: 'var(--muted)' },
  success: { bg: 'hsl(142 76% 45% / 0.1)', text: 'var(--success)', border: 'hsl(142 76% 45% / 0.5)' },
  warning: { bg: 'hsl(45 93% 47% / 0.1)', text: 'var(--warning)', border: 'hsl(45 93% 47% / 0.5)' },
  destructive: {
    bg: 'hsl(0 72% 51% / 0.1)',
    text: 'var(--destructive)',
    border: 'hsl(0 72% 51% / 0.5)',
  },
};

const PADDING_VALUES: Record<string, string> = {
  none: '0',
  small: '0.5rem',
  medium: '1rem',
  large: '1.5rem',
};

const blockStyleAttr = (block: ContentBlock): string => {
  const style = block.style || {};
  const parts: string[] = [`padding:${PADDING_VALUES[style.padding || 'medium']}`];

  if (style.backgroundColor) parts.push(`background:${COLOR_VALUES[style.backgroundColor].bg}`);
  if (style.textColor) parts.push(`color:${COLOR_VALUES[style.textColor].text}`);
  if (style.hasBorder) {
    const border = style.borderColor ? COLOR_VALUES[style.borderColor].border : 'var(--border)';
    parts.push(`border:1px solid ${border}`);
  }
  if (style.hasShadow) parts.push('box-shadow:0 10px 30px hsl(174 72% 50% / 0.1)');
  if (block.alignment === 'center') parts.push('text-align:center');
  if (block.alignment === 'right') parts.push('text-align:right');

  return escapeHtml(parts.join(';'));
};

/* ------------------------------------------------------------------ *
 * 문서 조립
 * ------------------------------------------------------------------ */

interface RenderedBody {
  html: string;
  /** 마크업을 실제로 내놓은 블록들. 타입별 런타임 조각은 이 목록만 보고 고른다. */
  rendered: ContentBlock[];
}

const renderGrid = (baked: BakedPage, context: EmitContext): RenderedBody => {
  const positions = calculateGridPositions(baked.blocks);
  const ordered = sortByGrid(baked.blocks, positions);

  const rendered: ContentBlock[] = [];

  const cells = ordered
    .map((block) => {
      const body = getBlockDefinition(block.type)?.emit(block, context) ?? '';
      if (!body.trim()) return '';

      rendered.push(block);

      const position = positions.get(block.id);
      const span = Math.min(
        GRID_COLUMNS,
        Math.max(1, position?.columnSpan || getDefaultSpan(block.type))
      );
      const column = Math.min(GRID_COLUMNS, Math.max(1, position?.column || 1));
      const row = Math.max(0, position?.row ?? 0) + 1;
      const clampedSpan = Math.min(span, GRID_COLUMNS - column + 1);

      const cellStyle = `grid-column:${column} / span ${clampedSpan};grid-row:${row}`;

      return [
        `<div class="tsb-cell" style="${escapeHtml(cellStyle)}">`,
        `<div class="tsb-block" style="${blockStyleAttr(block)}">`,
        body,
        '</div>',
        '</div>',
      ].join('\n');
    })
    .filter(Boolean);

  if (!cells.length) {
    return { html: '<p class="tsb-empty">표시할 콘텐츠가 없습니다.</p>', rendered };
  }

  return { html: `<div class="tsb-grid">\n${cells.join('\n')}\n</div>`, rendered };
};

/**
 * 마크업을 실제로 내놓은 타입의 런타임 조각만 모은다.
 *
 * 블록이 남아 있어도 값이 비어 실리지 않았다면 그 스크립트도 따라가지 않는다.
 * 산출물에 쓰이지 않는 코드가 한 줄도 없어야 "없는 코드는 켤 수 없다"가 성립한다.
 */
const collectAssets = (rendered: ContentBlock[], context: EmitContext): BlockAssets[] => {
  const byType = new Map<ContentBlock['type'], ContentBlock[]>();

  for (const block of rendered) {
    const group = byType.get(block.type);
    if (group) group.push(block);
    else byType.set(block.type, [block]);
  }

  return [...byType.entries()]
    .map(([type, blocks]) => getBlockDefinition(type)?.assets?.(blocks, context) ?? {})
    .filter((assets) => assets.css || assets.script);
};

const formatDate = (iso?: string): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const renderHeader = (baked: BakedPage, capabilities: PageCapabilities): string => {
  const meta: string[] = [];

  if (capabilities.showMeta) {
    const category = String(baked.category ?? '').trim();
    if (category) meta.push(`<span class="tsb-badge">${escapeHtml(category)}</span>`);
    const modified = formatDate(baked.lastModified);
    if (modified) meta.push(`<span class="tsb-modified">${escapeHtml(modified)}</span>`);
  }

  const subtitle = String(baked.subtitle ?? '').trim();

  return [
    '<header class="tsb-header">',
    '<div class="tsb-header-inner">',
    meta.length ? `<div class="tsb-meta">${meta.join('\n')}</div>` : '',
    `<h1 class="tsb-title">${escapeHtml(baked.title)}</h1>`,
    subtitle ? `<p class="tsb-subtitle">${escapeHtml(subtitle)}</p>` : '',
    '</div>',
    '</header>',
  ]
    .filter(Boolean)
    .join('\n');
};

/* ------------------------------------------------------------------ *
 * CSS 가지치기
 *
 * 스타일시트가 모든 규칙을 싣고 나가면 클래스 이름만으로 "여기 코드 블록
 * 기능이 있었구나"가 드러난다. 꺼진 기능은 흔적도 남기지 않는 게 이 설계의
 * 전제이므로, 문서에 실제로 쓰인 클래스의 규칙만 내보낸다.
 * ------------------------------------------------------------------ */

const collectUsedClasses = (markup: string): Set<string> => {
  const used = new Set<string>();
  const attributes = markup.matchAll(/class="([^"]*)"/g);
  for (const [, value] of attributes) {
    for (const name of value.split(/\s+/)) {
      if (name) used.add(name);
    }
  }
  return used;
};

/** 최상위 규칙 단위로 자른다 (@media 등 중첩 블록은 통째로 하나) */
const splitRules = (css: string): string[] => {
  const rules: string[] = [];
  let depth = 0;
  let start = 0;

  for (let i = 0; i < css.length; i++) {
    const char = css[i];
    if (char === '{') {
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0) {
        rules.push(css.slice(start, i + 1).trim());
        start = i + 1;
      }
    }
  }

  return rules.filter(Boolean);
};

const TSB_CLASS = /\.(tsb-[a-z0-9-]+)/g;

/** 셀렉터가 쓰이지 않은 tsb 클래스를 가리키면 버린다 */
const keepSelector = (selector: string, used: Set<string>): boolean => {
  const classes = [...selector.matchAll(TSB_CLASS)].map(([, name]) => name);
  if (!classes.length) return true; // :root, body 같은 기본 규칙
  return classes.every((name) => used.has(name));
};

export const pruneCss = (css: string, used: Set<string>): string =>
  splitRules(css)
    .map((rule) => {
      const open = rule.indexOf('{');
      if (open === -1) return '';

      const prelude = rule.slice(0, open).trim();
      const body = rule.slice(open + 1, rule.lastIndexOf('}'));

      if (prelude.startsWith('@')) {
        const inner = pruneCss(body, used);
        return inner ? `${prelude}{${inner}}` : '';
      }

      const selectors = prelude
        .split(',')
        .map((selector) => selector.trim())
        .filter((selector) => selector && keepSelector(selector, used));

      return selectors.length ? `${selectors.join(',')}{${body}}` : '';
    })
    .filter(Boolean)
    .join('\n');

const THEME_CSS = `
:root{
  --bg:hsl(220 20% 8%);
  --fg:hsl(180 100% 95%);
  --card:hsl(220 18% 12%);
  --primary:hsl(174 72% 50%);
  --secondary:hsl(220 15% 18%);
  --secondary-fg:hsl(180 100% 90%);
  --muted:hsl(220 15% 16%);
  --muted-fg:hsl(180 10% 55%);
  --border:hsl(180 20% 20%);
  --success:hsl(142 76% 45%);
  --warning:hsl(45 93% 47%);
  --destructive:hsl(0 72% 51%);
  --grid-line:hsl(180 20% 15%);
  --radius:0.5rem;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{
  background:var(--bg);color:var(--fg);
  font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;
  -webkit-font-smoothing:antialiased;line-height:1.7;
}
code,pre,.tsb-lang{font-family:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace}
a{color:var(--primary)}
.tsb-header{position:relative;overflow:hidden;border-bottom:1px solid var(--border)}
.tsb-header::before{
  content:'';position:absolute;inset:0;opacity:.3;
  background-image:linear-gradient(var(--grid-line) 1px,transparent 1px),linear-gradient(90deg,var(--grid-line) 1px,transparent 1px);
  background-size:40px 40px;
}
.tsb-header-inner{position:relative;z-index:1;max-width:64rem;margin:0 auto;padding:4rem 1.5rem}
.tsb-meta{display:flex;flex-wrap:wrap;align-items:center;gap:.75rem;margin-bottom:1.5rem}
.tsb-badge{
  display:inline-block;padding:.25rem .75rem;border-radius:9999px;
  border:1px solid hsl(174 72% 50% / .5);background:hsl(174 72% 50% / .1);
  color:var(--primary);font-size:.8rem;
}
.tsb-modified{color:var(--muted-fg);font-size:.75rem}
.tsb-title{margin:0 0 1rem;font-size:clamp(2rem,5vw,3rem);font-weight:700;text-shadow:0 0 10px hsl(174 72% 50% / .6)}
.tsb-subtitle{margin:0;max-width:42rem;color:var(--muted-fg);font-size:1.125rem}
.tsb-main{max-width:80rem;margin:0 auto;padding:3rem 1.5rem}
.tsb-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:1.5rem 1rem;align-items:start}
.tsb-cell{min-width:0}
.tsb-block{border-radius:var(--radius);min-width:0}
.tsb-block>*:first-child{margin-top:0}
.tsb-block>*:last-child{margin-bottom:0}
.tsb-heading{font-weight:600;line-height:1.3;margin:0 0 .75rem}
.tsb-h1{font-size:2rem}
.tsb-h2{font-size:1.5rem}
.tsb-h3{font-size:1.25rem}
.tsb-text p{margin:0 0 1rem}
.tsb-list{margin:0;padding-left:1.25rem}
.tsb-list li{margin-bottom:.5rem}
.tsb-divider{border:0;border-top:1px solid var(--border);margin:1.5rem 0}
.tsb-figure{margin:0}
.tsb-image{display:block;width:100%;height:auto;border-radius:var(--radius);border:1px solid var(--border)}
.tsb-frame{position:relative;aspect-ratio:16/9;border-radius:var(--radius);overflow:hidden;border:1px solid var(--border);box-shadow:0 0 0 1px hsl(174 72% 50% / .3),0 0 20px hsl(174 72% 50% / .1)}
.tsb-media{position:absolute;inset:0;width:100%;height:100%;border:0;object-fit:cover}
.tsb-caption{margin-top:.5rem;text-align:center;color:var(--muted-fg);font-size:.875rem}
.tsb-external-link{
  display:inline-flex;align-items:center;gap:.5rem;padding:.75rem 1rem;
  border:1px dashed hsl(174 72% 50% / .5);border-radius:var(--radius);
  background:hsl(174 72% 50% / .05);text-decoration:none;
}
.tsb-code{border:1px solid var(--border);border-radius:var(--radius);overflow:hidden}
.tsb-code-bar{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.5rem 1rem;background:hsl(220 15% 18% / .8);border-bottom:1px solid var(--border)}
.tsb-dots{display:inline-flex;gap:.375rem}
.tsb-dots i{width:.75rem;height:.75rem;border-radius:9999px;background:var(--muted-fg);opacity:.6}
.tsb-dots i:nth-child(1){background:var(--destructive)}
.tsb-dots i:nth-child(2){background:var(--warning)}
.tsb-dots i:nth-child(3){background:var(--success)}
.tsb-code-meta{display:inline-flex;align-items:center;gap:.75rem}
.tsb-lang{font-size:.75rem;text-transform:uppercase;color:var(--muted-fg)}
.tsb-pre{margin:0;padding:1rem;background:hsl(220 15% 18% / .5);overflow-x:auto}
.tsb-pre code{font-size:.875rem;white-space:pre}
.tsb-empty{color:var(--muted-fg);text-align:center;padding:4rem 0}
.tsb-footer{border-top:1px solid var(--border);margin-top:3rem;padding:1.5rem;text-align:center;color:var(--muted-fg);font-size:.875rem}
.tsb-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:.5rem;margin-top:1rem}
.tsb-button,.tsb-copy{
  font:inherit;font-size:.8rem;cursor:pointer;color:var(--primary);
  background:hsl(174 72% 50% / .08);border:1px solid hsl(174 72% 50% / .4);
  border-radius:.375rem;padding:.3rem .7rem;
}
.tsb-button:hover,.tsb-copy:hover{background:hsl(174 72% 50% / .18)}
@media (max-width:768px){
  .tsb-grid{display:block}
  .tsb-cell{margin-bottom:1.5rem}
  .tsb-header-inner{padding:3rem 1.25rem}
  .tsb-main{padding:2rem 1.25rem}
}
@media print{.tsb-actions,.tsb-copy{display:none}}
`.trim();

const SOURCE_SCRIPT = `
(function () {
  var node = document.getElementById('tsb-source');
  var button = document.querySelector('[data-tsb-download]');
  if (!node || !button) return;
  button.addEventListener('click', function () {
    var blob = new Blob([node.textContent], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = (document.title || 'page') + '.tsbproj';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
})();
`.trim();

export interface EmitOptions {
  /** 푸터에 표시할 서명. 기본값은 제품명. */
  signature?: string;
}

/**
 * 권한 매니페스트를 적용해 자기완결 HTML 문서를 생성한다.
 *
 * 이 함수의 계약: `capabilities`에서 꺼진 것은 반환 문자열 어디에도 없다.
 * 마크업도, 스크립트도, 데이터도 없다. 따라서 열람자 쪽에서 되살릴 수 없다.
 *
 * 한계는 분명히 해둔다 — 이 보장은 **클라이언트 전용 기능**에 대한 것이다.
 * 페이지가 훗날 서버 API를 호출하게 되면 그 API는 별도의 서버 인가가 필요하다.
 */
export const emitHtml = (
  page: TechPage,
  capabilities: PageCapabilities,
  options: EmitOptions = {}
): string => {
  const baked = bake(page, capabilities);
  const signature = options.signature || 'Tech Page Builder';

  const context: EmitContext = { capabilities };
  const { html: body, rendered } = renderGrid(baked, context);
  const assets = collectAssets(rendered, context);

  // 원본 임베드는 편집 재개방 또는 원본 내려받기가 켜져 있을 때만.
  // 임베드되는 것은 baked 모델이므로, 권한으로 제거된 콘텐츠는 여기에도 없다.
  const embedSource = capabilities.editing || capabilities.sourceDownload;

  const footerActions: string[] = [];
  if (capabilities.sourceDownload) {
    footerActions.push('<button class="tsb-button" type="button" data-tsb-download>원본 내려받기</button>');
  }

  const footer = capabilities.showFooter
    ? [
        '<footer class="tsb-footer">',
        `<p>${escapeHtml(signature)}</p>`,
        capabilities.editing
          ? '<p class="tsb-reopen">이 페이지는 에디터에서 다시 열 수 있습니다.</p>'
          : '',
        footerActions.length ? `<div class="tsb-actions">${footerActions.join('\n')}</div>` : '',
        '</footer>',
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  const scripts: string[] = assets
    .map((asset) => asset.script)
    .filter((script): script is string => Boolean(script));
  if (capabilities.sourceDownload) scripts.push(SOURCE_SCRIPT);

  const sourcePayload = embedSource
    ? [
        '<script type="application/json" id="tsb-source">',
        escapeJsonForScript({ version: 1, page: baked, capabilities }),
        '</script>',
      ].join('\n')
    : '';

  const header = renderHeader(baked, capabilities);

  // 마크업을 먼저 확정한 뒤, 거기서 실제로 쓰인 클래스의 규칙만 남긴다
  const blockCss = assets
    .map((asset) => asset.css)
    .filter((rule): rule is string => Boolean(rule));

  const css = [
    pruneCss(THEME_CSS, collectUsedClasses([header, body, footer].join('\n'))),
    ...blockCss,
  ].join('\n');

  return [
    '<!doctype html>',
    '<html lang="ko">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${escapeHtml(baked.title)}</title>`,
    baked.subtitle
      ? `<meta name="description" content="${escapeHtml(baked.subtitle)}" />`
      : '',
    '<link rel="preconnect" href="https://fonts.googleapis.com" />',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Inter:wght@300;400;500;600;700&display=swap" />',
    `<style>\n${css}\n</style>`,
    '</head>',
    '<body>',
    header,
    '<main class="tsb-main">',
    body,
    '</main>',
    footer,
    sourcePayload,
    scripts.length ? `<script>\n${scripts.join('\n\n')}\n</script>` : '',
    '</body>',
    '</html>',
    '',
  ]
    .filter((line) => line !== '')
    .join('\n');
};

/** 게시된 HTML에서 다시 편집 가능한 원본을 꺼낸다. 없으면 null. */
export const extractEmbeddedSource = (
  html: string
): { page: BakedPage; capabilities: unknown } | null => {
  const match = html.match(
    /<script[^>]*id=["']tsb-source["'][^>]*>([\s\S]*?)<\/script>/i
  );
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1]) as { page?: BakedPage; capabilities?: unknown };
    if (!parsed || typeof parsed !== 'object' || !parsed.page) return null;
    return { page: parsed.page, capabilities: parsed.capabilities };
  } catch {
    return null;
  }
};
