import axios, { AxiosResponse } from 'axios';
import {
  User,
  Server,
  Message,
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  CreateServerRequest,
  JoinServerRequest,
  SendMessageRequest,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Token is sent via HTTP-only cookies, so no need to manually add headers
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Track if we're already refreshing to prevent infinite loops
let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Response interceptor for handling errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh if this is already a refresh request
      if (originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }
      
      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api.request(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post('/auth/refresh');
        processQueue(null, 'token');
        return api.request(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear any auth state and don't redirect - let the app handle it
        console.log('Token refresh failed, user needs to login again');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials: LoginRequest): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterRequest): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  logout: async (): Promise<ApiResponse> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getCurrentUser: async (): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  refreshToken: async (): Promise<ApiResponse> => {
    const response = await api.post('/auth/refresh');
    return response.data;
  },
};

// Server API
export const serverAPI = {
  getServers: async (): Promise<ApiResponse<{ servers: Server[] }>> => {
    const response = await api.get('/servers');
    return response.data;
  },

  getServerById: async (serverId: number): Promise<ApiResponse<{ server: Server }>> => {
    const response = await api.get(`/servers/${serverId}`);
    return response.data;
  },

  createServer: async (serverData: CreateServerRequest): Promise<ApiResponse<{ server: Server }>> => {
    const response = await api.post('/servers', serverData);
    return response.data;
  },

  joinServer: async (joinData: JoinServerRequest): Promise<ApiResponse<{ server: Server }>> => {
    const response = await api.post('/servers/join', joinData);
    return response.data;
  },

  updateServer: async (
    serverId: number,
    serverData: Partial<CreateServerRequest>
  ): Promise<ApiResponse<{ server: Server }>> => {
    const response = await api.put(`/servers/${serverId}`, serverData);
    return response.data;
  },

  deleteServer: async (serverId: number): Promise<ApiResponse> => {
    const response = await api.delete(`/servers/${serverId}`);
    return response.data;
  },

  leaveServer: async (serverId: number): Promise<ApiResponse> => {
    const response = await api.post(`/servers/${serverId}/leave`);
    return response.data;
  },

  getPublicServers: async (): Promise<ApiResponse<Server[]>> => {
    const response = await api.get('/servers/public');
    return response.data;
  },
};

// Message API
export const messageAPI = {
  getChannelMessages: async (
    channelId: number,
    page: number = 1,
    limit: number = 50
  ): Promise<ApiResponse<{ messages: Message[]; pagination: any }>> => {
    const response = await api.get(`/messages/channels/${channelId}`, {
      params: { page, limit },
    });
    return response.data;
  },

  sendMessage: async (
    channelId: number,
    messageData: SendMessageRequest
  ): Promise<ApiResponse<{ data: Message }>> => {
    const response = await api.post(`/messages/channels/${channelId}`, messageData);
    return response.data;
  },

  editMessage: async (
    messageId: number,
    content: string
  ): Promise<ApiResponse<{ data: Message }>> => {
    const response = await api.put(`/messages/${messageId}`, { content });
    return response.data;
  },

  deleteMessage: async (messageId: number): Promise<ApiResponse> => {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },
};

// Friends API
export const friendsAPI = {
  getFriends: async (): Promise<{ message: string; data: any[] }> => {
    const response = await api.get('/friends');
    return response.data;
  },

  getFriendRequests: async (): Promise<{ message: string; data: any[] }> => {
    const response = await api.get('/friends/requests');
    return response.data;
  },

  sendFriendRequest: async (username: string): Promise<{ message: string; data?: any }> => {
    const response = await api.post('/friends/request', { username });
    return response.data;
  },

  acceptFriendRequest: async (requestId: number): Promise<{ message: string }> => {
    const response = await api.post(`/friends/requests/${requestId}/accept`);
    return response.data;
  },

  declineFriendRequest: async (requestId: number): Promise<{ message: string }> => {
    const response = await api.post(`/friends/requests/${requestId}/decline`);
    return response.data;
  },

  removeFriend: async (friendId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/friends/${friendId}`);
    return response.data;
  },
};

// Health check API
export const healthAPI = {
  check: async (): Promise<ApiResponse<{ status: string; timestamp: string; uptime: number }>> => {
    const response = await api.get('/health');
    return response.data;
  },
};

// Error handler utility
export const handleApiError = (error: any): string => {
  if (error.response?.data?.errors) {
    return error.response.data.errors.map((err: any) => err.msg).join(', ');
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Generic API call wrapper with error handling
export const apiCall = async <T>(
  apiFunction: () => Promise<T>,
  errorMessage: string = 'API call failed'
): Promise<T> => {
  try {
    return await apiFunction();
  } catch (error) {
    const message = handleApiError(error);
    throw new Error(`${errorMessage}: ${message}`);
  }
};

export default api;
