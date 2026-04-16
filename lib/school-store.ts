import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SchoolBranding {
  primary_color?: string;
  accent_color?: string;
  sidebar_color?: string;
  logo_url?: string;
}

export interface SchoolState {
  school: {
    name: string;
    board: string;
    logo_url: string;
    branding: SchoolBranding;
  } | null;
  role: string | null;
  permissions: string[];
  setSchool: (school: SchoolState["school"]) => void;
  setRole: (role: string) => void;
  setPermissions: (perms: string[]) => void;
  clearSchool: () => void;
}

export const useSchoolStore = create<SchoolState>()(
  persist(
    (set) => ({
      school: null,
      role: null,
      permissions: [],
      setSchool: (school) => set({ school }),
      setRole: (role) => set({ role }),
      setPermissions: (permissions) => set({ permissions }),
      clearSchool: () => set({ school: null, role: null, permissions: [] }),
    }),
    { name: "edupulse-school" }
  )
);
