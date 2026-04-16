import { create } from "zustand";

interface UserState {
  user: {
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    role_id: number;
  } | null;
  setUser: (user: UserState["user"]) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
