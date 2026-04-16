"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ErrorBoundary } from "@/components/shared/error-boundary";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <TopBar />
          <main className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
