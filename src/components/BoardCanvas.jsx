// src/components/BoardCanvas.jsx
import React, { useState, useEffect } from 'react';
import KonvaDrawingBoard from './KonvaDrawingBoard';
import { getBoardWithStrokes, saveStroke, replaceStrokes } from "../services/boardService";
import { useParams, useNavigate } from 'react-router-dom';

function BoardCanvas() { // <--- NEW PROP
  const {boardId} = useParams();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        setLoading(true);
        const fetchedBoard = await getBoardWithStrokes(boardId); // Fetches board with strokes
        setBoard(fetchedBoard);
        setError(null);
      } catch (err) {
        console.error("Error fetching board:", err);
        setError(err.response?.data?.message || "Board not found or not accessible.");
        if (err.response && err.response.status === 401) {
            // If unauthorized, redirect to login
            navigate("/");
        }
      } finally {
        setLoading(false);
      }
    };

    if (boardId) {
      fetchBoard();
    }
  }, [boardId, navigate]);

  const handleSaveActualStroke = async (boardId, strokeData) => {
      try {
        const savedStroke = await saveStroke(boardId, strokeData);
        console.log("Stroke saved on mouseUp:", savedStroke);
        setError(null);
        // Removed re-fetch here to avoid loop, KonvaDrawingBoard manages lines state
        // The explicit save button will handle saving all current lines
      } catch (err) {
        setError(err.message);
        console.error("Save Stroke Error:", err);
      }
    };

  const handleSaveAllBoardContent = async (boardId, lines) => {
    try {
      await replaceStrokes(boardId, lines); // Replaces all strokes on backend
      console.log("All board content explicitly saved!");
      setError(null);
      // After saving, re-fetch the board to update local state if necessary
      const updatedBoard = await getBoardWithStrokes(boardId);
      setBoard(updatedBoard);
    } catch (err) {
      console.error("Explicit Save Board Content Error:", err);
      setError(err.response?.data?.message || "Failed to save board content.");
    }
  };

  const handleClearAllStrokes = async (boardId) => {
    try {
      await replaceStrokes(boardId, []); // Clear all strokes by sending empty array
      console.log("All strokes for board cleared on backend!");
      setError(null);
      // Update local board state to reflect cleared strokes
      const updatedBoard = await getBoardWithStrokes(boardId);
      setBoard(updatedBoard);
    } catch (err) {
      console.error("Clear Canvas Error:", err);
      setError(err.response?.data?.message || "Failed to clear canvas.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-[#121417] text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading board...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-[#121417] text-white">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error: {error}</p>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Handle case where board is still null after loading
  if (!board) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-[#121417] text-white">
        <div className="text-center">
          <p className="text-yellow-400 mb-4">Board not found</p>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col w-full h-screen bg-[#121417]">
      <div className="bg-slate-800 text-white p-4 flex items-center justify-between shadow-md">
        <button onClick={()=> navigate('/dashboard')} style={{ padding: '8px 15px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>
          ← Back to Boards
        </button>
        <h2 className="text-xl font-bold">{board.title}</h2>
        <p className="text-sm text-slate-400">ID: {board.id} | Created: {new Date(board.createdAt).toLocaleDateString()}</p>
      </div>

      <div className="flex-1 overflow-hidden">
        <KonvaDrawingBoard
          boardId={board.id}
          initialStrokes={board.strokes}
          onSaveStroke={handleSaveActualStroke}
          onSaveAllBoardContent={handleSaveAllBoardContent}
          onClearAllStrokes={handleClearAllStrokes}
        />
      </div>
    </div>
  );
}

export default BoardCanvas;