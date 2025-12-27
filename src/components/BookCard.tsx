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
            "absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold backdrop-blur-sm",
            isCompleted 
              ? "bg-primary/90 text-primary-foreground" 
              : isLater
                ? "bg-secondary/90 text-secondary-foreground"
                : "bg-gold/90 text-foreground"
          )}>
            {isCompleted ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : isLater ? (
              <Clock className="h-3 w-3" />
            ) : (
              <BookOpen className="h-3 w-3" />
            )}
            {status}
          </div>

          {/* Priority Badge */}
          {(book.priority && book.priority !== 'none') && (
            <div className="absolute top-2 left-20">
              <PriorityBadge priority={book.priority} compact onClick={cyclePriority} />
            </div>
          )}

          {/* PDF Indicator */}
          {book.pdfURL && (
            <div className={cn(
              "absolute top-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-sm bg-accent/90 text-accent-foreground",
              book.priority && book.priority !== 'none' ? "left-28" : "left-20"
            )}>
              <FileText className="h-2.5 w-2.5" />
              PDF
            </div>
          )}

          {/* Action Buttons */}
          <div className="absolute top-2 right-2 flex gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); setIsEditOpen(true); }}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/90 text-accent-foreground opacity-0 transition-all duration-200 hover:bg-accent group-hover:opacity-100 focus:opacity-100"
              aria-label="Edit book"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(book.id); }}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive/90 text-destructive-foreground opacity-0 transition-all duration-200 hover:bg-destructive group-hover:opacity-100 focus:opacity-100"
              aria-label="Delete book"
            >
              <Trash2 className="h-3 w-3" />
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
          <div className="absolute bottom-0 left-0 right-0 p-3 pt-6">
            <h3 className="font-display text-sm font-bold leading-tight text-white line-clamp-2">
              {book.title}
            </h3>
            <p className="mt-0.5 text-xs text-white/80">{book.author}</p>
          </div>
        </div>

        {/* Card Body */}
        <div className="flex flex-1 flex-col gap-2 p-3">
          {/* Progress Info with Milestones */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{book.currentPage} / {book.totalPages} pages</span>
            <MilestoneProgress book={book} compact />
          </div>

          {/* Learning Section - Redesigned */}
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                <MessageSquare className="h-3 w-3 text-primary" />
              </div>
              <span className="text-xs font-semibold text-foreground">What I Learned</span>
            </div>
            <div className="relative">
              <textarea
                value={book.notes}
                onChange={(e) => handleOverallNotesChange(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Something you learned from this book..."
                className="h-16 w-full resize-none rounded-lg border-0 bg-muted/50 px-2.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 transition-all focus:bg-muted focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <div className="absolute bottom-1 right-1.5 text-[9px] text-muted-foreground/40">
                {book.notes?.length || 0} chars
              </div>
            </div>
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
