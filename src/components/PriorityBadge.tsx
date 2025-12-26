import { AlertTriangle, ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { PriorityLevel, priorityConfig } from '@/types/book';
import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: PriorityLevel;
  compact?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

const priorityIcons: Record<PriorityLevel, typeof AlertTriangle> = {
  high: AlertTriangle,
  medium: ArrowUp,
  low: ArrowDown,
  none: Minus,
};

export function PriorityBadge({ priority, compact, onClick }: PriorityBadgeProps) {
  if (priority === 'none' && !onClick) return null;

  const config = priorityConfig[priority];
  const Icon = priorityIcons[priority];

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 rounded-full text-xs font-medium transition-colors",
        config.bgColor,
        config.color,
        compact ? "px-2 py-0.5" : "px-2.5 py-1",
        onClick && "hover:opacity-80 cursor-pointer"
      )}
    >
      <Icon className={cn("h-3 w-3", config.color)} />
      {!compact && config.label}
    </button>
  );
}
