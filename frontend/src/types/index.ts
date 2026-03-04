/* ── Tools ── */
export type Tool =
  | 'select'
  | 'pen'
  | 'eraser'
  | 'line'
  | 'arrow'
  | 'rect'
  | 'ellipse'
  | 'diamond'
  | 'text'
  | 'image'
  | 'hand';

/* ── Point (every stroke is a list of these) ── */
export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

/* ── Stroke = the atomic freehand drawing primitive ── */
export interface Stroke {
  id: string;
  tool: 'pen' | 'eraser';
  points: number[]; // flat [x0,y0,x1,y1,…] — native Konva format
  color: string;
  strokeWidth: number;
  opacity: number;
  userId: string;
  timestamp: number;
}

/* ── Shape objects (rect, ellipse, diamond, arrow, line, text, image) ── */
export interface ShapeObject {
  id: string;
  type: 'rect' | 'ellipse' | 'diamond' | 'line' | 'arrow' | 'text' | 'image';
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: number[];
  text?: string;
  src?: string;
  color: string;
  fill?: string;
  strokeWidth: number;
  opacity: number;
  rotation: number;
  userId: string;
  timestamp: number;
}

/* ── A canvas element is either a stroke or a shape ── */
export type CanvasElement =
  | ({ kind: 'stroke' } & Stroke)
  | ({ kind: 'shape' } & ShapeObject);

/* ── Whiteboard state ── */
export interface WhiteboardState {
  elements: CanvasElement[];
  selectedTool: Tool;
  selectedColor: string;
  strokeWidth: number;
  zoom: number;
  panX: number;
  panY: number;
  selectedIds: string[];
}

/* ── Users / cursors ── */
export interface User {
  id: string;
  name: string;
  color: string;
  cursorX: number;
  cursorY: number;
}

/* ── Room ── */
export interface Room {
  id: string;
  name: string;
  createdAt: string;
  users: User[];
}

/* ── AI ── */
export interface AIPrompt {
  id: string;
  prompt: string;
  result: string;
  timestamp: number;
}

export interface AIDiagramSVGResult {
  id: string;
  prompt: string;
  svg: string;
  message: string;
  width: number;
  height: number;
  timestamp: number;
}
