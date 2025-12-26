import { Search, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SearchBar({ value, onChange, className }: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={cn(
      "relative flex items-center transition-all duration-200",
      isFocused && "ring-2 ring-primary/20",
      "rounded-xl",
      className
    )}>
      <Search className={cn(
        "absolute left-3 h-4 w-4 transition-colors",
        isFocused ? "text-primary" : "text-muted-foreground"
      )} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Search books by title or author..."
        className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors"
          aria-label="Clear search"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
