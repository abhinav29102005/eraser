// src/components/HomePage.jsx
import React, { useEffect, useState } from "react";
import {
  Search,
  HelpCircle,
  Plus,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Modal from "./Modal"; // <-- NEW IMPORT: Modal component
import { useNavigate } from "react-router-dom";
import { getUserBoards, createNewBoard } from "../services/boardService";
import Header from "./header";

const BoardCard = ({ board, navigate }) => (
  <div className="flex flex-col gap-3 pb-3 cursor-pointer group relative">
    <div
      className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl transition-transform group-hover:scale-105 group-hover:shadow-lg"
      style={{
        backgroundImage: board.thumbnail
          ? `url("${board.thumbnail}")`
          : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
      onClick={() => navigate(`/board/${board.id}`)}
    >
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-xl transition-all duration-200 flex items-end p-3">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <p className="text-white text-xs">
            {board.updatedAt
              ? `Updated ${new Date(board.updatedAt).toLocaleDateString()}`
              : "New board"}
          </p>
        </div>
      </div>
    </div>

    <div className="flex justify-between items-start">
      <div className="flex-1" onClick={() => navigate(`/board/${board.id}`)}>
        <p className="text-white text-base font-medium leading-normal group-hover:text-blue-300 transition-colors">
          {board.title || board.name}
        </p>
        {board.description && (
          <p className="text-slate-400 text-sm mt-1 truncate">
            {board.description}
          </p>
        )}
      </div>
    </div>
  </div>
);

const HomePage = () => {
  const [user, setUser] = useState(null);
  const [boards, setBoards] = useState([]);
  const [newBoardName, setNewBoardName] = useState("");
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [boardSearchQuery, setBoardSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("saved");
  const [isNewBoardModalOpen, setIsNewBoardModalOpen] = useState(false); // <-- NEW STATE for modal

  const mockSharedBoards = [];
  const [sharedBoards, setSharedBoards] = useState(mockSharedBoards);

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      loadBoards(parsedUser.id); // Load boards for the authenticated user
    } else {
      // If no user, redirect to auth page
      navigate("/");
    }
  }, [navigate]);

  const loadBoards = async (userId) => {
    try {
      const fetchedBoards = await getUserBoards(); // Your service should internally get boards for current user
      setBoards(fetchedBoards);
      setError(null);
    } catch (err) {
      console.error("Error fetching boards:", err);
      setError(err.response?.data?.message || "Failed to load boards.");
      if (err.response && err.response.status === 401) {
        // If unauthorized, log out and redirect to login
        handleLogout();
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setBoards([]);
    navigate("/"); // Redirect to the authentication page
  };

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) {
      setError("Board name cannot be empty.");
      return;
    }
    try {
      const response = await createNewBoard(newBoardName);
      setBoards((prevBoards) => [response.board, ...prevBoards]); // Add new board to list
      setNewBoardName("");
      setError(null);
      setIsNewBoardModalOpen(false); // Close modal
      navigate(`/board/${response.board.id}`); // Navigate to the new board's page!
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create board.");
      console.error("Create Board Error:", err);
    }
  };

  const getFilteredBoards = () => {
    const currentBoards = activeTab === "saved" ? boards : sharedBoards;
    return currentBoards.filter(
      (board) =>
        (board.title &&
          board.title.toLowerCase().includes(boardSearchQuery.toLowerCase())) ||
        (board.description &&
          board.description
            .toLowerCase()
            .includes(boardSearchQuery.toLowerCase()))
    );
  };

  const filteredBoards = getFilteredBoards();

  const handleNewBoardInputChange = (e) => {
    setNewBoardName(e.target.value);
    if (error) {
      setError(null); // Clear error when user types
    }
  };

  // NEW: Handler for creating board from modal
  // const onCreateBoardFromModal = async () => {
  //   // This calls the handleCreateBoard from App.jsx
  //   // App.jsx will handle validation and API call
  //   try {
  //       await handleCreateBoard(); // This handles creating, setting boards state in App.jsx
  //       setIsNewBoardModalOpen(false); // Close modal on success
  //       setNewBoardName(''); // Clear input after successful creation
  //   } catch (err) {
  //       // Error is already set in App.jsx, nothing more to do here.
  //       // It will be displayed by the error prop.
  //   }
  // };

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-slate-900 dark group/design-root overflow-x-hidden font-sans">
      <div className="layout-container flex h-full grow flex-col">
        {/* Header */}
        <Header user={user} setUser={setUser} setBoards={setBoards}/>

        {/* Main Content */}
        <div className="px-4 md:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            {/* Global Error Display */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-800 p-3 text-white">
                <AlertCircle size={20} />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Page Header (Your boards) */}
            <div className="flex flex-wrap justify-between gap-3 p-4">
              <p className="text-white tracking-tight text-3xl font-bold leading-tight min-w-72">
                Your boards
              </p>
              {/* Button to open New Board Modal */}
              <button
                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-8 px-4 bg-slate-700 text-white text-sm font-medium leading-normal hover:bg-slate-600 transition-colors"
                onClick={() => setIsNewBoardModalOpen(true)} // Open modal on click
              >
                <Plus size={16} className="mr-1" />
                <span className="truncate">New board</span>
              </button>
            </div>

            {/* Board Search Input */}
            <div className="px-4 py-3">
              <div className="flex flex-col min-w-40 h-12 w-full">
                <div className="flex w-full flex-1 items-stretch rounded-xl h-full">
                  <div className="text-slate-400 flex border-none bg-slate-700 items-center justify-center pl-4 rounded-l-xl border-r-0">
                    <Search size={24} />
                  </div>
                  <input
                    placeholder="Search boards"
                    className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border-none bg-slate-700 focus:border-none h-full placeholder:text-slate-400 px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
                    value={boardSearchQuery}
                    onChange={(e) => setBoardSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="pb-3">
              <div className="flex border-b border-slate-600 px-4 gap-8">
                <button
                  className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 transition-colors ${
                    activeTab === "saved"
                      ? "border-b-blue-500 text-white"
                      : "border-b-transparent text-slate-400 hover:text-white"
                  }`}
                  onClick={() => setActiveTab("saved")}
                >
                  <p className="text-sm font-bold leading-normal tracking-wide">
                    Saved boards ({boards.length})
                  </p>
                </button>
                <button
                  className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 transition-colors ${
                    activeTab === "shared"
                      ? "border-b-blue-500 text-white"
                      : "border-b-transparent text-slate-400 hover:text-white"
                  }`}
                  onClick={() => setActiveTab("shared")}
                >
                  <p className="text-sm font-bold leading-normal tracking-wide">
                    Shared boards ({sharedBoards.length})
                  </p>
                </button>
              </div>
            </div>

            {/* Board Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 p-4">
              {filteredBoards.length > 0 ? (
                filteredBoards.map((board) => (
                  <BoardCard key={board.id} board={board} navigate={navigate} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center col-span-full">
                  <div className="text-slate-400 mb-4">
                    <svg
                      className="w-16 h-16 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-slate-400 text-lg mb-2">
                    {boardSearchQuery ? "No boards found" : "No boards yet"}
                  </p>
                  <p className="text-slate-500 text-sm mb-4">
                    {boardSearchQuery
                      ? "Try adjusting your search or create a new board"
                      : "Create your first board to get started"}
                  </p>
                  {!boardSearchQuery && (
                    <button
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                      onClick={() => setIsNewBoardModalOpen(true)} // Open modal from here too
                    >
                      <Plus size={16} />
                      Create your first board
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* NEW: New Board Modal */}
      <Modal
        isOpen={isNewBoardModalOpen}
        onClose={() => {
          setIsNewBoardModalOpen(false);
          setNewBoardName(""); // Clear input when modal closes
          setError(null); // Clear error when modal closes
        }}
        title="Create New Board"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <label
            htmlFor="newBoardNameInput"
            style={{ fontSize: "1em", color: "#cbd5e1" }}
          >
            Board Name:
          </label>
          <input
            id="newBoardNameInput"
            type="text"
            value={newBoardName}
            onChange={handleNewBoardInputChange}
            placeholder="e.g., Project Brainstorm"
            style={{
              padding: "10px",
              borderRadius: "5px",
              border: "1px solid #475569",
              backgroundColor: "#334155",
              color: "white",
              fontSize: "1em",
            }}
          />
          {error && <p style={{ color: "red", fontSize: "0.9em" }}>{error}</p>}
          <button
            onClick={handleCreateBoard}
            style={{
              padding: "10px 15px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "1em",
              marginTop: "10px",
            }}
          >
            Create Board
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default HomePage;
