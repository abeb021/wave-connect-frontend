import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppHeader from '@/components/AppHeader';
import {
  createComment,
  createPublication,
  deletePublication,
  getCommentsByPublication,
  getFeed,
  getProfileById,
  updatePublication,
  type Comment,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Edit2, MessageCircle, Trash2 } from 'lucide-react';

interface PublicationItem {
  id: string;
  text: string;
  user_id: string;
  time_created: string;
  isEditing?: boolean;
  editText?: string;
  comments?: Comment[];
  isCommentsOpen?: boolean;
  isCommentsLoading?: boolean;
  newCommentText?: string;
}

export default function Feed() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [publications, setPublications] = useState<PublicationItem[]>([]);
  const [newPostText, setNewPostText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const [usernamesById, setUsernamesById] = useState<Record<string, string>>({});

  const resolveUsernames = async (userIds: string[]) => {
    const uniqueIds = Array.from(new Set(userIds.filter(Boolean))).filter((id) => !usernamesById[id]);

    if (uniqueIds.length === 0) {
      return;
    }

    const resolved = await Promise.all(
      uniqueIds.map(async (id) => {
        try {
          const profile = await getProfileById(id);
          return [id, profile.username || id] as const;
        } catch {
          return [id, id] as const;
        }
      })
    );

    setUsernamesById((prev) => ({ ...prev, ...Object.fromEntries(resolved) }));
  };

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isAuthLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) {
      return;
    }

    const loadFeed = async () => {
      setIsFeedLoading(true);
      try {
        if (user?.id) {
          await getProfileById(user.id);
        }

        const feed = await getFeed();
        setPublications(feed);
        await resolveUsernames(feed.map((publication) => publication.user_id));
      } catch (error) {
        if (error instanceof Error && error.message.includes('ID not found')) {
          setLocation('/profile?onboarding=1');
          return;
        }
        toast.error(error instanceof Error ? error.message : 'Failed to load feed');
      } finally {
        setIsFeedLoading(false);
      }
    };

    loadFeed();
  }, [isAuthLoading, isAuthenticated, user?.id, setLocation]);

  const welcomeText = useMemo(() => (user?.email ? `Welcome, ${user.email}` : undefined), [user?.email]);

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Restoring session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleCreatePublication = async () => {
    if (!newPostText.trim()) {
      toast.error('Publication cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      const publication = await createPublication({ text: newPostText });
      setPublications((prev) => [publication, ...prev]);
      setNewPostText('');
      await resolveUsernames([publication.user_id]);
      toast.success('Publication created');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create publication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPublication = (id: string, currentText: string) => {
    setPublications((prev) =>
      prev.map((pub) => (pub.id === id ? { ...pub, isEditing: true, editText: currentText } : pub))
    );
  };

  const handleSaveEdit = async (id: string, newText: string) => {
    if (!newText.trim()) {
      toast.error('Publication cannot be empty');
      return;
    }

    try {
      await updatePublication(id, { text: newText });
      setPublications((prev) =>
        prev.map((pub) =>
          pub.id === id ? { ...pub, text: newText, isEditing: false, editText: undefined } : pub
        )
      );
      toast.success('Publication updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update publication');
    }
  };

  const handleDeletePublication = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this publication?')) {
      return;
    }

    try {
      await deletePublication(id);
      setPublications((prev) => prev.filter((pub) => pub.id !== id));
      toast.success('Publication deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete publication');
    }
  };

  const handleToggleComments = async (id: string) => {
    const targetPublication = publications.find((publication) => publication.id === id);
    if (!targetPublication) {
      return;
    }

    if (targetPublication.isCommentsOpen) {
      setPublications((prev) =>
        prev.map((publication) =>
          publication.id === id ? { ...publication, isCommentsOpen: false } : publication
        )
      );
      return;
    }

    setPublications((prev) =>
      prev.map((publication) =>
        publication.id === id
          ? { ...publication, isCommentsOpen: true, isCommentsLoading: true }
          : publication
      )
    );

    try {
      const comments = await getCommentsByPublication(id);
      await resolveUsernames(comments.map((comment) => comment.user_id));
      setPublications((prev) =>
        prev.map((publication) =>
          publication.id === id ? { ...publication, comments, isCommentsLoading: false } : publication
        )
      );
    } catch (error) {
      setPublications((prev) =>
        prev.map((publication) =>
          publication.id === id ? { ...publication, isCommentsLoading: false } : publication
        )
      );
      toast.error(error instanceof Error ? error.message : 'Failed to load comments');
    }
  };

  const handleCreateComment = async (id: string, text: string) => {
    if (!text.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      const comment = await createComment(id, { text });
      await resolveUsernames([comment.user_id]);
      setPublications((prev) =>
        prev.map((publication) =>
          publication.id === id
            ? {
                ...publication,
                comments: [comment, ...(publication.comments || [])],
                newCommentText: '',
                isCommentsOpen: true,
              }
            : publication
        )
      );
      toast.success('Comment added');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add comment');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title="Wave Connect"
        subtitle={welcomeText}
        actions={
          <Button onClick={() => setLocation('/chat')} variant="outline" className="border-border">
            Chat
          </Button>
        }
      />

      <main className="container py-8 md:py-10">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Share Your Thoughts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full resize-none rounded-md border border-border bg-background p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                rows={3}
              />
              <Button
                onClick={handleCreatePublication}
                disabled={isLoading || !newPostText.trim()}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {isLoading ? 'Publishing...' : 'Publish'}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {isFeedLoading ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">Loading publications...</CardContent>
              </Card>
            ) : publications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No publications yet. Be first to share.
                </CardContent>
              </Card>
            ) : (
              publications.map((publication) => {
                const authorName = usernamesById[publication.user_id] || publication.user_id;
                return (
                  <Card key={publication.id} className="shadow-sm transition-shadow hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <button onClick={() => setLocation(`/users/${publication.user_id}`)} className="text-left">
                            <CardTitle className="text-base hover:text-accent">{authorName}</CardTitle>
                          </button>
                          <p className="text-xs text-muted-foreground">post id: {publication.id}</p>
                          <CardDescription className="text-xs">
                            {new Date(publication.time_created).toLocaleString()}
                          </CardDescription>
                        </div>

                        {publication.user_id === user?.id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditPublication(publication.id, publication.text)}
                              className="rounded-md p-2 transition-colors hover:bg-secondary"
                              title="Edit"
                            >
                              <Edit2 size={16} className="text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => handleDeletePublication(publication.id)}
                              className="rounded-md p-2 transition-colors hover:bg-secondary"
                              title="Delete"
                            >
                              <Trash2 size={16} className="text-destructive" />
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {publication.isEditing ? (
                        <div className="space-y-3">
                          <textarea
                            value={publication.editText || ''}
                            onChange={(e) =>
                              setPublications((prev) =>
                                prev.map((item) =>
                                  item.id === publication.id ? { ...item, editText: e.target.value } : item
                                )
                              )
                            }
                            className="w-full resize-none rounded-md border border-border bg-background p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleSaveEdit(publication.id, publication.editText || '')}
                              className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                              size="sm"
                            >
                              Save
                            </Button>
                            <Button
                              onClick={() =>
                                setPublications((prev) =>
                                  prev.map((item) =>
                                    item.id === publication.id
                                      ? { ...item, isEditing: false, editText: undefined }
                                      : item
                                  )
                                )
                              }
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed text-foreground">{publication.text}</p>
                      )}

                      <div className="border-t border-border pt-2">
                        <button
                          onClick={() => handleToggleComments(publication.id)}
                          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-accent"
                        >
                          <MessageCircle size={16} /> Comments
                        </button>
                      </div>

                      {publication.isCommentsOpen ? (
                        <div className="space-y-4 rounded-lg bg-secondary/20 p-4">
                          <div className="space-y-2">
                            <textarea
                              value={publication.newCommentText || ''}
                              onChange={(e) =>
                                setPublications((prev) =>
                                  prev.map((item) =>
                                    item.id === publication.id
                                      ? { ...item, newCommentText: e.target.value }
                                      : item
                                  )
                                )
                              }
                              placeholder="Write a comment..."
                              className="w-full resize-none rounded-md border border-border bg-background p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                              rows={2}
                            />
                            <Button
                              onClick={() => handleCreateComment(publication.id, publication.newCommentText || '')}
                              className="bg-accent text-accent-foreground hover:bg-accent/90"
                              size="sm"
                            >
                              Add Comment
                            </Button>
                          </div>

                          {publication.isCommentsLoading ? (
                            <p className="text-sm text-muted-foreground">Loading comments...</p>
                          ) : !publication.comments || publication.comments.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No comments yet.</p>
                          ) : (
                            <div className="space-y-3">
                              {publication.comments.map((comment) => (
                                <div key={comment.id} className="rounded-md bg-background p-3">
                                  <div className="mb-2 flex items-start justify-between gap-3">
                                    <div>
                                      <button
                                        onClick={() => setLocation(`/users/${comment.user_id}`)}
                                        className="text-left text-sm font-medium text-foreground hover:text-accent"
                                      >
                                        {usernamesById[comment.user_id] || comment.user_id}
                                      </button>
                                      <p className="text-[11px] text-muted-foreground">{comment.user_id}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(comment.time_created).toLocaleString()}
                                    </p>
                                  </div>
                                  <p className="whitespace-pre-wrap text-sm text-foreground">{comment.text}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
