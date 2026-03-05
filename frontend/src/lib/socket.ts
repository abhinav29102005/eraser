import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const getSocketUrl = () => {
  const url = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_SOCKET_URL is not defined');
  }
  return url;
};

const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const connectSocket = (userId: string) => {
  if (socket?.connected) return socket;

  const token = getAuthToken();

  socket = io(getSocketUrl(), {
    auth: {
      token: token, // JWT token for authentication
      userId,
    },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('Connected to socket server');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from socket server');
  });

  socket.on('error', (error: { message?: string }) => {
    console.error('Socket error:', error);
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
