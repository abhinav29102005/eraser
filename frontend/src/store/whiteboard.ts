import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CanvasElement, Tool, WhiteboardState } from '@app-types/index';

interface HistoryEntry {
  elements: CanvasElement[];
  timestamp: number;
}

interface WhiteboardStore extends WhiteboardState {
  /* tool */
  setSelectedTool: (tool: Tool) => void;
  setSelectedColor: (color: string) => void;
  setStrokeWidth: (w: number) => void;

  /* elements */
  addElement: (el: CanvasElement) => void;
  removeElement: (id: string) => void;
  updateElement: (id: string, patch: Partial<CanvasElement>) => void;
  setElements: (els: CanvasElement[]) => void;
  clearElements: () => void;

  /* viewport */
  setZoom: (z: number) => void;
  setPan: (x: number, y: number) => void;

  /* selection */
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;

  /* history - undo/redo (internal state) */
  _history: HistoryEntry[];
  _future: HistoryEntry[];
  _pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useWhiteboardStore = create<WhiteboardStore>()(
  persist(
    (set, get) => ({
      elements: [],
      selectedTool: 'pen',
      selectedColor: '#ffffff',
      strokeWidth: 2,
      zoom: 1,
      panX: 0,
      panY: 0,
      selectedIds: [],

      // Internal history state
      _history: [],
      _future: [],

      _pushHistory: () => {
        const state = get();
        const newHistory = [
          ...state._history,
          { elements: [...state.elements], timestamp: Date.now() }
        ].slice(-50); // Keep last 50 states
        set({ _history: newHistory, _future: [] });
      },

      setSelectedTool: (tool) => set({ selectedTool: tool }),
      setSelectedColor: (color) => set({ selectedColor: color }),
      setStrokeWidth: (w) => set({ strokeWidth: w }),

      addElement: (el) => {
        const state = get();
        state._pushHistory();
        set({ elements: [...state.elements, el] });
      },

      removeElement: (id) => {
        const state = get();
        state._pushHistory();
        set({ elements: state.elements.filter((e) => e.id !== id) });
      },

      updateElement: (id, patch) => {
        const state = get();
        state._pushHistory();
        set({
          elements: state.elements.map((e) =>
            e.id === id ? ({ ...e, ...patch } as CanvasElement) : e,
          ),
        });
      },

      setElements: (els) => set({ elements: els }),
      clearElements: () => set({ elements: [] }),

      setZoom: (z) => set({ zoom: z }),
      setPan: (x, y) => set({ panX: x, panY: y }),

      setSelectedIds: (ids) => set({ selectedIds: ids }),
      clearSelection: () => set({ selectedIds: [] }),

      /* undo/redo */
      undo: () => {
        const state = get();
        const { _history, _future } = state;

        if (_history.length === 0) return;

        const previous = _history[_history.length - 1];
        const newHistory = _history.slice(0, -1);
        const newFuture = [
          { elements: [...state.elements], timestamp: Date.now() },
          ..._future
        ].slice(0, 50);

        set({
          elements: previous.elements,
          _history: newHistory,
          _future: newFuture
        });
      },

      redo: () => {
        const state = get();
        const { _history, _future } = state;

        if (_future.length === 0) return;

        const next = _future[0];
        const newFuture = _future.slice(1);
        const newHistory = [
          ..._history,
          { elements: [...state.elements], timestamp: Date.now() }
        ].slice(-50);

        set({
          elements: next.elements,
          _history: newHistory,
          _future: newFuture
        });
      },

      canUndo: () => get()._history.length > 0,
      canRedo: () => get()._future.length > 0
    }),
    {
      name: 'whiteboard-storage',
      partialize: (state) => ({
        elements: state.elements,
        selectedTool: state.selectedTool,
        selectedColor: state.selectedColor,
        strokeWidth: state.strokeWidth,
        zoom: state.zoom,
        panX: state.panX,
        panY: state.panY
      })
    }
  )
);
