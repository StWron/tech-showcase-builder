import { BlockType, PageCapabilities } from '@/types/page-builder';
import {
  ALL_BLOCK_TYPES,
  BLOCK_TYPE_LABELS,
  FEATURE_CAPABILITIES,
  toggleBlockType,
} from '@/lib/capabilities';
import { BakeSummary } from '@/lib/bake';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CapabilityPanelProps {
  capabilities: PageCapabilities;
  summary: BakeSummary;
  onChange: (capabilities: PageCapabilities) => void;
}

export const CapabilityPanel = ({ capabilities, summary, onChange }: CapabilityPanelProps) => {
  const disabledTypes = ALL_BLOCK_TYPES.filter(
    (type) => !capabilities.allowedBlockTypes.includes(type)
  );
  const disabledFeatures = FEATURE_CAPABILITIES.filter(({ key }) => !capabilities[key]);
  const offCount = disabledTypes.length + disabledFeatures.length;

  const handleBlockType = (type: BlockType, enabled: boolean) => {
    onChange(toggleBlockType(capabilities, type, enabled));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ShieldCheck className="w-4 h-4" />
          권한
          {offCount > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-warning/20 text-warning">
              {offCount} off
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-96 bg-card border-border max-h-[70vh] overflow-y-auto scrollbar-thin"
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm">게시 권한</h4>
            <p className="text-xs text-muted-foreground mt-1">
              끈 항목은 게시물에 <strong className="text-foreground">코드 자체가 들어가지 않습니다.</strong>{' '}
              열람자가 브라우저에서 무엇을 뒤집어도 되살릴 수 없습니다.
            </p>
          </div>

          <Separator />

          {/* 콘텐츠 권한 */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">콘텐츠 블록</Label>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {ALL_BLOCK_TYPES.map((type) => (
                <div key={type} className="flex items-center justify-between">
                  <Label htmlFor={`cap-${type}`} className="text-sm font-normal cursor-pointer">
                    {BLOCK_TYPE_LABELS[type]}
                  </Label>
                  <Switch
                    id={`cap-${type}`}
                    checked={capabilities.allowedBlockTypes.includes(type)}
                    onCheckedChange={(checked) => handleBlockType(type, checked)}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* 기능 권한 */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">기능</Label>
            {FEATURE_CAPABILITIES.map(({ key, label, description }) => (
              <div key={key} className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <Label htmlFor={`cap-${key}`} className="text-sm font-normal cursor-pointer">
                    {label}
                  </Label>
                  <p className="text-[11px] leading-snug text-muted-foreground">{description}</p>
                </div>
                <Switch
                  id={`cap-${key}`}
                  checked={capabilities[key]}
                  onCheckedChange={(checked) => onChange({ ...capabilities, [key]: checked })}
                />
              </div>
            ))}
          </div>

          {/* 게시 영향 요약 */}
          {summary.removedBlocks > 0 && (
            <>
              <Separator />
              <div
                className={cn(
                  'flex items-start gap-2 p-3 rounded-lg',
                  'bg-warning/10 border border-warning/30'
                )}
              >
                <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="text-warning font-medium">
                    블록 {summary.removedBlocks}개가 게시물에서 제외됩니다
                  </p>
                  <p className="text-muted-foreground">
                    {Object.entries(summary.removedByType)
                      .map(([type, count]) => `${BLOCK_TYPE_LABELS[type as BlockType]} ${count}개`)
                      .join(', ')}
                    {' — '}내용까지 함께 빠지며, 게시물만으로는 복구할 수 없습니다.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
