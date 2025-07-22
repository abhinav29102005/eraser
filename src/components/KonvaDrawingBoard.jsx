// src/components/KonvaDrawingBoard.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Stage, Layer, Line, Rect } from "react-konva";
import {
  Pencil,
  Eraser,
  Move,
  RotateCcw,
  MousePointerClick,
  Save,
} from "lucide-react";

const DEFAULT_STROKE_COLOR = 'white';
const DEFAULT_STROKE_WIDTH = 5;
const ERASER_STROKE_WIDTH = 20;

function KonvaDrawingBoard({ initialStrokes, onSaveStroke, onSaveAllBoardContent, boardId, onClearAllStrokes }) {
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const [tool, setTool] = useState("pen");
  const [lines, setLines] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // --- Resizing the Stage when container size changes ---
  const checkSize = useCallback(() => {
    if (containerRef.current) {
      setContainerSize({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      });
    }
  }, []);

  useEffect(() => {
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, [checkSize]);

  // --- Load initial strokes ---
  useEffect(() => {
    const loadedLines = (initialStrokes || [])
      .filter(s => s.points && s.points.length > 0)
      .map(s => ({
        id: s.id,
        points: typeof s.points === 'string' ? JSON.parse(s.points) : s.points,
        tool: s.tool || "pen",
        color: s.color || DEFAULT_STROKE_COLOR,
        strokeWidth: s.strokeWidth || DEFAULT_STROKE_WIDTH,
      }));
    setLines(loadedLines);
  }, [initialStrokes]);

  // --- Drawing Event Handlers ---
  const handleMouseDown = useCallback((e) => {
    if (tool === "pan" || tool === "pointer") return;
    setIsDrawing(true);
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    //convert screen coordinates into stage coordinates
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const relativePos = transform.point(pos);
    setLines((prevLines) => [
      ...prevLines,
      {
        tool,
        color: tool === "eraser" ? "black" : DEFAULT_STROKE_COLOR,
        strokeWidth: tool === "eraser" ? ERASER_STROKE_WIDTH : DEFAULT_STROKE_WIDTH,
        points: [relativePos.x, relativePos.y],
        id: Date.now() + Math.random(),
      },
    ]);
  }, [tool]);

  const handleMouseMove = useCallback((e) => {
    if (!isDrawing || tool === "pan" || tool === "pointer") return;
    const stage = stageRef.current;
    const point = stage.getPointerPosition();

    //convert screen coordinates into stage coordinates
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const relativePos = transform.point(point);

    setLines((prevLines) => {
      const lastLine = { ...prevLines[prevLines.length - 1] };
      lastLine.points = lastLine.points.concat([relativePos.x, relativePos.y]);
      const newLines = [...prevLines];
      newLines[newLines.length - 1] = lastLine;
      return newLines;
    });
  }, [isDrawing, tool]);

  const handleMouseUp = useCallback(async () => {
    setIsDrawing(false);
    if (lines.length > 0) {
      const completedLine = lines[lines.length - 1];
      if (completedLine.points.length > 2) {
        const strokeToSave = {
          tool: completedLine.tool,
          color: completedLine.color,
          strokeWidth: completedLine.strokeWidth,
          points: completedLine.points,
        };
        await onSaveStroke(boardId, strokeToSave);
      }
    }
  }, [lines, onSaveStroke, boardId]);

  // --- Explicit Save Handler ---
  const handleExplicitSave = useCallback(() => {
      if (onSaveAllBoardContent) {
          onSaveAllBoardContent(boardId, lines);
          alert("All changes saved!");
      } else {
          alert("Save feature not fully connected. Check console.");
      }
  }, [onSaveAllBoardContent, boardId, lines]);

  // --- Clear Canvas Function ---
  const clearCanvas = useCallback(async () => {
    if (window.confirm("Are you sure you want to clear the entire canvas? This action cannot be undone.")) {
      setLines([]); // Clear locally first for immediate feedback
      await onClearAllStrokes(boardId);
      alert("Canvas cleared permanently!");
    }
  }, [boardId, onClearAllStrokes]);

  // --- View Control Handlers (MOVED HERE) ---
  const handleWheel = useCallback((e) => { // <--- MOVED AND WRAPPED IN useCallback
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * 1.1 : oldScale / 1.1;
    const clampedScale = Math.max(0.1, Math.min(newScale, 5));

    setStageScale(clampedScale);

    setStagePos({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  }, []); // No external dependencies, stageRef is ref

  const handleDragEnd = useCallback((e) => { // <--- MOVED AND WRAPPED IN useCallback
    setStagePos({
      x: e.target.x(),
      y: e.target.y(),
    });
  }, []);

  const resetView = useCallback(() => { // <--- MOVED AND WRAPPED IN useCallback
    setStagePos({ x: 0, y: 0 });
    setStageScale(1);
  }, []);


  return (
    <div className="w-full h-full bg-[#121417] flex flex-row relative">
      {/* Toolbar */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 p-4 flex flex-col items-center justify-between z-10">
        <div className="flex flex-col items-center space-y-10">
          <button onClick={() => setTool("pointer")} className={`p-2 rounded-lg text-white transition-colors ${tool === "pointer" ? "bg-blue-100/15" : "hover:bg-blue-100/15"}`} title="Pointer Tool"> <MousePointerClick size={25} /> </button>
          <button onClick={() => setTool("pen")} className={`p-2 rounded-lg text-white transition-colors ${tool === "pen" ? "bg-blue-100/15" : "hover:bg-blue-100/15"}`} title="Pen Tool"> <Pencil size={25} /> </button>
          <button onClick={() => setTool("eraser")} className={`p-2 rounded-lg text-white transition-colors ${tool === "eraser" ? "bg-blue-100/15" : "hover:bg-blue-100/15"}`} title="Eraser Tool"> <Eraser size={25} /> </button>
          <button onClick={() => setTool("pan")} className={`p-2 rounded-lg text-white transition-colors ${tool === "pan" ? "bg-blue-100/15" : "hover:bg-blue-100/15"}`} title="Pan Tool"> <Move size={25} /> </button>
        </div>
        <div className="p-5"></div>
        <button onClick={resetView} className="p-2 rounded-lg text-white hover:bg-blue-100/15 transition-colors" title="Reset View"> <RotateCcw size={25} /> </button>
        <div className="p-4"> </div>
        <button
          onClick={handleExplicitSave}
          className="p-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          title="Save All Changes"
        >
          <Save size={25} />
        </button>
        <div className="p-4"> </div>
        <button onClick={clearCanvas} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"> Clear </button>
      </div>

      {/* Canvas Area */}
      <div ref={containerRef} className="flex-1 overflow-hidden relative">
        <Stage
          ref={stageRef}
          width={containerSize.width}
          height={containerSize.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel} // <--- Will now find handleWheel
          draggable={tool === "pan"}
          onDragEnd={handleDragEnd} // <--- Will now find handleDragEnd
          x={stagePos.x}
          y={stagePos.y}
          scaleX={stageScale}
          scaleY={stageScale}
        >
          <Layer>
            <Rect // <--- This Rect is crucial for the background color
              x={0} y={0}
              width={containerSize.width} height={containerSize.height}
              fill="#121417"
            />
            {lines.map((line) => (
              <Line
                key={line.id}
                points={line.points}
                stroke={line.color}
                strokeWidth={line.strokeWidth}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={
                  line.tool === "eraser" ? "destination-out" : "source-over"
                }
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

export default KonvaDrawingBoard;