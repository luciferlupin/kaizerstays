export type UserRoleType = "OWNER" | "FRONT_DESK" | "HOUSEKEEPING" | "KITCHEN_POS" | "GENERAL_STAFF";

export function getUserRoleType(roleStr?: string): UserRoleType {
  const r = (roleStr || "").toLowerCase();
  if (
    r.includes("owner") ||
    r.includes("gm") ||
    r.includes("admin") ||
    r.includes("manager & gm") ||
    r.includes("property owner") ||
    r.includes("general manager")
  ) {
    return "OWNER";
  }
  if (r.includes("front") || r.includes("reception") || r.includes("desk")) {
    return "FRONT_DESK";
  }
  if (r.includes("house") || r.includes("cleaning") || r.includes("linen")) {
    return "HOUSEKEEPING";
  }
  if (r.includes("kitchen") || r.includes("pos") || r.includes("chef") || r.includes("restaurant") || r.includes("f&b")) {
    return "KITCHEN_POS";
  }
  return "GENERAL_STAFF";
}

export type AccessLevel = "EDIT" | "VIEW_ONLY" | "LOCKED";

export interface PagePermission {
  level: AccessLevel;
  reason?: string;
  primaryWorkspace: string;
}

export function getPagePermission(path: string, roleStr?: string): PagePermission {
  const roleType = getUserRoleType(roleStr);

  // OWNER & GM: Full Edit access across all pages
  if (roleType === "OWNER") {
    return { level: "EDIT", primaryWorkspace: "/dashboard" };
  }

  const cleanPath = path.split("?")[0].replace(/\/$/, "");

  // FRONT DESK MANAGER (e.g. Sunil Sharma)
  if (roleType === "FRONT_DESK") {
    const primaryWorkspace = "/dashboard/front-desk";
    
    // EDIT PAGES
    const editPaths = [
      "/dashboard/front-desk",
      "/dashboard/reservations",
      "/dashboard/reservations/new",
      "/dashboard/guests",
      "/dashboard/messages",
      "/dashboard/requests",
    ];
    if (editPaths.some((p) => cleanPath === p || cleanPath.startsWith("/dashboard/reservations/"))) {
      return { level: "EDIT", primaryWorkspace };
    }

    // VIEW ONLY PAGES (Important operational reference for Front Desk)
    const viewPaths = [
      "/dashboard",
      "/dashboard/rooms",
      "/dashboard/calendar",
      "/dashboard/housekeeping",
      "/dashboard/night-audit",
    ];
    if (viewPaths.some((p) => cleanPath === p)) {
      return { level: "VIEW_ONLY", reason: "Front Office Staff — Read-Only Reference Mode", primaryWorkspace };
    }

    // LOCKED PAGES
    return { level: "LOCKED", reason: "Access restricted to Property Owner & Management Console", primaryWorkspace };
  }

  // HOUSEKEEPING SUPERVISOR (e.g. Meena Kumari)
  if (roleType === "HOUSEKEEPING") {
    const primaryWorkspace = "/dashboard/housekeeping";

    // EDIT PAGES
    const editPaths = [
      "/dashboard/housekeeping",
      "/dashboard/requests",
      "/dashboard/inventory",
    ];
    if (editPaths.some((p) => cleanPath === p)) {
      return { level: "EDIT", primaryWorkspace };
    }

    // VIEW ONLY PAGES
    const viewPaths = [
      "/dashboard",
      "/dashboard/rooms",
      "/dashboard/messages",
    ];
    if (viewPaths.some((p) => cleanPath === p)) {
      return { level: "VIEW_ONLY", reason: "Housekeeping Staff — Read-Only Reference Mode", primaryWorkspace };
    }

    // LOCKED PAGES
    return { level: "LOCKED", reason: "Access restricted to Property Owner & Front Office", primaryWorkspace };
  }

  // KITCHEN & POS (e.g. Arun Kumar)
  if (roleType === "KITCHEN_POS") {
    const primaryWorkspace = "/dashboard/pos";

    // EDIT PAGES
    const editPaths = [
      "/dashboard/pos",
      "/dashboard/inventory",
    ];
    if (editPaths.some((p) => cleanPath === p)) {
      return { level: "EDIT", primaryWorkspace };
    }

    // VIEW ONLY PAGES
    const viewPaths = [
      "/dashboard",
      "/dashboard/front-desk",
      "/dashboard/requests",
    ];
    if (viewPaths.some((p) => cleanPath === p)) {
      return { level: "VIEW_ONLY", reason: "Kitchen & POS Staff — Read-Only Reference Mode", primaryWorkspace };
    }

    // LOCKED PAGES
    return { level: "LOCKED", reason: "Access restricted to Property Owner & Front Office", primaryWorkspace };
  }

  return { level: "EDIT", primaryWorkspace: "/dashboard" };
}
