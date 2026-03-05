'use client';

import { useWhiteboardStore } from '@store/whiteboard';
import type { Tool } from '@app-types/index';

const COLORS = ['#ffffff', '#f97316', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#eab308'];

const TOOLBAR_TOOLS: { tool: Tool; label: string; shortcut: string }[] = [
  { tool: 'select', label: 'Select', shortcut: 'V' },
  { tool: 'hand', label: 'Hand', shortcut: 'H' },
  { tool: 'pen', label: 'Pen', shortcut: 'P' },
  { tool: 'eraser', label: 'Eraser', shortcut: 'E' },
  { tool: 'line', label: 'Line', shortcut: 'L' },
  { tool: 'arrow', label: 'Arrow', shortcut: 'A' },
  { tool: 'rect', label: 'Rect', shortcut: 'R' },
  { tool: 'ellipse', label: 'Ellipse', shortcut: 'O' },
  { tool: 'diamond', label: 'Diamond', shortcut: 'D' },
  { tool: 'text', label: 'Text', shortcut: 'T' },
];

interface ToolbarProps {
  onSave: () => void;
}

export function Toolbar({ onSave }: ToolbarProps) {
  const {
    selectedTool,
    selectedColor,
    strokeWidth,
    setSelectedTool,
    setSelectedColor,
    setStrokeWidth,
    undo,
    redo,
    canUndo,
    canRedo
  } = useWhiteboardStore();

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-900 rounded-lg">
      {/* Tools */}
      <div className="flex gap-1">
        {TOOLBAR_TOOLS.map(({ tool, label, shortcut }) => (
          <button
            key={tool}
            onClick={() => setSelectedTool(tool)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              selectedTool === tool
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
            title={`${label} (${shortcut})`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="w-px h-8 bg-gray-700" />

      {/* Colors */}
      <div className="flex gap-1">
        {COLORS.map((color) => (
          <button
            key={color}
            onClick={() => setSelectedColor(color)}
            className={`w-6 h-6 rounded-full border-2 transition-transform ${
              selectedColor === color ? 'border-blue-500 scale-110' : 'border-transparent'
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      <div className="w-px h-8 bg-gray-700" />

      {/* Stroke Width */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Stroke:</span>
        <input
          type="range"
          min="1"
          max="20"
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
          className="w-20"
        />
        <span className="text-xs text-gray-400 w-4">{strokeWidth}</span>
      </div>

      <div className="w-px h-8 bg-gray-700" />

      {/* Undo/Redo */}
      <div className="flex gap-1">
        <button
          onClick={undo}
          disabled={!canUndo()}
          className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded text-sm hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
        >
          Undo
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded text-sm hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Y)"
        >
          Redo
        </button>
      </div>

      <div className="w-px h-8 bg-gray-700" />

      {/* Save */}
      <button
        onClick={onSave}
        className="px-4 py-1.5 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"
      >
        Save
      </button>
    </div>
  );
}
