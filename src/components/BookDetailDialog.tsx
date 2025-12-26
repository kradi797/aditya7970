import { useState, useCallback, useRef } from 'react';
import { X, Plus, BookOpen, CheckCircle2, Smile, Meh, Frown, Upload, FileText, Clock, BookMarked } from 'lucide-react';
import { Book, PageReflection, MoodType, getBookStatus, getProgressPercentage, PDFAnnotation } from '@/types/book';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PDFViewer } from './PDFViewer';
import { MilestoneProgress } from './MilestoneProgress';
import { PrioritySelector } from './PrioritySelector';

interface BookDetailDialogProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, updates: Partial<Book>) => void;
}

const moodEmojis: Record<MoodType, { icon: typeof Smile; label: string; color: string }> = {
  happy: { icon: Smile, label: 'Happy', color: 'text-green-500' },
  neutral: { icon: Meh, label: 'Neutral', color: 'text-amber-500' },
  sad: { icon: Frown, label: 'Sad', color: 'text-blue-500' },
};

export function BookDetailDialog({ book, isOpen, onClose, onUpdate }: BookDetailDialogProps) {
  const [currentPageInput, setCurrentPageInput] = useState(book.currentPage.toString());
  const [newPage, setNewPage] = useState(book.currentPage.toString());
  const [newTopic, setNewTopic] = useState('');
  const [newText, setNewText] = useState('');
  const [newMood, setNewMood] = useState<MoodType>('neutral');
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const status = getBookStatus(book);
  const progress = getProgressPercentage(book);
  const isCompleted = status === 'Completed';
  const isLater = status === 'Later';
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
    if (isNaN(page) || page < 1 || page > book.totalPages || !newTopic.trim()) return;
    
    const newReflection: PageReflection = {
      page,
      topic: newTopic.trim(),
      text: newText.trim(),
      mood: newMood,
    };
    
    const updated = [...reflections, newReflection].sort((a, b) => a.page - b.page);
    
    onUpdate(book.id, { pageReflections: updated });
    setNewPage(book.currentPage.toString());
    setNewTopic('');
    setNewText('');
    setNewMood('neutral');
    setIsAdding(false);
  };

  const handleDeleteReflection = (index: number) => {
    onUpdate(book.id, { pageReflections: reflections.filter((_, i) => i !== index) });
  };

  const handlePDFUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `${book.id}-${Date.now()}.pdf`;
      const { data, error } = await supabase.storage
        .from('book-pdfs')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('book-pdfs')
        .getPublicUrl(data.path);

      onUpdate(book.id, { pdfURL: publicUrl });
      toast.success('PDF uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload PDF');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleToggleLater = () => {
    const newStatus = book.status === 'later' ? 'reading' : 'later';
    onUpdate(book.id, { status: newStatus });
    toast.success(newStatus === 'later' ? 'Added to Read Later' : 'Moved to Reading');
  };

  const handleSaveAnnotations = (annotations: PDFAnnotation[]) => {
    onUpdate(book.id, { pdfAnnotations: annotations });
  };

  if (!isOpen) return null;

  if (showPDFViewer && book.pdfURL) {
    return (
      <PDFViewer
        pdfURL={book.pdfURL}
        bookTitle={book.title}
        onClose={() => setShowPDFViewer(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-card shadow-2xl animate-fade-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-card/90 text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
          {/* Left Side - Book Cover & Info */}
          <div className="md:w-2/5 flex-shrink-0 p-6 flex flex-col items-center bg-muted/30 overflow-y-auto">
            {/* Status Badge & Later Toggle */}
            <div className="self-stretch flex items-center justify-between mb-4">
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
                isCompleted 
                  ? "bg-primary text-primary-foreground" 
                  : isLater
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-gold text-foreground"
              )}>
                {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : isLater ? <Clock className="h-3.5 w-3.5" /> : <BookOpen className="h-3.5 w-3.5" />}
                {status}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleLater}
                className={cn(
                  "h-8 text-xs",
                  isLater && "text-primary"
                )}
              >
                <BookMarked className="h-3.5 w-3.5 mr-1" />
                {isLater ? 'Start Reading' : 'Read Later'}
              </Button>
            </div>

            {/* Priority Selector */}
            <div className="self-stretch mb-4">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Priority</label>
              <PrioritySelector 
                value={book.priority || 'none'} 
                onChange={(priority) => onUpdate(book.id, { priority })}
              />
            </div>
            {book.pdfURL && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowPDFViewer(true)}
                className="w-full max-w-[240px] mb-3 gap-2"
              >
                <FileText className="h-4 w-4" />
                Read PDF
              </Button>
            )}
            
            {/* Book Cover */}
            <div className="w-full max-w-[240px] rounded-xl overflow-hidden shadow-lg mb-3">
              <div className="relative aspect-[2/3] w-full">
                <img
                  src={book.coverURL || '/placeholder.svg'}
                  alt={`Cover of ${book.title}`}
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              </div>
            </div>

            {/* Upload PDF Button (below cover) */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf"
              onChange={handlePDFUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full max-w-[240px] mb-4 gap-2"
            >
              <Upload className="h-4 w-4" />
              {isUploading ? 'Uploading...' : book.pdfURL ? 'Replace PDF' : 'Upload Your Book'}
            </Button>
            
            {/* Book Title & Author */}
            <h2 className="font-display text-xl font-bold text-foreground text-center">{book.title}</h2>
            <p className="text-muted-foreground text-sm text-center mb-4">{book.author}</p>
            
            {/* Milestone Progress */}
            <div className="w-full mb-4">
              <MilestoneProgress book={book} />
            </div>
            
            {/* Page Input */}
            <div className="w-full space-y-2">
              <div className="flex items-center gap-2 justify-center">
                <input
                  type="number"
                  min={0}
                  max={book.totalPages}
                  value={currentPageInput}
                  onChange={(e) => handlePageChange(e.target.value)}
                  onBlur={handlePageBlur}
                  className="w-20 rounded-lg border border-input bg-background px-2 py-1.5 text-sm font-medium text-foreground text-center transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-sm text-muted-foreground">of {book.totalPages} pages</span>
              </div>
            </div>
          </div>
          
          {/* Right Side - Reflections */}
          <div className="md:w-3/5 flex-1 overflow-y-auto p-6 pr-12 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-foreground truncate">Page Reflections</h3>
              {!isAdding && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNewPage(book.currentPage.toString());
                    setIsAdding(true);
                  }}
                  className="h-8 flex-shrink-0 mr-2"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              )}
            </div>
            
            {/* Add new reflection form */}
            {isAdding && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Page</span>
                    <input
                      type="number"
                      min={1}
                      max={book.totalPages}
                      value={newPage}
                      onChange={(e) => setNewPage(e.target.value)}
                      className="w-16 rounded-lg border border-input bg-background px-2 py-1.5 text-sm text-foreground text-center focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Mood</span>
                    <div className="flex gap-1">
                      {(Object.keys(moodEmojis) as MoodType[]).map((mood) => {
                        const { icon: Icon, color } = moodEmojis[mood];
                        return (
                          <button
                            key={mood}
                            onClick={() => setNewMood(mood)}
                            className={cn(
                              "p-1.5 rounded-lg transition-all",
                              newMood === mood 
                                ? "bg-primary/20 ring-2 ring-primary" 
                                : "hover:bg-muted"
                            )}
                          >
                            <Icon className={cn("h-5 w-5", color)} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Topic title..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                  autoFocus
                />
                <textarea
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Your thoughts on this topic..."
                  className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none h-20"
                />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsAdding(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleAddReflection} className="flex-1" disabled={!newTopic.trim()}>
                    Save
                  </Button>
                </div>
              </div>
            )}
            
            {/* Existing reflections */}
            <div className="space-y-3">
              {reflections.length === 0 && !isAdding ? (
                <p className="text-sm text-muted-foreground/60 italic py-8 text-center">
                  No reflections yet. Add your thoughts as you read!
                </p>
              ) : (
                reflections.map((reflection, index) => {
                  const { icon: MoodIcon, color: moodColor } = moodEmojis[reflection.mood || 'neutral'];
                  return (
                    <div 
                      key={`${reflection.page}-${index}`} 
                      className="group rounded-xl border border-border bg-muted/30 p-4"
                    >
                      {/* Topic Header */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{reflection.topic || 'Untitled'}</h4>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            Page {reflection.page}
                          </span>
                          <MoodIcon className={cn("h-5 w-5", moodColor)} />
                          <button
                            onClick={() => handleDeleteReflection(index)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Topic Content */}
                      {reflection.text && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {reflection.text}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
