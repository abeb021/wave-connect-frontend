import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  connectChatWebSocket,
  deleteMessage,
  getConversation,
  getUserById,
  getConversationWithPeer,
  getUserByUsername,
  Message,
  sendChatSocketMessage,
  updateMessage,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Send, Trash2, Edit2 } from 'lucide-react';

/**
 * Modern Minimalist Design: Chat Page
 * - Message-based layout with clear sender/receiver distinction
 * - Conversation-style interface
 */

interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  receiver: string;
  timeSent: string;
  isEditing?: boolean;
  editText?: string;
}

interface ChatListItem {
  peerId: string;
  peerLabel: string;
  lastMessage: string;
  lastMessageTime: string;
}

const NOTEBOOK_LABEL = 'Notebook';

export default function Chat() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [selectedUserInput, setSelectedUserInput] = useState('');
  const [selectedUsername, setSelectedUsername] = useState('');
  const [peerId, setPeerId] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isResolvingPeer, setIsResolvingPeer] = useState(false);
  const [isConversationLoading, setIsConversationLoading] = useState(false);
  const [isAllMessagesLoading, setIsAllMessagesLoading] = useState(false);
  const [userLabels, setUserLabels] = useState<Record<string, string>>({});
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const refreshChatList = async () => {
    try {
      const conversation = await getConversation();
      setAllMessages(conversation);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to refresh chats');
    }
  };

  const refreshSelectedConversation = async (nextPeerId: string) => {
    try {
      const conversation = await getConversationWithPeer(nextPeerId);
      setMessages(conversation);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to refresh conversation');
    }
  };

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isAuthLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const resolvePeerLabels = async () => {
      if (!user?.id || allMessages.length === 0) {
        return;
      }

      const peerIds = Array.from(
        new Set(
          allMessages
            .map((message) => (message.sender === user.id ? message.receiver : message.sender))
            .filter((id) => id && id !== user.id && !userLabels[id])
        )
      );

      if (peerIds.length === 0) {
        return;
      }

      const resolvedEntries = await Promise.all(
        peerIds.map(async (id) => {
          try {
            const peer = await getUserById(id);
            return [id, peer.username] as const;
          } catch {
            return [id, id] as const;
          }
        })
      );

      setUserLabels((prev) => Object.fromEntries([...Object.entries(prev), ...resolvedEntries]));
    };

    resolvePeerLabels();
  }, [allMessages, user?.id, userLabels]);

  useEffect(() => {
    const loadAllMessages = async () => {
      if (!isAuthenticated || selectedUsername) {
        return;
      }

      setIsAllMessagesLoading(true);
      try {
        const conversation = await getConversation();
        setAllMessages(conversation);
      } catch (error) {
        setAllMessages([]);
        toast.error(error instanceof Error ? error.message : 'Failed to load messages');
      } finally {
        setIsAllMessagesLoading(false);
      }
    };

    loadAllMessages();
  }, [isAuthenticated, selectedUsername]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const socket = connectChatWebSocket(
      (incoming) => {
        if (typeof incoming === 'string') {
          return;
        }

        if (incoming.type === 'chat.error' && incoming.error) {
          toast.error(incoming.error);
          return;
        }

        if (incoming.type !== 'chat.message' || !incoming.payload || !incoming.id || !incoming.timestamp) {
          return;
        }

        if (incoming.payload.receiver === user?.id) {
          void refreshChatList();
          if (peerId) {
            void refreshSelectedConversation(peerId);
          }
          return;
        }

        const liveMessage: Message = {
          id: incoming.id,
          text: incoming.payload.text,
          sender: user?.id || '',
          receiver: incoming.payload.receiver,
          timeSent: incoming.timestamp,
        };

        setAllMessages((prev) => {
          if (prev.some((message) => message.id === liveMessage.id)) {
            return prev;
          }
          return [...prev, liveMessage];
        });

        setMessages((prev) => {
          if (prev.some((message) => message.id === liveMessage.id)) {
            return prev;
          }
          return [...prev, liveMessage];
        });
      },
      () => {
        toast.error('WebSocket connection failed');
      }
    );

    socketRef.current = socket;

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [isAuthenticated, peerId, user?.id]);

  useEffect(() => {
    const loadConversation = async () => {
      if (!isAuthenticated || !selectedUsername || !peerId) {
        setMessages([]);
        return;
      }

      setIsConversationLoading(true);
      try {
      const conversation = await getConversationWithPeer(peerId);
        setMessages(conversation);
      } catch (error) {
        setMessages([]);
        toast.error(error instanceof Error ? error.message : 'Failed to load conversation');
      } finally {
        setIsConversationLoading(false);
      }
    };

    loadConversation();
  }, [isAuthenticated, selectedUsername, peerId]);

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

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      toast.error('Message cannot be empty');
      return;
    }

    if (!selectedUsername || !peerId) {
      toast.error('Please enter a recipient');
      return;
    }

    try {
      if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
        throw new Error('Chat socket is not connected');
      }

      sendChatSocketMessage(socketRef.current, peerId, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    }
  };

  const handleOpenConversation = async () => {
    if (!selectedUserInput.trim()) {
      toast.error('Enter a username');
      return;
    }

    setIsResolvingPeer(true);
    try {
      const peer = await getUserByUsername(selectedUserInput.trim());
      setUserLabels((prev) => ({ ...prev, [peer.id]: peer.username }));
      setPeerId(peer.id);
      setSelectedUsername(peer.username);
    } catch (error) {
      setPeerId('');
      setSelectedUsername('');
      setMessages([]);
      toast.error(error instanceof Error ? error.message : 'Failed to find user');
    } finally {
      setIsResolvingPeer(false);
    }
  };

  const handleSelectChat = (nextPeerId: string) => {
    setPeerId(nextPeerId);
    const nextLabel = nextPeerId === user?.id ? NOTEBOOK_LABEL : userLabels[nextPeerId] || nextPeerId;
    setSelectedUsername(nextLabel);
    setSelectedUserInput(nextLabel === NOTEBOOK_LABEL ? '' : nextLabel);
  };

  const handleLeaveChat = () => {
    setPeerId('');
    setSelectedUsername('');
    setSelectedUserInput('');
    setMessages([]);
  };

  const chatList: ChatListItem[] = (() => {
    if (!user?.id) {
      return [];
    }

    const latestByPeer = new Map<string, ChatMessage>();

    for (const message of allMessages) {
      const otherUserId = message.sender === user.id ? message.receiver : message.sender;
      if (!otherUserId || otherUserId === user.id) {
        continue;
      }

      const existing = latestByPeer.get(otherUserId);
      if (!existing || new Date(message.timeSent).getTime() > new Date(existing.timeSent).getTime()) {
        latestByPeer.set(otherUserId, message);
      }
    }

    return Array.from(latestByPeer.entries())
      .map(([otherUserId, message]) => ({
        peerId: otherUserId,
        peerLabel: otherUserId === user.id ? NOTEBOOK_LABEL : userLabels[otherUserId] || otherUserId,
        lastMessage: message.text,
        lastMessageTime: message.timeSent,
      }))
      .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
  })();

  const chatListWithNotebook = (() => {
    if (!user?.id) {
      return chatList;
    }

    const notebookConversation = chatList.find((chat) => chat.peerId === user.id);
    if (notebookConversation) {
      return chatList;
    }

    return [
      {
        peerId: user.id,
        peerLabel: NOTEBOOK_LABEL,
        lastMessage: 'Private notes with yourself',
        lastMessageTime: new Date(0).toISOString(),
      },
      ...chatList,
    ];
  })();

  const handleEditMessage = (id: string, currentText: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, isEditing: true, editText: currentText } : msg
      )
    );
  };

  const handleSaveEdit = async (id: string, newText: string) => {
    if (!newText.trim()) {
      toast.error('Message cannot be empty');
      return;
    }

    try {
      await updateMessage(id, { text: newText });
      setAllMessages((prev) =>
        prev.map((msg) =>
          msg.id === id ? { ...msg, text: newText, isEditing: false, editText: undefined } : msg
        )
      );
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === id ? { ...msg, text: newText, isEditing: false, editText: undefined } : msg
        )
      );
      toast.success('Message updated!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update message');
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      await deleteMessage(id);
      setAllMessages((prev) => prev.filter((msg) => msg.id !== id));
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
      toast.success('Message deleted!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete message');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container py-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-primary">Messages</h1>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setLocation('/profile')}
              variant="outline"
              className="border-border hover:bg-secondary"
            >
              Profile
            </Button>
            <Button
              onClick={() => setLocation('/feed')}
              variant="outline"
              className="border-border hover:bg-secondary"
            >
              Back to Feed
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 gap-6 lg:grid-cols-5 lg:items-start">
          {/* Sidebar - Conversations */}
          <Card className="shadow-md lg:col-span-2 lg:h-[calc(100vh-10rem)]">
            <CardHeader>
              <CardTitle className="text-lg">Conversations</CardTitle>
              <CardDescription>Find a user or continue an existing chat</CardDescription>
            </CardHeader>
            <CardContent className="flex h-full min-h-0 flex-col space-y-2">
              <div className="space-y-2 border-b border-border pb-4">
                <Input
                  type="text"
                  placeholder="Find user by username..."
                  value={selectedUserInput}
                  onChange={(e) => setSelectedUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleOpenConversation();
                    }
                  }}
                  className="border-border focus:ring-accent"
                />
                <Button
                  onClick={handleOpenConversation}
                  disabled={isResolvingPeer || !selectedUserInput.trim()}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  {isResolvingPeer ? 'Opening...' : 'Open Chat'}
                </Button>
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {isAllMessagesLoading ? (
                  <p className="text-sm text-muted-foreground">Loading chats...</p>
                ) : chatListWithNotebook.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-center">
                    <p className="text-sm text-muted-foreground">No conversations yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {chatListWithNotebook.map((chat) => (
                      <button
                        key={chat.peerId}
                        onClick={() => handleSelectChat(chat.peerId)}
                        className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                          peerId === chat.peerId
                            ? 'border-accent bg-accent/10'
                            : 'border-border bg-secondary/20 hover:bg-secondary/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-semibold text-foreground">{chat.peerLabel}</p>
                          <p className="shrink-0 text-xs text-muted-foreground">
                            {chat.lastMessageTime === new Date(0).toISOString()
                              ? ''
                              : new Date(chat.lastMessageTime).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                          </p>
                        </div>
                        <p className="truncate text-sm text-muted-foreground">{chat.lastMessage}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="shadow-md flex h-[calc(100vh-10rem)] min-h-0 flex-col lg:col-span-3">
            <CardHeader className="border-b border-border bg-card/95">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">
                    {selectedUsername ? selectedUsername : 'Messages'}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {selectedUsername ? 'Conversation' : 'Select a conversation from the left'}
                  </CardDescription>
                </div>
                {selectedUsername && (
                  <Button onClick={handleLeaveChat} variant="outline" size="sm" className="border-border">
                    Leave Chat
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
              {selectedUsername && isConversationLoading ? (
                <div className="flex items-center justify-center h-full text-center">
                  <p className="text-muted-foreground">Loading conversation...</p>
                </div>
              ) : !selectedUsername ? (
                <div className="flex items-center justify-center h-full text-center">
                  <p className="text-muted-foreground">
                    Select a chat from the list or open a new one by username.
                  </p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        msg.sender === user?.id
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-secondary text-foreground'
                      }`}
                    >
                      {msg.isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={msg.editText || ''}
                            onChange={(e) =>
                              setMessages((prev) =>
                                prev.map((m) =>
                                  m.id === msg.id ? { ...m, editText: e.target.value } : m
                                )
                              )
                            }
                            className="w-full p-2 border border-border rounded bg-background text-foreground text-sm resize-none"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleSaveEdit(msg.id, msg.editText || '')}
                              size="sm"
                              className="flex-1 text-xs"
                            >
                              Save
                            </Button>
                            <Button
                              onClick={() =>
                                setMessages((prev) =>
                                  prev.map((m) =>
                                    m.id === msg.id
                                      ? { ...m, isEditing: false, editText: undefined }
                                      : m
                                  )
                                )
                              }
                              variant="outline"
                              size="sm"
                              className="flex-1 text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.timeSent).toLocaleTimeString()}
                          </p>
                          {msg.sender === user?.id && (
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleEditMessage(msg.id, msg.text)}
                                className="p-1 hover:opacity-75 transition-opacity"
                                title="Edit"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="p-1 hover:opacity-75 transition-opacity"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            {/* Message Input */}
            <div className="border-t border-border p-4 space-y-3">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={!selectedUsername}
                  className="border-border focus:ring-accent"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!selectedUsername || !peerId || !newMessage.trim()}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground px-4"
                >
                  <Send size={18} />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
