import api from './api';

export const authAPI = {
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  logout: () =>
    api.post('/auth/logout'),

  getMe: () =>
    api.get('/auth/me'),

  refreshToken: () =>
    api.post('/auth/refresh'),
};

export const roomAPI = {
  create: (name: string) =>
    api.post('/rooms', { name }),

  getAll: () =>
    api.get('/rooms'),

  getById: (id: string) =>
    api.get(`/rooms/${id}`),

  update: (id: string, data: any) =>
    api.put(`/rooms/${id}`, data),

  delete: (id: string) =>
    api.delete(`/rooms/${id}`),

  addObject: (roomId: string, object: any) =>
    api.post(`/rooms/${roomId}/objects`, object),

  updateObject: (roomId: string, objectId: string, data: any) =>
    api.put(`/rooms/${roomId}/objects/${objectId}`, data),

  deleteObject: (roomId: string, objectId: string) =>
    api.delete(`/rooms/${roomId}/objects/${objectId}`),
};

export const aiAPI = {
  generateDiagram: (prompt: string) =>
    api.post('/ai/diagram', { prompt }),

  analyzeImage: (imageUrl: string) =>
    api.post('/ai/analyze', { imageUrl }),

  suggestEdits: (content: string) =>
    api.post('/ai/suggest', { content }),
};
