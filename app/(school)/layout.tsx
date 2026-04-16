"use client";

import { useEffect } from "react";
import { SchoolSidebar } from "@/components/school-layout/school-sidebar";
import { SchoolTopbar } from "@/components/school-layout/school-topbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ErrorBoundary } from "@/components/shared/error-boundary";

// Helper to convert hex to RGB
function hexToRgb(hex: string): string {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return "";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
}

export default function SchoolLayout({ children }: { children: React.ReactNode }) {
  // Try to read school branding from localStorage directly to avoid import issues
  useEffect(() => {
    try {
      const stored = localStorage.getItem("edupulse-school");
      if (stored) {
        const parsed = JSON.parse(stored);
        const branding = parsed?.state?.school?.branding;
        if (branding) {
          const root = document.documentElement;
          const primaryRgb = hexToRgb(branding.primary_color);
          if (primaryRgb) root.style.setProperty("--brand-primary", primaryRgb);
          const accentRgb = hexToRgb(branding.accent_color);
          if (accentRgb) root.style.setProperty("--brand-accent", accentRgb);
          const sidebarRgb = hexToRgb(branding.sidebar_color);
          if (sidebarRgb) root.style.setProperty("--brand-sidebar-bg", sidebarRgb);
        }
      }
    } catch {}

    return () => {
      const root = document.documentElement;
      root.style.removeProperty("--brand-primary");
      root.style.removeProperty("--brand-accent");
      root.style.removeProperty("--brand-sidebar-bg");
    };
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <SchoolSidebar />
        <div className="flex flex-1 flex-col">
          <SchoolTopbar />
          <main className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
