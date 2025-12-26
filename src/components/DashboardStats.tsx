import { BookOpen, CheckCircle2, FileText, Flame } from 'lucide-react';

interface DashboardStatsProps {
  totalBooks: number;
  completed: number;
  pagesRead: number;
  streak?: number;
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

// Generate fire emojis based on streak count (max 7 for display)
function getStreakDisplay(streak: number): string {
  if (streak === 0) return '';
  const count = Math.min(streak, 7);
  return '🔥'.repeat(count) + (streak > 7 ? '+' : '');
}

export function DashboardStats({ totalBooks, completed, pagesRead, streak = 0 }: DashboardStatsProps) {
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
              <p className="font-display text-3xl font-bold text-foreground">{streak}</p>
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
