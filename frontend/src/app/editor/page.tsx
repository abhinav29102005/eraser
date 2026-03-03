'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useWhiteboardStore } from '@store/whiteboard';
import { roomAPI, aiAPI } from '@lib/services';
import toast from 'react-hot-toast';
import Link from 'next/link';
import type { CanvasElement, Tool, ShapeObject } from '@app-types/index';

/* Konva must be loaded client-side only (it accesses `window`) */
const KonvaCanvas = dynamic<{ roomId: string; showAiPanel: boolean }>(
  () => import('./KonvaCanvas'),
  { ssr: false },
);

/* ─── helpers ─── */
function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const COLORS = ['#ffffff', '#f97316', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#eab308'];

const TOOLBAR_TOOLS: { tool: Tool; label: string; shortcut: string }[] = [
  { tool: 'select',  label: 'Select',  shortcut: 'V' },
  { tool: 'hand',    label: 'Hand',    shortcut: 'H' },
  { tool: 'pen',     label: 'Pen',     shortcut: 'P' },
  { tool: 'eraser',  label: 'Eraser',  shortcut: 'E' },
  { tool: 'line',    label: 'Line',    shortcut: 'L' },
  { tool: 'arrow',   label: 'Arrow',   shortcut: 'A' },
  { tool: 'rect',    label: 'Rect',    shortcut: 'R' },
  { tool: 'ellipse', label: 'Ellipse', shortcut: 'O' },
  { tool: 'diamond', label: 'Diamond', shortcut: 'D' },
  { tool: 'text',    label: 'Text',    shortcut: 'T' },
];

/* ─── tool icon SVGs ─── */
function ToolIcon({ tool, className = 'w-4 h-4' }: { tool: string; className?: string }) {
  const p = { className, fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 1.5 };
  switch (tool) {
    case 'select':  return <svg {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M4.5 10.5H2.25m3.916-5.834L7.757 6.257" /></svg>;
    case 'hand':    return <svg {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M10.05 4.575a1.575 1.575 0 1 0-3.15 0v3.15m3.15-3.15v-1.1a1.575 1.575 0 0 1 3.15 0v1.1m-3.15 0h3.15m0 0a1.575 1.575 0 0 1 3.15 0v4.725M13.2 4.575V2.475m3.15 6.75V4.575m0 0a1.575 1.575 0 0 1 3.15 0v7.725c0 3.479-2.821 6.3-6.3 6.3h0c-3.479 0-6.3-2.821-6.3-6.3V7.725a1.575 1.575 0 0 0-3.15 0" /></svg>;
    case 'pen':     return <svg {...p}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>;
    case 'eraser':  return <svg {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75 14.25 12m0 0 2.25 2.25M14.25 12l2.25-2.25M14.25 12 12 14.25m-2.58 4.92-6.374-6.375a1.125 1.125 0 0 1 0-1.59L9.42 4.83a1.125 1.125 0 0 1 1.59 0l6.375 6.375a1.125 1.125 0 0 1 0 1.59l-6.375 6.374a1.125 1.125 0 0 1-1.59 0Z" /></svg>;
    case 'line':    return <svg {...p}><line x1="5" y1="19" x2="19" y2="5" strokeLinecap="round" /></svg>;
    case 'arrow':   return <svg {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>;
    case 'rect':    return <svg {...p}><rect x="4" y="4" width="16" height="16" rx="2" strokeLinecap="round" /></svg>;
    case 'ellipse': return <svg {...p}><ellipse cx="12" cy="12" rx="9" ry="7" /></svg>;
    case 'diamond': return <svg {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3 21 12 12 21 3 12Z" /></svg>;
    case 'text':    return <svg {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10M12 4v16" /></svg>;
    default:        return null;
  }
}

/* ================================================================ */
export default function EditorPage() {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');

  /* Extract room ID from URL pathname: /editor/<roomId> */
  useEffect(() => {
    const segments = window.location.pathname.split('/');
    const id = segments[2]; // /editor/<id>
    if (!id) { router.push('/dashboard'); return; }
    setRoomId(id);
  }, [router]);

  const {
    elements, selectedTool, selectedColor, strokeWidth, zoom, panX, panY, selectedIds,
    setSelectedTool, setSelectedColor, setStrokeWidth,
    addElement, removeElement, setElements, clearElements,
    setZoom, setPan, setSelectedIds, clearSelection,
  } = useWhiteboardStore();

  const [roomName, setRoomName] = useState('Untitled');
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);

  /* ─── Load room data ─── */
  useEffect(() => {
    if (!roomId) return;
    const token = localStorage.getItem('authToken');
    if (!token) { router.push('/login'); return; }

    roomAPI.getById(roomId)
      .then((res) => {
        setRoomName(res.data.name);
        if (res.data.objects && Array.isArray(res.data.objects)) {
          const converted: CanvasElement[] = res.data.objects.map((obj: any) => {
            if (obj.data?.points) {
              return {
                kind: 'stroke' as const,
                id: obj.id,
                tool: 'pen' as const,
                points: obj.data.points,
                color: obj.color || '#ffffff',
                strokeWidth: obj.stroke_width || 2,
                opacity: 1,
                userId: obj.user_id || '',
                timestamp: obj.timestamp || Date.now(),
              };
            }
            return {
              kind: 'shape' as const,
              id: obj.id,
              type: (obj.type || 'rect') as ShapeObject['type'],
              x: obj.x || 0, y: obj.y || 0,
              width: obj.data?.width || 100,
              height: obj.data?.height || 100,
              color: obj.color || '#ffffff',
              fill: obj.data?.fill || '',
              strokeWidth: obj.stroke_width || 2,
              opacity: 1, rotation: 0,
              userId: obj.user_id || '',
              timestamp: obj.timestamp || Date.now(),
            };
          });
          setElements(converted);
        }
      })
      .catch(() => toast.error('Failed to load canvas'));
  }, [roomId, router, setElements]);

  /* ─── Keyboard shortcuts ─── */
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      const map: Record<string, Tool> = { v: 'select', h: 'hand', p: 'pen', e: 'eraser', l: 'line', a: 'arrow', r: 'rect', o: 'ellipse', d: 'diamond', t: 'text' };
      const tool = map[e.key.toLowerCase()];
      if (tool) { setSelectedTool(tool); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') { selectedIds.forEach(removeElement); clearSelection(); }
      if (e.key === '+' || e.key === '=') setZoom(Math.min(zoom * 1.1, 5));
      if (e.key === '-') setZoom(Math.max(zoom * 0.9, 0.1));
      if (e.key === '0') { setZoom(1); setPan(0, 0); }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [selectedIds, zoom, setSelectedTool, removeElement, clearSelection, setZoom, setPan]);

  /* ─── AI ─── */
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await aiAPI.generateDiagram(aiPrompt);
      setAiResult(res.data.result || JSON.stringify(res.data));
      toast.success('AI response received');
    } catch {
      toast.error('AI generation failed');
    } finally { setAiLoading(false); }
  };

  const handleExport = () => {
    // The KonvaCanvas child will expose export through a ref, but for simplicity we
    // use the stage ref that's available there.
    toast.success('Use Ctrl+Shift+S to export (coming soon)');
  };

  const cursorForTool: Record<string, string> = {
    select: 'default', hand: 'grab', pen: 'crosshair', eraser: 'crosshair',
    line: 'crosshair', arrow: 'crosshair', rect: 'crosshair', ellipse: 'crosshair',
    diamond: 'crosshair', text: 'text',
  };

  /* Wait for roomId to be resolved from the URL */
  if (!roomId) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface-950">
        <div className="animate-spin h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-surface-950 overflow-hidden">
      {/* ── Top toolbar ── */}
      <header className="h-12 bg-surface-900 border-b border-surface-700/60 flex items-center px-3 gap-2 flex-shrink-0 z-30">
        <Link href="/dashboard" className="btn-ghost p-1.5" title="Back">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
        </Link>
        <span className="text-sm font-medium text-surface-200 truncate max-w-[140px]">{roomName}</span>
        <div className="w-px h-6 bg-surface-700 mx-1" />

        {/* Tools */}
        <div className="flex items-center bg-surface-800 border border-surface-700 rounded-lg p-0.5 gap-0.5">
          {TOOLBAR_TOOLS.map((t) => (
            <button
              key={t.tool}
              onClick={() => setSelectedTool(t.tool)}
              className={`p-1.5 rounded-md transition-all ${selectedTool === t.tool ? 'bg-brand-500 text-white shadow-glow-brand' : 'text-surface-400 hover:text-surface-200 hover:bg-surface-700'}`}
              title={`${t.label} (${t.shortcut})`}
            >
              <ToolIcon tool={t.tool} />
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-surface-700 mx-1" />

        {/* Color + stroke */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="w-6 h-6 rounded-md border-2 border-surface-600"
            style={{ backgroundColor: selectedColor }}
            title="Color"
          />
          {showColorPicker && (
            <div className="absolute top-10 left-0 bg-surface-800 border border-surface-700 rounded-lg p-2 flex gap-1.5 z-50 shadow-float animate-scale-in">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => { setSelectedColor(c); setShowColorPicker(false); }}
                  className={`w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform ${selectedColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-surface-500">{strokeWidth}px</span>
            <input type="range" min={1} max={20} value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))} className="w-16 h-1 accent-brand-500" />
          </div>
        </div>

        <div className="flex-1" />

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-surface-500 tabular-nums">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(Math.max(zoom * 0.9, 0.1))} className="btn-ghost p-1" title="Zoom out">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M5 12h14" /></svg>
          </button>
          <button onClick={() => setZoom(Math.min(zoom * 1.1, 5))} className="btn-ghost p-1" title="Zoom in">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M12 5v14m-7-7h14" /></svg>
          </button>
          <button onClick={() => { setZoom(1); setPan(0, 0); }} className="btn-ghost p-1 text-[10px] text-surface-500">Fit</button>
          <div className="w-px h-6 bg-surface-700 mx-1" />
          <button onClick={() => setShowAiPanel(!showAiPanel)} className={`btn-ghost p-1.5 ${showAiPanel ? 'text-brand-400' : ''}`} title="AI Assistant">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" /></svg>
          </button>
          <button onClick={() => clearElements()} className="btn-ghost p-1.5 text-surface-500 hover:text-red-400" title="Clear canvas">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
          </button>
        </div>
      </header>

      {/* ── Canvas + AI panel ── */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative" style={{ cursor: cursorForTool[selectedTool] || 'default' }}>
          {/* Dot grid */}
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
              backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
              backgroundPosition: `${panX % (24 * zoom)}px ${panY % (24 * zoom)}px`,
            }}
          />
          <KonvaCanvas roomId={roomId} showAiPanel={showAiPanel} />
          {/* Bottom info */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[10px] text-surface-500 bg-surface-900/80 backdrop-blur-sm border border-surface-700/40 rounded-lg px-3 py-1.5 z-10">
            <span>{elements.length} elements</span>
            <span>•</span>
            <span>{Math.round(zoom * 100)}%</span>
            <span>•</span>
            <span>∞ canvas</span>
          </div>
        </div>

        {/* AI panel */}
        {showAiPanel && (
          <aside className="w-80 bg-surface-900 border-l border-surface-700/60 flex flex-col flex-shrink-0 animate-slide-in-right">
            <div className="h-12 flex items-center justify-between px-4 border-b border-surface-700/60 flex-shrink-0">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" /></svg>
                <span className="text-sm font-semibold text-white">AI Assistant</span>
              </div>
              <button onClick={() => setShowAiPanel(false)} className="text-surface-500 hover:text-surface-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <p className="text-xs text-surface-400 leading-relaxed">Describe a diagram — AI will help generate it.</p>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Microservices architecture with API gateway, auth, user service, PostgreSQL"
                rows={4}
                className="input-field text-sm resize-none"
              />
              <button onClick={handleAiGenerate} disabled={aiLoading || !aiPrompt.trim()} className="btn-primary w-full text-sm disabled:opacity-50">
                {aiLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Generating…
                  </span>
                ) : 'Generate'}
              </button>
              {aiResult && (
                <div className="bg-surface-800 border border-surface-700 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-brand-400 mb-2">AI Response</h4>
                  <pre className="text-xs text-surface-300 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">{aiResult}</pre>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
