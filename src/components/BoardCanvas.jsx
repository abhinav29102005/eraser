// src/components/BoardCanvas.jsx
import React from 'react';
import KonvaDrawingBoard from './KonvaDrawingBoard';

function BoardCanvas({ board, onBackToList, onSaveStroke }) {
  if (!board) {
    return <p>No board selected.</p>;
  }

  return (
    // Adjust this outer div to take full available height and width
    // Removing padding/border here so KonvaDrawingBoard can go edge-to-edge
    // We'll rely on KonvaDrawingBoard's internal styling for its full screen effect
    <div className="flex flex-col w-full h-screen bg-[#121417]"> {/* Use Tailwind/CSS for full height/width */}
      {/* Header/Info Bar for the Board Page */}
      <div className="bg-slate-800 text-white p-4 flex items-center justify-between shadow-md">
        <button onClick={onBackToList} style={{ padding: '8px 15px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>
          ← Back to Boards
        </button>
        <h2 className="text-xl font-bold">{board.title}</h2>
        <p className="text-sm text-slate-400">ID: {board.id} | Created: {new Date(board.createdAt).toLocaleDateString()}</p>
      </div>

      {/* KonvaDrawingBoard will take the remaining height */}
      <div className="flex-1 overflow-hidden"> {/* This div ensures it expands to fill remaining space */}
        <KonvaDrawingBoard
          boardId={board.id}
          initialStrokes={board.strokes}
          onSaveStroke={onSaveStroke}
        />
      </div>

      {/* You might want a footer here later */}
    </div>
  );
}

export default BoardCanvas;