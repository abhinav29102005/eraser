import React from "react";
import {
  Search,
  HelpCircle,
  Plus,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const TriangleIcon = () => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-4 h-4"
  >
    <path
      d="M13.8261 30.5736C16.7203 29.8826 20.2244 29.4783 24 29.4783C27.7756 29.4783 31.2797 29.8826 34.1739 30.5736C36.9144 31.2278 39.9967 32.7669 41.3563 33.8352L24.8486 7.36089C24.4571 6.73303 23.5429 6.73303 23.1514 7.36089L6.64374 33.8352C8.00331 32.7669 11.0856 31.2278 13.8261 30.5736Z"
      fill="currentColor"
    />
  </svg>
);

function Header({ user, setUser, setBoards, searchQuery, setSearchQuery }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setBoards([]);
    navigate("/"); // Redirect to the authentication page
  };

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-700 px-10 py-3">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-4 text-white">
          <TriangleIcon />
          <h2 className="text-white text-lg font-bold leading-tight tracking-wide">
            LUMO
          </h2>
        </div>
        <nav className="flex items-center gap-9">
          <a
            className="text-white text-sm font-medium leading-normal hover:text-blue-300 transition-colors"
            href="#"
          >
            Home
          </a>
          <a
            className="text-white text-sm font-medium leading-normal hover:text-blue-300 transition-colors"
            href="#"
          >
            Templates
          </a>
          <a
            className="text-white text-sm font-medium leading-normal hover:text-blue-300 transition-colors"
            href="#"
          >
            Inspiration
          </a>
          <a
            className="text-white text-sm font-medium leading-normal hover:text-blue-300 transition-colors"
            href="#"
          >
            Pricing
          </a>
        </nav>
      </div>
      <div className="flex flex-1 justify-end gap-8">
        <div className="flex flex-col min-w-40 h-10 max-w-64">
          <div className="flex w-full flex-1 items-stretch rounded-xl h-full">
            <div className="text-slate-400 flex border-none bg-slate-700 items-center justify-center pl-4 rounded-l-xl border-r-0">
              <Search size={24} />
            </div>
            <input
              placeholder="Search"
              className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border-none bg-slate-700 focus:border-none h-full placeholder:text-slate-400 px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 bg-slate-700 text-white gap-2 text-sm font-bold leading-normal tracking-wide min-w-0 px-2.5 hover:bg-slate-600 transition-colors">
          <HelpCircle size={20} />
        </button>

        <div className="flex items-center gap-2">
          <p className="text-white text-sm font-medium leading-normal">
            {user?.name || user?.email || "Guest"}
          </p>
          <button
            onClick={() => {
              handleLogout();
            }}
            className="flex items-center gap-2 bg-slate-700 text-white px-3 py-2 rounded-lg text-sm hover:bg-slate-600 transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
