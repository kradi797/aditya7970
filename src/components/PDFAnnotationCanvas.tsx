import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas as FabricCanvas, PencilBrush, Rect, IText } from 'fabric';
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
  const fabricRef = useRef<FabricCanvas | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize fabric canvas
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return;

    try {
      const canvas = new FabricCanvas(canvasRef.current, {
        width: Math.max(width, 100),
        height: Math.max(height, 100),
        backgroundColor: 'transparent',
        selection: true,
      });

      // Initialize brush
      const brush = new PencilBrush(canvas);
      brush.color = selectedColor;
      brush.width = 3;
      canvas.freeDrawingBrush = brush;

      fabricRef.current = canvas;
      setIsReady(true);

      // Handle path created for drawing
      canvas.on('path:created', () => {
        onAddAnnotation('drawing', 'Drawing annotation', { x: 0, y: 0 });
        toast.success('Drawing saved');
      });

    } catch (error) {
      console.error('Failed to initialize canvas:', error);
    }

    return () => {
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
        setIsReady(false);
      }
    };
  }, [pageNumber]);

  // Update canvas size when dimensions change
  useEffect(() => {
    if (!fabricRef.current || !isReady) return;
    
    const newWidth = Math.max(width, 100);
    const newHeight = Math.max(height, 100);
    
    fabricRef.current.setDimensions({ 
      width: newWidth, 
      height: newHeight 
    });
    fabricRef.current.renderAll();
  }, [width, height, isReady]);

  // Update tool mode
  useEffect(() => {
    if (!fabricRef.current || !isReady) return;

    const canvas = fabricRef.current;
    canvas.isDrawingMode = activeTool === 'draw';
    canvas.selection = activeTool === 'select';

    if (activeTool === 'draw' && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = selectedColor;
      canvas.freeDrawingBrush.width = 3;
    }

    canvas.renderAll();
  }, [activeTool, selectedColor, isReady]);

  // Handle canvas click for text and highlight
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!fabricRef.current || !isReady) return;
    
    const canvas = fabricRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'text') {
      const text = new IText('Edit text', {
        left: x,
        top: y,
        fontSize: 16,
        fill: selectedColor,
        fontFamily: 'Arial',
      });

      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
      
      onAddAnnotation('note', 'Text annotation', { x, y, width: 100, height: 20 });
      toast.success('Text added - click to edit');
    } else if (activeTool === 'highlight') {
      const highlight = new Rect({
        left: x - 50,
        top: y - 10,
        width: 100,
        height: 24,
        fill: selectedColor,
        opacity: 0.35,
        selectable: true,
        rx: 2,
        ry: 2,
      });

      canvas.add(highlight);
      canvas.renderAll();
      
      onAddAnnotation('highlight', 'Highlight', { x: x - 50, y: y - 10, width: 100, height: 24 });
      toast.success('Highlight added - drag corners to resize');
    }
  }, [activeTool, selectedColor, isReady, onAddAnnotation]);

  // Don't render if no active tool or select/note mode
  const isToolActive = activeTool === 'draw' || activeTool === 'highlight' || activeTool === 'text';
  
  if (!isToolActive) {
    return null;
  }

  return (
    <div 
      onClick={handleCanvasClick}
      className="absolute inset-0 z-10"
      style={{
        cursor: activeTool === 'text' ? 'text' : activeTool === 'highlight' ? 'crosshair' : activeTool === 'draw' ? 'crosshair' : 'default',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
}
