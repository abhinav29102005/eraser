// src/services/boardService.js
import axiosInstance from '../api/axiosInstance';

export const createNewBoard = async (boardName) => {
  try {
    const response = await axiosInstance.post('/boards', { name: boardName });
    return response.data; // Axios wraps the response in a 'data' property
  } catch (error) {
    console.error('Failed to create board:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const getUserBoards = async () => {
  try {
    const response = await axiosInstance.get('/boards');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch boards:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const getBoardWithStrokes = async (boardId) => {
  try {
    const response = await axiosInstance.get(`/boards/${boardId}`);
    // Remember to parse strokes.points if they are JSON strings
    const board = response.data;
    if (board.strokes) {
      board.strokes = board.strokes.map(s => ({
        ...s,
        points: typeof s.points === 'string' ? JSON.parse(s.points) : s.points // Ensure parsing if it's a string
      }));
    }
    return board;
  } catch (error) {
    console.error('Failed to fetch board with strokes:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const saveStroke = async (boardId, strokeData) => {
  try {
    const response = await axiosInstance.post(`/boards/${boardId}/strokes`, strokeData);
    return response.data;
  } catch (error) {
    console.error('Failed to save stroke:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const updateBoardName = async (boardId, newName) => {
  try {
    const response = await axiosInstance.put(`/boards/${boardId}`, { name: newName });
    return response.data;
  } catch (error) {
    console.error('Failed to update board name:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const deleteBoard = async (boardId) => {
  try {
    await axiosInstance.delete(`/boards/${boardId}`);
    return { message: `Board ${boardId} deleted successfully` }; // Backend returns msg
  } catch (error) {
    console.error('Failed to delete board:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

// --- THIS IS THE MISSING FUNCTION YOU NEED TO ADD ---
export const replaceStrokes = async (boardId, strokesArray) => {
    try {
        const response = await axiosInstance.patch(`/boards/${boardId}/strokes`, strokesArray);
        return response.data;
    } catch (error) {
        console.error('Failed to replace strokes:', error.response?.data || error.message);
        throw error.response?.data || error;
    }
};