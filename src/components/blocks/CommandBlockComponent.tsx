import { CommandBlock } from '@/types/page-builder';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Zap, ShieldAlert } from 'lucide-react';

interface CommandBlockComponentProps {
  block: CommandBlock;
  isEditMode: boolean;
  onUpdate: (updates: Partial<CommandBlock>) => void;
}

const isValidEndpoint = (value: string) => /^https?:\/\//i.test(value.trim());

const isValidPayload = (value: string) => {
  if (!value.trim()) return true;
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
};

export const CommandBlockComponent = ({
  block,
  isEditMode,
  onUpdate,
}: CommandBlockComponentProps) => {
  if (isEditMode) {
    const endpointOk = isValidEndpoint(block.endpoint);
    const payloadOk = isValidPayload(block.payload);

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-warning" />
          <span className="text-sm text-muted-foreground">제어 명령</span>
        </div>

        <Input
          value={block.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="bg-secondary border-border"
          placeholder="버튼 문구 (예: 펌프 기동)"
        />

        <div className="space-y-1">
          <Input
            value={block.endpoint}
            onChange={(e) => onUpdate({ endpoint: e.target.value })}
            className="bg-secondary border-border font-mono text-sm"
            placeholder="https://tb.example.com/api/plugins/rpc/oneway/DEVICE_ID"
          />
          {!endpointOk && (
            <p className="text-xs text-warning">
              http/https 절대 주소만 게시됩니다. 지금 상태로는 이 블록이 산출물에서 빠집니다.
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Textarea
            value={block.payload}
            onChange={(e) => onUpdate({ payload: e.target.value })}
            className="min-h-[90px] bg-secondary border-border font-mono text-sm"
            placeholder='{"method": "setState", "params": true}'
          />
          {!payloadOk && <p className="text-xs text-destructive">JSON 형식이 아닙니다.</p>}
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs">실행 전 확인</Label>
          <Switch
            checked={block.confirm}
            onCheckedChange={(checked) => onUpdate({ confirm: checked })}
          />
        </div>

        <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30">
          <ShieldAlert className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <p className="text-[11px] leading-snug text-muted-foreground">
            버튼을 빼도 엔드포인트는 열려 있습니다. 모니터링 계정이 이 주소를 직접 호출하지
            못하도록 <strong className="text-foreground">서버에서 계정별 권한을 막아두세요.</strong>{' '}
            게시물에는 자격증명이 담기지 않고, 브라우저 세션 인증을 그대로 씁니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled
        className="px-4 py-2 rounded-md border border-warning/50 bg-warning/10 text-warning text-sm font-medium"
      >
        {block.label || '명령 실행'}
      </button>
      <span className="text-xs text-muted-foreground">미리보기에서는 실행되지 않습니다</span>
    </div>
  );
};
