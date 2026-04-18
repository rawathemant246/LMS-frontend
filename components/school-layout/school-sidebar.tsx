"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  UserCheck,
  Heart,
  ClipboardCheck,
  Calendar,
  BookOpen,
  FileText,
  BarChart3,
  IndianRupee,
  Megaphone,
  PieChart,
  Settings,
  FileVideo,
  PenTool,
  Brain,
  PlayCircle,
  TrendingUp,
  MessageSquare,
  Zap,
  Bell,
  Award,
} from "lucide-react";

import { useSchoolStore } from "@/lib/school-store";
import { getNavForRole } from "@/lib/school-nav";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  GraduationCap,
  Users,
  UserCheck,
  Heart,
  ClipboardCheck,
  Calendar,
  BookOpen,
  FileText,
  BarChart3,
  IndianRupee,
  Megaphone,
  PieChart,
  Settings,
  FileVideo,
  PenTool,
  Brain,
  PlayCircle,
  TrendingUp,
  MessageSquare,
  Bell,
  Award,
};

export function SchoolSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const school = useSchoolStore((s) => s.school);
  const role = useSchoolStore((s) => s.role);
  const permissions = useSchoolStore((s) => s.permissions);

  const navGroups = getNavForRole(role ?? "unknown");
  const schoolName = school?.name ?? "EduPulse";
  const logoUrl = school?.logo_url ?? null;

  return (
    <Sidebar
      collapsible="icon"
      className="border-r-0"
      style={
        {
          "--sidebar-background": "rgb(var(--brand-sidebar-bg, 30 27 75))",
        } as React.CSSProperties
      }
    >
      <div className="flex h-full flex-col bg-[rgb(var(--brand-sidebar-bg,30_27_75))]">
        {/* Logo / School name */}
        <SidebarHeader className="px-4 py-5">
          <div className="flex items-center gap-2.5">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={schoolName}
                className="h-8 w-8 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--brand-primary,249_115_22))]">
                <Zap className="h-4 w-4 text-white" />
              </div>
            )}
            {!isCollapsed && (
              <span className="text-lg font-bold tracking-tight text-white truncate">
                {schoolName}
              </span>
            )}
          </div>
        </SidebarHeader>

        {/* Navigation */}
        <SidebarContent className="px-2">
          {navGroups.map((group, groupIdx) => (
            <SidebarGroup key={groupIdx} className="py-1">
              {group.section && !isCollapsed && (
                <SidebarGroupLabel className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-[rgb(var(--brand-accent,99_102_241))]">
                  {group.section}
                </SidebarGroupLabel>
              )}
              {group.section && isCollapsed && (
                <div className="my-2 h-px bg-white/10" />
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items
                    .filter((item) => !item.permission || permissions.includes(item.permission))
                    .map((item) => {
                    const Icon = iconMap[item.icon];
                    const isActive =
                      item.href.endsWith("/dashboard")
                        ? pathname === item.href
                        : pathname.startsWith(item.href);

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          render={<Link href={item.href} />}
                          isActive={isActive}
                          tooltip={item.name}
                          className={cn(
                            "relative h-9 rounded-lg text-white/60 transition-colors",
                            "hover:bg-white/10 hover:text-white",
                            isActive && [
                              "bg-white/10 text-white",
                              "before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:rounded-r-full before:bg-[rgb(var(--brand-primary,249_115_22))]",
                            ]
                          )}
                        >
                          {Icon && (
                            <Icon
                              className={cn(
                                "h-4 w-4 shrink-0",
                                isActive ? "text-white" : "text-white/60"
                              )}
                            />
                          )}
                          <span
                            className={cn(
                              "truncate text-sm",
                              isActive ? "font-medium text-white" : "text-white/60"
                            )}
                          >
                            {item.name}
                          </span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        {/* Footer collapse button */}
        <SidebarFooter className="border-t border-white/10 px-3 py-3">
          <SidebarTrigger className="w-full justify-start text-white/60 hover:bg-white/10 hover:text-white" />
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}
