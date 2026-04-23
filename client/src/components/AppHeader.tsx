import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import UserMenu from './UserMenu';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export default function AppHeader({ title, subtitle, actions, className }: AppHeaderProps) {
  return (
    <header className={cn('border-b border-border bg-card/90 backdrop-blur-sm', className)}>
      <div className="container flex items-center justify-between gap-3 py-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold text-primary md:text-3xl">{title}</h1>
          {subtitle ? <p className="truncate text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
