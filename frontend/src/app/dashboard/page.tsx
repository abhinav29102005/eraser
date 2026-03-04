'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { roomAPI } from '@lib/services';
import toast from 'react-hot-toast';

interface Room {
  id: string;
  name: string;
  createdAt: string;
}

const sidebarSections = [
  { label: 'Diagrams', icon: 'diagram' },
  { label: 'Collaborators', icon: 'users' },
  { label: 'Document Explore', icon: 'doc' },
  { label: 'Common Management', icon: 'doc' },
  { label: 'Document Context', icon: 'doc' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }
    loadRooms();
  }, [router]);

  const loadRooms = async () => {
    try {
      const response = await roomAPI.getAll();
      setRooms(response.data);
    } catch (error: any) {
      toast.error('Failed to load canvases');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    try {
      const response = await roomAPI.create(newRoomName);
      setRooms([...rooms, response.data]);
      setNewRoomName('');
      setShowCreateModal(false);
      toast.success('Canvas created!');
    } catch (error: any) {
      toast.error('Failed to create canvas');
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm('Delete this canvas? This action cannot be undone.')) return;
    try {
      await roomAPI.delete(id);
      setRooms(rooms.filter((r) => r.id !== id));
      toast.success('Canvas deleted');
    } catch {
      toast.error('Failed to delete canvas');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex bg-surface-950 overflow-hidden">
      {/* Left Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-60'} bg-surface-900 border-r border-surface-700/60 flex flex-col flex-shrink-0 transition-all duration-200`}>
        {/* Logo */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-surface-700/60 flex-shrink-0">
          <div className="w-7 h-7 bg-brand-500 rounded-md flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
            </svg>
          </div>
          {!sidebarCollapsed && <span className="text-sm font-bold text-white tracking-tight">LUMO</span>}
        </div>

        {/* Sidebar content */}
        <div className="flex-1 overflow-y-auto py-3">
          {!sidebarCollapsed && (
            <>
              {/* Workspaces */}
              <div className="px-3 mb-4">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider">Workspaces</span>
                  <button onClick={() => setShowCreateModal(true)} className="text-surface-500 hover:text-brand-400 transition-colors" title="New canvas">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                </div>
                <button className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md bg-surface-800 text-surface-200 text-sm">
                  <svg className="w-4 h-4 text-brand-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                  </svg>
                  All Canvases
                </button>
              </div>

              {/* Quick links */}
              <div className="px-3 mb-4">
                <span className="block text-[11px] font-semibold text-surface-500 uppercase tracking-wider mb-2 px-1">Quick Links</span>
                {sidebarSections.map((s) => (
                  <button key={s.label} className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-surface-400 hover:text-surface-200 hover:bg-surface-800/60 text-sm transition-colors">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      {s.icon === 'diagram' && <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6Z" />}
                      {s.icon === 'doc' && <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />}
                      {s.icon === 'users' && <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />}
                    </svg>
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Teams */}
              <div className="px-3 mb-4">
                <span className="block text-[11px] font-semibold text-surface-500 uppercase tracking-wider mb-2 px-1">Teams</span>
                {['Workspaces', 'Team 3', 'Documentation'].map((team) => (
                  <button key={team} className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-surface-400 hover:text-surface-200 hover:bg-surface-800/60 text-sm transition-colors">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                    </svg>
                    {team}
                  </button>
                ))}
              </div>

              {/* Canvas list */}
              {rooms.length > 0 && (
                <div className="px-3">
                  <span className="block text-[11px] font-semibold text-surface-500 uppercase tracking-wider mb-2 px-1">Recent</span>
                  {rooms.slice(0, 8).map((room) => (
                    <Link
                      key={room.id}
                      href={`/editor?room=${room.id}`}
                      className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-surface-400 hover:text-surface-200 hover:bg-surface-800/60 text-sm transition-colors truncate"
                    >
                      <svg className="w-3.5 h-3.5 flex-shrink-0 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                      </svg>
                      <span className="truncate">{room.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar footer */}
        <div className="border-t border-surface-700/60 p-3 flex-shrink-0">
          {!sidebarCollapsed && (
            <button className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-surface-500 hover:text-surface-300 hover:bg-surface-800/60 text-sm transition-colors mb-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              Settings
            </button>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 text-surface-500 hover:text-surface-300 py-1.5 rounded-md hover:bg-surface-800/60 transition-colors"
            title={sidebarCollapsed ? 'Expand' : 'Collapse'}
          >
            <svg className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-surface-900/60 backdrop-blur-sm border-b border-surface-700/60 flex items-center justify-between px-6 flex-shrink-0">
          <h1 className="text-base font-semibold text-white">All Canvases</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary text-sm flex items-center gap-1.5 px-4 py-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Canvas
            </button>
            <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-xs font-semibold text-brand-400 cursor-pointer" title="Profile">
              U
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userId');
                router.push('/');
              }}
              className="btn-ghost text-xs text-surface-500"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Search & view toggle */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search canvases…"
                className="input-field pl-10 text-sm"
              />
            </div>
            <div className="flex bg-surface-800 border border-surface-700 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-surface-700 text-white' : 'text-surface-500 hover:text-surface-300'}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-surface-700 text-white' : 'text-surface-500 hover:text-surface-300'}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <svg className="animate-spin w-8 h-8 text-brand-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            </div>
          ) : filteredRooms.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-surface-800 border border-surface-700 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">
                {rooms.length === 0 ? 'No canvases yet' : 'No results'}
              </h3>
              <p className="text-sm text-surface-500 mb-6 max-w-xs">
                {rooms.length === 0 ? 'Create your first canvas to start diagramming and documenting.' : 'Try a different search term.'}
              </p>
              {rooms.length === 0 && (
                <button onClick={() => setShowCreateModal(true)} className="btn-primary text-sm">
                  Create your first canvas
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid view */
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRooms.map((room) => (
                <div key={room.id} className="card-hover group flex flex-col overflow-hidden">
                  {/* Preview */}
                  <Link href={`/editor?room=${room.id}`} className="block h-36 bg-surface-800/50 border-b border-surface-700/40 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex items-center gap-2 opacity-30 group-hover:opacity-50 transition-opacity">
                        {['A', 'B', 'C'].map((l) => (
                          <div key={l} className="w-10 h-7 rounded border border-surface-600 flex items-center justify-center text-[10px] text-surface-500">{l}</div>
                        ))}
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.preventDefault(); handleDeleteRoom(room.id); }}
                        className="w-7 h-7 rounded-md bg-surface-900/80 border border-surface-700 flex items-center justify-center text-surface-400 hover:text-red-400 hover:border-red-400/30 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </Link>
                  {/* Info */}
                  <div className="p-3">
                    <Link href={`/editor?room=${room.id}`} className="block">
                      <h3 className="text-sm font-medium text-surface-200 truncate group-hover:text-white transition-colors">{room.name}</h3>
                      <p className="text-xs text-surface-500 mt-0.5">{formatDate(room.createdAt)}</p>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List view */
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-700/60">
                    <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Name</th>
                    <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Created</th>
                    <th className="text-right text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRooms.map((room) => (
                    <tr key={room.id} className="border-b border-surface-700/30 last:border-0 hover:bg-surface-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/editor?room=${room.id}`} className="text-surface-200 hover:text-white font-medium transition-colors">{room.name}</Link>
                      </td>
                      <td className="px-4 py-3 text-surface-500">{formatDate(room.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/editor?room=${room.id}`} className="text-brand-400 hover:text-brand-300 text-xs font-medium transition-colors">Open</Link>
                          <button onClick={() => handleDeleteRoom(room.id)} className="text-surface-500 hover:text-red-400 text-xs font-medium transition-colors">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-md p-6 shadow-float animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">New Canvas</h2>
              <button onClick={() => { setShowCreateModal(false); setNewRoomName(''); }} className="text-surface-500 hover:text-surface-300 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Canvas name</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. System Architecture"
                  autoFocus
                  className="input-field"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" className="btn-primary flex-1">Create</button>
                <button type="button" onClick={() => { setShowCreateModal(false); setNewRoomName(''); }} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
