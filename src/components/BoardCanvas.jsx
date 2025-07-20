// src/components/BoardCanvas.jsx
import React from 'react';
import KonvaDrawingBoard from './KonvaDrawingBoard'; // <--- Import the actual Konva component

function BoardCanvas({ board, onBackToList, onSaveStroke }) {
  if (!board) {
    return <p>No board selected.</p>;
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <button onClick={onBackToList} style={{ marginBottom: '20px', padding: '8px 15px', cursor: 'pointer' }}>
        ← Back to Your Boards
      </button>

      <h2>Board: {board.title}</h2>
      <p>ID: {board.id}</p>
      <p>Created: {new Date(board.createdAt).toLocaleDateString()}</p>

      {/* Embed the KonvaDrawingBoard here */}
      <KonvaDrawingBoard
        boardId={board.id}
        initialStrokes={board.strokes} // Pass the fetched strokes
        onSaveStroke={onSaveStroke} // Pass the save handler from App.jsx
      />

      {/* Removed the dummy stroke button and strokes list display */}
    </div>
  );
}

export default BoardCanvas;