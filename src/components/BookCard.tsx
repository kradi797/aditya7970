import { useState, useCallback } from 'react';
import { Trash2, BookOpen, CheckCircle2 } from 'lucide-react';
import { Book, getBookStatus, getProgressPercentage } from '@/types/book';
import { cn } from '@/lib/utils';

interface BookCardProps {
  book: Book;
  onUpdate: (id: number, updates: Partial<Book>) => void;
  onDelete: (id: number) => void;
  index: number;
}

export function BookCard({ book, onUpdate, onDelete, index }: BookCardProps) {
  const [currentPageInput, setCurrentPageInput] = useState(book.currentPage.toString());
  const status = getBookStatus(book);
  const progress = getProgressPercentage(book);
  const isCompleted = status === 'Completed';

  const handlePageChange = useCallback((value: string) => {
    setCurrentPageInput(value);
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= book.totalPages) {
      onUpdate(book.id, { currentPage: numValue });
    }
  }, [book.id, book.totalPages, onUpdate]);

  const handlePageBlur = useCallback(() => {
    const numValue = parseInt(currentPageInput, 10);
    if (isNaN(numValue) || numValue < 0) {
      setCurrentPageInput('0');
      onUpdate(book.id, { currentPage: 0 });
    } else if (numValue > book.totalPages) {
      setCurrentPageInput(book.totalPages.toString());
      onUpdate(book.id, { currentPage: book.totalPages });
    }
  }, [currentPageInput, book.id, book.totalPages, onUpdate]);

  const handleNotesChange = useCallback((value: string) => {
    onUpdate(book.id, { notes: value });
  }, [book.id, onUpdate]);

  return (
    <div 
      className="group relative flex flex-col overflow-hidden rounded-xl bg-card shadow-card transition-all duration-300 hover:shadow-hover animate-fade-in"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Cover Image */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
        <img
          src={book.coverURL || '/placeholder.svg'}
          alt={`Cover of ${book.title}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder.svg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
        
        {/* Status Badge */}
        <div className={cn(
          "absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm",
          isCompleted 
            ? "bg-primary/90 text-primary-foreground" 
            : "bg-gold/90 text-foreground"
        )}>
          {isCompleted ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <BookOpen className="h-3.5 w-3.5" />
          )}
          {status}
        </div>

        {/* Delete Button */}
        <button
          onClick={() => onDelete(book.id)}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-destructive/90 text-destructive-foreground opacity-0 transition-all duration-200 hover:bg-destructive group-hover:opacity-100 focus:opacity-100"
          aria-label="Delete book"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-display text-lg font-bold leading-tight text-card line-clamp-2">
            {book.title}
          </h3>
          <p className="mt-1 text-sm text-card/80">{book.author}</p>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-foreground">{progress}%</span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-muted">
            <div 
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
                isCompleted ? "bg-primary" : "bg-gradient-gold"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={book.totalPages}
              value={currentPageInput}
              onChange={(e) => handlePageChange(e.target.value)}
              onBlur={handlePageBlur}
              className="w-20 rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <span className="text-sm text-muted-foreground">
              of {book.totalPages} pages
            </span>
          </div>
        </div>

        {/* Notes Section */}
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Reflections
          </label>
          <textarea
            value={book.notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Add your thoughts..."
            className="h-20 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
    </div>
  );
}
