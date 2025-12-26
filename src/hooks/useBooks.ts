import { useState, useEffect, useCallback, useMemo } from 'react';
import { Book, FilterType, getBookStatus, PriorityLevel } from '@/types/book';

const STORAGE_KEY = 'book-tracker-library';

function loadBooks(): Book[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const books = stored ? JSON.parse(stored) : [];
    // Migrate old books to include pageReflections, status, and priority
    return books.map((book: Book) => ({
      ...book,
      pageReflections: book.pageReflections || [],
      status: book.status || 'reading',
      priority: book.priority || 'none',
      pdfAnnotations: book.pdfAnnotations || [],
    }));
  } catch {
    return [];
  }
}

function saveBooks(books: Book[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

// Priority sort order
const priorityOrder: Record<PriorityLevel, number> = {
  high: 0,
  medium: 1,
  low: 2,
  none: 3,
};

export function useBooks() {
  const [books, setBooks] = useState<Book[]>(() => loadBooks());
  const [filter, setFilter] = useState<FilterType>('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    saveBooks(books);
  }, [books]);

  const addBook = useCallback((bookData: Omit<Book, 'id' | 'currentPage' | 'notes' | 'pageReflections'>) => {
    const newBook: Book = {
      ...bookData,
      id: Date.now(),
      currentPage: 0,
      notes: '',
      pageReflections: [],
      status: bookData.status || 'reading',
      priority: bookData.priority || 'none',
      pdfAnnotations: [],
    };
    setBooks(prev => [...prev, newBook]);
  }, []);

  const updateBook = useCallback((id: number, updates: Partial<Book>) => {
    setBooks(prev => prev.map(book => 
      book.id === id ? { ...book, ...updates } : book
    ));
  }, []);

  const deleteBook = useCallback((id: number) => {
    setBooks(prev => prev.filter(book => book.id !== id));
  }, []);

  // Filter and search books, then sort by priority
  const filteredBooks = useMemo(() => {
    let result = books;
    
    // Apply status filter
    if (filter !== 'All') {
      result = result.filter(book => getBookStatus(book) === filter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(book => 
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
      );
    }
    
    // Sort by priority (high first), then by most recently added
    return result.sort((a, b) => {
      const priorityA = priorityOrder[a.priority || 'none'];
      const priorityB = priorityOrder[b.priority || 'none'];
      if (priorityA !== priorityB) return priorityA - priorityB;
      return b.id - a.id; // Most recent first within same priority
    });
  }, [books, filter, searchQuery]);

  const stats = {
    totalBooks: books.length,
    completed: books.filter(book => getBookStatus(book) === 'Completed').length,
    pagesRead: books.reduce((sum, book) => sum + book.currentPage, 0),
    later: books.filter(book => getBookStatus(book) === 'Later').length,
  };

  return {
    books: filteredBooks,
    allBooks: books,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    addBook,
    updateBook,
    deleteBook,
    stats,
  };
}
