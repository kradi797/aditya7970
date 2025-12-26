import { useState, useCallback, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { 
  X, ZoomIn, ZoomOut, Maximize2, Download, 
  BookOpen, Columns2, Highlighter, MessageSquare, 
  Pencil, Trash2, RotateCcw, Save, ChevronLeft, 
  ChevronRight, List, Grid3X3, Minus, Plus,
  Type, MousePointer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PDFAnnotation } from '@/types/book';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PDFAnnotationCanvas } from './PDFAnnotationCanvas';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type ViewMode = 'single' | 'double';
type AnnotationTool = 'select' | 'highlight' | 'note' | 'draw' | 'text' | null;

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
  { name: 'Red', value: '#EF4444' },
];

export function PDFViewer({ 
  pdfURL, 
  bookTitle, 
  onClose, 
  annotations = [], 
  onSaveAnnotations 
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [viewMode, setViewMode] = useState<ViewMode>('double');
  const [fitToScreen, setFitToScreen] = useState<boolean>(true);
  const [activeTool, setActiveTool] = useState<AnnotationTool>('select');
  const [selectedColor, setSelectedColor] = useState(annotationColors[0].value);
  const [localAnnotations, setLocalAnnotations] = useState<PDFAnnotation[]>(annotations);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [showAnnotationPanel, setShowAnnotationPanel] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Calculate responsive page width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        setContainerWidth(width);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [showThumbnails]);

  const getPageWidth = useCallback(() => {
    const sidebarWidth = showThumbnails ? 180 : 0;
    const annotationPanelWidth = showAnnotationPanel ? 320 : 0;
    const availableWidth = containerWidth - sidebarWidth - annotationPanelWidth - 80;
    const availableHeight = window.innerHeight - 200;
    const aspectRatio = 0.707; // A4 aspect ratio
    
    if (viewMode === 'double') {
      // Two-page view
      const maxWidthPerPage = (availableWidth / 2) - 20;
      if (fitToScreen) {
        const fitByHeight = availableHeight * aspectRatio * 0.85;
        return Math.min(maxWidthPerPage, fitByHeight) * scale;
      }
      return Math.min(maxWidthPerPage, 500) * scale;
    } else {
      // Single page mode
      if (fitToScreen) {
        const fitByHeight = availableHeight * aspectRatio;
        const fitByWidth = availableWidth * 0.9;
        return Math.min(fitByHeight, fitByWidth) * scale;
      }
      return Math.min(availableWidth * 0.7, 700) * scale;
    }
  }, [containerWidth, viewMode, scale, showThumbnails, showAnnotationPanel, fitToScreen]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    toast.success(`PDF loaded: ${numPages} pages`);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setIsLoading(false);
    toast.error('Failed to load PDF');
  };

  const handleZoomIn = () => {
    setFitToScreen(false);
    setScale(prev => Math.min(prev + 0.25, 3));
  };
  const handleZoomOut = () => {
    setFitToScreen(false);
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };
  const handleResetZoom = () => {
    setScale(1);
    setFitToScreen(false);
  };
  
  const handleFitToScreen = () => {
    setScale(1);
    setFitToScreen(true);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setScale(1);
    setFitToScreen(true);
  };

  const handleToolSelect = (tool: AnnotationTool) => {
    setActiveTool(tool);
    if (tool === 'note') {
      setShowAnnotationPanel(true);
    }
  };

  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, numPages));
    setCurrentPage(validPage);
    
    // Scroll to the page
    const pageElement = document.getElementById(`pdf-page-${validPage}`);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePrevPage = () => {
    if (viewMode === 'double') {
      goToPage(currentPage - 2);
    } else {
      goToPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (viewMode === 'double') {
      goToPage(currentPage + 2);
    } else {
      goToPage(currentPage + 1);
    }
  };

  const addAnnotation = useCallback((type: PDFAnnotation['type'], content: string, position: PDFAnnotation['position']) => {
    const newAnnotation: PDFAnnotation = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      page: currentPage,
      type,
      content,
      color: selectedColor,
      position,
      createdAt: Date.now(),
    };
    setLocalAnnotations(prev => [...prev, newAnnotation]);
    setHasUnsavedChanges(true);
    
    // Auto-save
    if (onSaveAnnotations) {
      setTimeout(() => {
        onSaveAnnotations([...localAnnotations, newAnnotation]);
        toast.success('Auto-saved');
      }, 500);
    }
  }, [currentPage, selectedColor, localAnnotations, onSaveAnnotations]);

  const deleteAnnotation = useCallback((id: string) => {
    const updated = localAnnotations.filter(a => a.id !== id);
    setLocalAnnotations(updated);
    setHasUnsavedChanges(true);
    
    // Auto-save
    if (onSaveAnnotations) {
      onSaveAnnotations(updated);
      toast.success('Annotation deleted');
    }
  }, [localAnnotations, onSaveAnnotations]);

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
  };

  // Generate page pairs for continuous two-page scrolling
  const getPagePairs = () => {
    const pairs: number[][] = [];
    for (let i = 1; i <= numPages; i += 2) {
      if (i + 1 <= numPages) {
        pairs.push([i, i + 1]);
      } else {
        pairs.push([i]);
      }
    }
    return pairs;
  };

  // Handle scroll to track current page
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const pages = container.querySelectorAll('[data-page-number]');
    
    let closestPage = 1;
    let closestDistance = Infinity;
    
    pages.forEach((page) => {
      const rect = page.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const distance = Math.abs(rect.top - containerRect.top);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPage = parseInt(page.getAttribute('data-page-number') || '1', 10);
      }
    });
    
    setCurrentPage(closestPage);
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background" ref={containerRef}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
          <h2 className="font-display text-lg font-semibold text-foreground truncate max-w-[150px] sm:max-w-[250px]">
            {bookTitle}
          </h2>
          {hasUnsavedChanges && (
            <span className="text-xs text-amber-500 font-medium">• Unsaved</span>
          )}
        </div>
        
        {/* View Mode Controls */}
        <div className="hidden md:flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === 'single' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('single')}
            className="h-7 px-2 text-xs"
          >
            <BookOpen className="h-3.5 w-3.5 mr-1" />
            Single
          </Button>
          <Button
            variant={viewMode === 'double' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('double')}
            className="h-7 px-2 text-xs"
          >
            <Columns2 className="h-3.5 w-3.5 mr-1" />
            Two Page
          </Button>
          <Button
            variant={fitToScreen ? 'secondary' : 'ghost'}
            size="sm"
            onClick={handleFitToScreen}
            className="h-7 px-2 text-xs"
          >
            <Maximize2 className="h-3.5 w-3.5 mr-1" />
            Fit
          </Button>
        </div>

        {/* Zoom & Navigation Controls */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={scale <= 0.5} className="h-7 w-7 p-0">
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs text-foreground min-w-[45px] text-center font-medium">{Math.round(scale * 100)}%</span>
            <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={scale >= 3} className="h-7 w-7 p-0">
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleResetZoom} className="h-7 w-7 p-0">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          {hasUnsavedChanges && (
            <Button variant="default" size="sm" onClick={handleSave} className="h-7 gap-1 text-xs">
              <Save className="h-3.5 w-3.5" />
              Save
            </Button>
          )}
          
          <a href={pdfURL} download target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="h-7 w-7 p-0">
              <Download className="h-3.5 w-3.5" />
            </Button>
          </a>
        </div>
      </header>
      
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/80 shrink-0">
        {/* Left Tools */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={cn("h-8 px-2", showThumbnails && "bg-muted")}
          >
            <Grid3X3 className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline text-xs">Thumbnails</span>
          </Button>
          
          <div className="h-6 w-px bg-border" />
          
          {/* Annotation Tools */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={activeTool === 'select' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleToolSelect('select')}
              className="h-7 px-2"
              title="Select"
            >
              <MousePointer className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={activeTool === 'highlight' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleToolSelect('highlight')}
              className="h-7 px-2"
              title="Highlight"
            >
              <Highlighter className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={activeTool === 'note' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleToolSelect('note')}
              className="h-7 px-2"
              title="Add Note"
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={activeTool === 'draw' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleToolSelect('draw')}
              className="h-7 px-2"
              title="Draw"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={activeTool === 'text' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleToolSelect('text')}
              className="h-7 px-2"
              title="Add Text"
            >
              <Type className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Color Picker */}
        {activeTool && activeTool !== 'select' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">Color:</span>
            <div className="flex items-center gap-1">
              {annotationColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className={cn(
                    "w-5 h-5 rounded-full transition-transform border-2",
                    selectedColor === color.value 
                      ? "border-foreground scale-110" 
                      : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handlePrevPage} disabled={currentPage <= 1} className="h-7 w-7 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={numPages}
              value={currentPage}
              onChange={(e) => goToPage(parseInt(e.target.value, 10))}
              className="w-12 h-7 text-center text-xs border border-input rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <span className="text-xs text-muted-foreground">/ {numPages}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleNextPage} disabled={currentPage >= numPages} className="h-7 w-7 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Thumbnail Sidebar */}
        {showThumbnails && (
          <div className="w-[180px] border-r border-border bg-muted/30 shrink-0">
            <ScrollArea className="h-full">
              <div className="p-3 space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground mb-3">Pages</h4>
                <Document file={pdfURL} loading={null}>
                  {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={cn(
                        "w-full mb-2 rounded-lg overflow-hidden border-2 transition-all hover:border-primary/50",
                        currentPage === pageNum ? "border-primary shadow-md" : "border-transparent"
                      )}
                    >
                      <Page
                        pageNumber={pageNum}
                        width={140}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                      <div className="text-xs text-center py-1 bg-background/80">
                        {pageNum}
                      </div>
                    </button>
                  ))}
                </Document>
              </div>
            </ScrollArea>
          </div>
        )}

        {/* PDF Content */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-auto bg-muted/50"
          onScroll={handleScroll}
        >
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-muted-foreground">Loading PDF...</p>
              </div>
            </div>
          )}
          
          <Document
            file={pdfURL}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
            className={cn(
              "flex flex-col items-center py-6",
              viewMode === 'double' && "items-center"
            )}
          >
            {viewMode === 'double' ? (
              // Two-page continuous scrolling
              <div className="space-y-6">
                {getPagePairs().map((pair, index) => (
                  <div 
                    key={index} 
                    className="flex gap-4 justify-center"
                    id={`pdf-page-pair-${index}`}
                  >
                    {pair.map((pageNum) => (
                      <div
                        key={pageNum}
                        id={`pdf-page-${pageNum}`}
                        data-page-number={pageNum}
                        className={cn(
                          "relative bg-white rounded-lg shadow-lg overflow-hidden transition-shadow",
                          currentPage === pageNum && "ring-2 ring-primary"
                        )}
                      >
                        <Page
                          pageNumber={pageNum}
                          width={getPageWidth()}
                          renderTextLayer={true}
                          renderAnnotationLayer={true}
                          className="select-text"
                        />
                        {activeTool && activeTool !== 'select' && activeTool !== 'note' && (
                          <PDFAnnotationCanvas
                            pageNumber={pageNum}
                            width={getPageWidth()}
                            height={getPageWidth() / 0.707}
                            activeTool={activeTool}
                            selectedColor={selectedColor}
                            annotations={localAnnotations}
                            onAddAnnotation={(type, content, position) => {
                              addAnnotation(type, content, position);
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              // Single page or fit mode continuous scrolling
              <div className="space-y-6">
                {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                  <div
                    key={pageNum}
                    id={`pdf-page-${pageNum}`}
                    data-page-number={pageNum}
                    className={cn(
                      "relative bg-white rounded-lg shadow-lg overflow-hidden transition-shadow",
                      currentPage === pageNum && "ring-2 ring-primary"
                    )}
                  >
                    <Page
                      pageNumber={pageNum}
                      width={getPageWidth()}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      className="select-text"
                    />
                    {activeTool && activeTool !== 'select' && activeTool !== 'note' && (
                      <PDFAnnotationCanvas
                        pageNumber={pageNum}
                        width={getPageWidth()}
                        height={getPageWidth() / 0.707}
                        activeTool={activeTool}
                        selectedColor={selectedColor}
                        annotations={localAnnotations}
                        onAddAnnotation={(type, content, position) => {
                          addAnnotation(type, content, position);
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </Document>
        </div>

        {/* Annotation Panel */}
        {showAnnotationPanel && (
          <div className="w-80 border-l border-border bg-card shrink-0 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Annotations</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowAnnotationPanel(false)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 border-b border-border">
              <h4 className="text-sm font-medium text-foreground mb-2">Add Note</h4>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write your note for page ${currentPage}..."
                className="w-full h-24 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setNoteText('')}>
                  Clear
                </Button>
                <Button size="sm" className="flex-1" onClick={handleAddNote} disabled={!noteText.trim()}>
                  Add Note
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  All Annotations ({localAnnotations.length})
                </h4>
                {localAnnotations.length === 0 ? (
                  <p className="text-sm text-muted-foreground/60 italic text-center py-4">
                    No annotations yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {localAnnotations
                      .sort((a, b) => a.page - b.page)
                      .map((annotation) => (
                        <div 
                          key={annotation.id}
                          className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 group hover:bg-muted transition-colors cursor-pointer"
                          onClick={() => goToPage(annotation.page)}
                        >
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                            style={{ backgroundColor: annotation.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-primary">Page {annotation.page}</span>
                              <span className="text-xs text-muted-foreground capitalize">{annotation.type}</span>
                            </div>
                            <p className="text-sm text-foreground line-clamp-2">
                              {annotation.content || 'No content'}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteAnnotation(annotation.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 border-t border-border bg-card shrink-0">
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === 'single' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('single')}
            className="h-8 w-8 p-0"
          >
            <BookOpen className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'double' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('double')}
            className="h-8 w-8 p-0"
          >
            <Columns2 className="h-4 w-4" />
          </Button>
          <Button
            variant={fitToScreen ? 'secondary' : 'ghost'}
            size="sm"
            onClick={handleFitToScreen}
            className="h-8 w-8 p-0"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handlePrevPage} disabled={currentPage <= 1} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{currentPage} / {numPages}</span>
          <Button variant="ghost" size="sm" onClick={handleNextPage} disabled={currentPage >= numPages} className="h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <Button
          variant={showAnnotationPanel ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setShowAnnotationPanel(!showAnnotationPanel)}
          className="h-8 w-8 p-0"
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
