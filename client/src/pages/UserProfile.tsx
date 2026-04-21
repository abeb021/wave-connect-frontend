import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getProfileById, getPublicationsByUser, getUserById, type Profile as PublicProfile, type Publication, type UserResponse } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Calendar, FileText, User } from 'lucide-react';

export default function UserProfile() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/users/:userId');
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [account, setAccount] = useState<UserResponse | null>(null);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
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
        const [userData, userPublications] = await Promise.all([
          getUserById(params.userId),
          getPublicationsByUser(params.userId),
        ]);

        setAccount(userData);
        setPublications(userPublications);

        try {
          const profileData = await getProfileById(params.userId);
          setProfile(profileData);
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

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading user...</p>
      </div>
    );
  }

  if (!isAuthenticated || !account) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">{profile?.username || account.username}</h1>
            <p className="text-sm text-muted-foreground">User profile and publications</p>
          </div>
          <Button
            onClick={() => setLocation('/feed')}
            variant="outline"
            className="border-border hover:bg-secondary"
          >
            Back to Feed
          </Button>
        </div>
      </header>

      <main className="container py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl">User Overview</CardTitle>
              <CardDescription>Information returned from auth and profile endpoints</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-secondary/30 p-4">
                <User size={20} className="text-accent" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Username</p>
                  <p className="text-lg font-semibold text-foreground">{account.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-secondary/30 p-4">
                <Calendar size={20} className="text-accent" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Member Since</p>
                  <p className="text-lg font-semibold text-foreground">
                    {new Date(account.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {profile ? (
                <div className="rounded-lg bg-secondary/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Public Profile Name</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{profile.username}</p>
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
