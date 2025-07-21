// src/components/BoardCanvas.jsx
import React from 'react';
import KonvaDrawingBoard from './KonvaDrawingBoard';

function BoardCanvas({ board, onBackToList, onSaveStroke, onSaveAllBoardContent }) { // <--- NEW PROP
  if (!board) {
    return <p>No board selected.</p>;
  }

  return (
    <div className="flex flex-col w-full h-screen bg-[#121417]">
      <div className="bg-slate-800 text-white p-4 flex items-center justify-between shadow-md">
        <button onClick={onBackToList} style={{ padding: '8px 15px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>
          ← Back to Boards
        </button>
        <h2 className="text-xl font-bold">{board.title}</h2>
        <p className="text-sm text-slate-400">ID: {board.id} | Created: {new Date(board.createdAt).toLocaleDateString()}</p>
      </div>

      <div className="flex-1 overflow-hidden">
        <KonvaDrawingBoard
          boardId={board.id}
          initialStrokes={board.strokes}
          onSaveStroke={onSaveStroke}
          onSaveAllBoardContent={onSaveAllBoardContent} // <--- PASS NEW PROP DOWN
        />
      </div>
    </div>
  );
}

export default BoardCanvas;