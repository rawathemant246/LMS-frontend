"use client";

import { Bell, Settings, User, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

import { logout } from "@/lib/auth";
import { useUserStore } from "@/lib/store";
import { useSchoolStore } from "@/lib/school-store";
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

export function SchoolTopbar() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const school = useSchoolStore((s) => s.school);
  const role = useSchoolStore((s) => s.role);

  const initials = user ? `${(user.first_name || "U")[0]}${(user.last_name || "")[0]}` : "U";
  const displayName = user ? `${user.first_name} ${user.last_name}` : "User";
  const roleName = role
    ? role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "School User";

  const schoolName = school?.name ?? "EduPulse";
  const logoUrl = school?.logo_url ?? null;

  function handleLogout() {
    logout();
  }

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-4">
      {/* Left: sidebar toggle + school branding */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-gray-500 hover:text-gray-700" />
        <div className="flex items-center gap-2">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={schoolName}
              className="h-7 w-7 rounded-md object-cover"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[rgb(var(--brand-primary,249_115_22))]">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
          )}
          <span className="hidden text-sm font-semibold text-gray-800 md:block">
            {schoolName}
          </span>
        </div>
      </div>

      {/* Right: bell + avatar */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <div className="relative">
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </Button>
          {/* Badge removed: no real notification count yet */}
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
              <AvatarFallback className="bg-[rgb(var(--brand-primary,79_70_229))] text-white text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium text-gray-700 md:block">
              {displayName}
            </span>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="py-2">
              <p className="text-sm font-semibold text-gray-900">{displayName}</p>
              <p className="text-xs text-gray-500">{roleName}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              render={<button type="button" onClick={() => router.push("/settings")} />}
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              render={<button type="button" onClick={() => router.push("/settings")} />}
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
