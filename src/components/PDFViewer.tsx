import { useState, useCallback, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { 
  X, ZoomIn, ZoomOut, Download, 
  BookOpen, Columns2, ChevronLeft, 
  ChevronRight, Grid3X3, Search,
  Maximize, ArrowDownToLine, ArrowRightToLine
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type ViewMode = 'single' | 'double';
type FitMode = 'none' | 'width' | 'height' | 'screen';

interface PDFViewerProps {
  pdfURL: string;
  bookTitle: string;
  onClose: () => void;
}

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
const STORAGE_KEY_PREFIX = 'pdf-viewer-state-';

export function PDFViewer({ pdfURL, bookTitle, onClose }: PDFViewerProps) {
  // Core state
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [fitMode, setFitMode] = useState<FitMode>('screen');
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  // Layout measurements
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [pageSize, setPageSize] = useState({ width: 612, height: 792 }); // Default letter size
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageInputRef = useRef<HTMLInputElement>(null);

  // Generate storage key from PDF URL
  const storageKey = `${STORAGE_KEY_PREFIX}${btoa(pdfURL).slice(0, 20)}`;

  // Load saved state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const state = JSON.parse(saved);
        if (state.currentPage) setCurrentPage(state.currentPage);
        if (state.scale) setScale(state.scale);
        if (state.viewMode) setViewMode(state.viewMode);
        if (state.fitMode) setFitMode(state.fitMode);
      }
    } catch (e) {
      console.error('Failed to load PDF viewer state:', e);
    }
  }, [storageKey]);

  // Save state on changes
  useEffect(() => {
    if (numPages > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          currentPage,
          scale,
          viewMode,
          fitMode
        }));
      } catch (e) {
        console.error('Failed to save PDF viewer state:', e);
      }
    }
  }, [currentPage, scale, viewMode, fitMode, numPages, storageKey]);

  // Measure container size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [showThumbnails]);

  // Calculate effective page width based on fit mode
  const getPageWidth = useCallback(() => {
    const sidebarWidth = showThumbnails ? 180 : 0;
    const availableWidth = containerSize.width - sidebarWidth - 60;
    const availableHeight = containerSize.height - 40;
    const aspectRatio = pageSize.height / pageSize.width;
    
    if (fitMode === 'none') {
      return pageSize.width * scale;
    }
    
    if (viewMode === 'double') {
      const perPageWidth = (availableWidth / 2) - 20;
      
      switch (fitMode) {
        case 'width':
          return perPageWidth * scale;
        case 'height':
          return (availableHeight / aspectRatio) * scale;
        case 'screen':
          const fitByWidth = perPageWidth;
          const fitByHeight = availableHeight / aspectRatio;
          return Math.min(fitByWidth, fitByHeight) * scale;
        default:
          return perPageWidth * scale;
      }
    } else {
      switch (fitMode) {
        case 'width':
          return availableWidth * 0.95 * scale;
        case 'height':
          return (availableHeight / aspectRatio) * scale;
        case 'screen':
          const fitByWidth = availableWidth * 0.95;
          const fitByHeight = availableHeight / aspectRatio;
          return Math.min(fitByWidth, fitByHeight) * scale;
        default:
          return availableWidth * 0.7 * scale;
      }
    }
  }, [containerSize, viewMode, scale, showThumbnails, fitMode, pageSize]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    toast.success(`PDF loaded: ${numPages} pages`);
  };

  const onPageLoadSuccess = (page: any) => {
    if (pageSize.width === 612) { // Only update if still default
      setPageSize({ width: page.width, height: page.height });
    }
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setIsLoading(false);
    toast.error('Failed to load PDF');
  };

  // Zoom controls
  const handleZoomIn = () => {
    setFitMode('none');
    const currentIndex = ZOOM_STEPS.findIndex(s => s >= scale);
    if (currentIndex < ZOOM_STEPS.length - 1) {
      setScale(ZOOM_STEPS[currentIndex + 1]);
    }
  };

  const handleZoomOut = () => {
    setFitMode('none');
    const currentIndex = ZOOM_STEPS.findIndex(s => s >= scale);
    if (currentIndex > 0) {
      setScale(ZOOM_STEPS[currentIndex - 1]);
    }
  };

  // Fit mode handlers
  const handleFitWidth = () => {
    setScale(1);
    setFitMode('width');
  };

  const handleFitHeight = () => {
    setScale(1);
    setFitMode('height');
  };

  const handleFitScreen = () => {
    setScale(1);
    setFitMode('screen');
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setScale(1);
    setFitMode('screen');
  };

  // Page navigation
  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, numPages));
    setCurrentPage(validPage);
    
    const pageElement = document.getElementById(`pdf-page-${validPage}`);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePrevPage = () => {
    const step = viewMode === 'double' ? 2 : 1;
    goToPage(currentPage - step);
  };

  const handleNextPage = () => {
    const step = viewMode === 'double' ? 2 : 1;
    goToPage(currentPage + step);
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const value = parseInt((e.target as HTMLInputElement).value, 10);
      if (!isNaN(value)) {
        goToPage(value);
      }
    }
  };

  // Generate page pairs for two-page view
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

  // Track current page on scroll
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          handlePrevPage();
          break;
        case 'ArrowRight':
          handleNextPage();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case 'Escape':
          onClose();
          break;
        case 'f':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setShowSearch(true);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, numPages, viewMode]);

  const calculatedWidth = getPageWidth();

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background" ref={containerRef}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
          <h2 className="font-display text-lg font-semibold text-foreground truncate max-w-[200px] sm:max-w-[300px]">
            {bookTitle}
          </h2>
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
            Spread
          </Button>
        </div>

        {/* Fit Mode Controls */}
        <div className="hidden lg:flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={fitMode === 'width' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={handleFitWidth}
            className="h-7 px-2 text-xs"
            title="Fit Width"
          >
            <ArrowRightToLine className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={fitMode === 'height' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={handleFitHeight}
            className="h-7 px-2 text-xs"
            title="Fit Height"
          >
            <ArrowDownToLine className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={fitMode === 'screen' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={handleFitScreen}
            className="h-7 px-2 text-xs"
            title="Fit Screen"
          >
            <Maximize className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleZoomOut} 
              disabled={scale <= ZOOM_STEPS[0]} 
              className="h-7 w-7 p-0"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs text-foreground min-w-[45px] text-center font-medium">
              {Math.round(scale * 100)}%
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleZoomIn} 
              disabled={scale >= ZOOM_STEPS[ZOOM_STEPS.length - 1]} 
              className="h-7 w-7 p-0"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
            className={cn("h-7 w-7 p-0", showSearch && "bg-muted")}
          >
            <Search className="h-3.5 w-3.5" />
          </Button>
          
          <a href={pdfURL} download target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="h-7 w-7 p-0">
              <Download className="h-3.5 w-3.5" />
            </Button>
          </a>
        </div>
      </header>
      
      {/* Search Bar */}
      {showSearch && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card/80 shrink-0">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search in PDF... (Note: Text search requires text layer)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 flex-1 max-w-md"
            autoFocus
          />
          <Button variant="ghost" size="sm" onClick={() => setShowSearch(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/80 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowThumbnails(!showThumbnails)}
          className={cn("h-8 px-2", showThumbnails && "bg-muted")}
        >
          <Grid3X3 className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline text-xs">Thumbnails</span>
        </Button>

        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handlePrevPage} 
            disabled={currentPage <= 1} 
            className="h-7 w-7 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            <Input
              ref={pageInputRef}
              type="number"
              min={1}
              max={numPages}
              value={currentPage}
              onChange={(e) => setCurrentPage(parseInt(e.target.value, 10) || 1)}
              onKeyDown={handlePageInputKeyDown}
              onBlur={(e) => goToPage(parseInt(e.target.value, 10))}
              className="w-14 h-7 text-center text-xs"
            />
            <span className="text-xs text-muted-foreground">/ {numPages}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleNextPage} 
            disabled={currentPage >= numPages} 
            className="h-7 w-7 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile view mode toggle */}
        <div className="flex md:hidden items-center gap-1">
          <Button
            variant={viewMode === 'single' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('single')}
            className="h-7 w-7 p-0"
          >
            <BookOpen className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={viewMode === 'double' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('double')}
            className="h-7 w-7 p-0"
          >
            <Columns2 className="h-3.5 w-3.5" />
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
            className="flex flex-col items-center py-6"
          >
            {viewMode === 'double' ? (
              // Two-page spread view
              <div className="space-y-6">
                {getPagePairs().map((pair, index) => (
                  <div 
                    key={index} 
                    className="flex gap-4 justify-center"
                  >
                    {pair.map((pageNum) => (
                      <div
                        key={pageNum}
                        id={`pdf-page-${pageNum}`}
                        data-page-number={pageNum}
                        className={cn(
                          "bg-white rounded-lg shadow-lg overflow-hidden transition-shadow",
                          currentPage === pageNum && "ring-2 ring-primary"
                        )}
                      >
                        <Page
                          pageNumber={pageNum}
                          width={calculatedWidth}
                          renderTextLayer={true}
                          renderAnnotationLayer={true}
                          onLoadSuccess={pageNum === 1 ? onPageLoadSuccess : undefined}
                          className="select-text"
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              // Single page view
              <div className="space-y-6">
                {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                  <div
                    key={pageNum}
                    id={`pdf-page-${pageNum}`}
                    data-page-number={pageNum}
                    className={cn(
                      "bg-white rounded-lg shadow-lg overflow-hidden transition-shadow",
                      currentPage === pageNum && "ring-2 ring-primary"
                    )}
                  >
                    <Page
                      pageNumber={pageNum}
                      width={calculatedWidth}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      onLoadSuccess={pageNum === 1 ? onPageLoadSuccess : undefined}
                      className="select-text"
                    />
                  </div>
                ))}
              </div>
            )}
          </Document>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 border-t border-border bg-card shrink-0">
        <div className="flex items-center gap-1">
          <Button
            variant={fitMode === 'width' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={handleFitWidth}
            className="h-8 w-8 p-0"
          >
            <ArrowRightToLine className="h-4 w-4" />
          </Button>
          <Button
            variant={fitMode === 'screen' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={handleFitScreen}
            className="h-8 w-8 p-0"
          >
            <Maximize className="h-4 w-4" />
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
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={scale <= ZOOM_STEPS[0]} className="h-8 w-8 p-0">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={scale >= ZOOM_STEPS[ZOOM_STEPS.length - 1]} className="h-8 w-8 p-0">
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
