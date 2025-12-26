import { FilterType } from '@/types/book';
import { cn } from '@/lib/utils';

interface FilterTabsProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts: {
    all: number;
    reading: number;
    completed: number;
    later: number;
  };
}

const filters: FilterType[] = ['All', 'Reading', 'Completed', 'Later'];

export function FilterTabs({ filter, onFilterChange, counts }: FilterTabsProps) {
  const getCount = (f: FilterType) => {
    switch (f) {
      case 'All': return counts.all;
      case 'Reading': return counts.reading;
      case 'Completed': return counts.completed;
      case 'Later': return counts.later;
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((f) => (
        <button
          key={f}
          onClick={() => onFilterChange(f)}
          className={cn(
            "relative px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            filter === f
              ? "bg-primary text-primary-foreground shadow-soft"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          {f}
          <span className={cn(
            "ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs",
            filter === f
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}>
            {getCount(f)}
          </span>
        </button>
      ))}
    </div>
  );
}
