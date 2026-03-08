'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useWhiteboardStore } from '@store/whiteboard';
import { usePresenceStore, type PresenceUser } from '@store/presence';
import { connectSocket } from '@lib/socket';
import { roomAPI, aiAPI } from '@lib/services';
import toast from 'react-hot-toast';
import Link from 'next/link';
import mermaid from 'mermaid';
import type { CanvasElement, Tool, ShapeObject, AIDiagramSVGResult } from '@app-types/index';
import type { Socket } from 'socket.io-client';

/* Initialize mermaid */
mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' });

/* Konva must be loaded client-side only (it accesses `window`) */
const KonvaCanvas = dynamic<{ roomId: string; showAiPanel: boolean; layout: 'canvas' | 'doc' | 'both'; onCursorMove?: (x: number, y: number) => void }>(
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

  /* Extract room ID from URL query string: /editor?room=<roomId> */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('room');
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
  const [aiSvgData, setAiSvgData] = useState<AIDiagramSVGResult | null>(null);
  const [mermaidPreview, setMermaidPreview] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [layout, setLayout] = useState<'canvas' | 'doc' | 'both'>('both');
  const [docContent, setDocContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  const { setLocalUser, addUser, removeUser, updateUserCursor, clearUsers } = usePresenceStore();

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
            if (obj.type === 'pen' || obj.type === 'eraser' || obj.data?.points) {
              return {
                kind: 'stroke' as const,
                id: obj.id,
                tool: (obj.type === 'pen' || obj.type === 'eraser') ? obj.type : 'pen' as const,
                points: obj.data?.points || [],
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
              points: obj.data?.points,
              text: obj.data?.text,
              src: obj.data?.src,
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

  /* ─── Socket connection for real-time collaboration ─── */
  useEffect(() => {
    if (!roomId) return;
    const userId = localStorage.getItem("userId") || "";
    const userName = localStorage.getItem("userName") || "Anonymous";
    if (!userId) return;

    // Initialize presence store
    setLocalUser(userId, userName, "#3b82f6");

    // Connect socket
    const socketInstance = connectSocket(userId);
    setSocket(socketInstance);

    // Set up socket event listeners
    const handleConnect = () => {
      console.log("Connected to socket server");
      socketInstance.emit("join_room", { room_id: roomId, user_id: userId, user_name: userName });
    };

    const handleRoomData = (data: { objects: any[] }) => {
      console.log("Received room data:", data.objects?.length, "objects");
      if (data.objects && Array.isArray(data.objects)) {
        const converted: CanvasElement[] = data.objects.map((obj: any) => {
          if (obj.type === "pen" || obj.type === "eraser" || obj.data?.points) {
            return {
              kind: "stroke" as const,
              id: obj.id,
              tool: (obj.type === "pen" || obj.type === "eraser") ? obj.type : "pen" as const,
              points: obj.data?.points || [],
              color: obj.color || "#ffffff",
              strokeWidth: obj.stroke_width || 2,
              opacity: 1,
              userId: obj.userId || '',
              timestamp: obj.timestamp || Date.now(),
            };
          }
          return {
            kind: "shape" as const,
            id: obj.id,
            type: (obj.type || "rect") as ShapeObject["type"],
            x: obj.x || 0, y: obj.y || 0,
            width: obj.data?.width || 100,
            height: obj.data?.height || 100,
            points: obj.data?.points,
            text: obj.data?.text,
            src: obj.data?.src,
            color: obj.color || "#ffffff",
            fill: obj.data?.fill || '',
            strokeWidth: obj.stroke_width || 2,
            opacity: 1, rotation: 0,
            userId: obj.userId || '',
            timestamp: obj.timestamp || Date.now(),
          };
        });
        setElements(converted);
      }
    };

    const handleObjectDrawn = (data: any) => {
      if (data.type === "pen" || data.type === "eraser" || data.data?.points) {
        const el: CanvasElement = {
          kind: "stroke",
          id: data.id,
          tool: data.type as 'pen' | 'eraser',
          points: data.data?.points || [],
          color: data.color || "#ffffff",
          strokeWidth: data.strokeWidth || 2,
          opacity: 1,
          userId: data.userId || '',
          timestamp: data.timestamp || Date.now(),
        };
        addElement(el);
      } else {
        const el: CanvasElement = {
          kind: "shape",
          id: data.id,
          type: (data.type || "rect") as ShapeObject["type"],
          x: data.x || 0, y: data.y || 0,
          width: data.data?.width || 100,
          height: data.data?.height || 100,
          points: data.data?.points,
          text: data.data?.text,
          src: data.data?.src,
          color: data.color || "#ffffff",
          fill: data.data?.fill || '',
          strokeWidth: data.strokeWidth || 2,
          opacity: 1, rotation: 0,
          userId: data.userId || '',
          timestamp: data.timestamp || Date.now(),
        };
        addElement(el);
      }
    };

    const handleObjectDeleted = (data: { object_id: string }) => {
      removeElement(data.object_id);
    };

    const handleRoomCleared = () => {
      clearElements();
    };

    const handleCursorMoved = (data: { userId: string; x: number; y: number }) => {
      if (data.userId !== userId) {
        updateUserCursor(data.userId, data.x, data.y);
      }
    };

    const handleUsersUpdate = (users: PresenceUser[]) => {
      setOnlineUsers(users);
      clearUsers();
      users.forEach((user) => addUser(user));
    };

    socketInstance.on("connect", handleConnect);
    socketInstance.on("room_data", handleRoomData);
    socketInstance.on("object_drawn", handleObjectDrawn);
    socketInstance.on("object_deleted", handleObjectDeleted);
    socketInstance.on("room_cleared", handleRoomCleared);
    socketInstance.on("cursor_moved", handleCursorMoved);
    socketInstance.on("users_update", handleUsersUpdate);

    return () => {
      socketInstance.off("connect", handleConnect);
      socketInstance.off("room_data", handleRoomData);
      socketInstance.off("object_drawn", handleObjectDrawn);
      socketInstance.off("object_deleted", handleObjectDeleted);
      socketInstance.off("room_cleared", handleRoomCleared);
      socketInstance.off("cursor_moved", handleCursorMoved);
      socketInstance.off("users_update", handleUsersUpdate);
      socketInstance.emit("leave_room", { room_id: roomId, user_id: userId });
    };
  }, [roomId, setElements, addElement, removeElement, clearElements, setLocalUser, addUser, removeUser, updateUserCursor, clearUsers]);

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
    setAiSvgData(null);
    setAiResult('');
    setMermaidPreview(null);
    try {
      const res = await aiAPI.generateDiagramVisual(aiPrompt);
      const data: AIDiagramSVGResult = res.data;
      setAiSvgData(data);
      setAiResult(data.message || 'Diagram generated!');
      
      // If it's a Mermaid diagram, render preview
      if (data.type === 'mermaid' && data.mermaid) {
        try {
          const { svg } = await mermaid.render('mermaid-preview-' + Date.now(), data.mermaid);
          setMermaidPreview(svg);
        } catch (err) {
          console.error('Failed to render Mermaid preview:', err);
        }
      }
      
      toast.success('AI visual generated ✨');
    } catch {
      // Fallback to text-only diagram endpoint
      try {
        const res = await aiAPI.generateDiagram(aiPrompt);
        setAiResult(res.data.result || JSON.stringify(res.data));
        toast.success('AI response received');
      } catch {
        toast.error('AI generation failed');
      }
    } finally { setAiLoading(false); }
  };

  const handleAddSvgToCanvas = async () => {
    if (!aiSvgData) return;
    
    let svgString: string | null = null;
    let width = 600;
    let height = 400;

    try {
      // If it's a Mermaid diagram, convert it to SVG first
      if (aiSvgData.type === 'mermaid' && aiSvgData.mermaid) {
        const { svg } = await mermaid.render('mermaid-diagram-' + Date.now(), aiSvgData.mermaid);
        svgString = svg;
        
        // Try to extract dimensions from the rendered SVG
        const viewBoxMatch = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
        const widthMatch = svg.match(/width="([\d.]+)"/);
        const heightMatch = svg.match(/height="([\d.]+)"/);
        
        if (viewBoxMatch) {
          width = parseFloat(viewBoxMatch[1]);
          height = parseFloat(viewBoxMatch[2]);
        } else if (widthMatch && heightMatch) {
          width = parseFloat(widthMatch[1]);
          height = parseFloat(heightMatch[1]);
        }
        
        // Scale to fit nicely in viewport (90% of visible canvas area)
        const maxCanvasWidth = (window.innerWidth - 100) / zoom; // 100px for margins
        const maxCanvasHeight = (window.innerHeight - 100) / zoom;
        
        const scaleFactor = Math.min(
          maxCanvasWidth / width,
          maxCanvasHeight / height,
          2.5 // Max scale of 2.5x
        );
        
        width = width * scaleFactor;
        height = height * scaleFactor;
        
        // Ensure minimum visibility
        width = Math.max(width, 400);
        height = Math.max(height, 300);
        
      } else if (aiSvgData.svg) {
        // Use existing SVG
        svgString = aiSvgData.svg;
        width = aiSvgData.width || 600;
        height = aiSvgData.height || 400;
      } else {
        toast.error('No diagram data available');
        return;
      }

      if (!svgString) {
        toast.error('Failed to render diagram');
        return;
      }

      // Convert SVG string to a data URI so KonvaCanvas can render it as an image
      const encoded = btoa(unescape(encodeURIComponent(svgString)));
      const dataUri = `data:image/svg+xml;base64,${encoded}`;

      // Place at center of the current viewport with better positioning
      const viewportCenterX = -panX / zoom + (window.innerWidth / 2) / zoom;
      const viewportCenterY = (-panY + 48) / zoom + (window.innerHeight / 2) / zoom; // 48px for header
      
      const el: CanvasElement = {
        kind: 'shape',
        id: uid(),
        type: 'image',
        x: viewportCenterX - width / 2,
        y: viewportCenterY - height / 2,
        width: width,
        height: height,
        src: dataUri,
        color: '#ffffff',
        strokeWidth: 0,
        opacity: 1,
        rotation: 0,
        userId: localStorage.getItem('userId') || '',
        timestamp: Date.now(),
      };

      addElement(el);
      // Persist to backend
      roomAPI.addObject(roomId, {
        type: 'image',
        x: el.x,
        y: el.y,
        data: { width: width, height: height, src: dataUri },
        color: '#ffffff',
        stroke_width: 0,
      }).catch(() => {});

      toast.success('Diagram added to canvas! 🎨 Drag corners to resize.');
      
      // Auto-select the newly added diagram for immediate interaction
      setSelectedIds([el.id]);
    } catch (error) {
      console.error('Failed to render diagram:', error);
      toast.error('Failed to render diagram on canvas');
    }
  };

  const handleExport = () => {
    toast.success('Use Ctrl+Shift+S to export (coming soon)');
  };

  /* ─── Handle cursor movement for presence ─── */
  const handleCursorMove = useCallback((x: number, y: number) => {
    if (socket && socket.connected) {
      socket.emit('cursor_move', { room_id: roomId, x, y });
    }
  }, [socket, roomId]);

  /* ─── Save canvas state ─── */
  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      // Helper: strip undefined/null keys so axios doesn't send JSON nulls
      const clean = <T extends Record<string, unknown>>(obj: T): T => {
        const out = {} as Record<string, unknown>;
        for (const [k, v] of Object.entries(obj)) {
          if (v !== undefined && v !== null) out[k] = v;
        }
        return out as T;
      };

      // Bulk-save all canvas elements
      const objectsPayload = elements.map((el) => {
        if (el.kind === 'stroke') {
          return clean({
            type: el.tool,
            x: 0,
            y: 0,
            data: { points: el.points },
            color: el.color,
            stroke_width: el.strokeWidth,
            timestamp: el.timestamp,
          });
        }
        const s = el as Extract<CanvasElement, { kind: 'shape' }>;
        return clean({
          type: s.type,
          x: s.x,
          y: s.y,
          data: clean({
            width: s.width,
            height: s.height,
            points: s.points,
            text: s.text,
            src: s.src,
            fill: s.fill,
          }),
          color: s.color,
          stroke_width: s.strokeWidth,
          timestamp: s.timestamp,
        });
      });

      // Run both saves concurrently – neither depends on the other
      await Promise.all([
        roomAPI.update(roomId, { name: roomName }),
        roomAPI.saveCanvas(roomId, objectsPayload),
      ]);

      setLastSaved(new Date());
      toast.success('Saved');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Unknown error'
          : String(err);
      console.error('Save failed:', err);
      toast.error(`Failed to save: ${msg}`);
    } finally {
      setSaving(false);
    }
  }, [roomId, roomName, saving, elements]);

  /* ─── Ctrl+S shortcut ─── */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [handleSave]);

  /* ─── Share link ─── */
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/editor?room=${roomId}` : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const el = document.createElement('textarea');
      el.value = shareUrl; document.body.appendChild(el); el.select();
      document.execCommand('copy'); document.body.removeChild(el);
    }
    setLinkCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setLinkCopied(false), 2000);
  };

  /* ─── Doc formatting helpers ─── */
  const insertDocFormat = (prefix: string, suffix = '') => {
    const ta = document.getElementById('doc-editor') as HTMLTextAreaElement | null;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = docContent.slice(start, end);
    const next = docContent.slice(0, start) + prefix + selected + suffix + docContent.slice(end);
    setDocContent(next);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + prefix.length, end + prefix.length); }, 0);
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
        {lastSaved && <span className="text-[9px] text-surface-600 ml-1">saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
        <div className="w-px h-6 bg-surface-700 mx-1" />

        {onlineUsers.length > 0 && (
          <div className="flex items-center -space-x-2" title={`${onlineUsers.length} user(s) online`}>
            {onlineUsers.slice(0, 3).map((user) => (
              <div key={user.id} className="w-7 h-7 rounded-full border-2 border-surface-900 flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: user.color }} title={user.name}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {onlineUsers.length > 3 && (
              <div className="w-7 h-7 rounded-full border-2 border-surface-900 bg-surface-700 flex items-center justify-center text-xs font-bold text-surface-300">
                +{onlineUsers.length - 3}
              </div>
            )}
          </div>
        )}

        {/* Layout toggle — Doc | Both | Canvas (like eraser.io) */}
        <div className="flex items-center bg-surface-800 border border-surface-700 rounded-lg p-0.5 gap-0.5">
          <button onClick={() => setLayout('doc')} className={`p-1.5 rounded-md transition-all ${layout === 'doc' ? 'bg-brand-500 text-white shadow-glow-brand' : 'text-surface-400 hover:text-surface-200 hover:bg-surface-700'}`} title="Document only">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
          </button>
          <button onClick={() => setLayout('both')} className={`p-1.5 rounded-md transition-all ${layout === 'both' ? 'bg-brand-500 text-white shadow-glow-brand' : 'text-surface-400 hover:text-surface-200 hover:bg-surface-700'}`} title="Document + Canvas">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125c-.621 0-1.125.504-1.125 1.125v12.75c0 .621.504 1.125 1.125 1.125Z" /></svg>
          </button>
          <button onClick={() => setLayout('canvas')} className={`p-1.5 rounded-md transition-all ${layout === 'canvas' ? 'bg-brand-500 text-white shadow-glow-brand' : 'text-surface-400 hover:text-surface-200 hover:bg-surface-700'}`} title="Canvas only">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" /></svg>
          </button>
        </div>
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
          {/* Save */}
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-surface-800 border border-surface-700 text-surface-300 hover:text-white hover:border-surface-600 transition-all disabled:opacity-50" title="Save (Ctrl+S)">
            {saving ? (
              <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h2.21a2.25 2.25 0 0 0 2.012-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859M12 3v8.25m0 0-3-3m3 3 3-3" /></svg>
            )}
            Save
          </button>
          {/* Share */}
          <button onClick={() => setShowShareModal(true)} className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-brand-500 hover:bg-brand-600 text-white transition-all" title="Share & Collaborate">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.935-2.186 2.25 2.25 0 0 0-3.935 2.186Z" /></svg>
            Share
          </button>
          <div className="w-px h-6 bg-surface-700 mx-1" />
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

      {/* ── Main content: Doc + Canvas + AI ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ── Document panel (eraser.io style) ── */}
        <div className={`${layout === 'canvas' ? 'hidden' : ''} ${layout === 'both' ? 'w-[420px] flex-shrink-0' : 'flex-1'} bg-surface-900 border-r border-surface-700/60 flex flex-col transition-all`}>
          {/* Doc header */}
          <div className="h-10 flex items-center justify-between px-4 border-b border-surface-700/60 flex-shrink-0">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
              <span className="text-xs font-semibold text-surface-300 uppercase tracking-wider">Document</span>
            </div>
            <span className="text-[9px] text-surface-600 tabular-nums">{docContent.length > 0 ? `${docContent.split('\n').length} lines` : ''}</span>
          </div>
          {/* Formatting toolbar */}
          <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-surface-700/40 flex-shrink-0 overflow-x-auto">
            <button onClick={() => insertDocFormat('# ')} className="px-1.5 py-0.5 rounded text-[10px] font-bold text-surface-400 hover:text-surface-200 hover:bg-surface-700/50 transition-colors" title="Heading 1">H1</button>
            <button onClick={() => insertDocFormat('## ')} className="px-1.5 py-0.5 rounded text-[10px] font-bold text-surface-400 hover:text-surface-200 hover:bg-surface-700/50 transition-colors" title="Heading 2">H2</button>
            <button onClick={() => insertDocFormat('### ')} className="px-1.5 py-0.5 rounded text-[10px] font-bold text-surface-400 hover:text-surface-200 hover:bg-surface-700/50 transition-colors" title="Heading 3">H3</button>
            <div className="w-px h-4 bg-surface-700 mx-1" />
            <button onClick={() => insertDocFormat('**', '**')} className="px-1.5 py-0.5 rounded text-[10px] font-bold text-surface-400 hover:text-surface-200 hover:bg-surface-700/50 transition-colors" title="Bold (Ctrl+B)">B</button>
            <button onClick={() => insertDocFormat('_', '_')} className="px-1.5 py-0.5 rounded text-[10px] italic text-surface-400 hover:text-surface-200 hover:bg-surface-700/50 transition-colors" title="Italic (Ctrl+I)">I</button>
            <button onClick={() => insertDocFormat('`', '`')} className="px-1.5 py-0.5 rounded text-[10px] font-mono text-surface-400 hover:text-surface-200 hover:bg-surface-700/50 transition-colors" title="Inline code">{`</>`}</button>
            <div className="w-px h-4 bg-surface-700 mx-1" />
            <button onClick={() => insertDocFormat('- ')} className="px-1.5 py-0.5 rounded text-surface-400 hover:text-surface-200 hover:bg-surface-700/50 transition-colors" title="Bullet list">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
            </button>
            <button onClick={() => insertDocFormat('- [ ] ')} className="px-1.5 py-0.5 rounded text-surface-400 hover:text-surface-200 hover:bg-surface-700/50 transition-colors" title="Checklist">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
            </button>
            <button onClick={() => insertDocFormat('\n```\n', '\n```\n')} className="px-1.5 py-0.5 rounded text-surface-400 hover:text-surface-200 hover:bg-surface-700/50 transition-colors" title="Code block">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" /></svg>
            </button>
            <button onClick={() => insertDocFormat('[', '](url)')} className="px-1.5 py-0.5 rounded text-surface-400 hover:text-surface-200 hover:bg-surface-700/50 transition-colors" title="Link">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.86-4.939a4.5 4.5 0 0 0-1.242-7.244l-4.5-4.5a4.5 4.5 0 0 0-6.364 6.364l1.757 1.757" /></svg>
            </button>
          </div>
          {/* Editor */}
          <div className="flex-1 overflow-y-auto">
            <textarea
              id="doc-editor"
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              placeholder={"Start documenting here…\n\n# Architecture Overview\nDescribe your system design alongside the canvas.\n\n## Components\n- Use **markdown** formatting\n- Add context to diagrams\n- [ ] Track progress with checklists"}
              className="w-full h-full bg-transparent text-surface-200 placeholder-surface-600 resize-none outline-none text-sm leading-relaxed p-4 font-mono"
              spellCheck={false}
            />
          </div>
        </div>

        {/* ── Canvas ── */}
        <div className={`${layout === 'doc' ? 'hidden' : ''} flex-1 relative`} style={{ cursor: cursorForTool[selectedTool] || 'default' }}>
          {/* Dot grid */}
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
              backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
              backgroundPosition: `${panX % (24 * zoom)}px ${panY % (24 * zoom)}px`,
            }}
          />
          <KonvaCanvas roomId={roomId} showAiPanel={showAiPanel} layout={layout}  onCursorMove={handleCursorMove} />
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
              <p className="text-xs text-surface-400 leading-relaxed">Describe a diagram — AI will generate a vector image and place it right on your canvas.</p>
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
                ) : '✨ Generate Visual'}
              </button>

              {/* Humanized AI message */}
              {aiResult && (
                <div className="bg-surface-800/60 border border-surface-700/50 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" /></svg>
                    </div>
                    <p className="text-xs text-surface-300 leading-relaxed whitespace-pre-wrap">{aiResult}</p>
                  </div>
                </div>
              )}

              {/* Mermaid/SVG preview + Add to Canvas */}
              {(aiSvgData?.mermaid || aiSvgData?.svg) && (
                <div className="space-y-3">
                  <div className="bg-surface-800 border border-surface-700 rounded-xl p-3 overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] text-surface-500 uppercase tracking-wider font-semibold">
                        {aiSvgData.type === 'mermaid' ? '📊 Mermaid Diagram' : 'Preview'}
                      </p>
                      {aiSvgData.type === 'mermaid' && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 font-semibold">
                          Interactive
                        </span>
                      )}
                    </div>
                    
                    {/* Visual Preview */}
                    {aiSvgData.type === 'mermaid' && mermaidPreview ? (
                      <div className="bg-[#1e1e2e] rounded-lg p-4 overflow-auto max-h-80">
                        <div
                          className="flex items-center justify-center"
                          dangerouslySetInnerHTML={{ __html: mermaidPreview }}
                        />
                      </div>
                    ) : aiSvgData.svg ? (
                      <div
                        className="rounded-lg overflow-hidden bg-[#1e1e2e] flex items-center justify-center p-4"
                        dangerouslySetInnerHTML={{ __html: aiSvgData.svg }}
                        style={{ maxHeight: 320 }}
                      />
                    ) : null}
                    
                    {/* Show code in collapsible section for Mermaid */}
                    {aiSvgData.type === 'mermaid' && aiSvgData.mermaid && (
                      <details className="mt-3">
                        <summary className="text-[10px] text-surface-400 cursor-pointer hover:text-surface-300 transition-colors">
                          View Mermaid Code
                        </summary>
                        <div className="mt-2 bg-surface-900/50 rounded p-2 overflow-auto max-h-32">
                          <pre className="text-[10px] text-surface-300 font-mono whitespace-pre-wrap">{aiSvgData.mermaid}</pre>
                        </div>
                      </details>
                    )}
                  </div>
                  <button
                    onClick={handleAddSvgToCanvas}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-500 to-purple-500 hover:from-brand-600 hover:to-purple-600 text-white transition-all shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Add to Canvas
                  </button>
                  <p className="text-[10px] text-surface-500 text-center">
                    💡 Once added, you can <span className="text-brand-400 font-semibold">move, resize, and rotate</span> the diagram
                  </p>
                </div>
              )}

              {/* Fallback: text-only response (when SVG/Mermaid isn't available) */}
              {aiResult && !aiSvgData?.svg && !aiSvgData?.mermaid && (
                <div className="bg-surface-800 border border-surface-700 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-brand-400 mb-2">AI Response</h4>
                  <pre className="text-xs text-surface-300 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">{aiResult}</pre>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* ── Share & collaborate modal ── */}
        {showShareModal && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowShareModal(false)}>
            <div className="bg-surface-800 border border-surface-700 rounded-xl p-6 w-[480px] max-w-[90vw] shadow-float animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-semibold text-white">Share &amp; Collaborate</h3>
                <button onClick={() => setShowShareModal(false)} className="text-surface-500 hover:text-surface-300 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <p className="text-sm text-surface-400 mb-4">Share this link with teammates to collaborate on <span className="text-surface-200 font-medium">{roomName}</span> in real-time.</p>
              <div className="flex items-center gap-2">
                <input type="text" value={shareUrl} readOnly className="input-field text-xs flex-1 font-mono bg-surface-900 select-all" onClick={(e) => (e.target as HTMLInputElement).select()} />
                <button onClick={handleCopyLink} className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 flex-shrink-0 ${linkCopied ? 'bg-green-500 text-white' : 'bg-brand-500 hover:bg-brand-600 text-white'}`}>
                  {linkCopied ? (
                    <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>Copied!</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" /></svg>Copy link</>
                  )}
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-surface-700/60 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-300">Real-time collaboration</p>
                  <p className="text-xs text-surface-500 mt-0.5">Anyone with this link can join and edit the canvas when logged in. Changes sync instantly.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
