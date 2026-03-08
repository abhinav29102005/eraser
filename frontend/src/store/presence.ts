import { create } from 'zustand';

export interface PresenceUser {
  id: string;
  name: string;
  color: string;
  cursorX: number;
  cursorY: number;
  lastActive: number;
}

interface PresenceStore {
  users: Map<string, PresenceUser>;
  localUserId: string | null;
  localUserName: string;
  localUserColor: string;

  setLocalUser: (id: string, name: string, color: string) => void;
  updateUserCursor: (userId: string, x: number, y: number) => void;
  setUsers: (users: PresenceUser[]) => void;
  addUser: (user: PresenceUser) => void;
  removeUser: (userId: string) => void;
  getUsers: () => PresenceUser[];
  getOtherUsers: () => PresenceUser[];
  clearUsers: () => void;
}

// Generate a consistent color based on user ID
function getColorFromId(id: string): string {
  const colors = [
    '#f97316', // orange
    '#ef4444', // red
    '#22c55e', // green
    '#3b82f6', // blue
    '#a855f7', // purple
    '#ec4899', // pink
    '#eab308', // yellow
    '#06b6d4', // cyan
  ];

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

export const usePresenceStore = create<PresenceStore>((set, get) => ({
  users: new Map(),
  localUserId: null,
  localUserName: 'Anonymous',
  localUserColor: '#3b82f6',

  setLocalUser: (id, name, color) => {
    set({
      localUserId: id,
      localUserName: name,
      localUserColor: color || getColorFromId(id),
    });
  },

  updateUserCursor: (userId, x, y) => {
    const state = get();
    const users = new Map(state.users);

    if (users.has(userId)) {
      const user = users.get(userId)!;
      users.set(userId, {
        ...user,
        cursorX: x,
        cursorY: y,
        lastActive: Date.now(),
      });
    } else {
      // Create new user if not exists
      users.set(userId, {
        id: userId,
        name: userId.slice(0, 8),
        color: getColorFromId(userId),
        cursorX: x,
        cursorY: y,
        lastActive: Date.now(),
      });
    }

    set({ users });
  },

  setUsers: (users) => {
    const usersMap = new Map<string, PresenceUser>();
    users.forEach((user) => {
      usersMap.set(user.id, user);
    });
    set({ users: usersMap });
  },

  addUser: (user) => {
    const state = get();
    const users = new Map(state.users);
    users.set(user.id, user);
    set({ users });
  },

  removeUser: (userId) => {
    const state = get();
    const users = new Map(state.users);
    users.delete(userId);
    set({ users });
  },

  getUsers: () => {
    return Array.from(get().users.values());
  },

  getOtherUsers: () => {
    const state = get();
    return Array.from(state.users.values()).filter(
      (user) => user.id !== state.localUserId
    );
  },

  clearUsers: () => {
    set({ users: new Map() });
  },
}));
