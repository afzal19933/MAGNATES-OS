export type Role = "ADMIN" | "MEMBER" | "VISITOR";

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return userRole === requiredRole;
}
