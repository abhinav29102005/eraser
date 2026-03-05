import { useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { useWhiteboardStore } from '@store/whiteboard';
import toast from 'react-hot-toast';
import type { CanvasElement } from '@app-types/index';

interface UseSocketEventsProps {
  socket: Socket | null;
  roomId: string;
  userId: string;
  userName?: string;
}

export function useSocketEvents({
  socket,
  roomId,
  userId,
  userName
}: UseSocketEventsProps) {
  const {
    setElements,
    addElement,
    removeElement,
    updateElement,
    clearElements
  } = useWhiteboardStore();

  const emitRef = useRef<{
    draw: (data: any) => void;
    cursorMove: (data: any) => void;
    deleteObject: (objectId: string) => void;
    clearRoom: () => void;
  } | null>(null);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      console.log('Socket connected');
      // Join room after connection
      socket.emit('join_room', { room_id: roomId, user_id: userId });
    };

    const handleRoomData = (data: { objects: CanvasElement[] }) => {
      console.log('Received room data:', data.objects.length, 'objects');
      setElements(data.objects || []);
    };

    const handleObjectDrawn = (data: CanvasElement) => {
      addElement(data);
    };

    const handleObjectDeleted = (data: { object_id: string }) => {
      removeElement(data.object_id);
    };

    const handleRoomCleared = () => {
      clearElements();
    };

    const handleCursorMoved = (data: { userId: string; x: number; y: number }) => {
      // Cursor tracking can be handled by a separate cursor store
      // For now, we just broadcast - components can subscribe to this
      window.dispatchEvent(new CustomEvent('cursor-moved', { detail: data }));
    };

    const handleUsersUpdate = (users: any[]) => {
      window.dispatchEvent(new CustomEvent('users-updated', { detail: users }));
    };

    const handleError = (error: { message?: string }) => {
      console.error('Socket error:', error);
      if (error.message) {
        toast.error(error.message);
      }
    };

    socket.on('connect', handleConnect);
    socket.on('room_data', handleRoomData);
    socket.on('object_drawn', handleObjectDrawn);
    socket.on('object_deleted', handleObjectDeleted);
    socket.on('room_cleared', handleRoomCleared);
    socket.on('cursor_moved', handleCursorMoved);
    socket.on('users_update', handleUsersUpdate);
    socket.on('error', handleError);

    // If already connected, join room
    if (socket.connected) {
      socket.emit('join_room', { room_id: roomId, user_id: userId });
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('room_data', handleRoomData);
      socket.off('object_drawn', handleObjectDrawn);
      socket.off('object_deleted', handleObjectDeleted);
      socket.off('room_cleared', handleRoomCleared);
      socket.off('cursor_moved', handleCursorMoved);
      socket.off('users_update', handleUsersUpdate);
      socket.off('error', handleError);
    };
  }, [socket, roomId, userId, setElements, addElement, removeElement, clearElements]);

  // Create emit functions
  useEffect(() => {
    if (!socket) return;

    emitRef.current = {
      draw: (data) => {
        socket.emit('draw', { ...data, room_id: roomId, userId });
      },
      cursorMove: (data) => {
        socket.emit('cursor_move', { ...data, room_id: roomId, userId });
      },
      deleteObject: (objectId) => {
        socket.emit('delete_object', { room_id: roomId, object_id: objectId });
      },
      clearRoom: () => {
        socket.emit('clear_room', { room_id: roomId });
      }
    };
  }, [socket, roomId, userId]);

  return emitRef.current;
}
