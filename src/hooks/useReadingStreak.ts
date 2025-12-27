import { useState, useEffect, useCallback } from 'react';

const READING_DATES_KEY = 'book-tracker-reading-dates';
const MANUAL_STREAK_KEY = 'book-tracker-manual-streak';

// Get today's date as string YYYY-MM-DD
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function useReadingStreak() {
  const [manualStreak, setManualStreak] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem(MANUAL_STREAK_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [readingDates, setReadingDates] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(READING_DATES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Save manual streak to localStorage
  useEffect(() => {
    if (manualStreak !== null) {
      localStorage.setItem(MANUAL_STREAK_KEY, JSON.stringify(manualStreak));
    }
  }, [manualStreak]);

  // Save reading dates to localStorage
  useEffect(() => {
    localStorage.setItem(READING_DATES_KEY, JSON.stringify(readingDates));
  }, [readingDates]);

  // Mark today as read
  const markTodayAsRead = useCallback(() => {
    const today = getTodayString();
    setReadingDates(prev => {
      if (prev.includes(today)) {
        return prev;
      }
      return [...prev, today];
    });
  }, []);

  // Set streak manually
  const setStreak = useCallback((value: number) => {
    setManualStreak(Math.max(0, value));
  }, []);

  // Check if user has read today
  const hasReadToday = readingDates.includes(getTodayString());

  // Use manual streak value (default to 0 if never set)
  const streak = manualStreak ?? 0;

  return {
    streak,
    readingDates,
    markTodayAsRead,
    hasReadToday,
    setStreak,
  };
}
