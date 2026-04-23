import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getProfileAvatarBlob } from '@/lib/api';
import { MessageCircle, Moon, Newspaper, Sun, UserRound } from 'lucide-react';

export default function UserMenu() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    let disposed = false;

    const loadAvatar = async () => {
      try {
        const avatarBlob = await getProfileAvatarBlob(user.id);
        if (disposed) {
          return;
        }
        const nextUrl = URL.createObjectURL(avatarBlob);
        setAvatarUrl((prev) => {
          if (prev) {
            URL.revokeObjectURL(prev);
          }
          return nextUrl;
        });
      } catch {
        if (disposed) {
          return;
        }
        setAvatarUrl((prev) => {
          if (prev) {
            URL.revokeObjectURL(prev);
          }
          return null;
        });
      }
    };

    loadAvatar();

    return () => {
      disposed = true;
    };
  }, [user?.id]);

  useEffect(() => {
    return () => {
      if (avatarUrl) {
        URL.revokeObjectURL(avatarUrl);
      }
    };
  }, [avatarUrl]);

  const initials = useMemo(() => {
    if (!user?.email) {
      return 'U';
    }
    return user.email.slice(0, 1).toUpperCase();
  }, [user?.email]);

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full border border-border/80 bg-card p-1 shadow-sm transition-colors hover:bg-secondary/60"
          aria-label="Open profile menu"
        >
          <Avatar className="size-9">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="Your avatar" /> : null}
            <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setLocation('/feed')}>
          <Newspaper size={16} /> Feed
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocation('/chat')}>
          <MessageCircle size={16} /> Chat
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocation('/profile')}>
          <UserRound size={16} /> Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => toggleTheme?.()}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            logout();
            setLocation('/login');
          }}
        >
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
