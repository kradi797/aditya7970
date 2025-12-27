import { BookOpen, CheckCircle2, FileText, Flame } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

interface DashboardStatsProps {
  totalBooks: number;
  completed: number;
  pagesRead: number;
  streak?: number;
  onStreakChange?: (value: number) => void;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  delay: string;
}

function StatCard({ icon, label, value, delay }: StatCardProps) {
  return (
    <div 
      className="group relative overflow-hidden rounded-xl bg-card p-6 shadow-card transition-all duration-300 hover:shadow-hover hover:-translate-y-1"
      style={{ animationDelay: delay }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="font-display text-3xl font-bold text-foreground">{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

// Show single fire emoji for any streak
function getStreakDisplay(streak: number): string {
  return streak > 0 ? '🔥' : '';
}

export function DashboardStats({ totalBooks, completed, pagesRead, streak = 0, onStreakChange }: DashboardStatsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(streak.toString());

  const handleStreakClick = () => {
    setEditValue(streak.toString());
    setIsEditing(true);
  };

  const handleStreakBlur = () => {
    const newValue = parseInt(editValue, 10);
    if (!isNaN(newValue) && newValue >= 0 && onStreakChange) {
      onStreakChange(newValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleStreakBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={<BookOpen className="h-6 w-6" />}
        label="Total Books"
        value={totalBooks}
        delay="0ms"
      />
      <StatCard
        icon={<CheckCircle2 className="h-6 w-6" />}
        label="Completed"
        value={completed}
        delay="100ms"
      />
      <StatCard
        icon={<FileText className="h-6 w-6" />}
        label="Pages Read"
        value={pagesRead}
        delay="200ms"
      />
      {/* Reading Streak Card */}
      <div 
        className="group relative overflow-hidden rounded-xl bg-card p-6 shadow-card transition-all duration-300 hover:shadow-hover hover:-translate-y-1"
        style={{ animationDelay: '300ms' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Reading Streak</p>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <Input
                  type="number"
                  min="0"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleStreakBlur}
                  onKeyDown={handleKeyDown}
                  className="w-20 h-10 font-display text-2xl font-bold"
                  autoFocus
                />
              ) : (
                <p 
                  className="font-display text-3xl font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
                  onClick={handleStreakClick}
                  title="Click to edit"
                >
                  {streak}
                </p>
              )}
              <span className="text-lg" title={`${streak} day${streak !== 1 ? 's' : ''} streak`}>
                {getStreakDisplay(streak)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {streak === 0 ? 'Start reading today!' : `day${streak !== 1 ? 's' : ''} in a row`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}