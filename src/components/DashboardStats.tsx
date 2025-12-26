import { BookOpen, CheckCircle2, FileText } from 'lucide-react';

interface DashboardStatsProps {
  totalBooks: number;
  completed: number;
  pagesRead: number;
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

export function DashboardStats({ totalBooks, completed, pagesRead }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
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
    </div>
  );
}
