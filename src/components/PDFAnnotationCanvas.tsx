import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas as FabricCanvas, PencilBrush, Rect, FabricText } from 'fabric';
import { PDFAnnotation } from '@/types/book';
import { toast } from 'sonner';

type AnnotationTool = 'select' | 'highlight' | 'draw' | 'text' | null;

interface PDFAnnotationCanvasProps {
  pageNumber: number;
  width: number;
  height: number;
  activeTool: AnnotationTool;
  selectedColor: string;
  annotations: PDFAnnotation[];
  onAddAnnotation: (type: PDFAnnotation['type'], content: string, position: PDFAnnotation['position']) => void;
}

export function PDFAnnotationCanvas({
  pageNumber,
  width,
  height,
  activeTool,
  selectedColor,
  annotations,
  onAddAnnotation,
}: PDFAnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [isAddingText, setIsAddingText] = useState(false);

  // Initialize fabric canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width,
      height,
      backgroundColor: 'transparent',
      selection: activeTool === 'select',
    });

    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = selectedColor;
    canvas.freeDrawingBrush.width = 3;

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [pageNumber]);

  // Update canvas size
  useEffect(() => {
    if (!fabricCanvas) return;
    fabricCanvas.setDimensions({ width, height });
  }, [width, height, fabricCanvas]);

  // Update tool mode
  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === 'draw';
    fabricCanvas.selection = activeTool === 'select';

    if (activeTool === 'draw' && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = selectedColor;
      fabricCanvas.freeDrawingBrush.width = 3;
    }
  }, [activeTool, selectedColor, fabricCanvas]);

  // Handle canvas click for text and highlight
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!fabricCanvas) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'text' && !isAddingText) {
      setIsAddingText(true);
      
      const text = new FabricText('Click to edit', {
        left: x,
        top: y,
        fontSize: 16,
        fill: selectedColor,
        editable: true,
      });

      fabricCanvas.add(text);
      fabricCanvas.setActiveObject(text);
      
      // Save annotation
      onAddAnnotation('note', 'Text annotation', { x, y, width: 100, height: 20 });
      toast.success('Text added - double click to edit');
      
      setTimeout(() => setIsAddingText(false), 100);
    } else if (activeTool === 'highlight') {
      // Create a semi-transparent highlight rectangle
      const highlight = new Rect({
        left: x - 50,
        top: y - 10,
        width: 100,
        height: 20,
        fill: selectedColor,
        opacity: 0.3,
        selectable: true,
      });

      fabricCanvas.add(highlight);
      onAddAnnotation('highlight', 'Highlight', { x: x - 50, y: y - 10, width: 100, height: 20 });
      toast.success('Highlight added - drag to resize');
    }
  }, [fabricCanvas, activeTool, selectedColor, isAddingText, onAddAnnotation]);

  // Save drawing when done
  useEffect(() => {
    if (!fabricCanvas) return;

    const handlePathCreated = () => {
      onAddAnnotation('drawing', 'Drawing annotation', { x: 0, y: 0 });
      toast.success('Drawing saved');
    };

    fabricCanvas.on('path:created', handlePathCreated);

    return () => {
      fabricCanvas.off('path:created', handlePathCreated);
    };
  }, [fabricCanvas, onAddAnnotation]);

  // Load existing annotations
  useEffect(() => {
    if (!fabricCanvas) return;

    const pageAnnotations = annotations.filter(a => a.page === pageNumber);
    
    pageAnnotations.forEach((annotation) => {
      if (annotation.type === 'highlight') {
        const highlight = new Rect({
          left: annotation.position.x,
          top: annotation.position.y,
          width: annotation.position.width || 100,
          height: annotation.position.height || 20,
          fill: annotation.color,
          opacity: 0.3,
        });
        fabricCanvas.add(highlight);
      }
    });
  }, [fabricCanvas, annotations, pageNumber]);

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      className="absolute inset-0 z-10"
      style={{
        pointerEvents: activeTool && activeTool !== 'select' ? 'auto' : 'none',
        cursor: activeTool === 'text' ? 'text' : activeTool === 'highlight' ? 'crosshair' : activeTool === 'draw' ? 'crosshair' : 'default',
      }}
    />
  );
}
