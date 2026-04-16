export function detectRole(roleId: number | null, roleName?: string): string {
  if (!roleId) return "unknown";
  if (roleName) {
    const lower = roleName.toLowerCase();
    if (lower === "super_admin" || lower.includes("super")) return "super_admin";
    if (lower.includes("principal") || lower.includes("admin")) return "admin";
    if (lower.includes("teacher")) return "teacher";
    if (lower.includes("student")) return "student";
    if (lower.includes("parent")) return "parent";
    if (lower.includes("accountant")) return "accountant";
  }
  if (roleId === 1) return "super_admin";
  return "admin";
}

export function getRoleDashboardPath(role: string): string {
  switch (role) {
    case "super_admin": return "/dashboard";
    case "admin": return "/admin/dashboard";
    case "teacher": return "/teacher/dashboard";
    case "student": return "/student/dashboard";
    case "parent": return "/parent/dashboard";
    default: return "/admin/dashboard";
  }
}

export function hasPermission(permissions: string[], required: string): boolean {
  return permissions.includes(required);
}
