import { useState, useCallback } from 'react';
import { X, FileText, Plus, BookOpen, CheckCircle2 } from 'lucide-react';
import { Book, PageReflection, getBookStatus, getProgressPercentage } from '@/types/book';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BookDetailDialogProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, updates: Partial<Book>) => void;
}

export function BookDetailDialog({ book, isOpen, onClose, onUpdate }: BookDetailDialogProps) {
  const [currentPageInput, setCurrentPageInput] = useState(book.currentPage.toString());
  const [newPage, setNewPage] = useState(book.currentPage.toString());
  const [newText, setNewText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  const status = getBookStatus(book);
  const progress = getProgressPercentage(book);
  const isCompleted = status === 'Completed';
  const reflections = book.pageReflections || [];

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

  const handleAddReflection = () => {
    const page = parseInt(newPage);
    if (isNaN(page) || page < 1 || page > book.totalPages || !newText.trim()) return;
    
    const existing = reflections.find(r => r.page === page);
    let updated: PageReflection[];
    
    if (existing) {
      updated = reflections.map(r => r.page === page ? { ...r, text: newText.trim() } : r);
    } else {
      updated = [...reflections, { page, text: newText.trim() }].sort((a, b) => a.page - b.page);
    }
    
    onUpdate(book.id, { pageReflections: updated });
    setNewPage(book.currentPage.toString());
    setNewText('');
    setIsAdding(false);
  };

  const handleDeleteReflection = (page: number) => {
    onUpdate(book.id, { pageReflections: reflections.filter(r => r.page !== page) });
  };

  const handleUpdateReflection = (page: number, text: string) => {
    if (!text.trim()) {
      handleDeleteReflection(page);
      return;
    }
    onUpdate(book.id, { pageReflections: reflections.map(r => r.page === page ? { ...r, text } : r) });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-card shadow-2xl animate-fade-in flex flex-col">
        {/* Header with Cover */}
        <div className="relative h-48 flex-shrink-0">
          <img
            src={book.coverURL || '/placeholder.svg'}
            alt={`Cover of ${book.title}`}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-card/90 text-foreground hover:bg-card transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          {/* Status Badge */}
          <div className={cn(
            "absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm",
            isCompleted 
              ? "bg-primary/90 text-primary-foreground" 
              : "bg-gold/90 text-foreground"
          )}>
            {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : <BookOpen className="h-3.5 w-3.5" />}
            {status}
          </div>
          
          {/* Book Info */}
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="font-display text-2xl font-bold text-foreground">{book.title}</h2>
            <p className="text-muted-foreground">{book.author}</p>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Progress Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Reading Progress</h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold text-foreground">{progress}%</span>
            </div>
            <div className="relative h-3 overflow-hidden rounded-full bg-muted">
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
                className="w-24 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-sm text-muted-foreground">of {book.totalPages} pages</span>
            </div>
          </div>
          
          {/* Page Reflections Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Page Reflections
              </h3>
              {!isAdding && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNewPage(book.currentPage.toString());
                    setIsAdding(true);
                  }}
                  className="h-8"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Reflection
                </Button>
              )}
            </div>
            
            {/* Add new reflection form */}
            {isAdding && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Page</span>
                  <input
                    type="number"
                    min={1}
                    max={book.totalPages}
                    value={newPage}
                    onChange={(e) => setNewPage(e.target.value)}
                    className="w-20 rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                  <span className="text-sm text-muted-foreground">of {book.totalPages}</span>
                </div>
                <textarea
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Your reflection for this page..."
                  className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none h-24"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsAdding(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleAddReflection} className="flex-1">
                    Save Reflection
                  </Button>
                </div>
              </div>
            )}
            
            {/* Existing reflections */}
            <div className="space-y-3">
              {reflections.length === 0 && !isAdding ? (
                <p className="text-sm text-muted-foreground/60 italic py-4 text-center">
                  No page reflections yet. Add your thoughts as you read!
                </p>
              ) : (
                reflections.map((reflection) => (
                  <div 
                    key={reflection.page} 
                    className="group rounded-xl border border-border bg-muted/30 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-primary">Page {reflection.page}</span>
                      <button
                        onClick={() => handleDeleteReflection(reflection.page)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <textarea
                      value={reflection.text}
                      onChange={(e) => handleUpdateReflection(reflection.page, e.target.value)}
                      className="w-full resize-none rounded-lg border-0 bg-transparent p-0 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0 min-h-[60px]"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
