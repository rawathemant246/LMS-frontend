"use client";

import { Bell, Settings, User } from "lucide-react";
import { useRouter } from "next/navigation";

import { logout } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function TopBar() {
  const router = useRouter();

  function handleLogout() {
    logout();
  }

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-4">
      {/* Left: sidebar toggle */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-gray-500 hover:text-gray-700" />
      </div>

      {/* Center: search placeholder */}
      <div className="hidden flex-1 items-center justify-center md:flex">
        <button
          type="button"
          className="flex h-8 w-full max-w-sm items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-400 transition-colors hover:border-gray-300 hover:bg-gray-100"
        >
          <svg
            className="h-3.5 w-3.5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <span className="flex-1 text-left">Search...</span>
          <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: bell + avatar */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <div className="relative">
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </Button>
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#F97316] text-[10px] font-semibold text-white">
            3
          </span>
        </div>

        {/* Avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100 focus:outline-none"
              />
            }
          >
            <Avatar size="sm">
              <AvatarFallback className="bg-[#4F46E5] text-white text-xs font-semibold">
                HR
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium text-gray-700 md:block">
              Hemant Rawat
            </span>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="py-2">
              <p className="text-sm font-semibold text-gray-900">Hemant Rawat</p>
              <p className="text-xs text-gray-500">Super Admin</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              render={<button type="button" onClick={() => router.push("/dashboard/profile")} />}
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              render={<button type="button" onClick={() => router.push("/dashboard/settings")} />}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              render={<button type="button" onClick={handleLogout} />}
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
                />
              </svg>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
