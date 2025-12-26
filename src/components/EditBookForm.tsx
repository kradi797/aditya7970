import { useState, useEffect } from 'react';
import { Pencil, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Book } from '@/types/book';
import { cn } from '@/lib/utils';

interface EditBookFormProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, updates: Partial<Book>) => void;
}

export function EditBookForm({ book, isOpen, onClose, onSave }: EditBookFormProps) {
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [totalPages, setTotalPages] = useState(book.totalPages.toString());
  const [coverURL, setCoverURL] = useState(book.coverURL);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setTitle(book.title);
      setAuthor(book.author);
      setTotalPages(book.totalPages.toString());
      setCoverURL(book.coverURL);
      setErrors({});
    }
  }, [isOpen, book]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!author.trim()) newErrors.author = 'Author is required';
    const pages = parseInt(totalPages);
    if (!totalPages || pages < 1) newErrors.totalPages = 'Enter valid page count';
    if (pages < book.currentPage) newErrors.totalPages = `Must be at least ${book.currentPage} (current page)`;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave(book.id, {
      title: title.trim(),
      author: author.trim(),
      totalPages: parseInt(totalPages, 10),
      coverURL: coverURL.trim() || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop',
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
              <BookOpen className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <DialogTitle className="font-display text-2xl font-bold">Edit Book</DialogTitle>
              <DialogDescription>Update book details</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter book title"
              className={cn(
                "w-full rounded-lg border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
                errors.title ? "border-destructive" : "border-input focus:border-primary"
              )}
            />
            {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Author <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Enter author name"
              className={cn(
                "w-full rounded-lg border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
                errors.author ? "border-destructive" : "border-input focus:border-primary"
              )}
            />
            {errors.author && <p className="mt-1 text-xs text-destructive">{errors.author}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Total Pages <span className="text-destructive">*</span>
            </label>
            <input
              type="number"
              min={book.currentPage || 1}
              value={totalPages}
              onChange={(e) => setTotalPages(e.target.value)}
              placeholder="Enter page count"
              className={cn(
                "w-full rounded-lg border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
                errors.totalPages ? "border-destructive" : "border-input focus:border-primary"
              )}
            />
            {errors.totalPages && <p className="mt-1 text-xs text-destructive">{errors.totalPages}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Cover URL <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              type="url"
              value={coverURL}
              onChange={(e) => setCoverURL(e.target.value)}
              placeholder="https://example.com/cover.jpg"
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
