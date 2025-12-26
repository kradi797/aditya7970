import { Trophy, Target, Sparkles, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Book, getMilestones, getProgressPercentage } from '@/types/book';

interface MilestoneProgressProps {
  book: Book;
  compact?: boolean;
}

const milestoneIcons = [
  { milestone: 25, icon: Target, label: 'Quarter Way' },
  { milestone: 50, icon: Sparkles, label: 'Halfway There' },
  { milestone: 75, icon: Trophy, label: 'Almost Done' },
  { milestone: 100, icon: Crown, label: 'Completed!' },
];

export function MilestoneProgress({ book, compact = false }: MilestoneProgressProps) {
  const milestones = getMilestones(book);
  const progress = getProgressPercentage(book);

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {milestones.map(({ milestone, reached }) => {
          const config = milestoneIcons.find(m => m.milestone === milestone)!;
          const Icon = config.icon;
          return (
            <div
              key={milestone}
              className={cn(
                "p-1 rounded-full transition-all duration-300",
                reached 
                  ? "bg-primary/20 text-primary" 
                  : "bg-muted/50 text-muted-foreground/40"
              )}
              title={`${config.label} (${milestone}%)`}
            >
              <Icon className="h-3 w-3" />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground font-medium">Milestones</span>
        <span className="text-foreground font-semibold">{progress}% Complete</span>
      </div>
      
      {/* Progress Track */}
      <div className="relative">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-gold rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Milestone Markers */}
        <div className="absolute -top-1 left-0 right-0 flex justify-between px-[2px]">
          {milestones.map(({ milestone, reached }) => {
            const config = milestoneIcons.find(m => m.milestone === milestone)!;
            const Icon = config.icon;
            const position = milestone === 100 ? 'right-0' : `left-[${milestone}%]`;
            
            return (
              <div
                key={milestone}
                className="relative"
                style={{ 
                  position: 'absolute',
                  left: milestone === 100 ? 'auto' : `${milestone}%`,
                  right: milestone === 100 ? '0' : 'auto',
                  transform: milestone === 100 ? 'none' : 'translateX(-50%)',
                }}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-4 h-4 rounded-full border-2 transition-all duration-300",
                    reached
                      ? "bg-primary border-primary text-primary-foreground scale-110"
                      : "bg-background border-border text-muted-foreground"
                  )}
                >
                  <Icon className="h-2 w-2" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Milestone Labels */}
      <div className="flex justify-between text-xs">
        {milestones.map(({ milestone, reached }) => {
          const config = milestoneIcons.find(m => m.milestone === milestone)!;
          return (
            <div
              key={milestone}
              className={cn(
                "flex flex-col items-center gap-1 transition-colors duration-300",
                reached ? "text-primary" : "text-muted-foreground/60"
              )}
            >
              <span className="font-medium">{milestone}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}