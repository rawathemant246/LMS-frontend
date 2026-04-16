export function detectRole(roleId: number | null, roleName?: string): string {
  if (!roleId) return "unknown";
  if (roleName) {
    const lower = roleName.toLowerCase();
    const exactRoles: Record<string, string> = {
      super_admin: "super_admin",
      admin: "admin",
      principal: "admin",
      school_admin: "admin",
      teacher: "teacher",
      student: "student",
      parent: "parent",
      accountant: "accountant",
    };
    if (exactRoles[lower]) return exactRoles[lower];
  }
  if (roleId === 1) return "super_admin";
  return "unknown";
}

export function getRoleDashboardPath(role: string): string {
  switch (role) {
    case "super_admin": return "/dashboard";
    case "admin": return "/admin/dashboard";
    case "teacher": return "/teacher/dashboard";
    case "student": return "/student/dashboard";
    case "parent": return "/parent/dashboard";
    case "unknown": return "/login"; // Force re-login or show error
    default: return "/login";
  }
}

export function hasPermission(permissions: string[], required: string): boolean {
  return permissions.includes(required);
}
