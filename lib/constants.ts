export const APP_NAME = "EduPulse";

export const NAV_ITEMS = [
  {
    section: null,
    items: [
      { name: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
      { name: "Organizations", href: "/organizations", icon: "Building2" },
      { name: "Billing", href: "/billing", icon: "CreditCard" },
      { name: "Support", href: "/support", icon: "LifeBuoy" },
      { name: "Users", href: "/users", icon: "Users" },
    ],
  },
  {
    section: "ANALYTICS",
    items: [
      { name: "Analytics", href: "/analytics", icon: "BarChart3" },
      { name: "System Health", href: "/health", icon: "Activity" },
      { name: "Audit Logs", href: "/audit", icon: "ScrollText" },
    ],
  },
  {
    section: "SYSTEM",
    items: [
      { name: "Notifications", href: "/notifications", icon: "Bell" },
      { name: "Settings", href: "/settings", icon: "Settings" },
    ],
  },
];
