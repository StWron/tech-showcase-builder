import { Zap } from 'lucide-react';
import { CommandBlock } from '@/types/page-builder';
import { CommandBlockComponent } from '@/components/blocks/CommandBlockComponent';
import { escapeHtml, sanitizeAbsoluteUrl } from '@/lib/html-escape';
import { defineBlock } from './types';

const COMMAND_CSS = `
.tsb-command{display:inline-flex;align-items:center;gap:.5rem}
.tsb-command-button{
  font:inherit;font-size:.9rem;font-weight:500;cursor:pointer;
  color:var(--warning);background:hsl(45 93% 47% / .1);
  border:1px solid hsl(45 93% 47% / .5);border-radius:.375rem;padding:.5rem 1rem;
}
.tsb-command-button:hover:not(:disabled){background:hsl(45 93% 47% / .2)}
.tsb-command-button:disabled{opacity:.6;cursor:progress}
.tsb-command-status{font-size:.8rem;color:var(--muted-fg)}
.tsb-command-status[data-state="ok"]{color:var(--success)}
.tsb-command-status[data-state="fail"]{color:var(--destructive)}
`.trim();

/**
 * 게시물에는 자격증명을 심지 않는다. 브라우저 세션(쿠키)을 그대로 쓰므로
 * 이 파일이 유출돼도 토큰이 새지 않고, 인가 판단은 서버에 남는다.
 */
const COMMAND_SCRIPT = `
document.querySelectorAll('[data-tsb-command]').forEach(function (button) {
  var status = button.parentNode.querySelector('.tsb-command-status');
  var say = function (state, text) {
    if (!status) return;
    status.setAttribute('data-state', state);
    status.textContent = text;
  };

  button.addEventListener('click', function () {
    var endpoint = button.getAttribute('data-endpoint');
    var payload = button.getAttribute('data-payload') || '';
    if (!endpoint) return;
    if (button.hasAttribute('data-confirm') && !window.confirm('이 명령을 실행할까요?')) return;

    button.disabled = true;
    say('busy', '보내는 중...');

    fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    })
      .then(function (response) {
        say(response.ok ? 'ok' : 'fail', response.ok ? '전송됨' : '거부됨 (' + response.status + ')');
      })
      .catch(function () {
        say('fail', '전송 실패');
      })
      .then(function () {
        button.disabled = false;
      });
  });
});
`.trim();

export const commandBlock = defineBlock<CommandBlock>({
  type: 'command',
  label: '제어',
  icon: Zap,
  defaultSpan: 4,
  caution: '제어 블록입니다. 서버에서 계정별 권한을 함께 막아야 실제로 분리됩니다.',
  create: (seed) => ({
    ...seed,
    type: 'command',
    label: '명령 실행',
    endpoint: '',
    payload: '{"method": "setState", "params": true}',
    confirm: true,
  }),
  Editor: CommandBlockComponent,
  emit: (block) => {
    // 대상이 분명하지 않으면 싣지 않는다 — 열려면 제대로 열고, 아니면 아예 없다
    const endpoint = sanitizeAbsoluteUrl(block.endpoint);
    if (!endpoint) return '';

    const label = String(block.label ?? '').trim() || '명령 실행';
    const payload = String(block.payload ?? '').trim();

    return [
      '<div class="tsb-command">',
      '<button class="tsb-command-button" type="button" data-tsb-command',
      ` data-endpoint="${escapeHtml(endpoint)}"`,
      payload ? ` data-payload="${escapeHtml(payload)}"` : '',
      block.confirm ? ' data-confirm' : '',
      `>${escapeHtml(label)}</button>`,
      '<span class="tsb-command-status"></span>',
      '</div>',
    ]
      .filter(Boolean)
      .join('');
  },
  assets: () => ({ css: COMMAND_CSS, script: COMMAND_SCRIPT }),
});
