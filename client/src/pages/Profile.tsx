import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createProfile, getProfileById, getPublicationsByUser, updateProfile } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { User, Mail, Calendar } from 'lucide-react';

/**
 * Modern Minimalist Design: Profile Page
 * - Clean profile card layout
 * - Organized information hierarchy
 */

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [publications, setPublications] = useState<any[]>([]);
  const [isPublicationsLoading, setIsPublicationsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isAuthLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) {
      return;
    }

    const loadProfile = async () => {
      try {
        if (user?.id) {
          const [profileData, userPublications] = await Promise.all([
            getProfileById(user.id),
            getPublicationsByUser(user.id),
          ]);
          setProfile(profileData);
          setEditUsername(profileData.username);
          setPublications(userPublications);
        }
      } catch (error) {
        // Profile might not exist yet
        setProfile(null);
        if (user?.id) {
          try {
            const userPublications = await getPublicationsByUser(user.id);
            setPublications(userPublications);
          } catch {
            setPublications([]);
          }
        }
      } finally {
        setIsLoading(false);
        setIsPublicationsLoading(false);
      }
    };

    loadProfile();
  }, [isAuthLoading, isAuthenticated, user?.id]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Restoring session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleCreateProfile = async () => {
    if (!editUsername.trim()) {
      toast.error('Username cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      const newProfile = await createProfile({ username: editUsername });
      setProfile(newProfile);
      setIsEditing(false);
      toast.success('Profile created!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editUsername.trim()) {
      toast.error('Username cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      if (user?.id) {
        await updateProfile(user.id, { username: editUsername });
        setProfile({ ...profile, username: editUsername });
        setIsEditing(false);
        toast.success('Profile updated!');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container py-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-primary">Profile</h1>
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
        <div className="max-w-2xl mx-auto">
          {/* Account Information Card */}
          <Card className="shadow-md mb-6">
            <CardHeader>
              <CardTitle className="text-2xl">Account Information</CardTitle>
              <CardDescription>Your Wave Connect account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg">
                  <User size={20} className="text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Username</p>
                    <p className="text-lg font-semibold text-foreground">{user?.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg">
                  <Mail size={20} className="text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Email</p>
                    <p className="text-lg font-semibold text-foreground">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg">
                  <Calendar size={20} className="text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Member Since</p>
                    <p className="text-lg font-semibold text-foreground">
                      {new Date(user?.created_at || '').toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Card */}
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-2xl">Profile Information</CardTitle>
                <CardDescription>
                  {profile ? 'Your public profile details' : 'Create your profile to get started'}
                </CardDescription>
              </div>
              {profile && !isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  Edit Profile
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="username" className="text-sm font-medium text-foreground">
                      Username
                    </label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="border-border focus:ring-accent"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={profile ? handleUpdateProfile : handleCreateProfile}
                      disabled={isSaving}
                      className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      {isSaving ? 'Saving...' : profile ? 'Update Profile' : 'Create Profile'}
                    </Button>
                    <Button
                      onClick={() => {
                        setIsEditing(false);
                        setEditUsername(profile?.username || '');
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : profile ? (
                <div className="space-y-4">
                  <div className="p-4 bg-secondary/30 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Display Name</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{profile.username}</p>
                  </div>

                  <div className="p-4 bg-secondary/30 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Profile Created</p>
                    <p className="text-lg text-foreground mt-1">
                      {new Date(profile.time_created).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">You haven't created a profile yet.</p>
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    Create Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-md mt-6">
            <CardHeader>
              <CardTitle className="text-2xl">Your Publications</CardTitle>
              <CardDescription>Posts returned from `/api/feed/user/{'{'}userId{'}'}`</CardDescription>
            </CardHeader>
            <CardContent>
              {isPublicationsLoading ? (
                <p className="text-muted-foreground">Loading publications...</p>
              ) : publications.length === 0 ? (
                <p className="text-muted-foreground">You have not published anything yet.</p>
              ) : (
                <div className="space-y-4">
                  {publications.map((publication) => (
                    <div key={publication.id} className="rounded-lg bg-secondary/30 p-4">
                      <p className="text-foreground leading-relaxed">{publication.text}</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {new Date(publication.time_created).toLocaleString()}
                      </p>
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
