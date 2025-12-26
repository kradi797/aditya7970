import { useState, useCallback } from 'react';
import { Trash2, BookOpen, CheckCircle2, Pencil, MessageSquare, Clock, FileText } from 'lucide-react';
import { Book, getBookStatus, getProgressPercentage, PriorityLevel } from '@/types/book';
import { EditBookForm } from '@/components/EditBookForm';
import { BookDetailDialog } from '@/components/BookDetailDialog';
import { MilestoneProgress } from '@/components/MilestoneProgress';
import { PriorityBadge } from '@/components/PriorityBadge';
import { cn } from '@/lib/utils';

interface BookCardProps {
  book: Book;
  onUpdate: (id: number, updates: Partial<Book>) => void;
  onDelete: (id: number) => void;
  index: number;
}

const priorityOrder: PriorityLevel[] = ['none', 'low', 'medium', 'high'];

export function BookCard({ book, onUpdate, onDelete, index }: BookCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const status = getBookStatus(book);
  const progress = getProgressPercentage(book);
  const isCompleted = status === 'Completed';
  const isLater = status === 'Later';

  const handleOverallNotesChange = useCallback((value: string) => {
    onUpdate(book.id, { notes: value });
  }, [book.id, onUpdate]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open detail if clicking on action buttons or textarea
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('textarea')) return;
    setIsDetailOpen(true);
  };

  const cyclePriority = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIndex = priorityOrder.indexOf(book.priority || 'none');
    const nextIndex = (currentIndex + 1) % priorityOrder.length;
    onUpdate(book.id, { priority: priorityOrder[nextIndex] });
  };

  return (
    <>
      <div 
        className="group relative flex flex-col overflow-hidden rounded-xl bg-card shadow-card transition-all duration-300 hover:shadow-hover animate-fade-in cursor-pointer"
        style={{ animationDelay: `${index * 80}ms` }}
        onClick={handleCardClick}
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          {/* Status Badge */}
          <div className={cn(
            "absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm",
            isCompleted 
              ? "bg-primary/90 text-primary-foreground" 
              : isLater
                ? "bg-secondary/90 text-secondary-foreground"
                : "bg-gold/90 text-foreground"
          )}>
            {isCompleted ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : isLater ? (
              <Clock className="h-3.5 w-3.5" />
            ) : (
              <BookOpen className="h-3.5 w-3.5" />
            )}
            {status}
          </div>

          {/* Priority Badge */}
          {(book.priority && book.priority !== 'none') && (
            <div className="absolute top-3 left-24">
              <PriorityBadge priority={book.priority} compact onClick={cyclePriority} />
            </div>
          )}

          {/* PDF Indicator */}
          {book.pdfURL && (
            <div className={cn(
              "absolute top-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm bg-accent/90 text-accent-foreground",
              book.priority && book.priority !== 'none' ? "left-36" : "left-24"
            )}>
              <FileText className="h-3 w-3" />
              PDF
            </div>
          )}

          {/* Action Buttons */}
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setIsEditOpen(true); }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/90 text-accent-foreground opacity-0 transition-all duration-200 hover:bg-accent group-hover:opacity-100 focus:opacity-100"
              aria-label="Edit book"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(book.id); }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/90 text-destructive-foreground opacity-0 transition-all duration-200 hover:bg-destructive group-hover:opacity-100 focus:opacity-100"
              aria-label="Delete book"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Progress Overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50">
            <div 
              className={cn(
                "h-full transition-all duration-500",
                isCompleted ? "bg-primary" : "bg-gradient-gold"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 pt-8">
            <h3 className="font-display text-lg font-bold leading-tight text-white line-clamp-2">
              {book.title}
            </h3>
            <p className="mt-1 text-sm text-white/80">{book.author}</p>
          </div>
        </div>

        {/* Card Body */}
        <div className="flex flex-1 flex-col gap-3 p-4">
          {/* Progress Info with Milestones */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{book.currentPage} / {book.totalPages} pages</span>
            <MilestoneProgress book={book} compact />
          </div>

          {/* Overall Reflection */}
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" />
              Overall Reflection
            </label>
            <textarea
              value={book.notes}
              onChange={(e) => handleOverallNotesChange(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Your overall thoughts on this book..."
              className="h-20 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <EditBookForm
        book={book}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={onUpdate}
      />

      {/* Book Detail Dialog */}
      <BookDetailDialog
        book={book}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onUpdate={onUpdate}
      />
    </>
  );
}
