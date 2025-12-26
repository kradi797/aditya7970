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
}

export type BookStatus = 'Reading' | 'Completed';

export type FilterType = 'All' | 'Reading' | 'Completed';

export function getBookStatus(book: Book): BookStatus {
  return book.currentPage >= book.totalPages ? 'Completed' : 'Reading';
}

export function getProgressPercentage(book: Book): number {
  if (book.totalPages === 0) return 0;
  return Math.round((book.currentPage / book.totalPages) * 100);
}
