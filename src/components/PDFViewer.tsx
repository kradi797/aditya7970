import { useState, useCallback, useRef } from 'react';
import { 
  X, ZoomIn, ZoomOut, Maximize2, Download, 
  BookOpen, Columns2, Highlighter, MessageSquare, 
  Pencil, Trash2, ChevronLeft, ChevronRight,
  RotateCcw, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PDFAnnotation } from '@/types/book';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type ViewMode = 'single' | 'double' | 'fit';
type AnnotationTool = 'highlight' | 'note' | 'draw' | null;

interface PDFViewerProps {
  pdfURL: string;
  bookTitle: string;
  onClose: () => void;
  annotations?: PDFAnnotation[];
  onSaveAnnotations?: (annotations: PDFAnnotation[]) => void;
}

const annotationColors = [
  { name: 'Yellow', value: '#FBBF24' },
  { name: 'Green', value: '#34D399' },
  { name: 'Blue', value: '#60A5FA' },
  { name: 'Pink', value: '#F472B6' },
  { name: 'Orange', value: '#FB923C' },
];

export function PDFViewer({ 
  pdfURL, 
  bookTitle, 
  onClose, 
  annotations = [], 
  onSaveAnnotations 
}: PDFViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [activeTool, setActiveTool] = useState<AnnotationTool>(null);
  const [selectedColor, setSelectedColor] = useState(annotationColors[0].value);
  const [localAnnotations, setLocalAnnotations] = useState<PDFAnnotation[]>(annotations);
  const [showAnnotationPanel, setShowAnnotationPanel] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleResetZoom = () => setZoom(100);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'fit') {
      setZoom(100);
    }
  };

  const handleToolSelect = (tool: AnnotationTool) => {
    setActiveTool(activeTool === tool ? null : tool);
  };

  const addAnnotation = useCallback((type: PDFAnnotation['type'], content: string, position: PDFAnnotation['position']) => {
    const newAnnotation: PDFAnnotation = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      page: 1, // Would need actual page tracking
      type,
      content,
      color: selectedColor,
      position,
      createdAt: Date.now(),
    };
    setLocalAnnotations(prev => [...prev, newAnnotation]);
    setHasUnsavedChanges(true);
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} added`);
  }, [selectedColor]);

  const deleteAnnotation = useCallback((id: string) => {
    setLocalAnnotations(prev => prev.filter(a => a.id !== id));
    setHasUnsavedChanges(true);
    toast.success('Annotation deleted');
  }, []);

  const handleSave = useCallback(() => {
    if (onSaveAnnotations) {
      onSaveAnnotations(localAnnotations);
      setHasUnsavedChanges(false);
      toast.success('Annotations saved');
    }
  }, [localAnnotations, onSaveAnnotations]);

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addAnnotation('note', noteText, { x: 50, y: 50 });
    setNoteText('');
    setShowAnnotationPanel(false);
  };

  const getViewModeStyles = (): React.CSSProperties => {
    switch (viewMode) {
      case 'double':
        return {
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
        };
      case 'fit':
        return {
          width: '100%',
          height: '100%',
          maxWidth: 'none',
        };
      default:
        return {
          width: `${zoom}%`,
          maxWidth: '1200px',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
          <h2 className="font-display text-lg font-semibold text-foreground truncate max-w-[200px] sm:max-w-[300px]">
            {bookTitle}
          </h2>
          {hasUnsavedChanges && (
            <span className="text-xs text-amber-500 font-medium">• Unsaved changes</span>
          )}
        </div>
        
        {/* View Mode Controls */}
        <div className="hidden md:flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === 'single' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('single')}
            className="h-8 px-3"
          >
            <BookOpen className="h-4 w-4 mr-1.5" />
            Single
          </Button>
          <Button
            variant={viewMode === 'double' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('double')}
            className="h-8 px-3"
          >
            <Columns2 className="h-4 w-4 mr-1.5" />
            Two Page
          </Button>
          <Button
            variant={viewMode === 'fit' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('fit')}
            className="h-8 px-3"
          >
            <Maximize2 className="h-4 w-4 mr-1.5" />
            Fit
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={zoom <= 50 || viewMode === 'fit'}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[50px] text-center">{zoom}%</span>
            <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={zoom >= 200 || viewMode === 'fit'}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleResetZoom} disabled={viewMode === 'fit'}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          
          {onSaveAnnotations && hasUnsavedChanges && (
            <Button variant="default" size="sm" onClick={handleSave} className="gap-1.5">
              <Save className="h-4 w-4" />
              Save
            </Button>
          )}
          
          <a href={pdfURL} download target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </header>
      
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/80">
        {/* Annotation Tools */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground mr-2">Tools:</span>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={activeTool === 'highlight' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleToolSelect('highlight')}
              className="h-8 px-3"
            >
              <Highlighter className="h-4 w-4 mr-1.5" />
              Highlight
            </Button>
            <Button
              variant={activeTool === 'note' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => {
                handleToolSelect('note');
                setShowAnnotationPanel(true);
              }}
              className="h-8 px-3"
            >
              <MessageSquare className="h-4 w-4 mr-1.5" />
              Note
            </Button>
            <Button
              variant={activeTool === 'draw' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleToolSelect('draw')}
              className="h-8 px-3"
            >
              <Pencil className="h-4 w-4 mr-1.5" />
              Draw
            </Button>
          </div>
        </div>

        {/* Color Picker */}
        {activeTool && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Color:</span>
            <div className="flex items-center gap-1">
              {annotationColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className={cn(
                    "w-6 h-6 rounded-full transition-transform",
                    selectedColor === color.value && "ring-2 ring-foreground ring-offset-2 scale-110"
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Annotations Count */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {localAnnotations.length} annotation{localAnnotations.length !== 1 && 's'}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* PDF Content */}
        <div 
          ref={containerRef}
          className={cn(
            "flex-1 overflow-auto bg-muted/50 flex justify-center p-4",
            viewMode === 'double' && "items-start",
            viewMode === 'fit' && "items-stretch p-0"
          )}
        >
          <div 
            className={cn(
              "transition-all duration-200",
              viewMode === 'fit' && "w-full h-full"
            )}
            style={getViewModeStyles()}
          >
            <iframe
              src={`${pdfURL}#toolbar=0&navpanes=0&scrollbar=1`}
              title={bookTitle}
              className={cn(
                "bg-white rounded-lg shadow-lg",
                viewMode === 'fit' && "rounded-none w-full h-full"
              )}
              style={{
                width: viewMode === 'fit' ? '100%' : undefined,
                height: viewMode === 'fit' ? '100%' : '100%',
                minHeight: viewMode === 'fit' ? 'auto' : '80vh',
                border: 'none',
              }}
            />
            {viewMode === 'double' && (
              <iframe
                src={`${pdfURL}#toolbar=0&navpanes=0&scrollbar=1&page=2`}
                title={`${bookTitle} - Page 2`}
                className="bg-white rounded-lg shadow-lg"
                style={{
                  height: '100%',
                  minHeight: '80vh',
                  border: 'none',
                }}
              />
            )}
          </div>
        </div>

        {/* Annotation Panel */}
        {showAnnotationPanel && (
          <div className="w-80 border-l border-border bg-card p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Add Note</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowAnnotationPanel(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Write your note..."
              className="w-full h-32 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
            />

            <div className="flex gap-2 mt-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowAnnotationPanel(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleAddNote} disabled={!noteText.trim()}>
                Add Note
              </Button>
            </div>

            {/* Existing Annotations */}
            {localAnnotations.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">All Annotations</h4>
                <div className="space-y-2">
                  {localAnnotations.map((annotation) => (
                    <div 
                      key={annotation.id}
                      className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 group"
                    >
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                        style={{ backgroundColor: annotation.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground capitalize">{annotation.type}</p>
                        <p className="text-sm text-foreground truncate">{annotation.content || 'No content'}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteAnnotation(annotation.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile View Mode Selector */}
      <div className="md:hidden flex items-center justify-center gap-2 px-4 py-3 border-t border-border bg-card">
        <Button
          variant={viewMode === 'single' ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => handleViewModeChange('single')}
        >
          <BookOpen className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'double' ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => handleViewModeChange('double')}
        >
          <Columns2 className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'fit' ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => handleViewModeChange('fit')}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
