'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Ellipse, Arrow, Text as KText, Image as KImage, Transformer, Group, Circle } from 'react-konva';
import Konva from 'konva';
import { useWhiteboardStore } from '@store/whiteboard';
import { usePresenceStore, type PresenceUser } from '@store/presence';
import { roomAPI } from '@lib/services';
import type { CanvasElement, ShapeObject } from '@app-types/index';

/* ── Hook: load an HTMLImageElement from a data-URI or URL ── */
function useImage(src: string | undefined): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!src) { setImg(null); return; }
    const image = new window.Image();
    image.onload = () => setImg(image);
    image.onerror = () => setImg(null);
    image.src = src;
  }, [src]);
  return img;
}

/* ── Component: renders a single SVG image element on canvas ── */
function SvgImageNode({ el, selectedTool, setSelectedIds }: {
  el: Extract<CanvasElement, { kind: 'shape' }>;
  selectedTool: string;
  setSelectedIds: (ids: string[]) => void;
}) {
  const img = useImage(el.src);
  if (!img) return null;
  return (
    <KImage
      key={el.id}
      id={el.id}
      image={img}
      x={el.x}
      y={el.y}
      width={el.width || img.naturalWidth}
      height={el.height || img.naturalHeight}
      opacity={el.opacity}
      rotation={el.rotation}
      draggable={selectedTool === 'select' && !el.isLocked}
      onClick={() => { if (selectedTool === 'select') setSelectedIds([el.id]); }}
      onDragEnd={(e) => {
        useWhiteboardStore.getState().updateElement(el.id, { x: e.target.x(), y: e.target.y() } as any);
      }}
    />
  );
}

