/**
 * TeaceLock Role-Based Access Control (RBAC) constants and helpers.
 *
 * Roles are assigned server-side via the user_profiles table and enforced by
 * Row Level Security (RLS) policies. The frontend uses these constants for
 * UI-level routing and permission checks only.
 */

export type UserRole = 'admin' | 'manufacturer' | 'distributor' | 'retailer' | 'customer';

export const ROLES = {
  ADMIN: 'admin' as UserRole,
  MANUFACTURER: 'manufacturer' as UserRole,
  DISTRIBUTOR: 'distributor' as UserRole,
  RETAILER: 'retailer' as UserRole,
  CUSTOMER: 'customer' as UserRole,
} as const;

export const ALL_ROLES: UserRole[] = [
  ROLES.ADMIN,
  ROLES.MANUFACTURER,
  ROLES.DISTRIBUTOR,
  ROLES.RETAILER,
  ROLES.CUSTOMER,
];

/**
 * Human-readable role labels for UI display.
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  manufacturer: "Manufacturer",
  distributor: "Distributor",
  retailer: "Retailer",
  customer: "Customer",
};

/**
 * Role descriptions for UI display.
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: "Full administrative access to all portal functions.",
  manufacturer: "Register products and generate QR codes.",
  distributor: "Update product movement and supply-chain events.",
  retailer: "Record product receipt and stock status.",
  customer: "View product information and verify authenticity.",
};

/**
 * Check if a role can perform manufacturer operations (register products).
 */
export function canRegisterProducts(role: UserRole | null | undefined): boolean {
  return role === ROLES.ADMIN || role === ROLES.MANUFACTURER;
}

/**
 * Check if a role can perform distributor operations (update movement events).
 */
export function canUpdateMovement(role: UserRole | null | undefined): boolean {
  return role === ROLES.ADMIN || role === ROLES.DISTRIBUTOR;
}

/**
 * Check if a role can perform retailer operations (record receipt/stock).
 */
export function canRecordReceipt(role: UserRole | null | undefined): boolean {
  return role === ROLES.ADMIN || role === ROLES.RETAILER;
}

/**
 * Check if a role can perform administrative operations.
 */
export function isAdminRole(role: UserRole | null | undefined): boolean {
  return role === ROLES.ADMIN;
}

/**
 * Check if a role can view product information (all roles can).
 */
export function canViewProducts(role: UserRole | null | undefined): boolean {
  return ALL_ROLES.includes(role as UserRole);
}

/**
 * Parse the VITE_ADMIN_EMAILS env var into a normalized set of admin emails.
 * Returns empty set if the variable is missing or empty.
 * Emails are trimmed and lowercased.
 */
export function getConfiguredAdminEmails(): string[] {
  const raw = import.meta.env.VITE_ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Check if a given email is in the configured admin list.
 */
export function isConfiguredAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalizedEmail = email.trim().toLowerCase();
  const adminEmails = getConfiguredAdminEmails();
  // If no admin emails are configured, deny access to everyone
  if (adminEmails.length === 0) return false;
  return adminEmails.includes(normalizedEmail);
}