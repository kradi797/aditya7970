export type MoodType = 'neutral' | 'sad' | 'happy';

export interface PageReflection {
  page: number;
  topic: string;
  text: string;
  mood: MoodType;
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
