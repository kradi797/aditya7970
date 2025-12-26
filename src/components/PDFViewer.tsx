import { useState } from 'react';
import { X, ZoomIn, ZoomOut, Maximize2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PDFViewerProps {
  pdfURL: string;
  bookTitle: string;
  onClose: () => void;
}

export function PDFViewer({ pdfURL, bookTitle, onClose }: PDFViewerProps) {
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleResetZoom = () => setZoom(100);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
          <h2 className="font-display text-lg font-semibold text-foreground truncate max-w-[300px]">
            {bookTitle}
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={zoom <= 50}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[60px] text-center">{zoom}%</span>
          <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={zoom >= 200}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleResetZoom}>
            <Maximize2 className="h-4 w-4" />
          </Button>
          <a href={pdfURL} download target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </header>
      
      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-muted/50 flex items-start justify-center p-4">
        <iframe
          src={`${pdfURL}#toolbar=0&navpanes=0&scrollbar=1`}
          title={bookTitle}
          className="bg-white rounded-lg shadow-lg transition-transform duration-200"
          style={{
            width: `${zoom}%`,
            height: '100%',
            minHeight: '80vh',
            border: 'none',
          }}
        />
      </div>
    </div>
  );
}