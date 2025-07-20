// src/components/KonvaDrawingBoard.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Stage, Layer, Line } from "react-konva";
import {
  Pencil,
  Eraser,
  Move,
  RotateCcw,
  MousePointerClick,
} from "lucide-react";

// Default drawing properties (for new strokes)
const DEFAULT_STROKE_COLOR = 'white'; // <--- Changed to white for visibility
const DEFAULT_STROKE_WIDTH = 5;
const ERASER_STROKE_WIDTH = 20; // For eraser thickness

function KonvaDrawingBoard({ initialStrokes, onSaveStroke, boardId }) {
  const stageRef = useRef(null);
  const containerRef = useRef(null); // Ref for the div wrapping the Stage
  const [tool, setTool] = useState("pen");
  const [lines, setLines] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 }); // To track parent container size

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
    checkSize(); // Set initial size
    console.log('Konva Container Size:', containerSize);
    window.addEventListener('resize', checkSize); // Update on window resize
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
        color: s.color || DEFAULT_STROKE_COLOR, // Use stored color or default
        strokeWidth: s.strokeWidth || DEFAULT_STROKE_WIDTH, // Use stored width or default
      }));
    setLines(loadedLines);
  }, [initialStrokes]);

  // --- Drawing Event Handlers ---
  const handleMouseDown = useCallback((e) => {
    if (tool === "pan" || tool === "pointer") return;

    setIsDrawing(true);
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    setLines((prevLines) => [
      ...prevLines,
      {
        tool,
        // Use default color and width for new strokes
        color: tool === "eraser" ? "black" : DEFAULT_STROKE_COLOR, // Eraser draws 'black' on black bg to make it erase
        strokeWidth: tool === "eraser" ? ERASER_STROKE_WIDTH : DEFAULT_STROKE_WIDTH,
        points: [pos.x, pos.y],
        id: Date.now() + Math.random(),
      },
    ]);
  }, [tool]);

  const handleMouseMove = useCallback((e) => {
    if (!isDrawing || tool === "pan" || tool === "pointer") return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

    setLines((prevLines) => {
      const lastLine = { ...prevLines[prevLines.length - 1] };
      lastLine.points = lastLine.points.concat([point.x, point.y]); // Use raw point directly from stage
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

  // Handle wheel zoom
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return; // Ensure stage is defined

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
  };

  // Handle drag for panning
  const handleDragEnd = (e) => {
    setStagePos({
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  const clearCanvas = () => {
    // This only clears locally. For persistence, you'd need a backend endpoint to delete strokes for this board.
    setLines([]);
    // Optionally: alert("Canvas cleared locally. To clear permanently, implement a backend clear function.");
  };

  const resetView = () => {
    setStagePos({ x: 0, y: 0 });
    setStageScale(1);
  };

  return (
    <div className="w-full h-full bg-[#121417] flex flex-row relative"> {/* Adjusted to h-full for parent height */}
      {/* Toolbar */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 p-4 flex flex-col items-center justify-between z-10">
        <div className="flex flex-col items-center space-y-10">
          <button
            onClick={() => setTool("pointer")}
            className={`p-2 rounded-lg text-white transition-colors ${tool === "pointer" ? "bg-blue-100/15" : "hover:bg-blue-100/15"}`}
            title="Pointer Tool"
          > <MousePointerClick size={25} /> </button>
          <button
            onClick={() => setTool("pen")}
            className={`p-2 rounded-lg text-white transition-colors ${tool === "pen" ? "bg-blue-100/15" : "hover:bg-blue-100/15"}`}
            title="Pen Tool"
          > <Pencil size={25} /> </button>
          <button
            onClick={() => setTool("eraser")}
            className={`p-2 rounded-lg text-white transition-colors ${tool === "eraser" ? "bg-blue-100/15" : "hover:bg-blue-100/15"}`}
            title="Eraser Tool"
          > <Eraser size={25} /> </button>
          <button
            onClick={() => setTool("pan")}
            className={`p-2 rounded-lg text-white transition-colors ${tool === "pan" ? "bg-blue-100/15" : "hover:bg-blue-100/15"}`}
            title="Pan Tool"
          > <Move size={25} /> </button>
        </div>
        <div className="p-5"></div>
        <button
          onClick={resetView}
          className="p-2 rounded-lg text-white hover:bg-blue-100/15 transition-colors"
          title="Reset View"
        > <RotateCcw size={25} /> </button>
        <div className="p-4"> </div>
        <button
          onClick={clearCanvas}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        > Clear </button>
      </div>

      {/* Canvas Area */}
      <div ref={containerRef} className="flex-1 overflow-hidden relative"> {/* Use ref here */}
        <Stage
          ref={stageRef}
          width={containerSize.width} // Set width to container's width
          height={containerSize.height} // Set height to container's height
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          draggable={tool === "pan"}
          onDragEnd={handleDragEnd}
          x={stagePos.x}
          y={stagePos.y}
          scaleX={stageScale}
          scaleY={stageScale}
        >
          <Layer>
            {/* Render lines */}
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