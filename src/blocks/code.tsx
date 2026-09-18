import { Code2 } from 'lucide-react';
import { CodeBlock } from '@/types/page-builder';
import { CodeBlockComponent } from '@/components/blocks/CodeBlockComponent';
import { escapeHtml } from '@/lib/html-escape';
import { defineBlock } from './types';

const COPY_SCRIPT = `
document.querySelectorAll('[data-tsb-copy]').forEach(function (button) {
  button.addEventListener('click', function () {
    var container = button.closest('.tsb-code');
    var code = container && container.querySelector('code');
    if (!code) return;
    var done = function () {
      var original = button.textContent;
      button.textContent = '복사됨';
      setTimeout(function () { button.textContent = original; }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code.textContent).then(done, function () {});
    }
  });
});
`.trim();

export const codeBlock = defineBlock<CodeBlock>({
  type: 'code',
  label: '코드',
  icon: Code2,
  defaultSpan: 10,
  create: (seed) => ({
    ...seed,
    type: 'code',
    content: '// 코드를 입력하세요',
    language: 'javascript',
  }),
  Editor: CodeBlockComponent,
  emit: (block, { capabilities }) => {
    const language = String(block.language ?? '').trim() || 'text';
    const copyButton = capabilities.codeCopy
      ? '<button class="tsb-copy" type="button" data-tsb-copy>복사</button>'
      : '';

    return [
      '<div class="tsb-code">',
      '<div class="tsb-code-bar">',
      '<span class="tsb-dots"><i></i><i></i><i></i></span>',
      '<span class="tsb-code-meta">',
      `<span class="tsb-lang">${escapeHtml(language)}</span>`,
      copyButton,
      '</span>',
      '</div>',
      `<pre class="tsb-pre"><code>${escapeHtml(block.content)}</code></pre>`,
      '</div>',
    ].join('\n');
  },
  assets: (_blocks, { capabilities }) =>
    capabilities.codeCopy ? { script: COPY_SCRIPT } : {},
});
