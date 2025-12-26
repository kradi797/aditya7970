import { useState } from 'react';
import { Plus, X, FileText } from 'lucide-react';
import { PageReflection } from '@/types/book';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageReflectionsProps {
  reflections: PageReflection[];
  totalPages: number;
  currentPage: number;
  onUpdate: (reflections: PageReflection[]) => void;
}

export function PageReflections({ reflections, totalPages, currentPage, onUpdate }: PageReflectionsProps) {
  const [newPage, setNewPage] = useState(currentPage.toString());
  const [newText, setNewText] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddReflection = () => {
    const page = parseInt(newPage);
    if (isNaN(page) || page < 1 || page > totalPages || !newText.trim()) return;
    
    const existing = reflections.find(r => r.page === page);
    if (existing) {
      // Update existing
      onUpdate(reflections.map(r => r.page === page ? { ...r, text: newText.trim() } : r));
    } else {
      // Add new
      const updated = [...reflections, { page, text: newText.trim() }].sort((a, b) => a.page - b.page);
      onUpdate(updated);
    }
    
    setNewPage(currentPage.toString());
    setNewText('');
    setIsAdding(false);
  };

  const handleDeleteReflection = (page: number) => {
    onUpdate(reflections.filter(r => r.page !== page));
  };

  const handleUpdateReflection = (page: number, text: string) => {
    if (!text.trim()) {
      handleDeleteReflection(page);
      return;
    }
    onUpdate(reflections.map(r => r.page === page ? { ...r, text } : r));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
          <FileText className="h-4 w-4" />
          Page Reflections
        </label>
        {!isAdding && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setNewPage(currentPage.toString());
              setIsAdding(true);
            }}
            className="h-7 text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        )}
      </div>

      {/* Add new reflection form */}
      {isAdding && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Page</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={newPage}
              onChange={(e) => setNewPage(e.target.value)}
              className="w-16 rounded border border-input bg-background px-2 py-1 text-sm text-foreground focus:border-primary focus:outline-none"
            />
            <span className="text-xs text-muted-foreground">of {totalPages}</span>
          </div>
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Your reflection for this page..."
            className="w-full resize-none rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none h-16"
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsAdding(false)} className="flex-1 h-7 text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddReflection} className="flex-1 h-7 text-xs">
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Existing reflections */}
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {reflections.length === 0 && !isAdding ? (
          <p className="text-xs text-muted-foreground/60 italic">No page reflections yet</p>
        ) : (
          reflections.map((reflection) => (
            <div 
              key={reflection.page} 
              className="group rounded-lg border border-border bg-muted/30 p-2"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-primary">Page {reflection.page}</span>
                <button
                  onClick={() => handleDeleteReflection(reflection.page)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <textarea
                value={reflection.text}
                onChange={(e) => handleUpdateReflection(reflection.page, e.target.value)}
                className="w-full resize-none rounded border-0 bg-transparent p-0 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0 h-12"
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
