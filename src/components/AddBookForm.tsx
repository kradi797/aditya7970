import { useState } from 'react';
import { Plus, BookPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface AddBookFormProps {
  onAdd: (book: { title: string; author: string; totalPages: number; coverURL: string }) => void;
}

export function AddBookForm({ onAdd }: AddBookFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [coverURL, setCoverURL] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!author.trim()) newErrors.author = 'Author is required';
    if (!totalPages || parseInt(totalPages) < 1) newErrors.totalPages = 'Enter valid page count';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onAdd({
      title: title.trim(),
      author: author.trim(),
      totalPages: parseInt(totalPages, 10),
      coverURL: coverURL.trim() || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop',
    });

    setTitle('');
    setAuthor('');
    setTotalPages('');
    setCoverURL('');
    setErrors({});
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setErrors({});
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="gap-2"
        size="lg"
      >
        <Plus className="h-5 w-5" />
        Add Book
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                <BookPlus className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <DialogTitle className="font-display text-2xl font-bold">Add New Book</DialogTitle>
                <DialogDescription>Add a book to your library</DialogDescription>
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
                min={1}
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
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Add Book
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
