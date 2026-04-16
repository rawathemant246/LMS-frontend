"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  LifeBuoy,
  Users,
  BarChart3,
  Activity,
  ScrollText,
  Bell,
  Settings,
  Zap,
} from "lucide-react";

import { NAV_ITEMS } from "@/lib/constants";
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
  Building2,
  CreditCard,
  LifeBuoy,
  Users,
  BarChart3,
  Activity,
  ScrollText,
  Bell,
  Settings,
};

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar
      collapsible="icon"
      className="border-r-0"
      style={
        {
          "--sidebar-background": "#1E1B4B",
        } as React.CSSProperties
      }
    >
      {/* Override sidebar background with navy */}
      <div className="flex h-full flex-col bg-[#1E1B4B]">
        {/* Logo */}
        <SidebarHeader className="px-4 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F97316]">
              <Zap className="h-4 w-4 text-white" />
            </div>
            {!isCollapsed && (
              <span className="text-lg font-bold tracking-tight text-white">
                EduPulse
              </span>
            )}
          </div>
        </SidebarHeader>

        {/* Navigation */}
        <SidebarContent className="px-2">
          {NAV_ITEMS.map((group, groupIdx) => (
            <SidebarGroup key={groupIdx} className="py-1">
              {group.section && !isCollapsed && (
                <SidebarGroupLabel className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-[#6366F1]">
                  {group.section}
                </SidebarGroupLabel>
              )}
              {group.section && isCollapsed && (
                <div className="my-2 h-px bg-[#2D2A5E]" />
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const Icon = iconMap[item.icon];
                    const isActive =
                      item.href === "/dashboard"
                        ? pathname === "/dashboard"
                        : pathname.startsWith(item.href);

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          render={<Link href={item.href} />}
                          isActive={isActive}
                          tooltip={item.name}
                          className={cn(
                            "relative h-9 rounded-lg text-[#A5B4FC] transition-colors",
                            "hover:bg-[#2D2A5E] hover:text-white",
                            isActive && [
                              "bg-[#2D2A5E] text-white",
                              "before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:rounded-r-full before:bg-[#F97316]",
                            ]
                          )}
                        >
                          {Icon && (
                            <Icon
                              className={cn(
                                "h-4 w-4 shrink-0",
                                isActive ? "text-white" : "text-[#A5B4FC]"
                              )}
                            />
                          )}
                          <span
                            className={cn(
                              "truncate text-sm",
                              isActive ? "font-medium text-white" : "text-[#A5B4FC]"
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
        <SidebarFooter className="border-t border-[#2D2A5E] px-3 py-3">
          <SidebarTrigger className="w-full justify-start text-[#A5B4FC] hover:bg-[#2D2A5E] hover:text-white" />
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}
