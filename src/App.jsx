// src/App.jsx
import React, { useState, useEffect } from 'react';
import { getTestToken, logout, isLoggedIn, getMyUserDetails } from './services/authService';
import { createNewBoard, getUserBoards, getBoardWithStrokes, saveStroke } from './services/boardService';

import BoardCanvas from './components/BoardCanvas';
import HomePage from './components/HomePage'; // <--- NEW IMPORT: HomePage

import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(isLoggedIn());
  const [user, setUser] = useState(null);
  const [boards, setBoards] = useState([]); // This will be passed to HomePage
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [newBoardName, setNewBoardName] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (isAuthenticated) {
        try {
          const fetchedUser = await getMyUserDetails();
          setUser(fetchedUser);
          const fetchedBoards = await getUserBoards(); // Corrected call
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
      const fetchedBoards = await getUserBoards(); // Corrected call
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
      console.log("Stroke saved:", savedStroke);
      setError(null);

      // After saving, re-fetch the board to update strokes display
      const updatedBoard = await getBoardWithStrokes(boardId);
      setSelectedBoard(updatedBoard);

    } catch (err) {
      setError(err.message);
      console.error("Save Stroke Error:", err);
    }
  };


  return (
    <div className="App" >
      {/* Moved global error display here */}
      {error && <p style={{ color: 'red', border: '1px solid red', padding: '10px' }}>Error: {error}</p>}

      {!isAuthenticated ? (
        <button onClick={handleLogin}>Login (Get Test Token)</button>
      ) : (
        selectedBoard ? ( // If a board is selected, show BoardCanvas
          <BoardCanvas
            board={selectedBoard}
            onBackToList={handleBackToList}
            onSaveStroke={handleSaveActualStroke}
          />
        ) : ( // Otherwise, show the HomePage component (your dashboard)
          <HomePage
            user={user}
            boards={boards} // Pass the fetched boards
            handleSelectBoard={handleSelectBoard}
            handleCreateBoard={handleCreateBoard}
            newBoardName={newBoardName}
            setNewBoardName={setNewBoardName}
            handleLogout={handleLogout}
            error={error} // Pass down the error for HomePage to display
          />
        )
      )}
    </div>
  );
}

export default App;