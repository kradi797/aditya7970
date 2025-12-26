import { AlertTriangle, ArrowDown, ArrowUp, Minus, Check } from 'lucide-react';
import { PriorityLevel, priorityConfig } from '@/types/book';
import { cn } from '@/lib/utils';

interface PrioritySelectorProps {
  value: PriorityLevel;
  onChange: (priority: PriorityLevel) => void;
  className?: string;
}

const priorityIcons: Record<PriorityLevel, typeof AlertTriangle> = {
  high: AlertTriangle,
  medium: ArrowUp,
  low: ArrowDown,
  none: Minus,
};

const priorities: PriorityLevel[] = ['high', 'medium', 'low', 'none'];

export function PrioritySelector({ value, onChange, className }: PrioritySelectorProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {priorities.map((priority) => {
        const config = priorityConfig[priority];
        const Icon = priorityIcons[priority];
        const isSelected = value === priority;

        return (
          <button
            key={priority}
            onClick={() => onChange(priority)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              isSelected
                ? cn(config.bgColor, config.color, "ring-2 ring-offset-1", priority === 'high' && "ring-red-500", priority === 'medium' && "ring-amber-500", priority === 'low' && "ring-blue-500", priority === 'none' && "ring-muted-foreground/30")
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {config.label}
            {isSelected && <Check className="h-3 w-3 ml-0.5" />}
          </button>
        );
      })}
    </div>
  );
}
