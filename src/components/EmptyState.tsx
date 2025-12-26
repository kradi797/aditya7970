import { BookOpen, Library, Clock } from 'lucide-react';
import { FilterType } from '@/types/book';

interface EmptyStateProps {
  filter: FilterType;
}

export function EmptyState({ filter }: EmptyStateProps) {
  const messages: Record<FilterType, { icon: typeof Library; title: string; description: string }> = {
    All: {
      icon: Library,
      title: "Your library is empty",
      description: "Start building your reading collection by adding your first book."
    },
    Reading: {
      icon: BookOpen,
      title: "No books in progress",
      description: "All caught up! Start a new book to see it here."
    },
    Completed: {
      icon: BookOpen,
      title: "No completed books yet",
      description: "Keep reading! Your finished books will appear here."
    },
    Later: {
      icon: Clock,
      title: "No books saved for later",
      description: "Save books you want to read in the future here."
    }
  };

  const { icon: Icon, title, description } = messages[filter];

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="font-display text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-muted-foreground">{description}</p>
    </div>
  );
}
