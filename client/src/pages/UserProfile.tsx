import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppHeader from '@/components/AppHeader';
import { getProfileAvatarBlob, getProfileById, getPublicationsByUser, type Profile as PublicProfile, type Publication } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { FileText, Mail, User } from 'lucide-react';

export default function UserProfile() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/users/:userId');
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isAuthLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated || !match || !params?.userId) {
      return;
    }

    const loadUserPage = async () => {
      setIsLoading(true);
      try {
        const userPublications = await getPublicationsByUser(params.userId);
        setPublications(userPublications);

        try {
          const profileData = await getProfileById(params.userId);
          setProfile(profileData);
          try {
            const avatarBlob = await getProfileAvatarBlob(params.userId);
            const nextUrl = URL.createObjectURL(avatarBlob);
            setAvatarUrl((prev) => {
              if (prev) {
                URL.revokeObjectURL(prev);
              }
              return nextUrl;
            });
          } catch {
            setAvatarUrl((prev) => {
              if (prev) {
                URL.revokeObjectURL(prev);
              }
              return null;
            });
          }
        } catch {
          setProfile(null);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load user');
        setLocation('/feed');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserPage();
  }, [isAuthLoading, isAuthenticated, match, params?.userId, setLocation]);

  useEffect(() => {
    return () => {
      if (avatarUrl) {
        URL.revokeObjectURL(avatarUrl);
      }
    };
  }, [avatarUrl]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading user...</p>
      </div>
    );
  }

  if (!isAuthenticated || !params?.userId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title={profile?.username || params.userId}
        subtitle="User profile and publications"
        actions={
          <Button onClick={() => setLocation('/feed')} variant="outline" className="border-border">
            Back to Feed
          </Button>
        }
      />

      <main className="container py-8 md:py-10">
        <div className="mx-auto max-w-3xl space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl">User Overview</CardTitle>
              <CardDescription>Information returned from profile and feed endpoints</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-secondary/30 p-4">
                <User size={20} className="text-accent" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">User ID</p>
                  <p className="text-lg font-semibold text-foreground">{params.userId}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-secondary/30 p-4">
                <Mail size={20} className="text-accent" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                  <p className="text-lg font-semibold text-foreground">
                    {user?.id === params.userId ? user.email : 'Only available for your own account'}
                  </p>
                </div>
              </div>
              {profile ? (
                <div className="rounded-lg bg-secondary/30 p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="User avatar" className="h-14 w-14 rounded-full object-cover" />
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center">
                        <User size={20} className="text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Public Profile Name</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">{profile.username}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Bio</p>
                    <p className="mt-1 whitespace-pre-wrap text-foreground">{profile.bio || 'No bio yet.'}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-secondary/30 p-4 text-muted-foreground">
                  This user has not created a public profile yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl">Publications</CardTitle>
              <CardDescription>Posts returned from `/api/feed/user/{'{'}userId{'}'}`</CardDescription>
            </CardHeader>
            <CardContent>
              {publications.length === 0 ? (
                <div className="rounded-lg bg-secondary/30 p-6 text-center text-muted-foreground">
                  No publications yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {publications.map((publication) => (
                    <div key={publication.id} className="rounded-lg bg-secondary/30 p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText size={16} className="text-accent" />
                        <span>{new Date(publication.time_created).toLocaleString()}</span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed text-foreground">{publication.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
