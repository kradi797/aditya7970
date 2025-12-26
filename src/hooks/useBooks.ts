import { useState, useEffect, useCallback } from 'react';
import { Book, FilterType, getBookStatus } from '@/types/book';

const STORAGE_KEY = 'book-tracker-library';

function loadBooks(): Book[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const books = stored ? JSON.parse(stored) : [];
    // Migrate old books to include pageReflections
    return books.map((book: Book) => ({
      ...book,
      pageReflections: book.pageReflections || [],
    }));
  } catch {
    return [];
  }
}

function saveBooks(books: Book[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

export function useBooks() {
  const [books, setBooks] = useState<Book[]>(() => loadBooks());
  const [filter, setFilter] = useState<FilterType>('All');

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

  const filteredBooks = books.filter(book => {
    if (filter === 'All') return true;
    return getBookStatus(book) === filter;
  });

  const stats = {
    totalBooks: books.length,
    completed: books.filter(book => getBookStatus(book) === 'Completed').length,
    pagesRead: books.reduce((sum, book) => sum + book.currentPage, 0),
  };

  return {
    books: filteredBooks,
    allBooks: books,
    filter,
    setFilter,
    addBook,
    updateBook,
    deleteBook,
    stats,
  };
}
