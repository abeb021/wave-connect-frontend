import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  createProfile,
  getProfileAvatarBlob,
  getProfileById,
  getPublicationsByUser,
  updateProfile,
  updateProfileAvatar,
  type Publication,
  type Profile as ProfileType,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Calendar, Mail, User } from 'lucide-react';

export default function Profile() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [isPublicationsLoading, setIsPublicationsLoading] = useState(true);

  const isOnboarding = useMemo(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return new URLSearchParams(window.location.search).get('onboarding') === '1';
  }, [location]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isAuthLoading, isAuthenticated, setLocation]);

  const loadAvatar = async (userId: string) => {
    try {
      const blob = await getProfileAvatarBlob(userId);
      const nextUrl = URL.createObjectURL(blob);
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
  };

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated || !user?.id) {
      return;
    }

    const loadProfile = async () => {
      try {
        const [profileData, userPublications] = await Promise.all([
          getProfileById(user.id),
          getPublicationsByUser(user.id),
        ]);
        setProfile(profileData);
        setEditUsername(profileData.username);
        setEditBio(profileData.bio || '');
        setPublications(userPublications);
        setIsEditing(false);
        await loadAvatar(user.id);
      } catch {
        setProfile(null);
        setIsEditing(true);
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

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  useEffect(() => {
    return () => {
      if (avatarUrl) {
        URL.revokeObjectURL(avatarUrl);
      }
    };
  }, [avatarUrl]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Restoring session...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    setAvatarFile(file);
    setAvatarPreviewUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return URL.createObjectURL(file);
    });
  };

  const persistAvatarIfNeeded = async () => {
    if (!avatarFile) {
      return;
    }
    await updateProfileAvatar(avatarFile);
    if (avatarPreviewUrl) {
      setAvatarUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        return avatarPreviewUrl;
      });
      setAvatarPreviewUrl(null);
    } else {
      await loadAvatar(user.id);
    }
    setAvatarFile(null);
  };

  const handleCreateOrUpdateProfile = async () => {
    if (!editUsername.trim()) {
      toast.error('Username is required');
      return;
    }

    setIsSaving(true);
    try {
      if (!profile) {
        const created = await createProfile({ username: editUsername.trim() });
        const payload = { username: editUsername.trim(), bio: editBio.trim() };
        await updateProfile(payload);
        setProfile({ ...created, bio: editBio.trim() });
      } else {
        await updateProfile({ username: editUsername.trim(), bio: editBio.trim() });
        setProfile({ ...profile, username: editUsername.trim(), bio: editBio.trim() });
      }

      await persistAvatarIfNeeded();
      setIsEditing(false);
      toast.success(profile ? 'Profile updated!' : 'Profile created!');
      if (isOnboarding) {
        setLocation('/feed');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save profile');
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

  const shownAvatar = avatarPreviewUrl || avatarUrl;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container py-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-primary">Profile</h1>
          {!isOnboarding && (
            <Button
              onClick={() => setLocation('/feed')}
              variant="outline"
              className="border-border hover:bg-secondary"
            >
              Back to Feed
            </Button>
          )}
        </div>
      </header>

      <main className="container py-8">
        <div className="max-w-2xl mx-auto">
          {isOnboarding && (
            <Card className="mb-6 border-accent/40 shadow-md">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Finish your account setup: choose a username and optionally add bio and avatar.
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-md mb-6">
            <CardHeader>
              <CardTitle className="text-2xl">Account Information</CardTitle>
              <CardDescription>Email is visible only to you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg">
                <Mail size={20} className="text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Email</p>
                  <p className="text-lg font-semibold text-foreground">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg">
                <Calendar size={20} className="text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Member Since</p>
                  <p className="text-lg font-semibold text-foreground">
                    {new Date(user.created_at || '').toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-2xl">Profile Data</CardTitle>
                <CardDescription>
                  {profile ? 'This is your public profile data' : 'Create your public profile'}
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
                      placeholder="Choose a username"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="border-border focus:ring-accent"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="bio" className="text-sm font-medium text-foreground">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      placeholder="Tell people about yourself"
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      rows={4}
                      className="w-full rounded-md border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="avatar" className="text-sm font-medium text-foreground">
                      Avatar
                    </label>
                    <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleCreateOrUpdateProfile}
                      disabled={isSaving}
                      className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      {isSaving ? 'Saving...' : profile ? 'Update Profile' : 'Create Profile'}
                    </Button>
                    {profile && (
                      <Button
                        onClick={() => {
                          setIsEditing(false);
                          setEditUsername(profile.username);
                          setEditBio(profile.bio || '');
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ) : profile ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 rounded-lg bg-secondary/30 p-4">
                    {shownAvatar ? (
                      <img src={shownAvatar} alt="Profile avatar" className="h-16 w-16 rounded-full object-cover" />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
                        <User size={24} className="text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Username</p>
                      <p className="text-2xl font-bold text-foreground">{profile.username}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-secondary/30 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Bio</p>
                    <p className="mt-1 text-foreground whitespace-pre-wrap">
                      {profile.bio || 'No bio yet.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">You have not created a profile yet.</p>
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
