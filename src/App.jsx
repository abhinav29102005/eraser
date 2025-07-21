// src/App.jsx
import React, { useState, useEffect } from 'react';
import { getTestToken, logout, isLoggedIn, getMyUserDetails } from './services/authService';
import { createNewBoard, getUserBoards, getBoardWithStrokes, saveStroke, replaceStrokes } from './services/boardService';

import BoardCanvas from './components/BoardCanvas';
import HomePage from './components/HomePage';

import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(isLoggedIn());
  const [user, setUser] = useState(null);
  const [boards, setBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [newBoardName, setNewBoardName] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (isAuthenticated) {
        try {
          const fetchedUser = await getMyUserDetails();
          setUser(fetchedUser);
          const fetchedBoards = await getUserBoards();
          setBoards(fetchedBoards);
          setError(null);
        } catch (err) {
          setError(err.message);
          logout();
          setIsAuthenticated(false);
        }
      }
    };
    fetchData();
  }, [isAuthenticated]);

  const handleLogin = async () => {
    try {
      const fetchedUser = await getTestToken();
      setUser(fetchedUser);
      setIsAuthenticated(true);
      setError(null);
      const fetchedBoards = await getUserBoards();
      setBoards(fetchedBoards);
    } catch (err) {
      setError(err.message);
      console.error("Login Error:", err);
    }
  };

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    setUser(null);
    setBoards([]);
    setSelectedBoard(null);
    setError(null);
  };

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) {
      setError("Board name cannot be empty.");
      return;
    }
    try {
      const response = await createNewBoard(newBoardName);
      setBoards([...boards, response.board]);
      setNewBoardName('');
      setError(null);
      alert(`Board "${response.board.title}" created!`);
    } catch (err) {
      setError(err.message);
      console.error("Create Board Error:", err);
    }
  };

  const handleSelectBoard = async (boardId) => {
    try {
      const board = await getBoardWithStrokes(boardId);
      setSelectedBoard(board);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Select Board Error:", err);
    }
  };

  const handleBackToList = () => {
    setSelectedBoard(null);
    setError(null);
  };

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
    console.log('handleSaveAllBoardContent called from App.jsx');
    console.log('Board ID for save:', boardId);
    console.log('Lines to save:', lines);
    try {
      await replaceStrokes(boardId, lines);
      console.log("All board content explicitly saved!");
      setError(null);
      const updatedBoard = await getBoardWithStrokes(boardId);
      setSelectedBoard(updatedBoard);
    } catch (err) {
      setError(err.message);
      console.error("Explicit Save Board Content Error:", err);
    }
  };

  // --- MOVE THIS FUNCTION HERE ---
  const handleClearAllStrokes = async (boardId) => {
    try {
      await replaceStrokes(boardId, []); // Call replaceStrokes with an empty array
      console.log("All strokes for board cleared on backend!");
      setError(null);
      const updatedBoard = await getBoardWithStrokes(boardId);
      setSelectedBoard(updatedBoard);
    } catch (err) {
      setError(err.message);
      console.error("Clear Canvas Error:", err);
    }
  };


  return (
    <div className="App">
      {error && <p style={{ color: 'red', border: '1px solid red', padding: '10px' }}>Error: {error}</p>}

      {!isAuthenticated ? (
        <button onClick={handleLogin}>Login (Get Test Token)</button>
      ) : (
        selectedBoard ? (
          <BoardCanvas
            board={selectedBoard}
            onBackToList={handleBackToList}
            onSaveStroke={handleSaveActualStroke}
            onSaveAllBoardContent={handleSaveAllBoardContent}
            onClearAllStrokes={handleClearAllStrokes} // This line will now find handleClearAllStrokes
          />
        ) : (
          <HomePage
            user={user}
            boards={boards}
            handleSelectBoard={handleSelectBoard}
            handleCreateBoard={handleCreateBoard}
            newBoardName={newBoardName}
            setNewBoardName={setNewBoardName}
            handleLogout={handleLogout}
            error={error}
            setError={setError}
          />
        )
      )}
    </div>
  );
}

export default App;