/* ── Component: renders user cursors (presence) ── */
function UserCursors({ users, panX, panY, zoom, localUserId }: {
  users: PresenceUser[];
  panX: number;
  panY: number;
  zoom: number;
  localUserId: string | null;
}) {
  return (
    <>
      {users.map((user) => {
        if (user.id === localUserId) return null;
        return (
          <Group key={user.id} x={user.cursorX * zoom + panX} y={user.cursorY * zoom + panY}>
            <Circle
              radius={6}
              fill={user.color}
              stroke="#fff"
              strokeWidth={2}
            />
            <Rect
              x={12}
              y={-8}
              width={Math.max(60, user.name.length * 8)}
              height={20}
              fill={user.color}
              cornerRadius={4}
            />
            <KText
              x={16}
              y={-4}
              text={user.name.slice(0, 10)}
              fontSize={12}
              fill="#fff"
              fontStyle="bold"
            />
          </Group>
        );
      })}
    </>
  );
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

interface Props {
  roomId: string;
  showAiPanel: boolean;
  layout: 'canvas' | 'doc' | 'both';
  onCursorMove?: (x: number, y: number) => void;
}

export default function KonvaCanvas({ roomId, showAiPanel, layout, onCursorMove }: Props) {
  const {
    elements, selectedTool, selectedColor, strokeWidth, zoom, panX, panY, selectedIds,
    addElement, setSelectedIds, clearSelection, setZoom, setPan,
  } = useWhiteboardStore();

  const { users: presenceUsers, localUserId } = usePresenceStore();

  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  /* drawing state */
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPts, setCurrentPts] = useState<number[]>([]);
  const [shapeStart, setShapeStart] = useState<{ x: number; y: number } | null>(null);
  const [tempShape, setTempShape] = useState<ShapeObject | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPan, setLastPan] = useState({ x: 0, y: 0 });

  /* responsive size */
  const [size, setSize] = useState({ w: 1200, h: 700 });
  useEffect(() => {
    const update = () => {
      let w = window.innerWidth;
      if (showAiPanel) w -= 320;
      if (layout === 'both') w -= 420;
      setSize({ w: Math.max(w, 200), h: window.innerHeight - 48 });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [showAiPanel, layout]);

  /* attach transformer to selected elements */
  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) return;

    if (selectedIds.length === 1) {
      const selectedNode = stage.findOne(`#${selectedIds[0]}`);
      if (selectedNode) {
        transformer.nodes([selectedNode]);
        transformer.getLayer()?.batchDraw();
      }
    } else if (selectedIds.length > 1) {
      const selectedNodes = selectedIds
        .map((id) => stage.findOne(`#${id}`))
        .filter((node): node is Konva.Node => node !== undefined);
      if (selectedNodes.length > 0) {
        transformer.nodes(selectedNodes);
        transformer.getLayer()?.batchDraw();
      }
    } else {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
    }
  }, [selectedIds]);

  /* helper: pointer pos in canvas coords */
  const ptr = useCallback(() => {
    const s = stageRef.current;
    if (!s) return { x: 0, y: 0 };
    const p = s.getPointerPosition();
    if (!p) return { x: 0, y: 0 };
    return { x: (p.x - panX) / zoom, y: (p.y - panY) / zoom };
  }, [panX, panY, zoom]);

  /* ── mouse down ── */
  const onDown = useCallback(() => {
    const pos = ptr();
    if (selectedTool === 'hand') {
      setIsPanning(true);
      const p = stageRef.current?.getPointerPosition();
      if (p) setLastPan(p);
      return;
    }
    if (selectedTool === 'pen' || selectedTool === 'eraser') {
      setIsDrawing(true);
      setCurrentPts([pos.x, pos.y]);
      return;
    }
    if (['rect', 'ellipse', 'diamond', 'line', 'arrow'].includes(selectedTool)) {
      setIsDrawing(true);
      setShapeStart(pos);
      return;
    }
    if (selectedTool === 'text') {
      addElement({
        kind: 'shape', id: uid(), type: 'text',
        x: pos.x, y: pos.y, text: 'Double-click to edit',
        color: selectedColor, strokeWidth: 0, opacity: 1, rotation: 0,
        userId: localStorage.getItem('userId') || '', timestamp: Date.now(),
      });
    }
  }, [selectedTool, selectedColor, ptr, addElement]);

  /* ── mouse move ── */
  const onMove = useCallback(() => {
    // Emit cursor position for presence
    if (onCursorMove) {
      const pos = ptr();
      onCursorMove(pos.x, pos.y);
    }

    if (isPanning) {
      const p = stageRef.current?.getPointerPosition();
      if (!p) return;
      setPan(panX + (p.x - lastPan.x), panY + (p.y - lastPan.y));
      setLastPan(p);
      return;
    }
    if (!isDrawing) return;
    const pos = ptr();
    if (selectedTool === 'pen' || selectedTool === 'eraser') {
      setCurrentPts((prev) => [...prev, pos.x, pos.y]);
      return;
    }
    if (shapeStart) {
      setTempShape({
        id: 'temp', type: selectedTool as ShapeObject['type'],
        x: Math.min(shapeStart.x, pos.x), y: Math.min(shapeStart.y, pos.y),
        width: Math.abs(pos.x - shapeStart.x), height: Math.abs(pos.y - shapeStart.y),
        points: [shapeStart.x, shapeStart.y, pos.x, pos.y],
        color: selectedColor, strokeWidth, opacity: 1, rotation: 0,
        userId: '', timestamp: 0,
      });
    }
  }, [isPanning, isDrawing, selectedTool, shapeStart, selectedColor, strokeWidth, ptr, panX, panY, lastPan, setPan, onCursorMove]);

  /* ── mouse up ── */
  const onUp = useCallback(() => {
    if (isPanning) { setIsPanning(false); return; }
    if (!isDrawing) return;
    const userId = localStorage.getItem('userId') || '';

    if (selectedTool === 'pen' || selectedTool === 'eraser') {
      if (currentPts.length >= 4) {
        const el: CanvasElement = {
          kind: 'stroke', id: uid(), tool: selectedTool,
          points: currentPts,
          color: selectedTool === 'eraser' ? '#171920' : selectedColor,
          strokeWidth: selectedTool === 'eraser' ? strokeWidth * 3 : strokeWidth,
          opacity: 1, userId, timestamp: Date.now(),
        };
        addElement(el);
        roomAPI.addObject(roomId, {
          type: selectedTool, x: 0, y: 0,
          data: { points: currentPts },
          color: el.color, stroke_width: el.strokeWidth,
        }).catch(() => {});
      }
      setCurrentPts([]);
      setIsDrawing(false);
      return;
    }

    if (shapeStart && tempShape) {
      const el: CanvasElement = { kind: 'shape', ...tempShape, id: uid(), userId, timestamp: Date.now() };
      addElement(el);
      roomAPI.addObject(roomId, {
        type: tempShape.type, x: tempShape.x, y: tempShape.y,
        data: { width: tempShape.width, height: tempShape.height, points: tempShape.points },
        color: tempShape.color, stroke_width: tempShape.strokeWidth,
      }).catch(() => {});
      setTempShape(null);
      setShapeStart(null);
    }
    setIsDrawing(false);
  }, [isPanning, isDrawing, selectedTool, currentPts, selectedColor, strokeWidth, shapeStart, tempShape, addElement, roomId]);

  /* ── wheel zoom ── */
  const onWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const s = stageRef.current;
    if (!s) return;
    const p = s.getPointerPosition();
    if (!p) return;
    const dir = e.evt.deltaY > 0 ? -1 : 1;
    const f = 1.08;
    const nz = Math.min(Math.max(zoom * (dir > 0 ? f : 1 / f), 0.1), 5);
    const mp = { x: (p.x - panX) / zoom, y: (p.y - panY) / zoom };
    setPan(p.x - mp.x * nz, p.y - mp.y * nz);
    setZoom(nz);
  }, [zoom, panX, panY, setPan, setZoom]);

  /* ── render element ── */
  const renderEl = (el: CanvasElement) => {
    if (el.kind === 'stroke') {
      return (
        <Line
          key={el.id} id={el.id}
          points={el.points} stroke={el.color} strokeWidth={el.strokeWidth}
          tension={0.5} lineCap="round" lineJoin="round"
          globalCompositeOperation={el.tool === 'eraser' ? 'destination-out' : 'source-over'}
          opacity={el.opacity}
        />
      );
    }
    const s = el as Extract<CanvasElement, { kind: 'shape' }>;

    // Handle locked elements (AI diagrams) - cannot be erased
    const isLocked = s.isLocked || s.type === 'diagram';

    const base = {
      key: s.id, id: s.id, x: s.x, y: s.y,
      stroke: s.color, strokeWidth: s.strokeWidth, opacity: s.opacity, rotation: s.rotation,
      draggable: selectedTool === 'select' && !isLocked,
      onClick: () => { if (selectedTool === 'select') setSelectedIds([s.id]); },
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
        useWhiteboardStore.getState().updateElement(s.id, { x: e.target.x(), y: e.target.y() } as any);
      },
    };
    switch (s.type) {
      case 'rect':    return <Rect {...base} width={s.width || 100} height={s.height || 100} fill={s.fill || 'transparent'} cornerRadius={4} />;
      case 'ellipse': return <Ellipse {...base} radiusX={(s.width || 100) / 2} radiusY={(s.height || 80) / 2} fill={s.fill || 'transparent'} />;
      case 'diamond':
        return <Line {...base} points={[(s.width || 100) / 2, 0, s.width || 100, (s.height || 100) / 2, (s.width || 100) / 2, s.height || 100, 0, (s.height || 100) / 2]} closed fill={s.fill || 'transparent'} />;
      case 'line':    return <Line {...base} x={0} y={0} points={s.points || []} lineCap="round" />;
      case 'arrow':   return <Arrow {...base} x={0} y={0} points={s.points || []} pointerLength={10} pointerWidth={10} fill={s.color} />;
      case 'text':
        return (
          <KText {...base} text={s.text || 'Text'} fontSize={16} fill={s.color}
            onDblClick={(e) => {
              const t = e.target as Konva.Text;
              const val = prompt('Edit text:', t.text());
              if (val !== null) useWhiteboardStore.getState().updateElement(s.id, { text: val } as any);
            }}
          />
        );
      case 'image':
      case 'diagram':
        return (
          <SvgImageNode
            key={s.id}
            el={s as any}
            selectedTool={selectedTool}
            setSelectedIds={setSelectedIds}
          />
        );
      default: return null;
    }
  };

  /* ── temp shape preview ── */
  const renderTemp = () => {
    if (!tempShape) return null;
    const c = { stroke: tempShape.color, strokeWidth: tempShape.strokeWidth, opacity: 0.6, dash: [6, 4] };
    switch (tempShape.type) {
      case 'rect':    return <Rect x={tempShape.x} y={tempShape.y} width={tempShape.width} height={tempShape.height} {...c} cornerRadius={4} />;
      case 'ellipse': return <Ellipse x={tempShape.x + (tempShape.width || 0) / 2} y={tempShape.y + (tempShape.height || 0) / 2} radiusX={(tempShape.width || 0) / 2} radiusY={(tempShape.height || 0) / 2} {...c} />;
      case 'diamond':
        return <Line x={tempShape.x} y={tempShape.y} points={[(tempShape.width || 0) / 2, 0, tempShape.width || 0, (tempShape.height || 0) / 2, (tempShape.width || 0) / 2, tempShape.height || 0, 0, (tempShape.height || 0) / 2]} closed {...c} />;
      case 'line':    return <Line points={tempShape.points || []} {...c} lineCap="round" />;
      case 'arrow':   return <Arrow points={tempShape.points || []} {...c} pointerLength={10} pointerWidth={10} fill={tempShape.color} />;
      default: return null;
    }
  };

  // Get presence users array
  const presenceUsersArray = Array.from(presenceUsers.values());

  return (
    <Stage
      ref={stageRef}
      width={size.w} height={size.h}
      scaleX={zoom} scaleY={zoom}
      x={panX} y={panY}
      onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}
      onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
      onWheel={onWheel}
      onClick={(e) => { if (e.target === stageRef.current && selectedTool === 'select') clearSelection(); }}
    >
      <Layer>
        {elements.map(renderEl)}
        {currentPts.length >= 4 && (
          <Line
            points={currentPts}
            stroke={selectedTool === 'eraser' ? '#171920' : selectedColor}
            strokeWidth={selectedTool === 'eraser' ? strokeWidth * 3 : strokeWidth}
            tension={0.5} lineCap="round" lineJoin="round"
            globalCompositeOperation={selectedTool === 'eraser' ? 'destination-out' : 'source-over'}
          />
        )}
        {renderTemp()}
        <Transformer
          ref={transformerRef}
          onTransformEnd={() => {
            selectedIds.forEach((id) => {
              const node = stageRef.current?.findOne(`#${id}`);
              if (node) {
                useWhiteboardStore.getState().updateElement(id, {
                  x: node.x(),
                  y: node.y(),
                  width: node.width() * node.scaleX(),
                  height: node.height() * node.scaleY(),
                  rotation: node.rotation(),
                } as any);
                node.scaleX(1);
                node.scaleY(1);
              }
            });
          }}
        />
      </Layer>
      {/* Presence cursors layer */}
      <Layer>
        <UserCursors
          users={presenceUsersArray}
          panX={panX}
          panY={panY}
          zoom={zoom}
          localUserId={localUserId}
        />
      </Layer>
    </Stage>
  );
}
