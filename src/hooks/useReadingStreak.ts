import { useState, useEffect, useCallback } from 'react';

const READING_DATES_KEY = 'book-tracker-reading-dates';

// Get today's date as string YYYY-MM-DD
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

// Calculate streak from an array of date strings
function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  
  const sortedDates = [...dates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const today = getTodayString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toISOString().split('T')[0];
  
  // Check if most recent date is today or yesterday
  const mostRecent = sortedDates[0];
  if (mostRecent !== today && mostRecent !== yesterdayString) {
    return 0; // Streak broken
  }
  
  let streak = 0;
  let currentDate = new Date(mostRecent);
  
  for (const dateStr of sortedDates) {
    const expectedDate = currentDate.toISOString().split('T')[0];
    
    if (dateStr === expectedDate) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (dateStr < expectedDate) {
      // Skip duplicate dates, but if we miss a day, stop
      const dateToCheck = new Date(dateStr);
      const dayDiff = Math.floor((currentDate.getTime() - dateToCheck.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDiff > 1) {
        break; // Gap in dates, streak broken
      }
      currentDate = dateToCheck;
      currentDate.setDate(currentDate.getDate() - 1);
    }
  }
  
  return streak;
}

export function useReadingStreak() {
  const [readingDates, setReadingDates] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(READING_DATES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [streak, setStreak] = useState<number>(0);

  // Save to localStorage when dates change
  useEffect(() => {
    localStorage.setItem(READING_DATES_KEY, JSON.stringify(readingDates));
    setStreak(calculateStreak(readingDates));
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

  // Check if user has read today
  const hasReadToday = readingDates.includes(getTodayString());

  return {
    streak,
    readingDates,
    markTodayAsRead,
    hasReadToday,
  };
}
