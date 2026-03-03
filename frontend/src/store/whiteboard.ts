import { create } from 'zustand';
import type { CanvasElement, Tool, WhiteboardState } from '@app-types/index';

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
}

export const useWhiteboardStore = create<WhiteboardStore>((set) => ({
  elements: [],
  selectedTool: 'pen',
  selectedColor: '#ffffff',
  strokeWidth: 2,
  zoom: 1,
  panX: 0,
  panY: 0,
  selectedIds: [],

  setSelectedTool: (tool) => set({ selectedTool: tool }),
  setSelectedColor: (color) => set({ selectedColor: color }),
  setStrokeWidth: (w) => set({ strokeWidth: w }),

  addElement: (el) =>
    set((s) => ({ elements: [...s.elements, el] })),

  removeElement: (id) =>
    set((s) => ({ elements: s.elements.filter((e) => e.id !== id) })),

  updateElement: (id, patch) =>
    set((s) => ({
      elements: s.elements.map((e) =>
        e.id === id ? ({ ...e, ...patch } as CanvasElement) : e,
      ),
    })),

  setElements: (els) => set({ elements: els }),
  clearElements: () => set({ elements: [] }),

  setZoom: (z) => set({ zoom: z }),
  setPan: (x, y) => set({ panX: x, panY: y }),

  setSelectedIds: (ids) => set({ selectedIds: ids }),
  clearSelection: () => set({ selectedIds: [] }),
}));
