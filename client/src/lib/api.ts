/**
 * API client for Wave Connect Gateway.
 * Defaults to same-origin so the frontend server/dev server can proxy requests.
 */

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export interface UserRequest {
  username: string;
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

export interface Publication {
  id: string;
  text: string;
  user_id: string;
  time_created: string;
}

export interface CreatePublicationRequest {
  text: string;
}

export interface Comment {
  id: string;
  pub_id: string;
  text: string;
  user_id: string;
  time_created: string;
}

export interface CreateCommentRequest {
  text: string;
}

export interface Profile {
  username: string;
  id: string;
  time_created: string;
}

export interface CreateProfileRequest {
  username: string;
}

export interface Message {
  id: string;
  text: string;
  sender: string;
  receiver: string;
  timeSent: string;
}

export interface ChatSocketMessage {
  type: string;
  id?: string;
  timestamp?: string;
  error?: string;
  payload?: {
    receiver: string;
    text: string;
  };
}

export interface CreateMessageRequest {
  text: string;
  sender: string;
  receiver: string;
}

export interface UpdateTextRequest {
  text: string;
}

// Cookie management utilities
const setCookie = (name: string, value: string, days: number = 30): void => {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/`;
};

const getCookie = (name: string): string | null => {
  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length);
    }
  }
  return null;
};

const deleteCookie = (name: string): void => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
};

// Token management - uses cookies for persistence
export const getToken = (): string | null => {
  return getCookie('auth_token') || localStorage.getItem('auth_token');
};

export const setToken = (token: string): void => {
  setCookie('auth_token', token, 30); // 30 days
  setCookie('jwt', `Bearer ${token}`, 30); // Gateway WS auth compatibility
  localStorage.setItem('auth_token', token); // Fallback
};

export const clearToken = (): void => {
  deleteCookie('auth_token');
  deleteCookie('jwt');
  localStorage.removeItem('auth_token');
};

export const clearSession = (): void => {
  clearToken();
  deleteCookie('user_id');
  deleteCookie('username');
  deleteCookie('email');
  deleteCookie('created_at');
  localStorage.removeItem('user_id');
  localStorage.removeItem('username');
  localStorage.removeItem('email');
  localStorage.removeItem('created_at');
};

export const getCurrentUserId = (): string | null => {
  return getCookie('user_id') || localStorage.getItem('user_id');
};

export const setCurrentUserId = (userId: string): void => {
  setCookie('user_id', userId, 30); // 30 days
  localStorage.setItem('user_id', userId); // Fallback
};

export const getCurrentUsername = (): string | null => {
  return getCookie('username') || localStorage.getItem('username');
};

export const setCurrentUsername = (username: string): void => {
  setCookie('username', username, 30);
  localStorage.setItem('username', username);
};

export const getCurrentEmail = (): string | null => {
  return getCookie('email') || localStorage.getItem('email');
};

export const setCurrentEmail = (email: string): void => {
  setCookie('email', email, 30);
  localStorage.setItem('email', email);
};

export const getCurrentCreatedAt = (): string | null => {
  return getCookie('created_at') || localStorage.getItem('created_at');
};

export const setCurrentCreatedAt = (createdAt: string): void => {
  setCookie('created_at', createdAt, 30);
  localStorage.setItem('created_at', createdAt);
};

// Helper function to make authenticated requests
const makeRequest = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: unknown,
  requiresAuth = true
) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (requiresAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const options: RequestInit = {
    method,
    headers,
    credentials: 'include', // Include cookies in requests
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    // Handle authorization header for login
    if (method === 'POST' && endpoint === '/api/auth/login' && response.status === 202) {
      const authHeader = response.headers.get('Authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        setToken(token);
      }
    }

    if (!response.ok) {
      const errorText = await response.text();

      if (
        response.status === 401 ||
        errorText.toLowerCase().includes('invalid token') ||
        errorText.toLowerCase().includes('missing authorization token')
      ) {
        clearSession();
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
        throw new Error('Session expired. Please sign in again.');
      }

      throw new Error(errorText || `HTTP ${response.status}`);
    }

    // Some endpoints return no content
    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response.text();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Network error:', error);
      throw new Error(`Network error: Unable to reach ${API_BASE_URL}. Make sure the API server is running.`);
    }
    throw error;
  }
};

// Auth endpoints
export const registerUser = async (data: UserRequest): Promise<UserResponse> => {
  return makeRequest('/api/auth/register', 'POST', data, false);
};

export const loginUser = async (data: UserRequest): Promise<void> => {
  await makeRequest('/api/auth/login', 'POST', data, false);
};

export const getUserById = async (id: string): Promise<UserResponse> => {
  return makeRequest(`/api/auth/id/${id}`, 'GET');
};

export const getUserByUsername = async (username: string): Promise<UserResponse> => {
  return makeRequest(`/api/auth/username/${username}`, 'GET');
};

export const deleteUser = async (id: string): Promise<void> => {
  await makeRequest(`/api/auth/${id}`, 'DELETE');
};

// Feed endpoints
export const createPublication = async (data: CreatePublicationRequest): Promise<Publication> => {
  return makeRequest('/api/feed/', 'POST', data);
};

export const getFeed = async (): Promise<Publication[]> => {
  return makeRequest('/api/feed/', 'GET');
};

export const getPublicationsByUser = async (userId: string): Promise<Publication[]> => {
  return makeRequest(`/api/feed/user/${userId}`, 'GET');
};

export const getPublicationById = async (id: string): Promise<Publication> => {
  return makeRequest(`/api/feed/${id}`, 'GET');
};

export const updatePublication = async (id: string, data: UpdateTextRequest): Promise<void> => {
  await makeRequest(`/api/feed/${id}`, 'PUT', data);
};

export const deletePublication = async (id: string): Promise<void> => {
  await makeRequest(`/api/feed/${id}`, 'DELETE');
};

export const createComment = async (publicationId: string, data: CreateCommentRequest): Promise<Comment> => {
  return makeRequest(`/api/feed/${publicationId}/comment/`, 'POST', data);
};

export const getCommentsByPublication = async (publicationId: string): Promise<Comment[]> => {
  return makeRequest(`/api/feed/${publicationId}/comment/`, 'GET');
};

// Profile endpoints
export const createProfile = async (data: CreateProfileRequest): Promise<Profile> => {
  return makeRequest('/api/profile/', 'POST', data);
};

export const getProfileById = async (id: string): Promise<Profile> => {
  return makeRequest(`/api/profile/${id}`, 'GET');
};

export const updateProfile = async (id: string, data: CreateProfileRequest): Promise<void> => {
  await makeRequest(`/api/profile/${id}`, 'PUT', data);
};

export const deleteProfile = async (id: string): Promise<void> => {
  await makeRequest(`/api/profile/${id}`, 'DELETE');
};

// Chat endpoints
export const createMessage = async (data: CreateMessageRequest): Promise<Message> => {
  return makeRequest('/api/chat/', 'POST', data);
};

export const getConversation = async (): Promise<Message[]> => {
  return makeRequest('/api/chat/conversation', 'GET');
};

export const getConversationWithPeer = async (peerId: string): Promise<Message[]> => {
  return makeRequest(`/api/chat/conversation/${peerId}`, 'GET');
};

export const getMessageById = async (id: string): Promise<Message> => {
  return makeRequest(`/api/chat/${id}`, 'GET');
};

export const updateMessage = async (id: string, data: UpdateTextRequest): Promise<void> => {
  await makeRequest(`/api/chat/${id}`, 'PUT', data);
};

export const deleteMessage = async (id: string): Promise<void> => {
  await makeRequest(`/api/chat/${id}`, 'DELETE');
};

// WebSocket connection for chat
export const connectChatWebSocket = (
  onMessage: (data: ChatSocketMessage | string) => void,
  onError: (error: Event) => void
): WebSocket => {
  const wsBaseUrl = API_BASE_URL
    ? API_BASE_URL.replace(/^http/, 'ws')
    : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;
  const wsUrl = `${wsBaseUrl}/api/chat/ws`;
  
  const ws = new WebSocket(wsUrl);
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      onMessage(event.data);
    }
  };
  
  ws.onerror = onError;
  
  return ws;
};

export const sendChatSocketMessage = (socket: WebSocket, receiver: string, text: string): void => {
  socket.send(
    JSON.stringify({
      type: 'chat.send',
      payload: {
        receiver,
        text,
      },
    })
  );
};
