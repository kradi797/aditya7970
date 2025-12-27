import { Library } from 'lucide-react';
import { useEffect } from 'react';
import { useBooks } from '@/hooks/useBooks';
import { useReadingStreak } from '@/hooks/useReadingStreak';
import { DashboardStats } from '@/components/DashboardStats';
import { FilterTabs } from '@/components/FilterTabs';
import { BookCard } from '@/components/BookCard';
import { AddBookForm } from '@/components/AddBookForm';
import { EmptyState } from '@/components/EmptyState';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SearchBar } from '@/components/SearchBar';
import { getBookStatus } from '@/types/book';

const Index = () => {
  const { 
    books, 
    allBooks,
    filter, 
    setFilter, 
    searchQuery,
    setSearchQuery,
    addBook, 
    updateBook, 
    deleteBook, 
    stats 
  } = useBooks();

  const { streak, markTodayAsRead } = useReadingStreak();

  // Mark as read when user updates any book (reading activity)
  const handleUpdateBook = (id: number, updates: Parameters<typeof updateBook>[1]) => {
    updateBook(id, updates);
    markTodayAsRead();
  };

  // Also mark when adding a book
  const handleAddBook = (bookData: Parameters<typeof addBook>[0]) => {
    addBook(bookData);
    markTodayAsRead();
  };

  const counts = {
    all: allBooks.length,
    reading: allBooks.filter(b => getBookStatus(b) === 'Reading').length,
    completed: allBooks.filter(b => getBookStatus(b) === 'Completed').length,
    later: allBooks.filter(b => getBookStatus(b) === 'Later').length,
  };

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Library className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">
                Book Tracker
              </h1>
              <p className="hidden text-sm text-muted-foreground sm:block">
                Track your reading journey
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <AddBookForm onAdd={handleAddBook} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:px-6">
        {/* Dashboard Stats */}
        <section className="mb-8 animate-slide-up">
          <DashboardStats 
            totalBooks={stats.totalBooks}
            completed={stats.completed}
            pagesRead={stats.pagesRead}
            streak={streak}
          />
        </section>

        {/* Filter Tabs + Search Bar */}
        <section className="mb-8 animate-slide-up flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" style={{ animationDelay: '50ms' }}>
          <FilterTabs 
            filter={filter} 
            onFilterChange={setFilter}
            counts={counts}
          />
          <SearchBar 
            value={searchQuery}
            onChange={setSearchQuery}
            className="w-full sm:w-auto sm:min-w-[280px]"
          />
        </section>

        {/* Books Grid */}
        <section>
          {books.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {books.map((book, index) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onUpdate={handleUpdateBook}
                  onDelete={deleteBook}
                  index={index}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 py-6 mt-12">
        <div className="container mx-auto px-4 text-center sm:px-6">
          <p className="text-sm text-muted-foreground">
            Built with ❤️ for book lovers everywhere
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
