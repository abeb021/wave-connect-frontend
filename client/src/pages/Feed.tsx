import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createComment, createPublication, getCommentsByPublication, getFeed, updatePublication, deletePublication, type Comment } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Heart, MessageCircle, Trash2, Edit2 } from 'lucide-react';

/**
 * Modern Minimalist Design: Feed Page
 * - Card-based publication layout
 * - Asymmetric spacing with generous whitespace
 * - Teal accents for interactive elements
 */

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
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const [publications, setPublications] = useState<PublicationItem[]>([]);
  const [newPostText, setNewPostText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFeedLoading, setIsFeedLoading] = useState(true);

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
        const feed = await getFeed();
        setPublications(feed);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load feed');
      } finally {
        setIsFeedLoading(false);
      }
    };

    loadFeed();
  }, [isAuthLoading, isAuthenticated]);

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
      toast.success('Publication created!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create publication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPublication = (id: string, currentText: string) => {
    setPublications((prev) =>
      prev.map((pub) =>
        pub.id === id ? { ...pub, isEditing: true, editText: currentText } : pub
      )
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
      toast.success('Publication updated!');
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
      toast.success('Publication deleted!');
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
        publication.id === id ? { ...publication, isCommentsOpen: true, isCommentsLoading: true } : publication
      )
    );

    try {
      const comments = await getCommentsByPublication(id);
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
      toast.success('Comment added!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add comment');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Wave Connect</h1>
            <p className="text-sm text-muted-foreground">Welcome, {user?.username}</p>
          </div>
          <Button
            onClick={() => setLocation('/chat')}
            variant="outline"
            className="border-border hover:bg-secondary"
          >
            Chat
          </Button>
          <Button
            onClick={() => setLocation('/profile')}
            variant="outline"
            className="border-border hover:bg-secondary"
          >
            Profile
          </Button>
          <Button
            onClick={() => {
              logout();
              setLocation('/login');
            }}
            variant="outline"
            className="border-border hover:bg-secondary"
          >
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* New Publication Card */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Share Your Thoughts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full p-3 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                rows={3}
              />
              <Button
                onClick={handleCreatePublication}
                disabled={isLoading || !newPostText.trim()}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
              >
                {isLoading ? 'Publishing...' : 'Publish'}
              </Button>
            </CardContent>
          </Card>

          {/* Publications Feed */}
          <div className="space-y-4">
            {isFeedLoading ? (
              <Card className="shadow-sm">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Loading publications...</p>
                </CardContent>
              </Card>
            ) : publications.length === 0 ? (
              <Card className="shadow-sm">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No publications yet. Be the first to share!</p>
                </CardContent>
              </Card>
            ) : (
              publications.map((pub) => (
                <Card key={pub.id} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <button
                          onClick={() => setLocation(`/users/${pub.user_id}`)}
                          className="text-left"
                        >
                          <CardTitle className="text-base hover:text-accent">{pub.user_id}</CardTitle>
                        </button>
                        <CardDescription className="text-xs">
                          {new Date(pub.time_created).toLocaleString()}
                        </CardDescription>
                      </div>
                      {pub.user_id === user?.id && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditPublication(pub.id, pub.text)}
                            className="p-2 hover:bg-secondary rounded-md transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} className="text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleDeletePublication(pub.id)}
                            className="p-2 hover:bg-secondary rounded-md transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} className="text-destructive" />
                          </button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {pub.isEditing ? (
                      <div className="space-y-3">
                        <textarea
                          value={pub.editText || ''}
                          onChange={(e) =>
                            setPublications((prev) =>
                              prev.map((p) =>
                                p.id === pub.id ? { ...p, editText: e.target.value } : p
                              )
                            )
                          }
                          className="w-full p-3 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleSaveEdit(pub.id, pub.editText || '')}
                            className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                            size="sm"
                          >
                            Save
                          </Button>
                          <Button
                            onClick={() =>
                              setPublications((prev) =>
                                prev.map((p) =>
                                  p.id === pub.id ? { ...p, isEditing: false, editText: undefined } : p
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
                      <p className="whitespace-pre-wrap text-foreground leading-relaxed">{pub.text}</p>
                    )}

                    <div className="flex gap-4 pt-2 border-t border-border">
                      <button className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors">
                        <Heart size={16} />
                        <span className="text-sm">Like</span>
                      </button>
                      <button
                        onClick={() => handleToggleComments(pub.id)}
                        className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors"
                      >
                        <MessageCircle size={16} />
                        <span className="text-sm">Comments</span>
                      </button>
                    </div>

                    {pub.isCommentsOpen && (
                      <div className="space-y-4 rounded-lg bg-secondary/20 p-4">
                        <div className="space-y-2">
                          <textarea
                            value={pub.newCommentText || ''}
                            onChange={(e) =>
                              setPublications((prev) =>
                                prev.map((publication) =>
                                  publication.id === pub.id
                                    ? { ...publication, newCommentText: e.target.value }
                                    : publication
                                )
                              )
                            }
                            placeholder="Write a comment..."
                            className="w-full resize-none rounded-md border border-border bg-background p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                            rows={2}
                          />
                          <Button
                            onClick={() => handleCreateComment(pub.id, pub.newCommentText || '')}
                            className="bg-accent hover:bg-accent/90 text-accent-foreground"
                            size="sm"
                          >
                            Add Comment
                          </Button>
                        </div>

                        {pub.isCommentsLoading ? (
                          <p className="text-sm text-muted-foreground">Loading comments...</p>
                        ) : !pub.comments || pub.comments.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No comments yet.</p>
                        ) : (
                          <div className="space-y-3">
                            {pub.comments.map((comment) => (
                              <div key={comment.id} className="rounded-md bg-background p-3">
                                <div className="mb-2 flex items-center justify-between gap-3">
                                  <p className="text-sm font-medium text-foreground">{comment.user_id}</p>
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
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
