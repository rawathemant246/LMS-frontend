export const APP_NAME = "EduPulse";

export const NAV_ITEMS = [
  {
    section: null,
    items: [
      { name: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
      { name: "Organizations", href: "/dashboard/organizations", icon: "Building2" },
      { name: "Billing", href: "/dashboard/billing", icon: "CreditCard" },
      { name: "Support", href: "/dashboard/support", icon: "LifeBuoy" },
      { name: "Users", href: "/dashboard/users", icon: "Users" },
    ],
  },
  {
    section: "ANALYTICS",
    items: [
      { name: "Analytics", href: "/dashboard/analytics", icon: "BarChart3" },
      { name: "System Health", href: "/dashboard/health", icon: "Activity" },
      { name: "Audit Logs", href: "/dashboard/audit", icon: "ScrollText" },
    ],
  },
  {
    section: "SYSTEM",
    items: [
      { name: "Notifications", href: "/dashboard/notifications", icon: "Bell" },
      { name: "Settings", href: "/dashboard/settings", icon: "Settings" },
    ],
  },
];
