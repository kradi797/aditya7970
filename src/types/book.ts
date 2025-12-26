export type MoodType = 'neutral' | 'sad' | 'happy';

export type PriorityLevel = 'high' | 'medium' | 'low' | 'none';

export interface PageReflection {
  page: number;
  topic: string;
  text: string;
  mood: MoodType;
}

export interface PDFAnnotation {
  id: string;
  page: number;
  type: 'highlight' | 'note' | 'drawing';
  content: string;
  color: string;
  position: { x: number; y: number; width?: number; height?: number };
  createdAt: number;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  coverURL: string;
  notes: string; // Overall reflection
  pageReflections: PageReflection[];
  pdfURL?: string; // URL to uploaded PDF
  status?: 'reading' | 'later'; // For "Later" section
  priority?: PriorityLevel; // Priority level
  pdfAnnotations?: PDFAnnotation[]; // PDF annotations
}

export type BookStatus = 'Reading' | 'Completed' | 'Later';

export type FilterType = 'All' | 'Reading' | 'Completed' | 'Later';

export function getBookStatus(book: Book): BookStatus {
  if (book.status === 'later') return 'Later';
  return book.currentPage >= book.totalPages ? 'Completed' : 'Reading';
}

export function getProgressPercentage(book: Book): number {
  if (book.totalPages === 0) return 0;
  return Math.round((book.currentPage / book.totalPages) * 100);
}

export function getMilestones(book: Book): { milestone: number; reached: boolean }[] {
  const progress = getProgressPercentage(book);
  return [
    { milestone: 25, reached: progress >= 25 },
    { milestone: 50, reached: progress >= 50 },
    { milestone: 75, reached: progress >= 75 },
    { milestone: 100, reached: progress >= 100 },
  ];
}

export const priorityConfig: Record<PriorityLevel, { label: string; color: string; bgColor: string }> = {
  high: { label: 'High', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  medium: { label: 'Medium', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  low: { label: 'Low', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  none: { label: 'None', color: 'text-muted-foreground', bgColor: 'bg-muted' },
};
